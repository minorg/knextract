import fs from "node:fs";
import path from "node:path";
import { arrayToAsyncIterable } from "@/__tests__/unit/exporters/arrayToAsyncIterable";
import { exporterTestData } from "@/__tests__/unit/exporters/exporterTestData";
import { Adapters } from "@/lib/exporters/Adapters";
import { CsvSingleTableExporter } from "@/lib/exporters/CsvSingleTableExporter";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";

describe.skipIf(process.env["CI"])("CsvSingleTableExporter", () => {
  it(
    "should export plants annotations",
    async ({ expect }) => {
      const {
        plants: { documents, modelSet },
      } = await exporterTestData();
      await tmp.withDir(
        async ({ path: tempDirPath }) => {
          const tempFilePath = path.resolve(tempDirPath, "test.csv");
          await new Adapters.CorpusClaimsExporterToSingleTableExporter(
            new CsvSingleTableExporter({
              csvFilePath: tempFilePath,
            }),
          ).export({
            documents: arrayToAsyncIterable(documents.slice(0, 10)),
            modelSet,
          });
          const csvLines = (await fs.promises.readFile(tempFilePath))
            .toString()
            .split("\n");
          expect(csvLines).toHaveLength(12); // Header row + 10 documents + empty line at end of file
          expect(csvLines[0].split(",")).toHaveLength(73);
          expect(csvLines[1].split(",")).toHaveLength(73);
        },
        { unsafeCleanup: true },
      );
    },
    { timeout: 30000 },
  );
});
