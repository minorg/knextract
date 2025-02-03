"use server";

import { project } from "@/app/project";
import { logger } from "@/lib/logger";
import { Identifier, Locale } from "@/lib/models";
import { json } from "@/lib/models/impl";

export async function getConceptSchemeConcepts({
  conceptSchemeIdentifier,
  limit,
  locale,
  offset,
}: {
  conceptSchemeIdentifier: string;
  locale: Locale;
  limit: number;
  offset: number;
}): Promise<{
  concepts: json.Concept[];
}> {
  const modelSet = await project.modelSet({ locale });

  const conceptScheme = (
    await modelSet
      .conceptScheme(Identifier.fromString(conceptSchemeIdentifier))
      .resolve()
  )
    .toMaybe()
    .extractNullable();
  if (!conceptScheme) {
    logger.warn("no such concept scheme: %s", conceptSchemeIdentifier);
    return { concepts: [] };
  }

  const concepts: json.Concept[] = await Promise.all(
    (await (await conceptScheme.concepts({ limit, offset })).resolve()).map(
      (concept) =>
        concept.map(json.Concept.clone).mapLeft(json.Concept.missing).extract(),
    ),
  );

  return {
    concepts,
  };
}
