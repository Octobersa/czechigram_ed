import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";
import { getBugStatus } from "@/app/lib/bugActions";
import { Bugs } from "@/app/lib/bugs";

function parsePhotoId(rawPhotoId: string): number | null {
  const photoId = Number.parseInt(rawPhotoId, 10);
  if (!Number.isFinite(photoId)) {
    return null;
  }

  return photoId;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    const userId = requireAuthenticatedUserId(request);
    const { prisma } = await getTenantContext();

    const photoId = parsePhotoId((await params).photoId);
    if (photoId === null) {
      return apiError(400, "Invalid photo id", "INVALID_PHOTO_ID");
    }

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      select: { userId: true },
    });

    if (!photo || photo.userId !== userId) {
      return apiError(
        403,
        "Unauthorized to delete this photo",
        "PHOTO_DELETE_FORBIDDEN",
      );
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ message: "Photo deleted successfully" }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Failed to delete photo:");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    const userId = requireAuthenticatedUserId(request);
    const { prisma, studentSchema } = await getTenantContext();

    const photoId = parsePhotoId((await params).photoId);
    if (photoId === null) {
      return apiError(400, "Invalid photo id", "INVALID_PHOTO_ID");
    }

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      select: { userId: true },
    });

    if (!photo || photo.userId !== userId) {
      return apiError(
        403,
        "Unauthorized to update this photo",
        "PHOTO_UPDATE_FORBIDDEN",
      );
    }

    const body = (await request.json()) as { description?: unknown };
    if (typeof body.description !== "string") {
      return apiError(400, "Description is required", "MISSING_DESCRIPTION");
    }

    const isPostDescriptionOptional = await getBugStatus(
      Bugs.POST_DESCRIPTION_NOT_OPTIONAL.id,
      studentSchema,
    );

    if (!isPostDescriptionOptional && body.description.length === 0) {
      return apiError(400, "Description is required", "MISSING_DESCRIPTION");
    }

    const description = body.description.length === 0 ? null : body.description;

    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        description,
      },
    });

    return NextResponse.json(updatedPhoto, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Failed to update photo:");
  }
}
