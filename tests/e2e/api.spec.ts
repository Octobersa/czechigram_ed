import { type APIRequestContext, expect, test } from "@playwright/test";
import {
  createStudentSchema,
  deleteStudentSchema,
  loginViaApi,
  readEnvValue,
  registrationPassword,
  resolveStudentName,
  seededAdminEmail,
  seededUserEmail,
  seededUserPassword,
  uniqueId,
} from "./testUtils";
import { setBugStatus } from "@/app/lib/bugActions";
import { Bugs } from "@/app/lib/bugs";
import { getPrismaForStudent } from "@/app/lib/prisma";

const apiSuiteStudent = resolveStudentName("PLAYWRIGHT_API_STUDENT", "api");
type AuthSession = Awaited<ReturnType<typeof loginViaApi>>;
type PhotoSummary = {
  id: number;
  userId: string;
};

let adminSession: AuthSession;
let regularUserSession: AuthSession;

function ensureDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    const databaseUrl = readEnvValue("DATABASE_URL");
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for bug-status API regression tests.");
    }
    process.env.DATABASE_URL = databaseUrl;
  }

  return process.env.DATABASE_URL;
}

async function listPhotos(
  request: APIRequestContext,
  token: string,
  requestedUserId?: string,
): Promise<PhotoSummary[]> {
  const search = requestedUserId ? `?userId=${encodeURIComponent(requestedUserId)}` : "";
  const response = await request.get(`/${apiSuiteStudent}/api/protected/photos${search}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body.photos)).toBeTruthy();

  return body.photos as PhotoSummary[];
}

async function createPhotoFixture(userId: string, description: string): Promise<number> {
  ensureDatabaseUrl();
  const prisma = await getPrismaForStudent(`student_${apiSuiteStudent}`);
  const photo = await prisma.photo.create({
    data: {
      userId,
      imageUrl: `https://example.invalid/${uniqueId("photo")}.png`,
      description,
    },
  });
  return photo.id;
}

