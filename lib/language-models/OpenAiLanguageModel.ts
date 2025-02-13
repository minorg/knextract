import { LanguageModel } from "@/lib/language-models/LanguageModel";
import { OpenAiCredentials } from "@/lib/language-models/OpenAiCredentials";
import { logger } from "@/lib/logger";
import {
  CompletionMessage,
  LanguageModelSpecification,
  Prompt,
  PromptMessage,
} from "@/lib/models";
import { createOpenAI } from "@ai-sdk/openai";
import { CoreMessage, generateText } from "ai";
import { Tiktoken, TiktokenModel, encodingForModel } from "js-tiktoken";
import { LRUCache } from "lru-cache";
import { Either, Left } from "purify-ts";
import invariant from "ts-invariant";

function promptMessageToRoleToCoreMessageRole(
  promptMessageRole: PromptMessage["role"],
): Exclude<CoreMessage["role"], "tool"> {
  switch (promptMessageRole.value) {
    case "http://purl.archive.org/purl/knextract/cbox#_Role_AI":
      return "assistant";
    case "http://purl.archive.org/purl/knextract/cbox#_Role_Human":
      return "user";
    case "http://purl.archive.org/purl/knextract/cbox#_Role_System":
      return "system";
  }
}

export class OpenAiLanguageModel implements LanguageModel {
  readonly specification: LanguageModel["specification"];
  private readonly credentials: OpenAiCredentials;
  private readonly encoding: Tiktoken;
  private readonly messageTokenCountCache: LRUCache<string, number>;

  constructor({
    credentials,
    specification,
  }: {
    credentials: OpenAiCredentials;
    specification: LanguageModelSpecification;
  }) {
    this.credentials = credentials;
    let encoding: Tiktoken;
    try {
      encoding = encodingForModel(specification.apiIdentifier as TiktokenModel);
    } catch (e) {
      invariant(e instanceof Error);
      logger.warn(
        "error getting encoding for model %s: %s",
        specification.apiIdentifier,
        e.message,
      );
      // Unknown model
      encoding = encodingForModel("gpt-4");
    }
    this.encoding = encoding;
    this.messageTokenCountCache = new LRUCache({ max: 1000 });
    this.specification = specification;
  }

  countTokens(message: PromptMessage | string): number {
    const messageString =
      typeof message === "string" ? message : message.literalForm;
    const cachedTokenCount = this.messageTokenCountCache.get(messageString);
    if (typeof cachedTokenCount !== "undefined") {
      return cachedTokenCount;
    }
    const tokenCount = this.encoding.encode(messageString).length;
    this.messageTokenCountCache.set(messageString, tokenCount);
    return tokenCount;
  }

  async invoke(prompt: Prompt): Promise<Either<Error, CompletionMessage>> {
    const openai = createOpenAI({
      apiKey: this.credentials.apiKey,
    });

    try {
      const generatedText = await generateText({
        messages: prompt.messages.map((message) => ({
          content: message.literalForm,
          role: promptMessageToRoleToCoreMessageRole(message.role),
        })),
        model: openai(this.specification.apiIdentifier),
      });
      return Either.of(
        new CompletionMessage({
          literalForm: generatedText.text,
          role: "http://purl.archive.org/purl/knextract/cbox#_Role_AI",
        }),
      );
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }
  }
}
