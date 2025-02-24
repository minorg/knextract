import { CorpusClaimsExporter } from "@/lib/exporters/CorpusClaimsExporter";
import { EntityAttributeValueExporter } from "@/lib/exporters/EntityAttributeValueExporter";
import { SingleTableExporter } from "@/lib/exporters/SingleTableExporter";
import { logger } from "@/lib/logger";
import {
  DocumentStub,
  Identifier,
  ModelSet,
  kosResourceLabels,
} from "@/lib/models";
import { rdfVocabulary, rdfs } from "@/lib/vocabularies";
import { Maybe } from "purify-ts";

/**
 * Adapters between different exporter interfaces.
 */
export namespace Adapters {
  export class CorpusClaimsExporterToSingleTableExporter extends CorpusClaimsExporter {
    constructor(private readonly singleTableExporter: SingleTableExporter) {
      super();
    }

    override export(parameters: {
      documents: AsyncIterable<DocumentStub>;
      modelSet: ModelSet;
    }): Promise<void> {
      return new CorpusClaimsExporterToEntityAttributeValueExporter(
        new EntityAttributeValueExporterToSingleTableExporter(
          this.singleTableExporter,
        ),
      ).export(parameters);
    }
  }

  export class CorpusClaimsExporterToEntityAttributeValueExporter extends CorpusClaimsExporter {
    constructor(
      private readonly entityAttributeValueExporter: EntityAttributeValueExporter,
    ) {
      super();
      this.entityAttributeValueExporter = entityAttributeValueExporter;
    }

    override async export({
      documents,
      modelSet,
    }: {
      documents: AsyncIterable<DocumentStub>;
      modelSet: ModelSet;
    }): Promise<void> {
      const claimProperties = (await modelSet.claimProperties()).orDefault([]);
      const attributesByIdentifier = claimProperties.reduce(
        (attributesByIdentifier, claimProperty) => {
          const attributeIdentifierString = Identifier.toString(
            claimProperty.identifier,
          );
          const attribute: EntityAttributeValueExporter.Attribute = {
            definition:
              claimProperty.comments.length > 0
                ? Maybe.of(claimProperty.comments[0].value)
                : Maybe.empty(),
            identifier: claimProperty.identifier,
            label:
              claimProperty.labels.length > 0
                ? claimProperty.labels[0].value
                : attributeIdentifierString,
          };
          if (attributesByIdentifier[attributeIdentifierString]) {
            logger.warn("duplicate attribute: %s", attributeIdentifierString);
          }
          attributesByIdentifier[attributeIdentifierString] = attribute;
          return attributesByIdentifier;
        },
        {} as Record<string, EntityAttributeValueExporter.Attribute>,
      );

      await this.entityAttributeValueExporter.export({
        attributes: Object.values(attributesByIdentifier),
        entities: this.transformDocumentsToEntities({
          attributesByIdentifier,
          documents,
          modelSet,
        }),
      });
    }

    private async *transformDocumentsToEntities({
      attributesByIdentifier,
      documents,
      modelSet,
    }: {
      attributesByIdentifier: Record<
        string,
        EntityAttributeValueExporter.Attribute
      >;
      documents: AsyncIterable<DocumentStub>;
      modelSet: ModelSet;
    }): AsyncIterable<EntityAttributeValueExporter.Entity> {
      for await (const document of documents) {
        this.emit("preDocumentExportEvent", { document });

        const attributeValues: EntityAttributeValueExporter.Entity.AttributeValue[] =
          [];

        const claimsEither = await modelSet.claims({
          query: { documentIdentifier: document.identifier, type: "Document" },
        });
        if (claimsEither.isLeft()) {
          logger.warn(
            "error getting claims for document %s: %s",
            Identifier.toString(document.identifier),
            (claimsEither.extract() as Error).message,
          );
          continue;
        }
        const claims = claimsEither.unsafeCoerce();

        for (const claim of claims) {
          const attribute =
            attributesByIdentifier[Identifier.toString(claim.predicate)];
          if (!attribute) {
            logger.warn(
              "claim %s has predicate %s that's not in the attributes",
              Identifier.toString(claim.identifier),
              Identifier.toString(claim.predicate),
            );
            continue;
          }

          let value: string;
          switch (claim.object.type) {
            case "CategoricalValue": {
              value = kosResourceLabels(claim.object.value).display;
              break;
            }
            default:
              value = claim.object.value.toString();
              break;
          }

          attributeValues.push({
            attribute,
            value,
          });
        }

        yield {
          attributeValues,
          identifier: document.identifier,
          label: document.title
            .map((title) => title.literalForm)
            .orDefault(Identifier.toString(document.identifier)),
        };

        this.emit("postDocumentExportEvent", { document });
      }
    }
  }

  export class EntityAttributeValueExporterToSingleTableExporter
    implements EntityAttributeValueExporter
  {
    constructor(private readonly singleTableExporter: SingleTableExporter) {}

    async export({
      attributes,
      entities,
    }: {
      attributes: readonly EntityAttributeValueExporter.Attribute[];
      entities: AsyncIterable<EntityAttributeValueExporter.Entity>;
    }): Promise<void> {
      await this.singleTableExporter.export({
        columnDefinitions: [
          {
            definition: Maybe.empty(),
            identifier: rdfVocabulary.subject,
            label: "iri",
            type: "string",
          },
          {
            definition: Maybe.empty(),
            identifier: rdfs.label,
            label: "label",
            type: "string",
          },
          ...attributes.map((attribute) => ({
            definition: attribute.definition,
            label: attribute.label,
            identifier: attribute.identifier,
            type: "string" as const,
          })),
        ],
        rows: this.entitiesToRows({ attributes, entities }),
      });
    }

    private async *entitiesToRows({
      attributes,
      entities,
    }: {
      attributes: readonly EntityAttributeValueExporter.Attribute[];
      entities: AsyncIterable<EntityAttributeValueExporter.Entity>;
    }): AsyncIterable<SingleTableExporter.Row> {
      for await (const entity of entities) {
        const row: SingleTableExporter.Cell[] = [
          Identifier.toString(entity.identifier),
          entity.label,
        ];
        for (const attribute of attributes) {
          const value = entity.attributeValues.find((attributeValue) =>
            attributeValue.attribute.identifier.equals(attribute.identifier),
          );
          if (typeof value !== "undefined") {
            row.push(value.value);
          } else {
            row.push(null);
          }
        }
        yield row;
      }
    }
  }
}
