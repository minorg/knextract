import { Project } from "@/lib/Project";
import { ontologyDataset } from "@/lib/data/ontology/ontologyDataset";
import * as rdfSparql from "@/lib/models/impl/rdf/sparql";
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
    const [rdfSparqlModelSet] = await Promise.all([
      project.modelSet({ locale: "en" }),
    ]);
    if (!(rdfSparqlModelSet instanceof rdfSparql.ModelSet)) {
      throw new Error("SPARQL is not configured");
    }

    if (clean) {
      await rdfSparqlModelSet.clear();
    }

    for await (const dataset of project.datasets()) {
      await logShaclValidationReport({
        dataGraphDescription: "project dataset",
        validationReport: new SHACLValidator(ontologyDataset).validate(dataset),
      });

      await rdfSparqlModelSet.load(dataset);
    }
  },
});

run(cmd, process.argv.slice(2));
