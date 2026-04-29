import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { createAuthToken } from "@/app/lib/auth";
import {
  apiError,
  getTenantContext,
  handleApiRouteError,
} from "@/app/lib/apiRoute";
import {getBugStatus} from "@/app/lib/bugActions";
import {Bugs} from "@/app/lib/bugs";

// Define request validation schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  name: z.string(),
});

const registerBuggySchema = z.object({
  email: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  name: z.string(),
});

export async function POST(req: Request) {
  try {
    const { prisma, studentSchema } = await getTenantContext();
    const body = await req.json();

    const parsedData =  (await getBugStatus(Bugs.MISSING_EMAIL_VALIDATION.id, studentSchema)) ?
       registerSchema.safeParse(body)
    :
      registerBuggySchema.safeParse(body)

    if (!parsedData.success) {
      return apiError(
        400,
        "Invalid request body",
        "VALIDATION_ERROR",
        parsedData.error.flatten(),
      );
    }

    const { email, password, name } = parsedData.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError(400, "User already exists", "USER_ALREADY_EXISTS");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });
    const token = await createAuthToken(user.id);

    return NextResponse.json({ message: `User ${user.name} registered successfully`, token: token }, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error, "Registration error:");
  }
}
