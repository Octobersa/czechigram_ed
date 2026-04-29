import { expect, test } from "@playwright/test";
import {
  createStudentSchema,
  deleteStudentSchema,
  registrationPassword,
  resolveStudentName,
  searchQuery,
  seededAdminEmail,
  seededUserPassword,
  studentManagementToken,
  uniqueId,
} from "./testUtils";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentsManagementPage } from "./pages/StudentsManagementPage";
import { SearchPage } from "./pages/SearchPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminReportsPage } from "./pages/AdminReportsPage";

const uiSuiteStudent = resolveStudentName("PLAYWRIGHT_UI_STUDENT", "ui");

test.describe("ui flows", { tag: "@ui" }, () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ request }) => {
    await createStudentSchema(request, uiSuiteStudent);
  });

  test.afterAll(async ({ request }) => {
    await deleteStudentSchema(request, uiSuiteStudent);
  });

  test(
    "students management create and delete",
    { tag: ["@smoke", "@students"] },
    async ({ page }) => {
      const studentsPage = new StudentsManagementPage(page);
      const studentToCreate = uniqueId("uitest");

      await studentsPage.setAdminTokenBeforeLoad(studentManagementToken);
      await studentsPage.goto();
    await expect(studentsPage.title()).toBeVisible();

    await studentsPage.createStudent(studentToCreate);
    await expect(studentsPage.studentRow(studentToCreate)).toBeVisible();

      await studentsPage.deleteStudent(studentToCreate);
      await expect(studentsPage.studentRow(studentToCreate)).toHaveCount(0);
    },
  );

  test(
    "registration allows login with new account",
    { tag: ["@smoke", "@auth"] },
    async ({ page }) => {
      const authPage = new AuthPage(page, uiSuiteStudent);
      const dashboardPage = new DashboardPage(page, uiSuiteStudent);
      const suffix = uniqueId("user");
      const name = `pw-${suffix}`;
      const email = `${suffix}@example.com`;

      await authPage.gotoRegister();
      await authPage.register(name, email, registrationPassword);
      await expect(page).toHaveURL(dashboardPage.dashboardUrlPattern());
      await expect(dashboardPage.dashboardContent()).toBeVisible();

      await authPage.logout();
      await expect(page).toHaveURL(authPage.loginUrlPattern());
      await authPage.login(email, registrationPassword);
      await expect(page).toHaveURL(dashboardPage.dashboardUrlPattern());
      await expect(dashboardPage.dashboardContent()).toBeVisible();
    },
  );

  test(
    "seeded admin can login and access dashboard",
    { tag: ["@smoke", "@auth", "@admin"] },
    async ({ page }) => {
      const authPage = new AuthPage(page, uiSuiteStudent);
      const dashboardPage = new DashboardPage(page, uiSuiteStudent);

      await authPage.gotoLogin();
      await authPage.login(seededAdminEmail, seededUserPassword);
      await expect(page).toHaveURL(dashboardPage.dashboardUrlPattern());
      await expect(dashboardPage.dashboardContent()).toBeVisible();
      await expect(dashboardPage.postList()).toBeVisible();
      await expect(dashboardPage.newPostButton()).toBeVisible();
      await expect(dashboardPage.adminNav()).toBeVisible();

      await authPage.gotoLogin();
      await expect(page).toHaveURL(dashboardPage.dashboardUrlPattern());
      await expect(dashboardPage.dashboardContent()).toBeVisible();
    },
  );

  test(
    "search navigates to profile page",
    { tag: ["@smoke", "@search"] },
    async ({ page }) => {
      const authPage = new AuthPage(page, uiSuiteStudent);
      const dashboardPage = new DashboardPage(page, uiSuiteStudent);
      const searchPage = new SearchPage(page, uiSuiteStudent);
      const profilePage = new ProfilePage(page, uiSuiteStudent);

      await authPage.gotoLogin();
      await authPage.login(seededAdminEmail, seededUserPassword);
      await expect(page).toHaveURL(dashboardPage.dashboardUrlPattern());
      await expect(dashboardPage.dashboardContent()).toBeVisible();

      await searchPage.goto();
      await searchPage.search(searchQuery);
      await expect(searchPage.firstResult()).toBeVisible();
      await searchPage.openFirstResult();
      await expect(page).toHaveURL(profilePage.profileUrlPattern());
      await expect(profilePage.username()).toBeVisible();
      await expect(profilePage.postList()).toBeVisible();
    },
  );

  test("admin reports page loads", { tag: ["@smoke", "@admin"] }, async ({ page }) => {
    const authPage = new AuthPage(page, uiSuiteStudent);
    const dashboardPage = new DashboardPage(page, uiSuiteStudent);
    const adminReportsPage = new AdminReportsPage(page, uiSuiteStudent);

    await authPage.gotoLogin();
    await authPage.login(seededAdminEmail, seededUserPassword);
    await expect(page).toHaveURL(dashboardPage.dashboardUrlPattern());
    await expect(dashboardPage.dashboardContent()).toBeVisible();

    await adminReportsPage.goto();
    await expect(adminReportsPage.reportsTitle()).toBeVisible();
    await expect(adminReportsPage.pendingTab()).toBeVisible();
    await expect(adminReportsPage.dismissedTab()).toBeVisible();
    await expect(adminReportsPage.firstReportOrEmptyState()).toBeVisible();
  });
});
