import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptSchemesDataTable } from "@/lib/components/ConceptSchemesDataTable";
import { Layout } from "@/lib/components/Layout";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Locale } from "@/lib/models";
import { json } from "@/lib/models/impl";
import { routing } from "@/lib/routing";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

interface ConceptSchemesPageParams {
  locale: Locale;
}

export default async function ConceptSchemesPage({
  params: { locale },
}: {
  params: ConceptSchemesPageParams;
}) {
  unstable_setRequestLocale(locale);

  const conceptSchemes = await (
    await (
      await project.modelSet({ locale })
    ).conceptSchemes({
      limit: null,
      offset: 0,
    })
  ).flatResolve();

  const translations = await getTranslations("ConceptSchemesPage");

  return (
    <Layout>
      <PageTitleHeading>{translations("Concept schemes")}</PageTitleHeading>
      <ClientProvidersServer>
        <ConceptSchemesDataTable
          conceptSchemes={conceptSchemes.map(json.ConceptScheme.clone)}
        />
      </ClientProvidersServer>
    </Layout>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: ConceptSchemesPageParams;
}): Promise<Metadata> {
  return (await PageMetadata.get({ locale })).conceptSchemes;
}

export function generateStaticParams(): ConceptSchemesPageParams[] {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  return routing.locales.map((locale) => ({
    locale,
  }));
}
