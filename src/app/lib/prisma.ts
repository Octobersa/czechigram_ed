import { PrismaClient } from "@prisma/client";

type StudentClientEntry = {
    client: PrismaClient;
    lastUsedAt: number;
    lastSchemaCheckAt: number;
};

type StudentClientCache = Map<string, StudentClientEntry>;

const DEFAULT_STUDENT_CACHE_MAX = 20;
const DEFAULT_STUDENT_IDLE_MS = 10 * 60 * 1000;
const DEFAULT_STUDENT_SWEEP_INTERVAL_MS = 60 * 1000;
const DEFAULT_STUDENT_CONNECTION_LIMIT = 1;
const DEFAULT_STUDENT_SCHEMA_CHECK_INTERVAL_MS = 0;

function readPositiveIntEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) {
        return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        console.warn(`Environment variable ${name} is invalid. Using fallback value ${fallback}.`);
        return fallback;
    }

    return parsed;
}

function readNonNegativeIntEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) {
        return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        console.warn(`Environment variable ${name} is invalid. Using fallback value ${fallback}.`);
        return fallback;
    }

    return parsed;
}

const STUDENT_CACHE_MAX = readPositiveIntEnv("STUDENT_PRISMA_CACHE_MAX", DEFAULT_STUDENT_CACHE_MAX);
const STUDENT_IDLE_MS = readPositiveIntEnv("STUDENT_PRISMA_IDLE_MS", DEFAULT_STUDENT_IDLE_MS);
const STUDENT_SWEEP_INTERVAL_MS = readPositiveIntEnv("STUDENT_PRISMA_SWEEP_INTERVAL_MS", DEFAULT_STUDENT_SWEEP_INTERVAL_MS);
const STUDENT_CONNECTION_LIMIT = readPositiveIntEnv("STUDENT_PRISMA_CONNECTION_LIMIT", DEFAULT_STUDENT_CONNECTION_LIMIT);
const STUDENT_SCHEMA_CHECK_INTERVAL_MS = readNonNegativeIntEnv(
    "STUDENT_PRISMA_SCHEMA_CHECK_INTERVAL_MS",
    DEFAULT_STUDENT_SCHEMA_CHECK_INTERVAL_MS
);

declare global {
    var prisma: PrismaClient | undefined;
    var studentPrismaClients: StudentClientCache | undefined;
    var pendingStudentPrismaClients: Map<string, Promise<PrismaClient>> | undefined;
    var studentPrismaSweepTimer: ReturnType<typeof setInterval> | undefined;
    var studentPrismaShutdownHooksRegistered: boolean | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

const studentPrismaClients = global.studentPrismaClients ?? new Map<string, StudentClientEntry>();
global.studentPrismaClients = studentPrismaClients;

const pendingStudentPrismaClients = global.pendingStudentPrismaClients ?? new Map<string, Promise<PrismaClient>>();
global.pendingStudentPrismaClients = pendingStudentPrismaClients;

function getStudentDatasourceUrl(studentSchemaName: string): string {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured.");
    }

    const datasourceUrl = new URL(databaseUrl);
    datasourceUrl.pathname = `/${studentSchemaName}`;
    if (!datasourceUrl.searchParams.has("connection_limit")) {
        datasourceUrl.searchParams.set("connection_limit", String(STUDENT_CONNECTION_LIMIT));
    }
    return datasourceUrl.toString();
}

async function disconnectStudentClient(studentSchemaName: string): Promise<void> {
    const entry = studentPrismaClients.get(studentSchemaName);
    if (!entry) {
        return;
    }

    studentPrismaClients.delete(studentSchemaName);
    await entry.client.$disconnect();
}

export async function disconnectPrismaForStudent(studentSchemaName: string): Promise<void> {
    const pendingClient = pendingStudentPrismaClients.get(studentSchemaName);
    if (pendingClient) {
        try {
            await pendingClient;
        } catch {
            // Ignore pending initialization errors; disconnection below is best-effort.
        }
    }

    await disconnectStudentClient(studentSchemaName);
}

async function evictIdleStudentClients(now: number = Date.now()): Promise<void> {
    for (const [studentSchemaName, entry] of studentPrismaClients.entries()) {
        if (now - entry.lastUsedAt <= STUDENT_IDLE_MS) {
            continue;
        }

        try {
            await disconnectStudentClient(studentSchemaName);
        } catch (error) {
            console.error(`Failed to disconnect idle Prisma client for schema '${studentSchemaName}'.`, error);
        }
    }
}

async function evictLeastRecentlyUsedClients(maxClients: number): Promise<void> {
    while (studentPrismaClients.size > maxClients) {
        let lruSchemaName: string | undefined;
        let oldestAccess = Number.POSITIVE_INFINITY;

        for (const [studentSchemaName, entry] of studentPrismaClients.entries()) {
            if (entry.lastUsedAt < oldestAccess) {
                oldestAccess = entry.lastUsedAt;
                lruSchemaName = studentSchemaName;
            }
        }

        if (!lruSchemaName) {
            return;
        }

        try {
            await disconnectStudentClient(lruSchemaName);
        } catch (error) {
            console.error(`Failed to disconnect Prisma client during LRU eviction for schema '${lruSchemaName}'.`, error);
            return;
        }
    }
}

