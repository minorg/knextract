"use server";

import { project } from "@/app/project";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { Identifier, Locale } from "@/lib/models";
import { redirect } from "next/navigation";

export async function deleteDocument({
  identifier,
  locale,
}: {
  identifier: string;
  locale: Locale;
}): Promise<void> {
  const redirectHref = (await getHrefs({ locale })).corpora;

  const modelSet = await project.modelSet({ locale });

  const document = (
    await modelSet.document(Identifier.fromString(identifier)).resolve()
  )
    .toMaybe()
    .extractNullable();

  if (document === null) {
    logger.debug("document %s does not exist, skipping delete", identifier);
    redirect(redirectHref);
  }

  if (!document.mutable) {
    logger.debug(
      "corpus %s is immutable, skipping delete",
      Identifier.toString(document.identifier),
    );
    redirect(redirectHref);
  }

  await modelSet.deleteModel(document);

  redirect(redirectHref);
}
