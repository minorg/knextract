import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("WorkflowPage", () => {
  test.afterEach(async ({ request }) => {
    expect(
      (await request.post("/api/test/e2e/teardown")).status(),
    ).toStrictEqual(204);
  });

  test.beforeEach(async ({ page, request }) => {
    expect((await request.post("/api/test/e2e/setup")).status()).toStrictEqual(
      204,
    );
    await page.goto(testHrefs.workflow(testData.synthetic.workflow));
  });

  test("should have a link to the concept scheme", async ({ page }) => {
    await expect(
      page.getByText(testData.medlinePlus.conceptScheme.displayLabel),
    ).toBeVisible();
  });

  test("should have the right title", async ({ page }) => {
    await expect(page.getByTestId("page-title-heading")).toHaveText(
      `Workflow: ${testData.synthetic.workflow.displayLabel}`,
    );
  });

  test("should have a working delete button", async ({ page }) => {
    // Click the button that opens the delete dialog
    await page.getByTestId("delete-button").click();
    // Assert the dialog
    await expect(
      page.getByText("Are you sure you want to delete this workflow?"),
    ).toBeVisible();
    await expect(page.getByTestId("cancel-deletion-button")).toBeVisible();
    // Click the delete button
    await page.getByTestId("confirm-deletion-button").click();
    // Expect to be taken back to the workflows page
    await expect(page).toHaveURL(testHrefs.workflows);
    await expect(
      page.getByText(testData.synthetic.workflow.displayLabel),
    ).not.toBeVisible();
  });
});
