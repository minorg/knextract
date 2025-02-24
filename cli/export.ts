import { NamedNodesType } from "@/cli/NamedNodesType";
import { selectDocuments } from "@/cli/selectDocuments";
import { Project } from "@/lib/Project";
import { Adapters } from "@/lib/exporters/Adapters";
import { CorpusClaimsExporter } from "@/lib/exporters/CorpusClaimsExporter";
import { CsvSingleTableExporter } from "@/lib/exporters/CsvSingleTableExporter";
import { Sqlite3EntityAttributeValueExporter } from "@/lib/exporters/Sqlite3EntityAttributeValueExporter";
import { Sqlite3SingleTableExporter } from "@/lib/exporters/Sqlite3SingleTableExporter";
import { dataFactory } from "@/lib/rdfEnvironment";
import cliProgress from "cli-progress";
import {
  command,
  multioption,
  number,
  oneOf,
  option,
  run,
  string,
  subcommands,
} from "cmd-ts";

const cmd = subcommands({
  cmds: {
    "corpus-annotations": command({
      args: {
        corpusIri: option({
          defaultValue: () => "",
          description:
            "IRI of a corpus with documents to export; if not specified, use the first corpus in the project",
          long: "corpus-iri",
          short: "c",
          type: string,
        }),
        documentIris: multioption({
          description:
            "zero or more IRIs of documents to subset from the corpus",
          long: "document-iri",
          short: "d",
          type: NamedNodesType,
        }),
        documentsLimit: option({
          defaultValue: () => -1,
          description:
            "limit the number of documents specified by other other options (e.g., --corpus-iri)",
          long: "documents-limit",
          type: number,
        }),
        documentsOffset: option({
          defaultValue: () => 0,
          description:
            "offset the number of documents specified by other other options (e.g., --corpus-iri)",
          long: "documents-offset",
          type: number,
        }),
        format: option({
          description: "format to export",
          long: "format",
          short: "f",
          type: oneOf(["csv", "sqlite3-eav", "sqlite3-single-table"]),
        }),
        outputFilePath: option({
          description: "path to an output file to write",
          long: "output-file-path",
          short: "o",
          type: string,
        }),
      },
      handler: async ({
        corpusIri,
        documentIris,
        documentsLimit,
        documentsOffset,
        format,
        outputFilePath,
      }) => {
        const project = Project.fromEnvironment();

        const modelSet = await project.modelSet({
          locale: "en",
        });

        const { documents, documentsCount } = (
          await selectDocuments({
            corpusIdentifier: corpusIri
              ? dataFactory.namedNode(corpusIri)
              : null,
            identifiers: documentIris,
            limit: documentsLimit > 0 ? documentsLimit : null,
            modelSet,
            offset: documentsOffset,
          })
        ).unsafeCoerce();

        let corpusClaimsExporter: CorpusClaimsExporter;
        switch (format) {
          case "csv":
            corpusClaimsExporter =
              new Adapters.CorpusClaimsExporterToSingleTableExporter(
                new CsvSingleTableExporter({
                  csvFilePath: outputFilePath,
                }),
              );
            break;
          case "sqlite3-eav":
            corpusClaimsExporter =
              new Adapters.CorpusClaimsExporterToEntityAttributeValueExporter(
                new Sqlite3EntityAttributeValueExporter({
                  sqlite3FilePath: outputFilePath,
                }),
              );
            break;
          case "sqlite3-single-table":
            corpusClaimsExporter =
              new Adapters.CorpusClaimsExporterToSingleTableExporter(
                new Sqlite3SingleTableExporter({
                  sqlite3FilePath: outputFilePath,
                }),
              );
            break;
          default:
            throw new RangeError(format);
        }

        const progressBar = new cliProgress.SingleBar({
          format:
            "Documents [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total}",
        });
        progressBar.start(documentsCount, 0);
        corpusClaimsExporter.on("postDocumentExportEvent", () =>
          progressBar.increment(),
        );

        await corpusClaimsExporter.export({
          documents,
          modelSet,
        });

        progressBar.stop();
      },
      name: "corpus-annotations",
    }),
  },
  description: "Knextract export command line program",
  name: "export",
});

run(cmd, process.argv.slice(2));
