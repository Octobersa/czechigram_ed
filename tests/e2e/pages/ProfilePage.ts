import type { Locator, Page } from "@playwright/test";

export class ProfilePage {
  constructor(
    private readonly page: Page,
    private readonly studentName: string,
  ) {}

  profileUrlPattern(): RegExp {
    return new RegExp(`/${this.studentName}/profile/`);
  }

  username(): Locator {
    return this.page.getByTestId("profile-username");
  }

  postList(): Locator {
    return this.page.getByTestId("profile-post-list");
  }
}
