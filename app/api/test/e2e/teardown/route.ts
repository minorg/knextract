import { project } from "@/app/project";

export async function POST(_request: Request): Promise<Response> {
  await project.managedRdfDirectory.gitClean();

  const modelSet = await project.modelSet({ locale: "en" });

  await modelSet.clear();

  for await (const dataset of project.datasets()) {
    await modelSet.load(dataset);
  }

  return new Response(null, {
    status: 204,
  });
}
