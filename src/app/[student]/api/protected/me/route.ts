import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";

export async function GET(request: NextRequest) {
  try {
    const userId = requireAuthenticatedUserId(request);
    const { prisma } = await getTenantContext();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return apiError(404, "User not found", "USER_NOT_FOUND");
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiRouteError(error, "Failed to fetch current user:");
  }
}
