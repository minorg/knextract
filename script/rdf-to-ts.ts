import path from "node:path";
import { logger } from "@/lib/logger";
import { datasetCoreFactory, rdfEnvironment } from "@/lib/rdfEnvironment";
import { dataFactory } from "@/lib/rdfEnvironment";
import { getRdfFileFormat, parseRdfFile } from "@kos-kit/next-utils/server";
import { command, positional, run } from "cmd-ts";
import { File } from "cmd-ts/batteries/fs";

const cmd = command({
  description:
    "Wrap the contents of an RDF file as an RDF/JS dataset in TypeScript",
  name: "rdf-to-ts",
  args: {
    rdfFilePath: positional({
      type: File,
    }),
  },
  handler: async ({ rdfFilePath }) => {
    const rdfFileFormat = getRdfFileFormat(rdfFilePath);

    if (rdfFileFormat.isLeft()) {
      throw new Error(`${rdfFilePath} is not an RDF file`);
    }

    const dataset = datasetCoreFactory.dataset();
    logger.info("parsing %s", rdfFilePath);
    await parseRdfFile({
      dataFactory,
      dataset,
      rdfFileFormat: rdfFileFormat.unsafeCoerce(),
      rdfFilePath,
    });
    logger.info("parsed %d quads from %s", dataset.size, rdfFileFormat);

    process.stdout.write(
      `\
// ${path.basename(rdfFilePath)} for runtime use
// Generated code - do not modify

import { rdfEnvironment } from "@/lib/rdfEnvironment";

const dataset = rdfEnvironment.parsers.parseString(String.raw\`
${await rdfEnvironment.serializers.serializeToString(dataset, { format: "application/n-triples", sorted: true })}\`, { format: "application/n-triples" } ).unsafeCoerce();
export default dataset;
`,
    );
  },
});

run(cmd, process.argv.slice(2));
