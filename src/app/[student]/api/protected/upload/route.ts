import { NextRequest, NextResponse } from "next/server";
import { uploadImageToMinio } from "@/app/lib/minio";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";

export async function POST(request: NextRequest) {
  try {
    const userId = requireAuthenticatedUserId(request);
    const { prisma } = await getTenantContext();

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const descriptionEntry = formData.get("description");

    if (!(fileEntry instanceof File)) {
      return apiError(400, "No file provided", "NO_FILE_PROVIDED");
    }

    const description = typeof descriptionEntry === "string" ? descriptionEntry : null;
    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());

    let imageUrl: string;
    try {
      imageUrl = await uploadImageToMinio(fileBuffer, fileEntry.name);
    } catch (error) {
      console.error("Error uploading image:", error);
      return apiError(500, "Upload failed", "UPLOAD_FAILED");
    }

    const newPhoto = await prisma.photo.create({
      data: {
        userId,
        imageUrl,
        description,
      },
    });

    return NextResponse.json({ imageUrl, photoId: newPhoto.id }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Upload route error:");
  }
}
