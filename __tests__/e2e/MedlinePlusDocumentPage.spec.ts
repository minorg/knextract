import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("MedlinePlusDocumentPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testHrefs.document(testData.medlinePlus.document));
  });

  test("should have the document HTML", async ({ page }) => {
    await expect(page.getByTestId("document-html")).toHaveText(
      /^<p>A1C is a blood test.*/,
    );
  });

  test(`should have a link to the ${testData.medlinePlus.corpus.displayLabel} corpus`, async ({
    page,
  }) => {
    await page.getByText(testData.medlinePlus.corpus.displayLabel).click();
    await expect(page).toHaveURL(testHrefs.corpus(testData.medlinePlus.corpus));
  });

  testData.medlinePlus.document.claims.forEach((claim) => {
    test(`should link to the ${claim.concept.displayLabel} concept claim concept`, async ({
      page,
    }) => {
      if (
        !claim.concept.identifier.value.startsWith("https://medlineplus.gov/")
      ) {
        // No MeSH in the test project
        return;
      }
      await page.getByText(claim.concept.displayLabel).click();
      await expect(page).toHaveURL(testHrefs.concept(claim.concept));
    });
  });

  testData.medlinePlus.document.claims.forEach((claim) => {
    test(`should link to the ${claim.concept.displayLabel} claim`, async ({
      page,
    }) => {
      await page.getByTestId(`claim-link-${claim.identifier.value}`).click();
      await expect(page).toHaveURL(testHrefs.claim(claim));
    });
  });

  test("should have the right title", async ({ page }) => {
    await expect(page.getByTestId("page-title-heading")).toHaveText(
      `Document: ${testData.medlinePlus.document.displayLabel}`,
    );
  });
});
