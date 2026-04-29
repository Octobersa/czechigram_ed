import fs from "node:fs";
import path from "node:path";
import type { APIRequestContext } from "@playwright/test";

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function readEnvValue(key: string): string | undefined {
  const directValue = process.env[key];
  if (directValue) {
    return directValue;
  }

  for (const fileName of [".env.local", ".env"]) {
    const fullPath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.startsWith(`${key}=`)) {
        continue;
      }

      const value = line.slice(key.length + 1).trim();
      if (!value) {
        continue;
      }

      return stripWrappingQuotes(value);
    }
  }

  return undefined;
}

export function uniqueId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 10_000)}`.toLowerCase();
}

export function resolveStudentName(envKey: string, fallbackPrefix: string): string {
  return readEnvValue(envKey) ?? uniqueId(fallbackPrefix);
}

export const studentManagementToken =
  readEnvValue("API_STUDENT_MANAGEMENT_TOKEN") ?? "api-student-management-token";
export const seededAdminEmail =
  readEnvValue("PLAYWRIGHT_SEEDED_ADMIN_EMAIL") ?? "seeduser2@example.com";
export const seededUserEmail =
  readEnvValue("PLAYWRIGHT_SEEDED_USER_EMAIL") ?? "seeduser1@example.com";
export const seededUserPassword =
  readEnvValue("PLAYWRIGHT_SEEDED_USER_PASSWORD") ?? "securePassword123";
export const registrationPassword =
  readEnvValue("PLAYWRIGHT_REGISTER_PASSWORD") ?? "securePassword123";
export const searchQuery = readEnvValue("PLAYWRIGHT_SEARCH_QUERY") ?? "Seed User";

export async function createStudentSchema(
  request: APIRequestContext,
  studentName: string,
): Promise<void> {
  const response = await request.post("/students/api", {
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": studentManagementToken,
    },
    data: { studentName },
  });

  if (response.ok()) {
    return;
  }

  const body = await response.text();
  if (response.status() === 400 && body.includes("already exists")) {
    return;
  }

  throw new Error(
    `Could not create student schema "${studentName}" (status ${response.status()}): ${body}`,
  );
}

export async function deleteStudentSchema(
  request: APIRequestContext,
  studentName: string,
): Promise<void> {
  const response = await request.delete(`/students/api?studentName=${studentName}`, {
    headers: {
      "X-Auth-Token": studentManagementToken,
    },
  });

  if (response.ok()) {
    return;
  }

  const body = await response.text();
  if (response.status() === 500 && body.includes("does not exist")) {
    return;
  }

  throw new Error(
    `Could not delete student schema "${studentName}" (status ${response.status()}): ${body}`,
  );
}

export async function loginViaApi(
  request: APIRequestContext,
  studentName: string,
  email: string,
  password: string,
): Promise<{ token: string; userId: string; role: string }> {
  const response = await request.post(`/${studentName}/api/auth/login`, {
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      email,
      password,
    },
  });

  const body = await response.json();
  if (!response.ok()) {
    throw new Error(
      `Login failed for ${email} in ${studentName}. Status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  if (!body.token || !body.userId || !body.role) {
    throw new Error(`Unexpected login response: ${JSON.stringify(body)}`);
  }

  return {
    token: body.token as string,
    userId: body.userId as string,
    role: body.role as string,
  };
}
