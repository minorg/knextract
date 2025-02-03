import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("NewCorpusPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testHrefs.newCorpus);
  });

  test("it should create a new corpus with a label", async ({ page }) => {
    await page.getByTestId("label-input").click();
    await page.getByTestId("label-input").fill("New corpus");
    await page.getByTestId("submit-button").click();
    await expect(page).toHaveURL(new RegExp(`${testHrefs.corpora}`));
  });
});
