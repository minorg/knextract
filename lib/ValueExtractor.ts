import {
  BooleanValue,
  CategoricalValue,
  CompletionMessage,
  ConceptStub,
  ModelSet,
  Question,
  RealValue,
  TextValue,
  Value,
} from "@/lib/models";
import { dataFactory } from "@/lib/rdfEnvironment";
import { jsonrepair } from "jsonrepair";
import { NamedNode } from "oxigraph";
import { Either, EitherAsync, Left, Maybe } from "purify-ts";
import invariant from "ts-invariant";
import { isUri } from "valid-url";

function completionMessageString(
  completionMessage: CompletionMessage | string,
): string {
  return typeof completionMessage === "string"
    ? completionMessage
    : completionMessage.literalForm;
}

/**
 * Extract Values from a completion message.
 */
export class ValueExtractor {
  private readonly modelSet: Maybe<ModelSet>;

  constructor(parameters?: { modelSet?: Maybe<ModelSet> }) {
    this.modelSet = parameters?.modelSet ?? Maybe.empty();
  }

  extractBooleanValue(
    completionMessage: CompletionMessage | string,
  ): Either<Error, BooleanValue> {
    return this.extractJsonValues(completionMessage).chain((values) => {
      const booleanValue = values.find((value) => typeof value === "boolean");
      if (typeof booleanValue !== "undefined") {
        return Either.of(new BooleanValue({ value: booleanValue }));
      }
      return Left(
        new Error(
          `expected boolean value: ${completionMessageString(completionMessage)}`,
        ),
      );
    });
  }

  async extractCategoricalValues(
    completionMessage: CompletionMessage | string,
  ): Promise<Either<Error, readonly CategoricalValue[]>> {
    return EitherAsync<Error, readonly CategoricalValue[]>(
      async ({ liftEither, throwE }) => {
        const values = await liftEither(
          this.extractJsonValues(completionMessage),
        );
        const iriValues: NamedNode[] = [];
        for (const value of values) {
          if (typeof value !== "string") {
            throwE(
              new Error(
                `expected string values: ${completionMessageString(completionMessage)}`,
              ),
            );
            throw new Error("should never reach");
          }

          if (!isUri(value)) {
            throwE(
              new Error(
                `expected IRI values: ${completionMessageString(completionMessage)}`,
              ),
            );
          }
          iriValues.push(dataFactory.namedNode(value));
        }

        if (this.modelSet.isJust()) {
          return liftEither(
            (
              await this.modelSet.unsafeCoerce().conceptStubs({
                limit: null,
                offset: 0,
                query: { conceptIdentifiers: iriValues, type: "Identifiers" },
              })
            ).map((conceptStubs) =>
              conceptStubs.map(
                (conceptStub) => new CategoricalValue({ value: conceptStub }),
              ),
            ),
          );
        }

        return iriValues.map(
          (conceptIdentifier) =>
            new CategoricalValue({
              value: ConceptStub.create({ identifier: conceptIdentifier }),
            }),
        );
      },
    );
  }

  extractRealValues(
    completionMessage: CompletionMessage | string,
  ): Either<Error, readonly RealValue[]> {
    return this.extractJsonValues(completionMessage).chain((values) => {
      const realValues: RealValue[] = [];
      for (const value of values) {
        if (typeof value !== "number") {
          return Left(
            new Error(
              `expected string values: ${completionMessageString(completionMessage)}`,
            ),
          );
        }
        realValues.push(new RealValue({ value }));
      }
      return Either.of(realValues);
    });
  }

  extractTextValues(
    completionMessage: CompletionMessage | string,
  ): Either<Error, readonly TextValue[]> {
    return this.extractJsonValues(completionMessage).map((values) =>
      // Allow any primitive as a string value
      values.map((value) => new TextValue({ value: value.toString() })),
    );
  }

  async extractValues(
    completionMessage: CompletionMessage | string,
    {
      question,
    }: {
      question: { type: Question["type"] };
    },
  ): Promise<Either<Error, readonly Value[]>> {
    switch (question.type) {
      case "CategoricalQuestion":
        return this.extractCategoricalValues(completionMessage);
      case "DichotomousQuestion":
        return this.extractBooleanValue(completionMessage).map((value) => [
          value,
        ]);
      case "RealValuedQuestion":
        return this.extractRealValues(completionMessage);
      case "TextQuestion":
        return this.extractTextValues(completionMessage);
    }
  }

  private extractJsonValues(
    completionMessage: CompletionMessage | string,
  ): Either<Error, readonly (boolean | number | string)[]> {
    const completionMessageString =
      typeof completionMessage === "string"
        ? completionMessage
        : completionMessage.literalForm;

    // Strip characters before the first { and after the last }
    let strippedCompletionMessage = completionMessageString;
    const openCurlyBraceIndex = strippedCompletionMessage.indexOf("{");
    if (openCurlyBraceIndex > 0) {
      const closeCurlyBraceIndex = strippedCompletionMessage.lastIndexOf("}");
      if (closeCurlyBraceIndex > 0) {
        strippedCompletionMessage = strippedCompletionMessage.slice(
          openCurlyBraceIndex,
          closeCurlyBraceIndex,
        );
      }
    }

    // Run jsonrepair
    const repairedCompletionMessage = jsonrepair(strippedCompletionMessage);

    let parsedCompletionMessage: any;
    try {
      parsedCompletionMessage = JSON.parse(repairedCompletionMessage);
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }

    switch (typeof parsedCompletionMessage) {
      case "boolean":
      case "number":
      case "string":
        return Either.of([parsedCompletionMessage]);
      case "object":
        // Drop down
        break;
      default:
        return Left(
          new Error(
            `unexpected JSON type ${typeof parsedCompletionMessage}: ${completionMessageString}`,
          ),
        );
    }

    const objectValues = Object.values(parsedCompletionMessage as object);
    if (objectValues.length === 0) {
      return Left(new Error(`empty JSON object: ${completionMessageString}`));
    }
    if (objectValues.length > 1) {
      return Left(
        new Error(
          `JSON object with multiple members: ${completionMessageString}`,
        ),
      );
    }

    const objectValue = objectValues[0];
    switch (typeof objectValue) {
      case "boolean":
      case "number":
      case "string":
        return Either.of([objectValue]);
      case "object":
        if (Array.isArray(objectValue)) {
          break; // Drop down
        }
        return Left(
          new Error(
            `JSON object with non-array object member: ${completionMessageString}`,
          ),
        );
      default:
        return Left(
          new Error(
            `JSON object with unexpected member type: ${completionMessageString}`,
          ),
        );
    }

    const primitiveValues: (boolean | number | string)[] = [];
    for (const anyValue of objectValue as any[]) {
      switch (typeof anyValue) {
        case "boolean":
        case "number":
        case "string":
          primitiveValues.push(anyValue);
          break;
      }
    }
    return Either.of(primitiveValues);
  }
}
