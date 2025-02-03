import path from "node:path";
import { fileURLToPath } from "node:url";
import { Project } from "@/lib/Project";
import { ConceptScheme, Corpus } from "@/lib/models";
import invariant from "ts-invariant";

interface ExporterTestData {
  readonly plants: {
    readonly conceptSchemes: readonly ConceptScheme[];
    readonly corpus: Corpus;
  };
}

let lazyExporterTestData: ExporterTestData | undefined;

export async function exporterTestData(): Promise<ExporterTestData> {
  if (!lazyExporterTestData) {
    const plantsModelSet = await new Project({
      env: {},
      rootDirectoryPath: path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "..",
        "..",
        "projects",
        "plants",
      ),
    }).modelSet({ locale: "en" });
    const plantsConceptSchemes = await (
      await plantsModelSet.conceptSchemes({
        limit: null,
        offset: 0,
      })
    ).flatResolve();
    invariant(plantsConceptSchemes.length === 71);
    const plantsCorpora = await (
      await plantsModelSet.corpora({
        query: { includeDeleted: false, type: "All" },
      })
    ).flatResolve();
    invariant(plantsCorpora.length === 1);

    lazyExporterTestData = {
      plants: {
        conceptSchemes: plantsConceptSchemes,
        corpus: plantsCorpora[0],
      },
    };
  }

  return lazyExporterTestData;
}
