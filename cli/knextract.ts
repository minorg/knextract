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
    workflowEngine.on("postStepExecution", async (stepExecution) => {
      await this.writeTraceFile({
        fileStem: `${stepExecution.input.step.type}-${encodeFileName(stepExecution.input.step.identifier.value)}`,
      });
    });

    workflowEngine.on("postExecution", async (workflowExecution) => {
      this.traceModelSet.addModel(workflowExecution);
      await this.writeTraceFile({
        fileStem: "post-workflow-execution",
      });
      this.documentIdentifier = "";
      this.traceModelSet.clearSync();
      this.traceFileCounter = 0;
      this.workflowIdentifier = "";
    });

    workflowEngine.on("preExecution", async (workflowExecutionInput) => {
      this.documentIdentifier = Identifier.toString(
        workflowExecutionInput.document.identifier,
      );
      this.workflowIdentifier = Identifier.toString(
        workflowExecutionInput.workflow.identifier,
      );
      this.traceModelSet.addModel(workflowExecutionInput);

      await this.writeTraceFile({
        fileStem: "pre-workflow-execution",
      });
    });

    workflowEngine.on("preStepExecution", async (stepExecutionInput) => {
      // Step executions will refer to the document, so it needs to be in the model set
      await this.traceModelSet.addModel(stepExecutionInput);

      await this.writeTraceFile({
        fileStem: `${stepExecutionInput.step.type}-${encodeFileName(stepExecutionInput.step.identifier.value)}`,
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

    const documentStubs = selectDocuments({
      corpusIdentifier: corpusIri ? dataFactory.namedNode(corpusIri) : null,
      identifiers: documentIris,
      limit: documentsLimit > 0 ? documentsLimit : null,
      modelSet,
      offset: documentsOffset,
    });

    let workflowStubs: readonly WorkflowStub[];
    if (workflowIris.length > 0) {
      workflowStubs = workflowIris.map(
        (workflowIri) => new WorkflowStub({ identifier: workflowIri }),
      );
    } else {
      workflowStubs = (
        await modelSet.workflowStubs({
          query: { includeDeleted: false, type: "All" },
        })
      ).orDefault([]);
    }

    for (const workflowStub of workflowStubs) {
      for await (const documentStub of documentStubs) {
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
            documentStub,
            workflowStub,
          }),
        );
      }
    }
  },
});

run(cmd, process.argv.slice(2));
