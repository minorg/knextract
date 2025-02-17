"use server";

import { project } from "@/app/project";
import { logger } from "@/lib/logger";
import { DocumentStub, Identifier, Locale } from "@/lib/models";

export async function getCorpusDocuments({
  corpusIdentifier,
  limit,
  locale,
  offset,
}: {
  corpusIdentifier: string;
  limit: number;
  locale: Locale;
  offset: number;
}): Promise<{
  documents: ReturnType<DocumentStub["toJson"]>;
}> {
  return {
    documents: (
      await (
        await project.modelSet({ locale })
      ).documentStubs({
        limit,
        offset,
        query: {
          includeDeleted: false,
          corpusIdentifier: Identifier.fromString(corpusIdentifier),
          type: "MemberOfCorpus",
        },
      })
    )
      .mapLeft((error) => {
        logger.warn("error getting documents: %s", error.message);
        return [] as;
      })
      .map((documents) => documents.map((document) => document.toJson()))
      .extract(),
  };
}
