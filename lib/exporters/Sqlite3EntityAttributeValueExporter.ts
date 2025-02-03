import fs from "node:fs";
import { EntityAttributeValueExporter } from "@/lib/exporters/EntityAttributeValueExporter";
import { logger } from "@/lib/logger";
import { Identifier } from "@/lib/models";
import { AsyncDatabase } from "promised-sqlite3";
import sqlite3 from "sqlite3";
import invariant from "ts-invariant";

class Sqlite3EntityAttributeValueDatabase {
  constructor(private readonly db: AsyncDatabase) {}

  static async create(
    sqlite3FilePath: string,
  ): Promise<Sqlite3EntityAttributeValueDatabase> {
    const db = await AsyncDatabase.open(
      sqlite3FilePath,
      sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
    );
    return new Sqlite3EntityAttributeValueDatabase(db);
  }

  close(): Promise<void> {
    return this.db.close();
  }

  async createTables(): Promise<void> {
    // Order matters
    await this.createAttributeTable();
    await this.createAttributeValueCountTable();
    await this.createEntityTable();
    await this.createEntityAttributeValueTable();
  }

  async insertAttribute({
    definition,
    label,
  }: {
    definition: string | null;
    label: string;
  }): Promise<number> {
    const row: any = await this.db.get(
      `\
INSERT INTO attribute
(definition, label)
VALUES (?, ?)
RETURNING id
`,
      definition,
      label,
    );
    return row["id"];
  }

  async insertEntity({
    iri,
    label,
  }: { iri: string; label: string }): Promise<number> {
    const row: any = await this.db.get(
      `\
INSERT INTO entity
(iri, label)
VALUES (?, ?)
RETURNING id
`,
      iri,
      label,
    );
    return row["id"];
  }

  async insertEntityAttributeValue({
    attributeId,
    entityId,
    value,
  }: { attributeId: number; entityId: number; value: string }): Promise<void> {
    await this.db.run(
      `\
INSERT INTO entity_attribute_value
(attribute_id, entity_id, value)
VALUES (?, ?, ?)
`,
      attributeId,
      entityId,
      value,
    );

    await this.db.run(
      `\
INSERT INTO attribute_value_count
(attribute_id, value)
VALUES (?, ?)
ON CONFLICT (attribute_id, value) DO UPDATE SET count = count + 1
`,
      attributeId,
      value,
    );
  }

  private async createAttributeTable(): Promise<void> {
    await this.db.run(`\
CREATE TABLE attribute (
  definition TEXT,
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL
)`);
  }

  private async createAttributeValueCountTable(): Promise<void> {
    await this.db.run(`\
CREATE TABLE attribute_value_count (
  attribute_id INTEGER NOT NULL,
  count INTEGER DEFAULT 1,
  value TEXT NOT NULL,
  FOREIGN KEY (attribute_id) REFERENCES attribute(id),
  PRIMARY KEY (attribute_id, value)
)`);
  }

  private async createEntityAttributeValueTable(): Promise<void> {
    await this.db.run(`\
CREATE TABLE entity_attribute_value (
  attribute_id INTEGER NOT NULL,
  entity_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (attribute_id) REFERENCES attribute(id),
  FOREIGN KEY (entity_id) REFERENCES entity(id),
  PRIMARY KEY (attribute_id, entity_id, value)
)`);
  }

  private async createEntityTable(): Promise<void> {
    await this.db.run(`\
CREATE TABLE entity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  iri TEXT NOT NULL,
  label TEXT NOT NULL
)`);
  }
}

export class Sqlite3EntityAttributeValueExporter
  implements EntityAttributeValueExporter
{
  private readonly sqlite3FilePath: string;

  constructor({
    sqlite3FilePath,
  }: {
    sqlite3FilePath: string;
  }) {
    this.sqlite3FilePath = sqlite3FilePath;
  }

  async export({
    attributes,
    entities,
  }: Parameters<EntityAttributeValueExporter["export"]>[0]): Promise<void> {
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

    const db = await Sqlite3EntityAttributeValueDatabase.create(
      this.sqlite3FilePath,
    );
    try {
      await db.createTables();

      const attributeIdsByIdentifier: Record<string, number> = {};
      for (const attribute of attributes) {
        attributeIdsByIdentifier[Identifier.toString(attribute.identifier)] =
          await db.insertAttribute({
            definition: attribute.definition.extractNullable(),
            label: attribute.label,
          });
      }

      for await (const entity of entities) {
        const entityId = await db.insertEntity({
          iri: Identifier.toString(entity.identifier),
          label: entity.label,
        });

        for (const { attribute, value } of entity.attributeValues) {
          const attributeId =
            attributeIdsByIdentifier[Identifier.toString(attribute.identifier)];
          invariant(typeof attributeId !== "undefined");

          await db.insertEntityAttributeValue({
            attributeId,
            entityId,
            value,
          });
        }
      }
    } finally {
      await db.close();
    }
  }
}
