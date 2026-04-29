import type { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/app/lib/auth";
import { getPrismaForStudent } from "@/app/lib/prisma";

const STUDENT_SCHEMA_HEADER = "x-student-schema";

type ApiErrorPayload = {
  code: string;
  message: string;
  error: string;
  details?: unknown;
};

export class ApiRouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiRouteError";
  }
}

export function apiError(
  status: number,
  message: string,
  code: string,
  details?: unknown,
): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    {
      code,
      message,
      error: message,
      ...(details === undefined ? {} : { details }),
    },
    { status },
  );
}

function isMissingTenantSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /schema '.*' does not exist/i.test(error.message);
}

export function handleApiRouteError(
  error: unknown,
  logMessage: string,
): NextResponse<ApiErrorPayload> {
  if (error instanceof ApiRouteError) {
    return apiError(error.status, error.message, error.code, error.details);
  }

  if (isMissingTenantSchemaError(error)) {
    return apiError(404, "Student nenalezen!", "STUDENT_NOT_FOUND");
  }

  console.error(logMessage, error);
  return apiError(500, "Internal server error", "INTERNAL_SERVER_ERROR");
}

export async function getTenantContext(): Promise<{
  studentSchema: string;
  prisma: PrismaClient;
}> {
  const studentSchema = (await headers()).get(STUDENT_SCHEMA_HEADER);
  if (!studentSchema) {
    throw new ApiRouteError(404, "STUDENT_NOT_FOUND", "Student nenalezen!");
  }

  const prisma = await getPrismaForStudent(studentSchema);
  return { studentSchema, prisma };
}

export function requireAuthenticatedUserId(request: NextRequest): string {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    throw new ApiRouteError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return userId;
}

export async function requireAdminUser(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "admin") {
    throw new ApiRouteError(
      403,
      "FORBIDDEN",
      "Forbidden: Admin access required",
    );
  }
}
