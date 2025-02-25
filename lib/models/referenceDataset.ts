import {
  LanguageModelCreator,
  LanguageModelFamily,
  LanguageModelSpecification,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { DatasetCore } from "@rdfjs/types";

function createReferenceDataset(): DatasetCore {
  const openAiLanguageModelCreator = new LanguageModelCreator({
    identifier: "http://openai.com/",
    label: "OpenAI",
  });

  const gpt4oLanguageModelFamily = new LanguageModelFamily({
    creator: openAiLanguageModelCreator,
    label: "GPT-4o",
  });

  const modelSet = new RdfjsDatasetModelSet();

  modelSet.addModelSync(openAiLanguageModelCreator);
  modelSet.addModelSync(gpt4oLanguageModelFamily);
  modelSet.addModelSync(
    new LanguageModelSpecification({
      apiIdentifier: "gpt-4o-2024-08-06",
      contextWindow: 128000,
      family: gpt4oLanguageModelFamily,
      label: "GPT-4o 2024-08-06",
    }),
  );

  return modelSet.dataset;
}

export const referenceDataset = createReferenceDataset();
