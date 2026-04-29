import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
  requireAuthenticatedUserId,
} from "@/app/lib/apiRoute";

type SearchUserResult = {
  id: string;
  name: string;
};

export async function GET(request: NextRequest) {
  try {
    requireAuthenticatedUserId(request);
    const query = request.nextUrl.searchParams.get("query")?.trim();

    if (!query) {
      return apiError(400, "Search query is required", "MISSING_SEARCH_QUERY");
    }

    const { prisma } = await getTenantContext();
    const users = await prisma.$queryRaw<SearchUserResult[]>(
      Prisma.sql`
        SELECT id, name
        FROM User
        WHERE LOWER(name) LIKE CONCAT('%', LOWER(${query}), '%') OR LOWER(id) LIKE LOWER(${query})
      `,
    );

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Search error:");
  }
}
