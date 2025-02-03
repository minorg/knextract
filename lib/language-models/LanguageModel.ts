import {
  CompletionMessage,
  LanguageModelSpecification,
  Prompt,
  PromptMessage,
} from "@/lib/models";
import { Either } from "purify-ts";

export interface LanguageModel {
  readonly specification: LanguageModelSpecification;

  countTokens(message: PromptMessage | string): number;

  /**
   * Invoke the language model with the given messages, returning the completion message.
   */
  invoke(prompt: Prompt): Promise<Either<Error, CompletionMessage>>;
}
