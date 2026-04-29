import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAdminUser,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";



export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  try {
    const { prisma } = await getTenantContext();
    const userId = requireAuthenticatedUserId(request);
    await requireAdminUser(prisma, userId);

    const photoId = Number.parseInt((await params).id, 10);
    if (!Number.isFinite(photoId)) {
      return apiError(400, "Invalid photo id", "INVALID_PHOTO_ID");
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ message: "Photo deleted successfully" });
  } catch (error) {
    return handleApiRouteError(error, "Error deleting photo:");
  }
} 
