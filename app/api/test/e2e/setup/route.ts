import { testData } from "@/__tests__/unit/data/testData";
import { project } from "@/app/project";

export async function POST(_request: Request): Promise<Response> {
  await project.managedRdfDirectory.gitClean();

  const modelSet = await project.modelSet({ locale: "en" });

  await modelSet.clear();

  for await (const dataset of project.datasets()) {
    await modelSet.load(dataset);
  }

  for (const corpus of Object.values(testData.synthetic.corpora)) {
    await modelSet.addModel(corpus);
  }
  for (const document of Object.values(testData.synthetic.documents)) {
    await modelSet.addModel(document);
  }
  for (const workflow of Object.values(testData.synthetic.workflows)) {
    await modelSet.addModel(workflow);
  }

  return new Response(null, {
    status: 204,
  });
}
