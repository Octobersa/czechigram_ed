import type { Locator, Page } from "@playwright/test";

export class AdminReportsPage {
  constructor(
    private readonly page: Page,
    private readonly studentName: string,
  ) {}

  reportsTitle(): Locator {
    return this.page.getByTestId("reports-title");
  }

  pendingTab(): Locator {
    return this.page.getByTestId("reports-tab-pending");
  }

  dismissedTab(): Locator {
    return this.page.getByTestId("reports-tab-dismissed");
  }

  firstReportOrEmptyState(): Locator {
    return this.page
      .locator('[data-test-id="reports-empty-pending"], [data-test-id^="report-card-"]')
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto(`/${this.studentName}/admin`);
  }
}
