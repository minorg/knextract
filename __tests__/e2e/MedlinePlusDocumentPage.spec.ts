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

  testData.medlinePlus.document.annotations.forEach((annotation) => {
    test(`should link to the ${annotation.concept.displayLabel} concept annotation concept`, async ({
      page,
    }) => {
      if (
        !annotation.concept.identifier.value.startsWith(
          "https://medlineplus.gov/",
        )
      ) {
        // No MeSH in the test project
        return;
      }
      await page.getByText(annotation.concept.displayLabel).click();
      await expect(page).toHaveURL(testHrefs.concept(annotation.concept));
    });
  });

  testData.medlinePlus.document.annotations.forEach((annotation) => {
    test(`should link to the ${annotation.concept.displayLabel} concept annotation`, async ({
      page,
    }) => {
      await page
        .getByTestId(`annotation-link-${annotation.identifier.value}`)
        .click();
      await expect(page).toHaveURL(testHrefs.annotation(annotation));
    });
  });

  test("should have the right title", async ({ page }) => {
    await expect(page.getByTestId("page-title-heading")).toHaveText(
      `Document: ${testData.medlinePlus.document.displayLabel}`,
    );
  });
});
