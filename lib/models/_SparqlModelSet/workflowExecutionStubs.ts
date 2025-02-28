import { WorkflowExecutionQuery, WorkflowExecutionStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { knextract } from "@/lib/vocabularies";
import { Either, EitherAsync } from "purify-ts";
import * as sparqljs from "sparqljs";

const workflowExecutionVariable = dataFactory.variable!("workflowExecution");
const workflowExecutionInputVariable = dataFactory.variable!(
  "workflowExecutionInput",
);

function workflowExecutionQueryToWherePatterns(
  query: WorkflowExecutionQuery,
): readonly sparqljs.Pattern[] {
  switch (query.type) {
    case "All":
      return [];
    case "ClaimGenerator":
      throw new Error(
        "not implemented: add a generatedByWorkflowExecution to Claim instead of this monstrosity",
      );
    // return [
    //   {
    //     type: "values",
    //     values: [query.claimIdentifier].map((identifier) => {
    //       const valuePatternRow: sparqljs.ValuePatternRow = {};
    //       valuePatternRow[`?${claimVariable.value}`] = identifier;
    //       return valuePatternRow;
    //     }),
    //   },
    //   // Execution -> sub-processes
    //   sparqlTriplesToPattern({
    //     subject: workflowExecutionVariable,
    //     predicate: knextract.subProcesses,
    //     object: workflowExecutionSubProcessesVariable,
    //   }),
    //   // Sub-processes -> step execution list
    //   sparqlTriplesToPattern({
    //     subject: workflowExecutionSubProcessesVariable,
    //     predicate: knextract.workflowStepExecutions,
    //     object: workflowStepExecutionListVariable,
    //   }),
    //   ...sparqlRdfListPatterns({
    //     listVariable: workflowStepExecutionListVariable,
    //     itemPatterns: (workflowStepExecutionVariable) => [
    //       // Questionnaire step execution RDF type
    //       sparqlTriplesToPattern({
    //         subject: workflowStepExecutionVariable,
    //         predicate: rdf.type,
    //         object: WorkflowQuestionnaireStepExecution.fromRdfType,
    //       }),
    //       // Questionnaire step execution -> sub-processes
    //       sparqlTriplesToPattern({
    //         subject: workflowStepExecutionVariable,
    //         predicate: knextract.subProcesses,
    //         object: workflowQuestionnaireStepExecutionSubProcessesVariable,
    //       }),
    //       // Questionnaire step execution sub-processes -> questionnaire administration
    //       sparqlTriplesToPattern({
    //         subject: workflowQuestionnaireStepExecutionSubProcessesVariable,
    //         predicate: knextract.questionnaireAdministration,
    //         object: questionnaireAdministrationVariable,
    //       }),
    //       // Questionnaire administration -> sub-processes
    //       sparqlTriplesToPattern({
    //         subject: questionnaireAdministrationVariable,
    //         predicate: knextract.subProcesses,
    //         object: questionnaireAdministrationSubProcessesVariable,
    //       }),
    //       // Questionnaire administration sub-processes -> question administrations list
    //       sparqlTriplesToPattern({
    //         subject: questionnaireAdministrationSubProcessesVariable,
    //         predicate: knextract.questionnaireAdministrations,
    //         object: questionAdministrationsListVariable,
    //       }),
    //       // Question administrations list
    //       ...sparqlRdfListPatterns({
    //         listVariable: questionAdministrationsListVariable,
    //         itemPatterns: (questionAdministrationVariable) => [
    //           // Question administration -> output
    //           sparqlTriplesToPattern({
    //             subject: questionAdministrationVariable,
    //             predicate: knextract.processOutput,
    //             object: questionAdministrationOutputVariable,
    //           }),
    //           // Question administration output -> answer
    //           sparqlTriplesToPattern({
    //             subject: questionAdministrationOutputVariable,
    //             predicate: knextract.answer,
    //             object: answerVariable,
    //           }),
    //           // Answer -> claims list
    //           sparqlTriplesToPattern({
    //             subject: answerVariable,
    //             predicate: knextract.claims,
    //             object: claimListVariable,
    //           }),
    //           // Claim list item = claim
    //           ...sparqlRdfListPatterns({
    //             listVariable: claimListVariable,
    //             itemPatterns: (claimListItemVariable) => [
    //               {
    //                 expression: {
    //                   args: [claimListItemVariable, claimVariable],
    //                   operator: "=",
    //                   type: "operation",
    //                 },
    //                 type: "filter",
    //               },
    //             ],
    //           }),
    //         ],
    //       }),
    //     ],
    //   }),
    // ];
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
