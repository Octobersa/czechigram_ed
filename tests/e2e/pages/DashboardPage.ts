import type { Locator, Page } from "@playwright/test";

export class DashboardPage {
  constructor(
    private readonly page: Page,
    private readonly studentName: string,
  ) {}

  dashboardUrlPattern(): RegExp {
    return new RegExp(`/${this.studentName}/dashboard`);
  }

  dashboardContent(): Locator {
    return this.page.getByTestId("dashboard-content");
  }

  postList(): Locator {
    return this.page.getByTestId("dashboard-post-list");
  }

  newPostButton(): Locator {
    return this.page.getByTestId("new-post-button");
  }

  adminNav(): Locator {
    return this.page.getByTestId("nav-admin");
  }
}
