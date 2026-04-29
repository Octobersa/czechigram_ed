import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAdminUser,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await getTenantContext();
    const userId = requireAuthenticatedUserId(request);
    await requireAdminUser(prisma, userId);

    const reportId = Number.parseInt((await params).id, 10);
    if (!Number.isFinite(reportId)) {
      return apiError(400, "Invalid report id", "INVALID_REPORT_ID");
    }

    const { status } = await request.json();

    if (!["pending", "dismissed"].includes(status)) {
      return apiError(400, "Invalid status value", "INVALID_REPORT_STATUS");
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    return handleApiRouteError(error, "Error updating report status:");
  }
} 
