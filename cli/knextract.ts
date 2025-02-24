import * as fs from "node:fs/promises";
import path from "node:path";
import { NamedNodesType } from "@/cli/NamedNodesType";
import { selectDocuments } from "@/cli/selectDocuments";
import { Project } from "@/lib/Project";
import { WorkflowEngine } from "@/lib/WorkflowEngine";
import { Identifier, WorkflowStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { dataFactory, rdfEnvironment } from "@/lib/rdfEnvironment";
import { encodeFileName } from "@kos-kit/next-utils";
import { command, multioption, number, option, run, string } from "cmd-ts";

class WorkflowEngineTracer {
  private documentIdentifier = "";
  private readonly traceDirectoryPath: string;
  private traceFileCounter = 0;
  private readonly traceModelSet = new RdfjsDatasetModelSet();
  private workflowIdentifier = "";

  constructor({ traceDirectoryPath }: { traceDirectoryPath: string }) {
    this.traceDirectoryPath = traceDirectoryPath;
  }

  trace(workflowEngine: WorkflowEngine) {
    workflowEngine.on("postStepExecution", async (event) => {
      await this.writeTraceFile({
        fileStem: `${event.payload.input.step.type}-${encodeFileName(event.payload.input.step.identifier.value)}`,
      });
    });

    workflowEngine.on("postExecution", async (event) => {
      this.traceModelSet.addModel(event.payload.workflowExecution);
      await this.writeTraceFile({
        fileStem: "post-workflow-execution",
      });
      this.documentIdentifier = "";
      this.traceModelSet.clearSync();
      this.traceFileCounter = 0;
      this.workflowIdentifier = "";
    });

    workflowEngine.on("preExecution", async (event) => {
      this.documentIdentifier = Identifier.toString(
        event.payload.document.identifier,
      );
      this.workflowIdentifier = Identifier.toString(
        event.payload.workflow.identifier,
      );
      this.traceModelSet.addModel(event.payload);

      await this.writeTraceFile({
        fileStem: "pre-workflow-execution",
      });
    });

    workflowEngine.on("preStepExecution", async (event) => {
      // Step executions will refer to the document, so it needs to be in the model set
      await this.traceModelSet.addModel(event.payload);

      await this.writeTraceFile({
        fileStem: `${event.payload.step.type}-${encodeFileName(event.payload.step.identifier.value)}`,
      });
    });
  }

  private async writeTraceFile({
    fileStem,
  }: {
    fileStem: string;
  }) {
    const currentDate = new Date();
    const directoryPathParts = [
      this.traceDirectoryPath,
      currentDate.getUTCFullYear().toString(),
      currentDate.getUTCMonth().toString(),
      currentDate.getUTCDate().toString(),
      currentDate.getUTCHours().toString(),
      currentDate.getUTCMinutes().toString(),
      "workflows",
      encodeFileName(this.workflowIdentifier),
      "documents",
      encodeFileName(this.documentIdentifier),
    ];
    const directoryPath = path.resolve(...directoryPathParts);
    await fs.mkdir(path.dirname(directoryPath));
    const filePath = path.resolve(
      directoryPath,
      `${this.traceFileCounter.toString().padStart(3, "0")}-${fileStem}.ttl`,
    );
    this.traceFileCounter++;
    await fs.writeFile(
      filePath,
      await rdfEnvironment.serializers.serializeToString(
        this.traceModelSet.dataset,
        { format: "text/turtle" },
      ),
    );
  }
}

const cmd = command({
  name: "knextract",
  description: "Knextract command line interface",
  args: {
    corpusIri: option({
      defaultValue: () => "",
      description: "IRI of a corpus with documents to annotate",
      long: "corpus-iri",
      short: "c",
      type: string,
    }),
    documentIris: multioption({
      description:
        "zero or more IRIs of documents in the input to annotate; if specified, takes precedence over --corpus-iri; if not specified, any file documents passed as inputs are annotated; if no file documents were in the input, all documents in the input are annotated",
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
    workflowIris: multioption({
      description:
        "zero or more IRIs of workflows to annotate documents with; if not specified, the program uses all workflows in the input",
      long: "workflow-iri",
      short: "w",
      type: NamedNodesType,
    }),
    traceDirectoryPath: option({
      defaultValue: () => "",
      description: "path to a directory to write workflow traces",
      long: "workflow-trace-directory-path",
      short: "t",
      type: string,
    }),
  },
  handler: async ({
    corpusIri,
    documentIris,
    documentsLimit,
    documentsOffset,
    workflowIris,
    traceDirectoryPath,
  }) => {
    const project = Project.fromEnvironment();

    const languageModelFactory = await project.languageModelFactory();
    const modelSet = await project.modelSet({
      locale: "en",
    });

    const { documents } = (
      await selectDocuments({
        corpusIdentifier: corpusIri ? dataFactory.namedNode(corpusIri) : null,
        identifiers: documentIris,
        limit: documentsLimit > 0 ? documentsLimit : null,
        modelSet,
        offset: documentsOffset,
      })
    ).unsafeCoerce();

    let workflows: readonly WorkflowStub[];
    if (workflowIris.length > 0) {
      workflows = workflowIris.map(
        (workflowIri) => new WorkflowStub({ identifier: workflowIri }),
      );
    } else {
      workflows = (
        await modelSet.workflowStubs({
          query: { includeDeleted: false, type: "All" },
        })
      ).orDefault([]);
    }

    for (const workflow of workflows) {
      for await (const document of documents) {
        const workflowEngine = new WorkflowEngine({
          languageModelFactory,
          modelSet,
        });
        if (traceDirectoryPath) {
          new WorkflowEngineTracer({ traceDirectoryPath }).trace(
            workflowEngine,
          );
        }

        await modelSet.addModel(
          await workflowEngine.execute({
            document,
            workflow,
          }),
        );
      }
    }
  },
});

run(cmd, process.argv.slice(2));
