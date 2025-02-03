import fs from "node:fs";
import path from "node:path";
import { logger } from "@/lib/logger";
import { datasetCoreFactory, rdfEnvironment } from "@/lib/rdfEnvironment";
import { dataFactory } from "@/lib/rdfEnvironment";
import {
  fsEither,
  getRdfFileFormat,
  parseRdfFile,
} from "@kos-kit/next-utils/server";
import { command, run } from "cmd-ts";

const cmd = command({
  description: "transform lib/data into JSON-LD",
  name: "transform-lib-data",
  args: {},
  handler: async () => {
    const dataDirectoryPath = path.resolve(__dirname, "..", "lib", "data");
    if (
      !(await fsEither.stat(dataDirectoryPath))
        .map((stats) => stats.isDirectory())
        .orDefault(false)
    ) {
      throw new Error(
        `data directory ${dataDirectoryPath} does not exist or is not a directory`,
      );
    }

    for (const directoryName of ["ontology", "reference"]) {
      const tsDirectoryPath = path.resolve(
        dataDirectoryPath,
        directoryName,
        "ts",
      );
      try {
        await fs.promises.rm(tsDirectoryPath, { recursive: true });
      } catch {}
      await fs.promises.mkdir(tsDirectoryPath, { recursive: true });

      const ttlDirectoryPath = path.resolve(
        dataDirectoryPath,
        directoryName,
        "ttl",
      );

      for (const dirent of await fs.promises.readdir(ttlDirectoryPath, {
        withFileTypes: true,
      })) {
        if (!dirent.isFile()) {
          continue;
        }
        const filePath = path.resolve(dirent.parentPath, dirent.name);
        const rdfFileFormat = getRdfFileFormat(filePath);

        if (rdfFileFormat.isLeft()) {
          logger.info("%s is not an RDF file, ignoring", filePath);
          continue;
        }

        const dataset = datasetCoreFactory.dataset();
        logger.info("parsing %s", filePath);
        await parseRdfFile({
          dataFactory,
          dataset,
          rdfFileFormat: rdfFileFormat.unsafeCoerce(),
          rdfFilePath: filePath,
        });
        logger.info("parsed %d quads from %s", dataset.size, filePath);

        const tsFilePath = path.resolve(
          dataDirectoryPath,
          directoryName,
          "ts",
          `${path.basename(dirent.name, path.extname(dirent.name))}.ts`,
        );
        logger.info("transforming %s to %s", filePath, tsFilePath);
        await fs.promises.writeFile(
          tsFilePath,
          `\
import { rdfEnvironment } from "@/lib/rdfEnvironment";

export const dataset = rdfEnvironment.parsers.parseString(String.raw\`
${await rdfEnvironment.serializers.serializeToString(dataset, { format: "application/n-triples", sorted: true })}\`, { format: "application/n-triples" } ).unsafeCoerce();
`,
        );
        logger.info("transformed %s to %s", filePath, tsFilePath);
      }
    }
  },
});

run(cmd, process.argv.slice(2));
