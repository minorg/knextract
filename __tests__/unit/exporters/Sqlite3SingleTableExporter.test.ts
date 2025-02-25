import path from "node:path";
import { arrayToAsyncIterable } from "@/__tests__/unit/exporters/arrayToAsyncIterable";
import { exporterTestData } from "@/__tests__/unit/exporters/exporterTestData";
import { Adapters } from "@/lib/exporters/Adapters";
import { Sqlite3SingleTableExporter } from "@/lib/exporters/Sqlite3SingleTableExporter";
import { Identifier } from "@/lib/models";
import { AsyncDatabase } from "promised-sqlite3";
import sqlite3 from "sqlite3";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";

describe.skipIf(process.env["CI"])("Sqlite3SingleTableExporter", () => {
  it(
    "should export plants annotations",
    async ({ expect }) => {
      const {
        plants: { documents, modelSet },
      } = await exporterTestData();
      await tmp.withDir(
        async ({ path: tempDirPath }) => {
          const tempFilePath = path.resolve(tempDirPath, "test.db");
          await new Adapters.CorpusClaimsExporterToSingleTableExporter(
            new Sqlite3SingleTableExporter({
              sqlite3FilePath: tempFilePath,
            }),
          ).export({
            documents: arrayToAsyncIterable(documents),
            modelSet,
          });
          const db = await AsyncDatabase.open(
            tempFilePath,
            sqlite3.OPEN_READONLY,
          );
          try {
            const createTableSql: string = (
              (await db.get(
                "SELECT sql from sqlite_schema WHERE name = 'single_table'",
              )) as any
            )["sql"];
            expect(createTableSql.includes("--")).toStrictEqual(true);

            const rows: any[] = await db.all(
              "SELECT * FROM single_table ORDER BY id",
            );
            expect(rows).toHaveLength(10);
            const actualDocumentIris: string[] = rows.map((row) => row["iri"]);
            expect(actualDocumentIris.sort()).toStrictEqual(
              documents.map((document) =>
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
});
