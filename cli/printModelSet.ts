import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { rdfEnvironment } from "@/lib/rdfEnvironment";

export async function printModelSet(
  modelSet: RdfjsDatasetModelSet,
): Promise<void> {
  process.stdout.write(
    await rdfEnvironment.serializers.serializeToString(modelSet.dataset, {
      format: "application/n-triples",
    }),
  );
}
