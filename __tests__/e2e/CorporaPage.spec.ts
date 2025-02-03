import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("CorporaPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testHrefs.corpora);
  });

  test(`should have a link to the ${testData.medlinePlus.corpus.displayLabel} corpus`, async ({
    page,
  }) => {
    await page.getByText(testData.medlinePlus.corpus.displayLabel).click();
    await expect(page).toHaveURL(testHrefs.corpus(testData.medlinePlus.corpus));
  });

  test("should have the right title", async ({ page }) => {
    await expect(page.getByTestId("page-title-heading")).toHaveText("Corpora");
  });
});
