import { ModelSet, PromptMessage, PromptMessageTemplate } from "@/lib/models";
import { evaluatePromptInputValues } from "@/lib/utilities/server/evaluatePromptInputValues";
import Handlebars from "handlebars";
import { Either, EitherAsync } from "purify-ts";

Handlebars.registerHelper("json", (context) => JSON.stringify(context));

/**
 * Format a PromptMessageTemplate into a PromptMessage.
 *
 * This is a freestanding function so the logic is not tangled up with the (passive) models.
 */
export async function formatPromptMessageTemplate({
  ambientInputValues,
  modelSet,
  promptMessageTemplate,
}: {
  ambientInputValues: Record<string, any>;
  modelSet: ModelSet;
  promptMessageTemplate: PromptMessageTemplate;
}): Promise<Either<Error, PromptMessage>> {
  return EitherAsync(async ({ liftEither }) => {
    const promptMessageTemplateInputValues = await evaluatePromptInputValues({
      inputValues: promptMessageTemplate.inputValues,
      modelSet,
    });
    if (promptMessageTemplateInputValues.isLeft()) {
      return liftEither(promptMessageTemplateInputValues);
    }
    const handlebarsTemplate = Handlebars.compile(
      promptMessageTemplate.literalForm,
    );
    return new PromptMessage({
      literalForm: handlebarsTemplate({
        ...ambientInputValues,
        ...promptMessageTemplateInputValues.unsafeCoerce(),
      }),
      role: promptMessageTemplate.role,
    });
  });
}
