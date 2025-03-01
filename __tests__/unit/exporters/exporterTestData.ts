import path from "node:path";
import { fileURLToPath } from "node:url";
import { Project } from "@/lib/Project";
import { DocumentStub, ModelSet } from "@/lib/models";
import invariant from "ts-invariant";

interface ExporterTestData {
  readonly plants: {
    readonly documents: readonly DocumentStub[];
    readonly modelSet: ModelSet;
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
    const plantsDocuments = (
      await plantsModelSet.documentStubs({
        limit: null,
        offset: 0,
        query: { includeDeleted: false, type: "All" },
      })
    ).unsafeCoerce();
    invariant(plantsDocuments.length === 2175);

    lazyExporterTestData = {
      plants: {
        documents: plantsDocuments,
        modelSet: plantsModelSet,
      },
    };
  }

  return lazyExporterTestData;
}
