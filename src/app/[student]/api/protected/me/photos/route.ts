import { NextRequest, NextResponse } from "next/server";
import {
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";

export async function GET(request: NextRequest) {
  try {
    const userId = requireAuthenticatedUserId(request);
    const { prisma } = await getTenantContext();

    const photos = await prisma.photo.findMany({
      where: { userId },
    });

    return NextResponse.json(photos, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Failed to fetch user's photos:");
  }
}
