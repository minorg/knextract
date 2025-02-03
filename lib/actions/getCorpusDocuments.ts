"use server";

import { project } from "@/app/project";
import { logger } from "@/lib/logger";
import { Identifier, Locale } from "@/lib/models";
import { json } from "@/lib/models/impl";

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
  documents: json.Document[];
}> {
  const modelSet = await project.modelSet({ locale });

  const corpus = (
    await modelSet.corpus(Identifier.fromString(corpusIdentifier)).resolve()
  )
    .toMaybe()
    .extractNullable();
  if (!corpus) {
    logger.warn("no such corpus: %s", corpusIdentifier);
    return { documents: [] };
  }

  const documents: json.Document[] = (
    await (
      await corpus.documents({ includeDeleted: false, limit, offset })
    ).resolve()
  ).map((document) =>
    document.map(json.Document.clone).mapLeft(json.Document.missing).extract(),
  );

  return {
    documents,
  };
}
