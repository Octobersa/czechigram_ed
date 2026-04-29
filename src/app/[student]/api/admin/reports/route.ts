import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAdminUser,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";



export async function GET(request: NextRequest) {
  try {
    const { prisma } = await getTenantContext();
    const userId = requireAuthenticatedUserId(request);
    await requireAdminUser(prisma, userId);

    const url = new URL(request.url);
    const filter = url.searchParams.get("status") ?? 'pending';

    if (!["pending", "dismissed"].includes(filter)) {
      return apiError(400, "Invalid status value", "INVALID_REPORT_STATUS");
    }

    const reports = await prisma.report.findMany({
      where: {
        status: filter
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        photo: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    return handleApiRouteError(error, "Error fetching reports:");
  }
} 
