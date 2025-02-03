import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("WorkflowsPage", () => {
  test.afterEach(async ({ request }) => {
    expect(
      (await request.post("/api/test/e2e/teardown")).status(),
    ).toStrictEqual(204);
  });

  test.beforeEach(async ({ page, request }) => {
    expect((await request.post("/api/test/e2e/setup")).status()).toStrictEqual(
      204,
    );
    await page.goto(testHrefs.workflows);
  });

  test(`should have a link to the ${testData.synthetic.workflow.displayLabel} workflow`, async ({
    page,
  }) => {
    await page.getByText(testData.synthetic.workflow.displayLabel).click();
    await expect(page).toHaveURL(
      testHrefs.workflow(testData.synthetic.workflow),
    );
  });

  test("should have the right title", async ({ page }) => {
    await expect(page.getByTestId("page-title-heading")).toHaveText(
      "Workflows",
    );
  });
});
