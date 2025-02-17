"use server";

import { project } from "@/app/project";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { Corpus, Identifier, Locale } from "@/lib/models";
import { redirect } from "next/navigation";

export async function addCorpus(
  {
    label,
    locale,
  }: {
    label: string;
    locale: Locale;
  },
  _formData: FormData,
): Promise<void> {
  const corpus = new Corpus({
    label,
    mutable: true,
  });

  logger.debug("adding corpus %s", Identifier.toString(corpus.identifier));
  await (await project.modelSet({ locale })).addModel(corpus);
  logger.debug("added corpus %s", Identifier.toString(corpus.identifier));

  redirect(
    (await getHrefs({ locale })).corpus({
      identifier: corpus.identifier,
    }),
  );
}
