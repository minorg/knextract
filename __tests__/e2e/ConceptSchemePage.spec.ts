import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("ConceptSchemePage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      testHrefs.conceptScheme(testData.medlinePlus.conceptScheme),
    );
  });

  test(`should have a link to the ${testData.medlinePlus.concept.displayLabel} concept`, async ({
    page,
  }) => {
    await page.getByText(testData.medlinePlus.concept.displayLabel).click();
    await expect(page).toHaveURL(
      testHrefs.concept(testData.medlinePlus.concept),
    );
  });

  test("should have the right title", async ({ page }) => {
    await expect(page.getByTestId("page-title-heading")).toHaveText(
      `Concept scheme: ${testData.medlinePlus.conceptScheme.displayLabel}`,
    );
  });

  test("should go to the next page", async ({ page }) => {
    await page.getByTestId("next-page-button").click();
    await expect(page).toHaveURL(
      testHrefs.conceptScheme(testData.medlinePlus.conceptScheme, {
        pageIndex: 1,
        pageSize: 10,
      }),
    );
  });

  test("should go to the previous page", async ({ page }) => {
    const nextPageConcept = {
      displayLabel: "Drug Therapy",
    };

    await expect(
      page.getByText(testData.medlinePlus.concept.displayLabel),
    ).toBeVisible();
    await expect(
      page.getByText(nextPageConcept.displayLabel),
    ).not.toBeVisible();

    await page.getByTestId("next-page-button").click();
    await expect(page).toHaveURL(
      testHrefs.conceptScheme(testData.medlinePlus.conceptScheme, {
        pageIndex: 1,
        pageSize: 10,
      }),
    );

    await expect(page.getByText(nextPageConcept.displayLabel)).toBeVisible();

    await page.getByTestId("previous-page-button").click();
    await expect(page).toHaveURL(
      testHrefs.conceptScheme(testData.medlinePlus.conceptScheme, {
        pageIndex: 0,
        pageSize: 10,
      }),
    );
  });
});
