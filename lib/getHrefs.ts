import { project } from "@/app/project";
import { Hrefs } from "@/lib/Hrefs";
import { Locale } from "@/lib/models";
import { getLocale } from "next-intl/server";

/**
 * Get an Hrefs instance on the server.
 */
export async function getHrefs(kwds?: { locale?: Locale }): Promise<Hrefs> {
  return new Hrefs({
    basePath: project.nextConfiguration.basePath,
    locale: kwds?.locale ?? ((await getLocale()) as Locale),
  });
}
