import { NextResponse, NextRequest } from "next/server";
import { Photo } from "@/app/types/types";
import {
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";
import { Prisma } from "@prisma/client"; 

export async function GET(req: NextRequest) {
  const requestedUserId = req.nextUrl.searchParams.get('userId'); // Optional userId parameter
  const requestedDescription = req.nextUrl.searchParams.get('description'); // Optional description parameter
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 50 ? limit : 10;
  const skip = (validPage - 1) * validLimit;

  console.log("Requested description:", requestedDescription);
  const sanitizedDescription = requestedDescription ? requestedDescription.trim() : null;

  const whereClause: Prisma.PhotoWhereInput = {};
  if (requestedUserId) {
    whereClause.userId = Array.isArray(requestedUserId) ? requestedUserId[0] : requestedUserId;
  }
  if (sanitizedDescription) {
    whereClause.description = {
      contains: sanitizedDescription,

    };
  }

  try {
    const userId = requireAuthenticatedUserId(req);
    const { prisma } = await getTenantContext();
    // Get total count for pagination info
    const totalCount = await prisma.photo.count({
      where: whereClause,
    });

    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: validLimit,
      include: {
        likes: {
          select: {
            userId: true,
          }
        },
        user: {
          select: {
            name: true,
          },
        },
        reports: {
          select: {
            userId: true,
          },
        },
      },
    });

    const photosWithLikes: Photo[] = photos.map((photo) => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      username: photo.user.name,
      userId: photo.userId,
      createdAt: photo.createdAt,
      likesCount: photo.likes.length,
      userLiked: photo.likes.some(like => like.userId === userId),
      description: photo.description,
      userReported: photo.reports.some(report => report.userId === userId),
    }));

    // Return pagination metadata along with the photos
    return NextResponse.json({
      photos: photosWithLikes,
      pagination: {
        total: totalCount,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(totalCount / validLimit)
      }
    }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Failed to fetch photos:");
  }
}
