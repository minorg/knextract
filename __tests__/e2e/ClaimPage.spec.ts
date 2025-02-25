import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("ClaimPage", () => {
  const claim = testData.medlinePlus.document.claims[0];

  test.beforeEach(async ({ page }) => {
    await page.goto(testHrefs.claim(claim));
  });

  test(`should have a link to the ${claim.concept.displayLabel} concept`, async ({
    page,
  }) => {
    await page.getByText(claim.concept.displayLabel).click();
    await expect(page).toHaveURL(testHrefs.concept(claim.concept));
  });

  test(`should have a link to the ${testData.medlinePlus.document.displayLabel} document`, async ({
    page,
  }) => {
    await page.getByText(testData.medlinePlus.document.displayLabel).click();
    await expect(page).toHaveURL(
      testHrefs.document(testData.medlinePlus.document),
    );
  });

  test("should have the right title", async ({ page }) => {
    await expect(page.getByTestId("page-title-heading")).toHaveText("Claim");
  });

  test("should have the right type", async ({ page }) => {
    await expect(page.getByText("Gold")).toBeVisible();
  });
});
