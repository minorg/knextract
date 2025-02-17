"use server";

import { project } from "@/app/project";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { DocumentStub, Identifier, Locale } from "@/lib/models";
import { redirect } from "next/navigation";

export async function deleteCorpus({
  identifier,
  locale,
}: {
  identifier: string;
  locale: Locale;
}): Promise<void> {
  const redirectHref = (await getHrefs({ locale })).corpora;

  const modelSet = await project.modelSet({ locale });

  const corpus = (await modelSet.corpus(Identifier.fromString(identifier)))
    .toMaybe()
    .extractNullable();
  if (corpus === null) {
    logger.debug("corpus %s does not exist, skipping delete", identifier);
    redirect(redirectHref);
  }

  if (!corpus.mutable) {
    logger.debug(
      "corpus %s is immutable, skipping delete",
      Identifier.toString(corpus.identifier),
    );
    redirect(redirectHref);
  }

  await modelSet.deleteModel(corpus);

  for (const documentStub of (
    await modelSet.documentStubs({
      limit: null,
      offset: 0,
      query: {
        corpusIdentifier: corpus.identifier,
        includeDeleted: false,
        type: "MemberOfCorpus",
      },
    })
  )
    .mapLeft((error) => {
      logger.error("error getting corpus documents: %s", error.message);
      return [] as DocumentStub[];
    })
    .extract()) {
    logger.debug(
      "deleting corpus %s document %s",
      Identifier.toString(corpus.identifier),
      Identifier.toString(documentStub.identifier),
    );
    await modelSet.deleteModel({
      identifier: documentStub.identifier,
      type: "Document",
    });
    logger.debug(
      "deleted corpus %s document %s",
      Identifier.toString(corpus.identifier),
      Identifier.toString(documentStub.identifier),
    );
  }

  redirect(redirectHref);
}