async function disconnectAllStudentClients(): Promise<void> {
    if (global.studentPrismaSweepTimer) {
        clearInterval(global.studentPrismaSweepTimer);
        global.studentPrismaSweepTimer = undefined;
    }

    const schemas = [...studentPrismaClients.keys()];
    for (const schema of schemas) {
        try {
            await disconnectStudentClient(schema);
        } catch (error) {
            console.error(`Failed to disconnect Prisma client for schema '${schema}' during shutdown.`, error);
        }
    }
}

function ensureStudentPrismaLifecycleHandlers(): void {
    if (!global.studentPrismaSweepTimer) {
        global.studentPrismaSweepTimer = setInterval(() => {
            void evictIdleStudentClients().catch((error) => {
                console.error("Student Prisma idle eviction failed.", error);
            });
        }, STUDENT_SWEEP_INTERVAL_MS);

        global.studentPrismaSweepTimer.unref?.();
    }

    if (global.studentPrismaShutdownHooksRegistered) {
        return;
    }

    const cleanup = () => {
        void disconnectAllStudentClients();
    };

    process.once("SIGTERM", cleanup);
    process.once("SIGINT", cleanup);
    process.once("beforeExit", cleanup);

    global.studentPrismaShutdownHooksRegistered = true;
}

async function createStudentPrismaClient(studentSchemaName: string): Promise<PrismaClient> {
    const client = new PrismaClient({
        datasources: {
            db: {
                url: getStudentDatasourceUrl(studentSchemaName),
            },
        },
    });

    try {
        await client.$queryRaw`SELECT 1`;
        return client;
    } catch {
        await client.$disconnect();
        throw new Error(`Schema '${studentSchemaName}' does not exist`);
    }
}

function isSchemaMissingError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    return /database .* does not exist/i.test(error.message);
}

async function ensureCachedSchemaExists(
    studentSchemaName: string,
    entry: StudentClientEntry,
    now: number
): Promise<void> {
    const shouldCheckSchema =
        STUDENT_SCHEMA_CHECK_INTERVAL_MS === 0 ||
        now - entry.lastSchemaCheckAt >= STUDENT_SCHEMA_CHECK_INTERVAL_MS;

    if (!shouldCheckSchema) {
        return;
    }

    try {
        const schemaRows = await entry.client.$queryRaw<Array<{ SCHEMA_NAME: string }>>`
            SELECT SCHEMA_NAME
            FROM INFORMATION_SCHEMA.SCHEMATA
            WHERE SCHEMA_NAME = ${studentSchemaName}
            LIMIT 1
        `;
        entry.lastSchemaCheckAt = now;

        if (schemaRows.length === 0) {
            await disconnectStudentClient(studentSchemaName);
            throw new Error(`Schema '${studentSchemaName}' does not exist`);
        }
    } catch (error) {
        try {
            await disconnectStudentClient(studentSchemaName);
        } catch (disconnectError) {
            console.error(`Failed to disconnect Prisma client for schema '${studentSchemaName}' after schema check failure.`, disconnectError);
        }
        throw error;
    }
}

export async function getPrismaForStudent(studentSchemaName: string): Promise<PrismaClient> {
    if (!studentSchemaName) {
        throw new Error("Student schema name is required.");
    }

    ensureStudentPrismaLifecycleHandlers();

    const existingEntry = studentPrismaClients.get(studentSchemaName);
    if (existingEntry) {
        const now = Date.now();
        try {
            await ensureCachedSchemaExists(studentSchemaName, existingEntry, now);
            const refreshedEntry = studentPrismaClients.get(studentSchemaName);
            if (refreshedEntry) {
                refreshedEntry.lastUsedAt = now;
                return refreshedEntry.client;
            }
        } catch (error) {
            if (isSchemaMissingError(error)) {
                throw new Error(`Schema '${studentSchemaName}' does not exist`);
            }

            console.error(`Schema validation for cached Prisma client '${studentSchemaName}' failed. Reinitializing client.`, error);
        }
    }

    const pendingClient = pendingStudentPrismaClients.get(studentSchemaName);
    if (pendingClient) {
        return pendingClient;
    }

    const clientPromise = (async () => {
        await evictIdleStudentClients();

        const client = await createStudentPrismaClient(studentSchemaName);
        const now = Date.now();
        studentPrismaClients.set(studentSchemaName, {
            client,
            lastUsedAt: now,
            lastSchemaCheckAt: now,
        });

        await evictLeastRecentlyUsedClients(STUDENT_CACHE_MAX);
        return client;
    })();

    pendingStudentPrismaClients.set(studentSchemaName, clientPromise);
    try {
        return await clientPromise;
    } finally {
        pendingStudentPrismaClients.delete(studentSchemaName);
    }
}
