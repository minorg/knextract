import { testData } from "@/__tests__/e2e/testData";
import { testHrefs } from "@/__tests__/e2e/testHrefs";
import { expect, test } from "@playwright/test";

test.describe("UploadDocumentPage", () => {
  test.afterEach(async ({ request }) => {
    expect(
      (await request.post("/api/test/e2e/teardown")).status(),
    ).toStrictEqual(204);
  });

  test.beforeEach(async ({ page, request }) => {
    expect((await request.post("/api/test/e2e/setup")).status()).toStrictEqual(
      204,
    );
    await page.goto(testHrefs.uploadDocument(testData.synthetic.corpus));
  });

  test("it should paste text", async ({ page }) => {
    await page.getByTestId("text-tab-trigger").click();
    await page.getByTestId("title-input").click();
    await page.getByTestId("title-input").fill("Test document");
    await page.getByTestId("text-textarea").click();
    await page.getByTestId("text-textarea").fill("Test document contents");
    await page.getByTestId("submit-button").click();
    await expect(page).toHaveURL(new RegExp(`${testHrefs.locale}/documents/`));
  });

  test("it should upload a file", async ({ page }) => {
    await page.getByTestId("file-tab-trigger").click();
    await page.getByTestId("title-input").fill("Test document");
    await page
      .getByTestId("file-uploader-file-input")
      .setInputFiles(testData.test.document.filePath);
    await page.getByTestId("submit-button").click();
    await expect(page).toHaveURL(new RegExp(`${testHrefs.locale}/documents/`));
  });
});
