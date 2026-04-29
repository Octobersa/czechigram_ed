import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from 'jose';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathParts = url.pathname.split('/');


  // Ignore internal next.js requests or invalid/config paths
  if (url.pathname.startsWith('/public') || url.pathname.startsWith('/_next') || pathParts.length <= 2 || url.pathname.startsWith('/students')) {
    return NextResponse.next();
  }

  const studentName = pathParts[1];
  const studentDbSchema = `student_${studentName}`

  const requestHeaders = new Headers(req.headers);
  
  requestHeaders.set('x-student-schema', studentDbSchema);

  // Check auth for protected API routes
  if (pathParts.length >= 4 && pathParts[2] === 'api' && pathParts[3] === 'protected') {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jose.jwtVerify(token, secret);
      console.log("Token verified successfully");
    } catch (error) {
      console.log("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/:path*'  // Match all paths to handle both student schema and protected routes
  ]
};