import type { Page } from "@playwright/test";

export class AuthPage {
  constructor(
    private readonly page: Page,
    private readonly studentName: string,
  ) {}

  async gotoLogin(): Promise<void> {
    await this.page.goto(`/${this.studentName}/login`);
  }

  async gotoRegister(): Promise<void> {
    await this.page.goto(`/${this.studentName}/register`);
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.getByTestId("email-field").fill(email);
    await this.page.getByTestId("password-field").fill(password);
    await this.page.getByTestId("login-submit-button").click();
  }

  async register(name: string, email: string, password: string): Promise<void> {
    await this.page.getByTestId("name-field").fill(name);
    await this.page.getByTestId("email-field").fill(email);
    await this.page.getByTestId("password-field").fill(password);
    await this.page.getByTestId("register-submit-button").click();
  }

  async logout(): Promise<void> {
    await this.page.getByTestId("nav-logout").click();
  }

  loginUrlPattern(): RegExp {
    return new RegExp(`/${this.studentName}/login`);
  }
}
