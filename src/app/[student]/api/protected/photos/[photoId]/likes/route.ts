import type { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";

async function findExistingLikeId(
  prisma: PrismaClient,
  userId: string,
  photoId: number,
): Promise<number | null> {
  const existingLike = await prisma.like.findFirst({
    where: {
      userId,
      photoId,
    },
    select: { id: true },
  });

  return existingLike?.id ?? null;
}

function parsePhotoId(rawPhotoId: string): number | null {
  const photoId = Number.parseInt(rawPhotoId, 10);
  if (!Number.isFinite(photoId)) {
    return null;
  }

  return photoId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    requireAuthenticatedUserId(request);
    const { prisma } = await getTenantContext();

    const photoId = parsePhotoId((await params).photoId);
    if (photoId === null) {
      return apiError(400, "Invalid photo id", "INVALID_PHOTO_ID");
    }

    const likesCount = await prisma.like.count({
      where: {
        photoId,
      },
    });

    return NextResponse.json({ likesCount }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Failed to fetch likes:");
  }
}

export async function POST(
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

    if (await findExistingLikeId(prisma, userId, photoId)) {
      return apiError(400, "You already liked this photo", "LIKE_ALREADY_EXISTS");
    }

    const like = await prisma.like.create({
      data: {
        userId,
        photoId,
      },
    });

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error, "Failed to like photo:");
  }
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

    const existingLikeId = await findExistingLikeId(prisma, userId, photoId);
    if (!existingLikeId) {
      return apiError(400, "You haven't liked this photo yet", "LIKE_NOT_FOUND");
    }

    await prisma.like.delete({
      where: {
        id: existingLikeId,
      },
    });

    return NextResponse.json({ message: "Like removed successfully" }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Failed to remove like:");
  }
}
