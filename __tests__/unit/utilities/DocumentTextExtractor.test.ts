import path from "node:path";
import { cachesDirectoryPath } from "@/__tests__/unit/caches/cachesDirectoryPath";
import { testData } from "@/__tests__/unit/data";
import { DocumentTextExtractor } from "@/lib/utilities/server/DocumentTextExtractor";
import { describe, it } from "vitest";

describe.skipIf(process.env["CI"])("DocumentTextExtractor", async () => {
  [testData.testDocumentFilePaths.pdf].forEach((testDocumentFilePath) => {
    it(`should extract text from ${testDocumentFilePath} `, async ({
      expect,
    }) => {
      const result = await (
        (
          await DocumentTextExtractor.create({
            cacheDirectoryPath: path.resolve(cachesDirectoryPath, "textract"),
          })
        )
          .ifLeft((error) => {
            throw error;
          })
          .extract() as DocumentTextExtractor
      ).extractDocumentText(testDocumentFilePath);
      expect(result.html).not.toHaveLength(0);
      expect(result.text).not.toHaveLength(0);
    });
  });
});
