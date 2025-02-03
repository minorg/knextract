import { Project } from "@/lib/Project";
import { command, run } from "cmd-ts";

const cmd = command({
  description:
    "delete dynamic data such as workflows, workflow executions, and file documents",
  name: "clean",
  args: {},
  handler: async () => {
    const project = Project.fromEnvironment();

    // Deleted uncommitted, managed RDF
    await project.managedRdfDirectory.gitClean();

    const modelSet = await project.modelSet({ locale: "en" });
    await modelSet.clear(); // Clear all quads
    // Reload everything that was left after the clean above
    for await (const dataset of project.datasets()) {
      await modelSet.load(dataset);
    }
  },
});

run(cmd, process.argv.slice(2));
