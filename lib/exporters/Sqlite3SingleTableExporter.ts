import fs from "node:fs";
import { SingleTableExporter } from "@/lib/exporters/SingleTableExporter";
import { logger } from "@/lib/logger";
import { AsyncDatabase } from "promised-sqlite3";
import sqlite3 from "sqlite3";
import invariant from "ts-invariant";

export class Sqlite3SingleTableExporter implements SingleTableExporter {
  private readonly sqlite3FilePath: string;

  constructor({
    sqlite3FilePath,
  }: {
    sqlite3FilePath: string;
  }) {
    this.sqlite3FilePath = sqlite3FilePath;
  }

  async export({
    columnDefinitions,
    rows,
  }: Parameters<SingleTableExporter["export"]>[0]): Promise<void> {
    try {
      logger.debug("deleting existing SQLite3 file %s", this.sqlite3FilePath);
      await fs.promises.unlink(this.sqlite3FilePath);
      logger.debug("deleted existing SQLite3 file %s", this.sqlite3FilePath);
    } catch {
      logger.debug(
        "SQLite3 file %s doesn't already exist",
        this.sqlite3FilePath,
      );
    }

    const db = await AsyncDatabase.open(
      this.sqlite3FilePath,
      sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
    );
    try {
      const sqlColumnDefinitions: string[] = [];
      columnDefinitions.forEach((columnDefinition, columnDefinitionI) => {
        invariant(
          columnDefinition.label.indexOf("[") === -1,
          columnDefinition.label,
        );
        invariant(
          columnDefinition.label.indexOf("]") === -1,
          columnDefinition.label,
        );

        let sqlType: string;
        switch (columnDefinition.type) {
          case "boolean":
          case "integer":
            sqlType = "INTEGER";
            break;
          case "real":
            sqlType = "REAL";
            break;
          case "string":
            sqlType = "TEXT";
            break;
        }

        sqlColumnDefinitions.push(
          `  [${columnDefinition.label}] ${sqlType}${columnDefinitionI + 1 < columnDefinitions.length ? "," : ""}${columnDefinition.definition.isJust() ? `  -- ${columnDefinition.definition.unsafeCoerce().replaceAll("\n", " ")}` : ""}`,
        );
      });
      const sqlCreateTable = `\
CREATE TABLE single_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
${sqlColumnDefinitions.join("\n")}
)`;

      await db.run(sqlCreateTable);

      const sqlInsert = `\
INSERT INTO single_table
(${columnDefinitions.map((columnDefinition) => `[${columnDefinition.label}]`).join(",")})
VALUES
(${columnDefinitions.map(() => "?").join(",")})
`;
      for await (const row of rows) {
        await db.run(sqlInsert, row);
      }
    } finally {
      await db.close();
    }
  }
}
