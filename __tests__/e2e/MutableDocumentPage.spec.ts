import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("MutableDocumentPage", () => {
  test.afterEach(async ({ request }) => {
    expect(
      (await request.post("/api/test/e2e/teardown")).status(),
    ).toStrictEqual(204);
  });

  test.beforeEach(async ({ page, request }) => {
    expect((await request.post("/api/test/e2e/setup")).status()).toStrictEqual(
      204,
    );
    await page.goto(testHrefs.document(testData.synthetic.corpus.document));
  });

  test("should have a working delete button", async ({ page }) => {
    // Click the button that opens the delete dialog
    await page.getByTestId("delete-button").click();
    // Assert the dialog
    await expect(
      page.getByText("Are you sure you want to delete this document?"),
    ).toBeVisible();
    await expect(page.getByTestId("cancel-deletion-button")).toBeVisible();
    // Click the delete button
    await page.getByTestId("confirm-deletion-button").click();
    // Expect to be taken back to the corpora page
    await expect(page).toHaveURL(testHrefs.corpora);
  });
});
