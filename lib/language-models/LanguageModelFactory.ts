import { LanguageModel, OpenAiLanguageModel } from "@/lib/language-models";
import { OpenAiCredentials } from "@/lib/language-models/OpenAiCredentials";
import { LanguageModelSpecification } from "@/lib/models";
import { Either, Left, Right } from "purify-ts";

export class LanguageModelFactory {
  private readonly credentials: LanguageModelFactory.Credentials;
  private readonly specifications: readonly LanguageModelSpecification[];

  constructor({
    credentials,
    specifications,
  }: {
    credentials: LanguageModelFactory.Credentials;
    specifications: readonly LanguageModelSpecification[];
  }) {
    this.credentials = credentials;
    this.specifications = specifications;
  }

  createDefaultLanguageModel(): Either<Error, LanguageModel> {
    let availableSpecifications: readonly LanguageModelSpecification[];
    if (this.credentials.openai) {
      // Use the model with the largest context window
      availableSpecifications = this.specifications.filter((specification) => {
        switch (specification.family.creator.identifier.value) {
          case "http://openai.com/":
            return true;
        }
      });
    } else {
      availableSpecifications = [];
    }
    if (availableSpecifications.length === 0) {
      return Left(new Error("no language models available"));
    }
    return this.createLanguageModelFromSpecification(
      // Pick the specification with the largest context window
      availableSpecifications.reduce(
        (bestAvailableSpecification, specification) =>
          specification.contextWindow > bestAvailableSpecification.contextWindow
            ? specification
            : bestAvailableSpecification,
        availableSpecifications[0],
      ),
    );
  }

  createLanguageModelFromSpecification(
    specification: LanguageModelSpecification,
  ): Either<Error, LanguageModel> {
    switch (specification.family.creator.identifier.value) {
      case "http://openai.com/": {
        if (!this.credentials.openai) {
          return Left(new Error("no OpenAI credentials available"));
        }
        return Right(
          new OpenAiLanguageModel({
            credentials: this.credentials.openai,
            specification,
          }),
        );
      }
      default:
        return Left(
          new RangeError(
            `unrecognized language model creator: ${specification.family.creator.identifier.value}`,
          ),
        );
    }
  }
}

export namespace LanguageModelFactory {
  export interface Credentials {
    openai: OpenAiCredentials | null;
  }
}
