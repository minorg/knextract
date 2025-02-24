import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { CorporaDataTable } from "@/lib/components/CorporaDataTable";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Button } from "@/lib/components/ui/button";
import { getHrefs } from "@/lib/getHrefs";
import { Locale } from "@/lib/models";
import { routing } from "@/lib/routing";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

interface CorporaPageParams {
  locale: Locale;
}

export default async function CorporaPage({
  params: { locale },
}: {
  params: CorporaPageParams;
}) {
  unstable_setRequestLocale(locale);

  const corpora = (
    await (
      await project.modelSet({ locale })
    ).corpusStubs({
      query: { includeDeleted: false, type: "All" },
    })
  ).orDefault([]);

  const translations = await getTranslations("CorporaPage");

  return (
    <Layout>
      <div className="flex flex-row justify-between">
        <PageTitleHeading>{translations("Corpora")}</PageTitleHeading>
        <Button asChild variant="outline" title={translations("New corpus")}>
          <Link href={(await getHrefs()).newCorpus}>
            {translations("New corpus")}
          </Link>
        </Button>
      </div>
      <ClientProvidersServer>
        <CorporaDataTable corpora={corpora.map((corpus) => corpus.toJson())} />
      </ClientProvidersServer>
    </Layout>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: CorporaPageParams;
}): Promise<Metadata> {
  return (await PageMetadata.get({ locale })).corpora;
}

export function generateStaticParams(): CorporaPageParams[] {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  return routing.locales.map((locale) => ({
    locale,
  }));
}
