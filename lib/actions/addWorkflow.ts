"use server";

import { project } from "@/app/project";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { Identifier, Locale } from "@/lib/models";
import { rdf } from "@/lib/models/impl";
import { rdfEnvironment } from "@/lib/rdfEnvironment";
import { LanguageTagSet } from "@kos-kit/models";
import { redirect } from "next/navigation";

export async function addWorkflow(
  {
    locale,
    workflowRdfString,
  }: {
    locale: Locale;
    workflowRdfString: string;
  },
  _formData: FormData,
): Promise<void> {
  const workflowModelSet = new rdf.mem.ModelSet({
    dataset: rdfEnvironment.parsers
      .parseString(workflowRdfString, {
        format: "application/n-quads",
      })
      .unsafeCoerce(),
    includeLanguageTags: new LanguageTagSet(),
  });
  const workflowStubs = await workflowModelSet.workflows({
    query: { includeDeleted: true, type: "All" },
  });
  if (workflowStubs.length !== 1) {
    throw new Error("expected one workflow");
  }
  const workflow = (await workflowStubs.at(0)!.resolve())
    .toMaybe()
    .extractNullable();
  if (!workflow) {
    throw new Error("expected one workflow");
  }

  const modelSet = await project.modelSet({ locale });

  logger.debug("adding workflow %s", Identifier.toString(workflow.identifier));
  await modelSet.addModel(workflow);
  logger.debug("added workflow %s", Identifier.toString(workflow.identifier));

  redirect(
    (await getHrefs({ locale })).workflow({
      identifier: workflow.identifier,
    }),
  );
}
