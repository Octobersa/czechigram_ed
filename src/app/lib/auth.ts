import jwt from "jsonwebtoken";
import * as jose from "jose";
import { NextRequest } from "next/server";


export function getUserIdFromRequest(req: NextRequest): string | null {

  const authHeader =new Headers(req.headers).get('authorization');

  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function createAuthToken(userId: string): Promise<string> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const secret = new TextEncoder().encode(jwtSecret);
  return new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}
