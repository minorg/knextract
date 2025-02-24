"use server";

import { project } from "@/app/project";
import { logger } from "@/lib/logger";
import { ConceptStub, Identifier, Locale } from "@/lib/models";

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
  concepts: readonly ReturnType<typeof ConceptStub.toJson>[];
}> {
  return {
    concepts: (
      await (
        await project.modelSet({ locale })
      ).conceptStubs({
        limit,
        offset,
        query: {
          conceptSchemeIdentifier: Identifier.fromString(
            conceptSchemeIdentifier,
          ),
          type: "InScheme",
        },
      })
    )
      .mapLeft((error) => {
        logger.warn("error getting concepts: %s", error.message);
        return [];
      })
      .map((conceptStubs) => conceptStubs.map(ConceptStub.toJson))
      .extract(),
  };
}
