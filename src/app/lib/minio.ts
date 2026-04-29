import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import path from "path";
import { randomUUID } from "crypto";

// MinIO configuration
const minioConfig = {
    endpoint: process.env.MINIO_API_URL || "",
    bucketName: process.env.MINIO_BUCKET_NAME || "",
    accessKeyId: process.env.MINIO_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "",
    forcePathStyle: true,
    region: "us-east-1" // MinIO requires a region but doesn't use it, so any value works
};

const s3Client = minioConfig.endpoint && minioConfig.accessKeyId && minioConfig.secretAccessKey
    ? new S3Client({
        endpoint: minioConfig.endpoint,
        credentials: {
            accessKeyId: minioConfig.accessKeyId,
            secretAccessKey: minioConfig.secretAccessKey
        },
        forcePathStyle: minioConfig.forcePathStyle,
        region: minioConfig.region
    })
    : undefined;

function safeParseUrl(value: string): URL | undefined {
    try {
        return new URL(value);
    } catch {
        return undefined;
    }
}

const minioEndpointUrl = safeParseUrl(minioConfig.endpoint);

function getMinioObjectKeyFromImageUrl(imageUrl: string): string | null {
    if (!minioEndpointUrl || !minioConfig.bucketName) {
        return null;
    }

    const parsedImageUrl = safeParseUrl(imageUrl);
    if (!parsedImageUrl) {
        return null;
    }

    const endpointPort = minioEndpointUrl.port || (minioEndpointUrl.protocol === "https:" ? "443" : "80");
    const imagePort = parsedImageUrl.port || (parsedImageUrl.protocol === "https:" ? "443" : "80");

    if (parsedImageUrl.hostname !== minioEndpointUrl.hostname || imagePort !== endpointPort) {
        return null;
    }

    const pathSegments = parsedImageUrl.pathname.split("/").filter(Boolean);
    if (pathSegments.length < 2 || pathSegments[0] !== minioConfig.bucketName) {
        return null;
    }

    const objectKey = decodeURIComponent(pathSegments.slice(1).join("/"));
    return objectKey || null;
}

export async function uploadImageToMinio(fileBuffer: Buffer, originalName: string) {
    if (!s3Client || !minioConfig.bucketName) {
        console.warn("MinIO storage is not configured. Skipping image upload.");
        throw new Error("MinIO upload is disabled due to missing configuration.");
    }

    // Generate a unique filename
    const fileExt = path.extname(originalName);
    const fileName = `${randomUUID()}${fileExt}`;

    try {
        const contentType = `image/${fileExt.slice(1)}`;

        const putObjectParams = {
            Bucket: minioConfig.bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType
        };

        await s3Client.send(new PutObjectCommand(putObjectParams));

        return `${minioConfig.endpoint}/${minioConfig.bucketName}/${fileName}`;
    } catch (error) {
        console.error("Failed to upload image to MinIO:", error);
        throw new Error("Failed to upload image to MinIO");
    }
}

export async function deleteImagesFromMinio(imageUrls: string[]): Promise<{ deleted: number; skipped: number }> {
    const uniqueImageUrls = [...new Set(imageUrls.filter(Boolean))];
    if (uniqueImageUrls.length === 0) {
        return { deleted: 0, skipped: 0 };
    }

    if (!s3Client || !minioConfig.bucketName || !minioEndpointUrl) {
        console.warn("MinIO storage is not fully configured. Skipping image cleanup.");
        return {
            deleted: 0,
            skipped: uniqueImageUrls.length,
        };
    }

    let deleted = 0;
    let skipped = 0;
    const failedKeys: string[] = [];

    for (const imageUrl of uniqueImageUrls) {
        const objectKey = getMinioObjectKeyFromImageUrl(imageUrl);
        if (!objectKey) {
            skipped += 1;
            continue;
        }

        try {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: minioConfig.bucketName,
                Key: objectKey,
            }));
            deleted += 1;
        } catch (error) {
            failedKeys.push(objectKey);
            console.error(`Failed to delete MinIO object '${objectKey}'.`, error);
        }
    }

    if (failedKeys.length > 0) {
        throw new Error(`Failed to delete ${failedKeys.length} MinIO object(s).`);
    }

    return { deleted, skipped };
}
