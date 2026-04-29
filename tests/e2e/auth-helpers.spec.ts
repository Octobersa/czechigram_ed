import { expect, test } from "@playwright/test";
import { NextRequest } from "next/server";
import { createAuthToken, getUserIdFromRequest } from "@/app/lib/auth";
import { readEnvValue, uniqueId } from "./testUtils";

function ensureJwtSecret(): string {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = readEnvValue("JWT_SECRET") ?? "local-playwright-jwt-secret";
  }

  return process.env.JWT_SECRET;
}

test.describe("auth helper tests", { tag: ["@unit", "@auth"] }, () => {
  test(
    "createAuthToken can be decoded by getUserIdFromRequest",
    { tag: "@token" },
    async () => {
    ensureJwtSecret();
    const expectedUserId = uniqueId("user");
    const token = await createAuthToken(expectedUserId);
    const request = new NextRequest("http://localhost/test", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(getUserIdFromRequest(request)).toBe(expectedUserId);
    },
  );

  test(
    "getUserIdFromRequest returns null for missing and invalid token",
    { tag: "@token" },
    () => {
    ensureJwtSecret();

    const noHeaderRequest = new NextRequest("http://localhost/test");
    expect(getUserIdFromRequest(noHeaderRequest)).toBeNull();

    const invalidHeaderRequest = new NextRequest("http://localhost/test", {
      headers: {
        authorization: "Bearer invalid.token.value",
      },
    });
    expect(getUserIdFromRequest(invalidHeaderRequest)).toBeNull();
    },
  );
});
