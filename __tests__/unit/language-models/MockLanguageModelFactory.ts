import { MockLanguageModel } from "@/__tests__/unit/language-models/MockLanguageModel";
import { LanguageModel, LanguageModelFactory } from "@/lib/language-models";
import { Either, Right } from "purify-ts";

export class MockLanguageModelFactory extends LanguageModelFactory {
  constructor(private readonly mockLanguageModel: MockLanguageModel) {
    super({
      credentials: {
        openai: null,
      },
      specifications: [],
    });
  }

  override createDefaultLanguageModel(): Either<Error, LanguageModel> {
    return Right(this.mockLanguageModel);
  }

  override createLanguageModelFromSpecification(
    _specification: LanguageModel["specification"],
  ): Either<Error, LanguageModel> {
    return Right(this.mockLanguageModel);
  }
}
