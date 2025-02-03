import { LanguageModel } from "@/lib/language-models";
import { CompletionMessage, Prompt, PromptMessage } from "@/lib/models";
import { dataFactory } from "@/lib/rdfEnvironment";
import { Either, Left } from "purify-ts";
import invariant from "ts-invariant";
import { expect } from "vitest";

export class MockLanguageModel implements LanguageModel {
  static readonly IDENTIFIER = dataFactory.namedNode(
    "http://example.com/mockLanguageModel",
  );
  static readonly LOCAL_IDENTIFIER = "mock";
  readonly invocations: Prompt[] = [];
  readonly specification: LanguageModel["specification"];
  private readonly invocationResults: Either<Error, CompletionMessage>[];

  constructor({
    invocationResults,
    contextWindow,
  }: {
    invocationResults: (Error | string)[];
    contextWindow?: number;
  }) {
    this.invocationResults = invocationResults
      .toReversed()
      .map((invocationResult) => {
        if (typeof invocationResult === "string") {
          return Either.of(
            new CompletionMessage({
              literalForm: invocationResult,
              role: "http://purl.archive.org/purl/knextract/cbox#_Role_AI",
            }),
          );
        }
        return Left(invocationResult);
      });
    this.specification = {
      contextWindow: contextWindow ?? Number.MAX_SAFE_INTEGER,
      identifier: MockLanguageModel.IDENTIFIER,
      localIdentifier: MockLanguageModel.LOCAL_IDENTIFIER,
    };
  }

  countTokens(message: PromptMessage | string): number {
    if (typeof message === "string") {
      return message.length;
    }
    invariant(typeof message.literalForm === "string");
    return message.literalForm.length;
  }

  async invoke(prompt: Prompt): Promise<Either<Error, CompletionMessage>> {
    expect(prompt.messages).not.toHaveLength(0);
    const invocationResult = this.invocationResults.pop();
    expect(invocationResult).toBeDefined();
    this.invocations.push(prompt);
    return invocationResult!;
  }
}
