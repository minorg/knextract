import { WorkflowQuery, WorkflowStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { sparqlFilterDeletedPattern } from "@/lib/models/_SparqlModelSet/sparqlFilterDeletedPattern";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { Either, EitherAsync } from "purify-ts";
import * as sparqljs from "sparqljs";
import { invariant } from "ts-invariant";

const workflowVariable = dataFactory.variable!("workflow");

function workflowQueryToWherePatterns(
  query: WorkflowQuery,
): readonly sparqljs.Pattern[] {
  invariant(query.type === "All");
  return sparqlFilterDeletedPattern({
    query,
    subject: workflowVariable,
  }).toList();
}

export async function workflowStubs(
  this: SparqlModelSet,
  { query }: { query: WorkflowQuery },
): Promise<Either<Error, readonly WorkflowStub[]>> {
  return EitherAsync(async () =>
    new RdfjsDatasetModelSet({
      dataset: datasetCoreFactory.dataset(
        (
          await this.sparqlQueryClient.queryQuads(
            WorkflowStub.sparqlConstructQueryString({
              subject: workflowVariable,
              variablePrefix: "workflow",
              where: workflowQueryToWherePatterns(query).concat(),
            }),
          )
        ).concat(),
      ),
      languageIn: this.languageIn,
    }).workflowStubsSync({
      query: { includeDeleted: query.includeDeleted, type: "All" },
    }),
  );
}
