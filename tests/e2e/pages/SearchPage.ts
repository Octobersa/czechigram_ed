import type { Locator, Page } from "@playwright/test";

export class SearchPage {
  constructor(
    private readonly page: Page,
    private readonly studentName: string,
  ) {}

  searchInput(): Locator {
    return this.page.getByTestId("search-user-input");
  }

  searchSubmit(): Locator {
    return this.page.getByTestId("search-user-submit");
  }

  firstResult(): Locator {
    return this.page.locator('[data-test-id="search-results-list"] li').first();
  }

  async goto(): Promise<void> {
    await this.page.goto(`/${this.studentName}/search`);
  }

  async search(query: string): Promise<void> {
    await this.searchInput().fill(query);
    await this.searchSubmit().click();
  }

  async openFirstResult(): Promise<void> {
    await this.firstResult().click();
  }
}
