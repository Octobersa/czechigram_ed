import type { Locator, Page } from "@playwright/test";

export class StudentsManagementPage {
  constructor(private readonly page: Page) {}

  title(): Locator {
    return this.page.getByTestId("students-management-title");
  }

  studentNameInput(): Locator {
    return this.page.getByTestId("student-name-input");
  }

  createStudentButton(): Locator {
    return this.page.getByTestId("create-student-button");
  }

  studentRow(studentName: string): Locator {
    return this.page.getByTestId(`student-row-${studentName}`);
  }

  deleteStudentButton(studentName: string): Locator {
    return this.page.getByTestId(`delete-${studentName}`);
  }

  async setAdminTokenBeforeLoad(token: string): Promise<void> {
    await this.page.addInitScript((value: string) => {
      window.localStorage.setItem("adminToken", value);
    }, token);
  }

  async goto(): Promise<void> {
    await this.page.goto("/students");
  }

  async createStudent(studentName: string): Promise<void> {
    await this.studentNameInput().fill(studentName);
    await this.createStudentButton().click();
  }

  async deleteStudent(studentName: string): Promise<void> {
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.deleteStudentButton(studentName).click();
  }
}
