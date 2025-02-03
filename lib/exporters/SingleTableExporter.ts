import { Identifier } from "@/lib/models";
import { Maybe } from "purify-ts";

/**
 * Interface for exporters that create a single table with rows corresponding to entities and columns corresponding to attributes.
 */
export interface SingleTableExporter {
  export(parameters: {
    columnDefinitions: readonly SingleTableExporter.ColumnDefinition[];
    rows: AsyncIterable<SingleTableExporter.Row>;
  }): Promise<void>;
}

export namespace SingleTableExporter {
  export type Cell = boolean | null | number | string;

  export interface ColumnDefinition {
    readonly definition: Maybe<string>;
    readonly identifier: Identifier;
    readonly label: string;
    readonly type: "boolean" | "integer" | "real" | "string";
  }

  export type Row = readonly Cell[];
}
