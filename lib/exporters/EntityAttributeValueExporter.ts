import { Identifier } from "@/lib/models";
import { Maybe } from "purify-ts";

/**
 * Interface for exporters of generic entity-attribute-value models (https://en.wikipedia.org/wiki/Entity%E2%80%93attribute%E2%80%93value_model).
 * These importers don't care what the entities, attributes, or values are; they always have the same format.
 */
export interface EntityAttributeValueExporter {
  export(parameters: {
    attributes: readonly EntityAttributeValueExporter.Attribute[];
    entities: AsyncIterable<EntityAttributeValueExporter.Entity>;
  }): Promise<void>;
}

export namespace EntityAttributeValueExporter {
  export interface Entity {
    readonly attributeValues: readonly Entity.AttributeValue[];
    readonly identifier: Identifier;
    readonly label: string;
  }

  export namespace Entity {
    export interface AttributeValue {
      readonly attribute: EntityAttributeValueExporter.Attribute;
      readonly value: string;
    }
  }

  export interface Attribute {
    readonly definition: Maybe<string>;
    readonly identifier: Identifier;
    readonly label: string;
  }
}
