"use server";

import { project } from "@/app/project";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { Identifier, Locale } from "@/lib/models";
import { redirect } from "next/navigation";

export async function deleteWorkflow({
  identifier,
  locale,
}: {
  identifier: string;
  locale: Locale;
}): Promise<void> {
  const redirectHref = (await getHrefs({ locale })).workflows;

  const modelSet = await project.modelSet({ locale });

  const workflow = (await modelSet.workflow(Identifier.fromString(identifier)))
    .toMaybe()
    .extractNullable();

  if (workflow === null) {
    logger.debug("workflow %s does not exist, skipping delete", identifier);
    redirect(redirectHref);
  }

  await modelSet.deleteModel(workflow);

  redirect(redirectHref);
}
