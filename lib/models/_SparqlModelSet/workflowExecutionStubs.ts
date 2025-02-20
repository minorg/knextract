import {
  WorkflowExecution,
  WorkflowExecutionQuery,
  WorkflowExecutionStub,
  WorkflowQuestionnaireStepExecution,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { knextract } from "@/lib/vocabularies";
import { sparqlRdfTypePattern } from "@kos-kit/models/sparqlRdfTypePattern";
import { Variable } from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { Either, EitherAsync } from "purify-ts";
import * as sparqljs from "sparqljs";

function sparqlRdfListTriples({
  itemVariable,
  listVariable,
}: {
  itemVariable: Variable;
  listVariable: Variable;
}): sparqljs.Triple[] {
  const restVariable = dataFactory.variable!(`${listVariable.value}Rest`);

  return [
    // (List, rdf:rest*, rest)
    {
      subject: listVariable,
      predicate: {
        items: [rdf.rest],
        pathType: "*",
        type: "path",
      },
      object: restVariable,
    },
    // Step execution list rest, rdf:first, step execution
    {
      subject: restVariable,
      predicate: rdf.first,
      object: itemVariable,
    },
  ];
}

const answerVariable = dataFactory.variable!("answer");
const claimVariable = dataFactory.variable!("claim");
const claimListVariable = dataFactory.variable!("claimList");
const questionAdministrationOutputVariable = dataFactory.variable!(
  "questionAdministrationOutput",
);
const questionAdministrationVariable = dataFactory.variable!(
  "questionAdministration",
);
const questionAdministrationsListVariable = dataFactory.variable!(
  "questionAdministrationsList",
);
const questionnaireAdministrationVariable = dataFactory.variable!(
  "questionnaireAdministration",
);
const questionnaireAdministrationSubProcessesVariable = dataFactory.variable!(
  "questionnaireAdministrationSubProcesses",
);
const workflowExecutionVariable = dataFactory.variable!("workflowExecution");
const workflowExecutionInputVariable = dataFactory.variable!(
  "workflowExecutionInput",
);
const workflowExecutionSubProcessesVariable = dataFactory.variable!(
  "workflowExecutionSubProcesses",
);
const workflowStepExecutionListVariable = dataFactory.variable!(
  "workflowStepExecutionList",
);
const workflowStepExecutionVariable = dataFactory.variable!(
  "workflowStepExecution",
);
const workflowQuestionnaireStepExecutionSubProcessesVariable =
  dataFactory.variable!("workflowQuestionnaireStepExecutionSubProcesses");

function workflowExecutionQueryToWherePatterns(
  query: WorkflowExecutionQuery,
): readonly sparqljs.Pattern[] {
  switch (query.type) {
    case "All":
      return [
        sparqlRdfTypePattern({
          rdfType: WorkflowExecution.fromRdfType,
          subject: workflowExecutionVariable,
        }),
      ];
    case "ClaimGenerator":
      return [
        {
          type: "values",
          values: [query.claimIdentifier].map((identifier) => {
            const valuePatternRow: sparqljs.ValuePatternRow = {};
            valuePatternRow[`?${claimVariable.value}`] = identifier;
            return valuePatternRow;
          }),
        },
        {
          triples: [
            // Execution -> sub-processes
            {
              subject: workflowExecutionVariable,
              predicate: knextract.subProcesses,
              object: workflowExecutionSubProcessesVariable,
            },
            // Sub-processes -> step execution list
            {
              subject: workflowExecutionSubProcessesVariable,
              predicate: knextract.workflowStepExecutions,
              object: workflowStepExecutionListVariable,
            },
            ...sparqlRdfListTriples({
              itemVariable: workflowStepExecutionVariable,
              listVariable: workflowStepExecutionListVariable,
            }),
            // Step execution RDF type
            {
              subject: workflowStepExecutionVariable,
              predicate: rdf.type,
              object: WorkflowQuestionnaireStepExecution.fromRdfType,
            },
            // Questionnaire step execution -> sub-processes
            {
              subject: workflowStepExecutionVariable,
              predicate: knextract.subProcesses,
              object: workflowQuestionnaireStepExecutionSubProcessesVariable,
            },
            // Questionnaire step execution sub-processes -> questionnaire administration
            {
              subject: workflowQuestionnaireStepExecutionSubProcessesVariable,
              predicate: knextract.questionnaireAdministration,
              object: questionnaireAdministrationVariable,
            },
            // Questionnaire administration -> sub-processes
            {
              subject: questionnaireAdministrationVariable,
              predicate: knextract.subProcesses,
              object: questionnaireAdministrationSubProcessesVariable,
            },
            {
              subject: questionnaireAdministrationSubProcessesVariable,
              predicate: knextract.questionnaireAdministrations,
              object: questionAdministrationsListVariable,
            },
            ...sparqlRdfListTriples({
              itemVariable: questionAdministrationVariable,
              listVariable: questionAdministrationsListVariable,
            }),
            // Question administration -> output
            {
              subject: questionAdministrationVariable,
              predicate: knextract.processOutput,
              object: questionAdministrationOutputVariable,
            },
            // Question administration output -> answer
            {
              subject: questionAdministrationOutputVariable,
              predicate: knextract.answer,
              object: answerVariable,
            },
            // Answer -> claims list
            {
              subject: answerVariable,
              predicate: knextract.claims,
              object: claimListVariable,
            },
            ...sparqlRdfListTriples({
              itemVariable: claimVariable,
              listVariable: claimListVariable,
            }),
          ],
          type: "bgp",
        },
      ];
    case "Workflow":
      return [
        {
          triples: [
            // Execution -> input
            {
              subject: workflowExecutionVariable,
              predicate: knextract.processInput,
              object: workflowExecutionInputVariable,
            },
            // Input -> workflow
            {
              subject: workflowExecutionInputVariable,
              predicate: knextract.workflow,
              object: query.workflowIdentifier,
            },
          ],
          type: "bgp",
        },
      ];
  }
}

export async function workflowExecutionStubs(
  this: SparqlModelSet,
  {
    query,
  }: {
    query: WorkflowExecutionQuery;
  },
): Promise<Either<Error, readonly WorkflowExecutionStub[]>> {
  return EitherAsync(async () =>
    new RdfjsDatasetModelSet({
      dataset: datasetCoreFactory.dataset(
        (
          await this.sparqlQueryClient.queryQuads(
            WorkflowExecutionStub.sparqlConstructQueryString({
              subject: workflowExecutionVariable,
              variablePrefix: "workflowExecution",
              where: workflowExecutionQueryToWherePatterns(query).concat(),
            }),
          )
        ).concat(),
      ),
      languageIn: this.languageIn,
    }).workflowExecutionStubsSync({
      query: { type: "All" },
    }),
  );
}
