import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    requireAuthenticatedUserId(request);
    const { prisma } = await getTenantContext();
    const userId = (await params).userId;

    if (!userId) {
      return apiError(400, "User ID is required", "USER_ID_REQUIRED");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, bio: true },
    });

    if (!user) {
      return apiError(404, "User not found", "USER_NOT_FOUND");
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiRouteError(error, "Failed to fetch user:");
  }
}
