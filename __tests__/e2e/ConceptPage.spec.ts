import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("ConceptPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testHrefs.concept(testData.medlinePlus.concept));
  });

  test(`should have a link to the ${testData.medlinePlus.conceptScheme.displayLabel} concept scheme`, async ({
    page,
  }) => {
    await page
      .getByText(testData.medlinePlus.conceptScheme.displayLabel)
      .click();
    await expect(page).toHaveURL(
      testHrefs.conceptScheme(testData.medlinePlus.conceptScheme),
    );
  });

  test("should have the right title", async ({ page }) => {
    await expect(page.getByTestId("page-title-heading")).toHaveText(
      `Concept: ${testData.medlinePlus.concept.displayLabel}`,
    );
  });
});
