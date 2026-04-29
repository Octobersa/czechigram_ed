import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";

export async function PATCH(request: NextRequest) {
  try {
    const userId = requireAuthenticatedUserId(request);
    const { prisma } = await getTenantContext();

    const body = (await request.json()) as { bio?: string | null };
    if (body.bio === undefined) {
      return apiError(400, "Bio field is required", "MISSING_BIO");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { bio: body.bio },
      select: { id: true, name: true, bio: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return handleApiRouteError(error, "Error updating user bio:");
  }
}
