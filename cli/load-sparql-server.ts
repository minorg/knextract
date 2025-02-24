import { Project } from "@/lib/Project";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import ontologyDataset from "@/lib/models/models.shaclmate.ttl";
import { logShaclValidationReport } from "@/lib/utilities/logShaclValidationReport";
import { command, flag, run } from "cmd-ts";
import SHACLValidator from "rdf-validate-shacl";

const cmd = command({
  name: "load-sparql-server",
  args: {
    clean: flag({
      description: "remove all quads from the SPARQL server before loading it",
      long: "clean",
      short: "c",
    }),
  },
  handler: async ({ clean }) => {
    const project = Project.fromEnvironment();
    const [modelSet] = await Promise.all([project.modelSet({ locale: "en" })]);
    if (!(modelSet instanceof SparqlModelSet)) {
      throw new Error("SPARQL is not configured");
    }

    if (clean) {
      await modelSet.clear();
    }

    for await (const dataset of project.datasets()) {
      await logShaclValidationReport({
        dataGraphDescription: "project dataset",
        validationReport: new SHACLValidator(ontologyDataset).validate(dataset),
      });

      await modelSet.load(dataset);
    }
  },
});

run(cmd, process.argv.slice(2));
