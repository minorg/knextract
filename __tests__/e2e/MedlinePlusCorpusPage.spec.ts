import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("MedlinePlusCorpusPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testHrefs.corpus(testData.medlinePlus.corpus));
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
    await expect(page.getByTestId("page-title-heading")).toHaveText(
      `Corpus: ${testData.medlinePlus.corpus.displayLabel}`,
    );
  });

  test("should go to the next page", async ({ page }) => {
    await page.getByTestId("next-page-button").click();
    await expect(page).toHaveURL(
      testHrefs.corpus(testData.medlinePlus.corpus, {
        pageIndex: 1,
        pageSize: 10,
      }),
    );
  });

  test("should go to the previous page", async ({ page }) => {
    const nextPageDocument = {
      displayLabel: "Acute Myeloid Leukemia",
    };

    await expect(
      page.getByText(testData.medlinePlus.document.displayLabel),
    ).toBeVisible();
    await expect(
      page.getByText(nextPageDocument.displayLabel),
    ).not.toBeVisible();

    await page.getByTestId("next-page-button").click();
    await expect(page).toHaveURL(
      testHrefs.corpus(testData.medlinePlus.corpus, {
        pageIndex: 1,
        pageSize: 10,
      }),
    );

    await expect(page.getByText(nextPageDocument.displayLabel)).toBeVisible();

    await page.getByTestId("previous-page-button").click();
    await expect(page).toHaveURL(
      testHrefs.corpus(testData.medlinePlus.corpus, {
        pageIndex: 0,
        pageSize: 10,
      }),
    );
  });
});
