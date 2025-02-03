import { printModelSet } from "@/cli/printModelSet";
import { ModelSet } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";

export async function printModels(
  ...models: readonly ModelSet.AddableModel[]
): Promise<void> {
  await printModelSet(
    models.reduce((modelSet, model) => {
      modelSet.addModel(model);
      return modelSet;
    }, new RdfjsDatasetModelSet()),
  );
}