test.describe("api regression suite", { tag: ["@api", "@regression"] }, () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ request }) => {
    await createStudentSchema(request, apiSuiteStudent);
    adminSession = await loginViaApi(
      request,
      apiSuiteStudent,
      seededAdminEmail,
      seededUserPassword,
    );
    regularUserSession = await loginViaApi(
      request,
      apiSuiteStudent,
      seededUserEmail,
      seededUserPassword,
    );
  });

  test.afterAll(async ({ request }) => {
    await deleteStudentSchema(request, apiSuiteStudent);
  });

  test(
    "login with wrong password returns structured auth error",
    { tag: "@auth" },
    async ({ request }) => {
    const response = await request.post(`/${apiSuiteStudent}/api/auth/login`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        email: seededAdminEmail,
        password: "wrong-password",
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
      error: "Invalid email or password",
    });
    },
  );

  test(
    "registering existing user returns structured duplicate error",
    { tag: "@auth" },
    async ({ request }) => {
    const email = `${uniqueId("dupuser")}@example.com`;
    const payload = {
      name: "Duplicate User",
      email,
      password: registrationPassword,
    };

    const firstResponse = await request.post(`/${apiSuiteStudent}/api/auth/register`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    });
    expect(firstResponse.status()).toBe(201);

    const duplicateResponse = await request.post(`/${apiSuiteStudent}/api/auth/register`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    });
    expect(duplicateResponse.status()).toBe(400);

    const duplicateBody = await duplicateResponse.json();
    expect(duplicateBody).toMatchObject({
      code: "USER_ALREADY_EXISTS",
      message: "User already exists",
      error: "User already exists",
    });
    },
  );

  test(
    "protected photos requires bearer token (middleware guard)",
    { tag: "@protected" },
    async ({ request }) => {
    const response = await request.get(`/${apiSuiteStudent}/api/protected/photos`);
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toMatchObject({
      error: "Unauthorized",
    });
    },
  );

  test("admin reports requires bearer token", { tag: "@admin" }, async ({ request }) => {
    const response = await request.get(`/${apiSuiteStudent}/api/admin/reports?status=pending`);
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toMatchObject({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      error: "Unauthorized",
    });
  });

  test(
    "admin reports validates invalid status with structured error",
    { tag: "@admin" },
    async ({ request }) => {
    const response = await request.get(`/${apiSuiteStudent}/api/admin/reports?status=invalid`, {
      headers: {
        Authorization: `Bearer ${adminSession.token}`,
      },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toMatchObject({
      code: "INVALID_REPORT_STATUS",
      message: "Invalid status value",
      error: "Invalid status value",
    });
    },
  );

  test("admin photo delete validates photo id", { tag: "@admin" }, async ({ request }) => {
    const response = await request.delete(`/${apiSuiteStudent}/api/admin/photos/not-a-number`, {
      headers: {
        Authorization: `Bearer ${adminSession.token}`,
      },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toMatchObject({
      code: "INVALID_PHOTO_ID",
      message: "Invalid photo id",
      error: "Invalid photo id",
    });
  });

  test(
    "photo likes lifecycle works and prevents duplicates",
    { tag: ["@lifecycle", "@likes"] },
    async ({ request }) => {
    const photos = await listPhotos(request, regularUserSession.token);
    expect(photos.length).toBeGreaterThan(0);
    const targetPhoto = photos.find((photo) => photo.userId !== regularUserSession.userId) ?? photos[0];
    expect(targetPhoto).toBeDefined();

    const createLikeResponse = await request.post(
      `/${apiSuiteStudent}/api/protected/photos/${targetPhoto.id}/likes`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
          "Content-Type": "application/json",
        },
      },
    );
    expect(createLikeResponse.status()).toBe(201);

    const duplicateLikeResponse = await request.post(
      `/${apiSuiteStudent}/api/protected/photos/${targetPhoto.id}/likes`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
          "Content-Type": "application/json",
        },
      },
    );
    expect(duplicateLikeResponse.status()).toBe(400);
    const duplicateLikeBody = await duplicateLikeResponse.json();
    expect(duplicateLikeBody).toMatchObject({
      code: "LIKE_ALREADY_EXISTS",
      message: "You already liked this photo",
      error: "You already liked this photo",
    });

    const likeCountResponse = await request.get(
      `/${apiSuiteStudent}/api/protected/photos/${targetPhoto.id}/likes`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
        },
      },
    );
    expect(likeCountResponse.status()).toBe(200);
    const likeCountBody = await likeCountResponse.json();
    expect(likeCountBody.likesCount).toBeGreaterThanOrEqual(1);

    const removeLikeResponse = await request.delete(
      `/${apiSuiteStudent}/api/protected/photos/${targetPhoto.id}/likes`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
          "Content-Type": "application/json",
        },
      },
    );
    expect(removeLikeResponse.status()).toBe(200);

    const removeLikeAgainResponse = await request.delete(
      `/${apiSuiteStudent}/api/protected/photos/${targetPhoto.id}/likes`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
          "Content-Type": "application/json",
        },
      },
    );
    expect(removeLikeAgainResponse.status()).toBe(400);
    const removeLikeAgainBody = await removeLikeAgainResponse.json();
    expect(removeLikeAgainBody).toMatchObject({
      code: "LIKE_NOT_FOUND",
      message: "You haven't liked this photo yet",
      error: "You haven't liked this photo yet",
    });
    },
  );

  test(
    "report and admin moderation lifecycle works",
    { tag: ["@lifecycle", "@admin", "@reports"] },
    async ({ request }) => {
    const photos = await listPhotos(request, regularUserSession.token);
    expect(photos.length).toBeGreaterThan(0);
    const targetPhoto = photos.find((photo) => photo.userId !== regularUserSession.userId) ?? photos[0];
    expect(targetPhoto).toBeDefined();
    const reason = `Regression report ${uniqueId("reason")}`;

    const createReportResponse = await request.post(
      `/${apiSuiteStudent}/api/protected/photos/${targetPhoto.id}/report`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
          "Content-Type": "application/json",
        },
        data: { reason },
      },
    );
    expect(createReportResponse.status()).toBe(201);
    const createdReport = await createReportResponse.json();
    expect(createdReport).toMatchObject({
      userId: regularUserSession.userId,
      photoId: targetPhoto.id,
      status: "pending",
      reason,
    });

    const duplicateReportResponse = await request.post(
      `/${apiSuiteStudent}/api/protected/photos/${targetPhoto.id}/report`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
          "Content-Type": "application/json",
        },
        data: { reason: `${reason}-duplicate` },
      },
    );
    expect(duplicateReportResponse.status()).toBe(400);
    const duplicateReportBody = await duplicateReportResponse.json();
    expect(duplicateReportBody).toMatchObject({
      code: "REPORT_ALREADY_EXISTS",
      message: "You have already reported this photo",
      error: "You have already reported this photo",
    });

    const pendingReportsResponse = await request.get(
      `/${apiSuiteStudent}/api/admin/reports?status=pending`,
      {
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
        },
      },
    );
    expect(pendingReportsResponse.status()).toBe(200);
    const pendingReports = (await pendingReportsResponse.json()) as Array<{ id: number }>;
    const pendingReport = pendingReports.find((report) => report.id === createdReport.id);
    expect(pendingReport).toBeDefined();

    const dismissReportResponse = await request.patch(
      `/${apiSuiteStudent}/api/admin/reports/${createdReport.id}/status`,
      {
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
          "Content-Type": "application/json",
        },
        data: { status: "dismissed" },
      },
    );
    expect(dismissReportResponse.status()).toBe(200);
    const dismissedReport = await dismissReportResponse.json();
    expect(dismissedReport).toMatchObject({
      id: createdReport.id,
      status: "dismissed",
    });

    const dismissedReportsResponse = await request.get(
      `/${apiSuiteStudent}/api/admin/reports?status=dismissed`,
      {
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
        },
      },
    );
    expect(dismissedReportsResponse.status()).toBe(200);
    const dismissedReports = (await dismissedReportsResponse.json()) as Array<{ id: number }>;
    expect(dismissedReports.some((report) => report.id === createdReport.id)).toBeTruthy();
    },
  );

  test("user bio update is persisted", { tag: ["@lifecycle", "@profile"] }, async ({ request }) => {
    const bio = `Playwright bio ${uniqueId("bio")}`;

    const updateBioResponse = await request.patch(`/${apiSuiteStudent}/api/protected/me/bio`, {
      headers: {
        Authorization: `Bearer ${regularUserSession.token}`,
        "Content-Type": "application/json",
      },
      data: { bio },
    });
    expect(updateBioResponse.status()).toBe(200);
    const updatedBioBody = await updateBioResponse.json();
    expect(updatedBioBody).toMatchObject({
      id: regularUserSession.userId,
      bio,
    });

    const getUserResponse = await request.get(
      `/${apiSuiteStudent}/api/protected/users/${regularUserSession.userId}`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
        },
      },
    );
    expect(getUserResponse.status()).toBe(200);
    const userBody = await getUserResponse.json();
    expect(userBody).toMatchObject({
      id: regularUserSession.userId,
      bio,
    });
  });

  test(
    "owner-only photo delete guard and deletion lifecycle",
    { tag: ["@lifecycle", "@photos"] },
    async ({ request }) => {
    const adminPhotos = await listPhotos(request, adminSession.token, adminSession.userId);
    expect(adminPhotos.length).toBeGreaterThan(0);
    const targetPhoto = adminPhotos[0];

    const forbiddenDeleteResponse = await request.delete(
      `/${apiSuiteStudent}/api/protected/me/photos/${targetPhoto.id}`,
      {
        headers: {
          Authorization: `Bearer ${regularUserSession.token}`,
        },
      },
    );
    expect(forbiddenDeleteResponse.status()).toBe(403);
    const forbiddenBody = await forbiddenDeleteResponse.json();
    expect(forbiddenBody).toMatchObject({
      code: "PHOTO_DELETE_FORBIDDEN",
      message: "Unauthorized to delete this photo",
      error: "Unauthorized to delete this photo",
    });

    const ownerDeleteResponse = await request.delete(
      `/${apiSuiteStudent}/api/protected/me/photos/${targetPhoto.id}`,
      {
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
        },
      },
    );
    expect(ownerDeleteResponse.status()).toBe(200);
    const ownerDeleteBody = await ownerDeleteResponse.json();
    expect(ownerDeleteBody).toMatchObject({
      message: "Photo deleted successfully",
    });

    const adminPhotosAfterDeletion = await listPhotos(
      request,
      adminSession.token,
      adminSession.userId,
    );
    expect(adminPhotosAfterDeletion.some((photo) => photo.id === targetPhoto.id)).toBeFalsy();
    },
  );

  test(
    "description clear works only after optional-description bug is fixed",
    { tag: ["@lifecycle", "@photos"] },
    async ({ request }) => {
      ensureDatabaseUrl();
      await setBugStatus(Bugs.POST_DESCRIPTION_NOT_OPTIONAL.id, false, apiSuiteStudent);
      try {
        const targetPhotoId = await createPhotoFixture(
          adminSession.userId,
          `Initial description ${uniqueId("desc")}`,
        );

        const newDescription = `Updated description ${uniqueId("desc")}`;
        const setDescriptionResponse = await request.patch(
          `/${apiSuiteStudent}/api/protected/me/photos/${targetPhotoId}`,
          {
            headers: {
              Authorization: `Bearer ${adminSession.token}`,
              "Content-Type": "application/json",
            },
            data: { description: newDescription },
          },
        );
        expect(setDescriptionResponse.status()).toBe(200);
        const setDescriptionBody = await setDescriptionResponse.json();
        expect(setDescriptionBody).toMatchObject({
          id: targetPhotoId,
          description: newDescription,
        });

        const clearWhileBugPresentResponse = await request.patch(
          `/${apiSuiteStudent}/api/protected/me/photos/${targetPhotoId}`,
          {
            headers: {
              Authorization: `Bearer ${adminSession.token}`,
              "Content-Type": "application/json",
            },
            data: { description: "" },
          },
        );
        expect(clearWhileBugPresentResponse.status()).toBe(400);
        const clearWhileBugPresentBody = await clearWhileBugPresentResponse.json();
        expect(clearWhileBugPresentBody).toMatchObject({
          code: "MISSING_DESCRIPTION",
          message: "Description is required",
          error: "Description is required",
        });

        await setBugStatus(Bugs.POST_DESCRIPTION_NOT_OPTIONAL.id, true, apiSuiteStudent);
        const clearWhenFixedResponse = await request.patch(
          `/${apiSuiteStudent}/api/protected/me/photos/${targetPhotoId}`,
          {
            headers: {
              Authorization: `Bearer ${adminSession.token}`,
              "Content-Type": "application/json",
            },
            data: { description: "" },
          },
        );
        expect(clearWhenFixedResponse.status()).toBe(200);
        const clearWhenFixedBody = await clearWhenFixedResponse.json();
        expect(clearWhenFixedBody).toMatchObject({
          id: targetPhotoId,
          description: null,
        });
      } finally {
        await setBugStatus(Bugs.POST_DESCRIPTION_NOT_OPTIONAL.id, false, apiSuiteStudent);
      }
    },
  );
});
