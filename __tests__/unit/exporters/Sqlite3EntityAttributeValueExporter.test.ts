import path from "node:path";
import { exporterTestData } from "@/__tests__/unit/exporters/exporterTestData";
import { Adapters } from "@/lib/exporters/Adapters";
import { Sqlite3EntityAttributeValueExporter } from "@/lib/exporters/Sqlite3EntityAttributeValueExporter";
import { Identifier } from "@/lib/models";
import { AsyncDatabase } from "promised-sqlite3";
import sqlite3 from "sqlite3";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";

describe.skipIf(process.env["CI"])(
  "Sqlite3EntityAttributeValueExporter",
  () => {
    it(
      "should export plants annotations",
      async ({ expect }) => {
        const {
          plants: { corpus, conceptSchemes },
        } = await exporterTestData();
        await tmp.withDir(
          async ({ path: tempDirPath }) => {
            const tempFilePath = path.resolve(tempDirPath, "test.db");
            const documents = await corpus.documents({
              includeDeleted: false,
              limit: 10,
              offset: 0,
            });
            await new Adapters.CorpusAnnotationsExporterToEntityAttributeValueExporter(
              new Sqlite3EntityAttributeValueExporter({
                sqlite3FilePath: tempFilePath,
              }),
            ).export({
              conceptSchemes,
              documents: documents.flatResolveEach(),
            });
            const db = await AsyncDatabase.open(
              tempFilePath,
              sqlite3.OPEN_READONLY,
            );
            try {
              const rows: any[] = await db.all(
                "SELECT * FROM entity ORDER BY iri",
              );
              expect(rows).toHaveLength(10);
              const actualDocumentIris: string[] = rows.map(
                (row) => row["iri"],
              );
              expect(actualDocumentIris.sort()).toStrictEqual(
                (await documents.flatResolve()).map((document) =>
                  Identifier.toString(document.identifier),
                ),
              );
            } finally {
              await db.close();
            }
          },
          { unsafeCleanup: true },
        );
      },
      { timeout: 30000 },
    );
  },
);
