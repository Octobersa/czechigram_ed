import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createAuthToken } from "@/app/lib/auth";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
} from "@/app/lib/apiRoute";
import { z } from "zod";
import {getBugStatus} from "@/app/lib/bugActions";
import {Bugs} from "@/app/lib/bugs";

const loginBuggySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginNonValidatingSchema = z.object({
  email: z.string(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const { prisma, studentSchema } = await getTenantContext();
    const body = await req.json();
    const parsedData =
        (await getBugStatus(Bugs.NON_VALID_MAIL_USER_CANNOT_LOGIN.id, studentSchema)) ?
            loginNonValidatingSchema.safeParse(body) : loginBuggySchema.safeParse(body);
    if (!parsedData.success) {
      return apiError(
        400,
        "Invalid request body",
        "VALIDATION_ERROR",
        parsedData.error.flatten(),
      );
    }

    const { email, password } = parsedData.data;

    // Find user in database
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return apiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = await createAuthToken(user.id);

    return NextResponse.json({ token, userId: user.id, role: user.role }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, "Login error:");
  }
}
