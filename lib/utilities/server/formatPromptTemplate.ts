import { ModelSet, Prompt, PromptMessage, PromptTemplate } from "@/lib/models";
import { evaluatePromptInputValues } from "@/lib/utilities/server/evaluatePromptInputValues";
import { formatPromptMessageTemplate } from "@/lib/utilities/server/formatPromptMessageTemplate";
import { Either, EitherAsync } from "purify-ts";

/**
 * Format a Prompt.Template into a Prompt.
 *
 * This is a freestanding function so the logic is not tangled up with the (passive) models.
 */
export async function formatPromptTemplate({
  ambientInputValues,
  modelSet,
  promptTemplate,
}: {
  ambientInputValues: Record<string, any>;
  modelSet: ModelSet;
  promptTemplate: PromptTemplate;
}): Promise<Either<Error, Prompt>> {
  return EitherAsync(async ({ liftEither }) => {
    const promptTemplateInputValues = await evaluatePromptInputValues({
      inputValues: promptTemplate.inputValues,
      modelSet,
    });
    if (promptTemplateInputValues.isLeft()) {
      return liftEither(promptTemplateInputValues);
    }

    const promptMessages: PromptMessage[] = [];
    for (const promptMessageTemplate of promptTemplate.messageTemplates) {
      const promptMessage = await formatPromptMessageTemplate({
        ambientInputValues: {
          ...ambientInputValues,
          ...promptTemplateInputValues,
        },
        modelSet,
        promptMessageTemplate,
      });
      if (promptMessage.isLeft()) {
        return liftEither(promptMessage);
      }
      promptMessages.push(promptMessage.unsafeCoerce());
    }
    return new Prompt({ messages: promptMessages });
  });
}
