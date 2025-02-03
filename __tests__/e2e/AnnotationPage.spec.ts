import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("AnnotationPage", () => {
  const annotation = testData.medlinePlus.document.annotations[0];

  test.beforeEach(async ({ page }) => {
    await page.goto(testHrefs.annotation(annotation));
  });

  test(`should have a link to the ${annotation.concept.displayLabel} concept`, async ({
    page,
  }) => {
    await page.getByText(annotation.concept.displayLabel).click();
    await expect(page).toHaveURL(testHrefs.concept(annotation.concept));
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
      "Annotation",
    );
  });

  test("should have the right type", async ({ page }) => {
    await expect(page.getByText("Gold")).toBeVisible();
  });
});
