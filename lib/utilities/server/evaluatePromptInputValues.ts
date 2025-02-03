import { logger } from "@/lib/logger";
import { ModelSet, PromptInputValue } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either, EitherAsync } from "purify-ts";

export async function evaluatePromptInputValues({
  inputValues,
  modelSet,
}: { inputValues: readonly PromptInputValue[]; modelSet: ModelSet }): Promise<
  Either<Error, Record<string, any>>
> {
  return EitherAsync(async () => {
    const result: Record<string, string> = {};
    for (const inputValue of inputValues) {
      switch (inputValue.type) {
        case "PromptLiteralInputValue":
          result[inputValue.variable] = inputValue.literalForm;
          break;
        case "PromptSparqlSelectInputValue": {
          if (!(modelSet instanceof SparqlModelSet)) {
            logger.warn(
              "unable to evaluate SPARQL SELECT prompt input value on non-SPARQL ModelSet",
            );
            continue;
          }

          const resultRows = await modelSet.sparqlQueryClient.queryBindings(
            inputValue.sparqlSelect,
          );
          resultRows.forEach((resultRow, resultRowI) => {
            // If there are multiple result rows, append the row index to the key
            const keySuffix =
              resultRows.length > 1 ? resultRowI.toString() : "";
            for (const [keyPrefix, value] of Object.entries(resultRow)) {
              result[keyPrefix + keySuffix] = value.value;
            }
          });
        }
      }
    }
    return result;
  });
}
