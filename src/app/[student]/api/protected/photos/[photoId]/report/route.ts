import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    const userId = requireAuthenticatedUserId(request);
    const { prisma } = await getTenantContext();

    const photoId = Number.parseInt((await params).photoId, 10);
    if (!Number.isFinite(photoId)) {
      return apiError(400, "Invalid photo id", "INVALID_PHOTO_ID");
    }

    const body = (await request.json()) as { reason?: unknown };
    const reason = typeof body.reason === "string" ? body.reason : "";

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return apiError(404, "Photo not found", "PHOTO_NOT_FOUND");
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        userId,
        photoId,
      },
    });

    if (existingReport) {
      return apiError(
        400,
        "You have already reported this photo",
        "REPORT_ALREADY_EXISTS",
      );
    }

    const report = await prisma.report.create({
      data: {
        userId,
        photoId,
        reason,
        status: "pending",
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error, "Error reporting photo:");
  }
}
