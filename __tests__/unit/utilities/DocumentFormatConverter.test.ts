import * as fs from "node:fs/promises";
import path from "node:path";
import { testData } from "@/__tests__/unit/data";
import { DocumentFormatConverter } from "@/lib/utilities/server";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";

describe.skipIf(process.env["CI"])("DocumentFormatConverter", async () => {
  [testData.testDocumentFilePaths.pdf].forEach((testDocumentFilePath) => {
    it(`should convert ${testDocumentFilePath} to PDF`, async () => {
      await tmp.withDir(
        async ({ path: tempDirPath }) => {
          const outputFilePath = path.resolve(tempDirPath, "output.pdf");
          await (
            (await DocumentFormatConverter.create())
              .ifLeft((error) => {
                throw error;
              })
              .extract() as DocumentFormatConverter
          ).convert({
            inputFilePath: testDocumentFilePath,
            outputFilePath,
          });
          (await fs.stat(outputFilePath)).isFile();
        },
        { unsafeCleanup: true },
      );
    });
  });
});
