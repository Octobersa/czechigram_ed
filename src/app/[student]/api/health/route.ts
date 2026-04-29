import { NextResponse } from "next/server";
import { ApiRouteError, apiError, getTenantContext } from "@/app/lib/apiRoute";

export async function GET() {
  try {
    const { prisma } = await getTenantContext();
    const health = await prisma.$queryRaw`SELECT 1 as health`;
    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return apiError(error.status, error.message, error.code, error.details);
    }

    console.error("Student schema probably does not exist:", error);
    return apiError(404, "Tva testovaci instance neexistuje", "TEST_INSTANCE_NOT_FOUND");
  }
}
