"use server";

import { project } from "@/app/project";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { Identifier, Locale, Workflow } from "@/lib/models";
import { redirect } from "next/navigation";

export async function addWorkflow(
  json: {
    locale: Locale;
    workflow: ReturnType<Workflow["toJson"]>;
  },
  _formData: FormData,
): Promise<void> {
  const locale = json.locale;

  const workflowEither = Workflow.fromJson(json.workflow);
  workflowEither.ifLeft((error) => {
    logger.error("error deserializing workflow to add: %s", error);
    throw error;
  });
  const workflow = workflowEither.unsafeCoerce();

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
