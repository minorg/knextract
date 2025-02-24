import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptSchemeConceptsDataTable } from "@/lib/components/ConceptSchemeConceptsDataTable";
import { KosResourceSections } from "@/lib/components/KosLabelSections";
import { Layout } from "@/lib/components/Layout";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Section } from "@/lib/components/Section";
import { Identifier, Locale } from "@/lib/models";
import { routing } from "@/lib/routing";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface ConceptSchemePageParams {
  conceptSchemeIdentifier: string;
  locale: Locale;
}

export default async function ConceptSchemePage({
  params: { conceptSchemeIdentifier: conceptSchemeIdentifierProp, locale },
}: {
  params: ConceptSchemePageParams;
}) {
  unstable_setRequestLocale(locale);

  const conceptSchemeIdentifier = Identifier.fromString(
    decodeFileName(conceptSchemeIdentifierProp),
  );
  const conceptScheme = (
    await (
      await project.modelSet({ locale })
    )
      .conceptScheme(conceptSchemeIdentifier)
      .resolve()
  )
    .toMaybe()
    .extractNullable();
  if (!conceptScheme) {
    notFound();
  }

  const topConcepts = await conceptScheme.topConcepts();

  const translations = await getTranslations("ConceptSchemePage");

  return (
    <Layout>
      <PageTitleHeading>
        {translations("Concept scheme")}: {conceptScheme.displayLabel}
      </PageTitleHeading>
      <KosResourceSections model={conceptScheme} />
      {topConcepts.length > 0 ? (
        <Section title={translations("Top concepts")}>
          <div className="flex flex-col gap-2">
            <ClientProvidersServer>
              <ConceptSchemeConceptsDataTable
                conceptsCount={await conceptScheme.conceptsCount()}
                conceptSchemeIdentifier={Identifier.toString(
                  conceptSchemeIdentifier,
                )}
              />
            </ClientProvidersServer>
          </div>
        </Section>
      ) : null}
    </Layout>
  );
}

export async function generateMetadata({
  params: { conceptSchemeIdentifier, locale },
}: {
  params: ConceptSchemePageParams;
}): Promise<Metadata> {
  const pageMetadata = await PageMetadata.get({ locale });

  if (!project.nextConfiguration.generatePageMetadata) {
    return pageMetadata.locale;
  }

  return (
    await (
      await project.modelSet({ locale })
    )
      .conceptScheme(
        Identifier.fromString(decodeFileName(conceptSchemeIdentifier)),
      )
      .resolve()
  )
    .map((conceptScheme) => pageMetadata.conceptScheme(conceptScheme))
    .orDefault({});
}

export async function generateStaticParams(): Promise<
  ConceptSchemePageParams[]
> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: ConceptSchemePageParams[] = [];

  for (const locale of routing.locales) {
    for await (const conceptScheme of await (
      await project.modelSet({ locale })
    ).conceptSchemes({ limit: null, offset: 0 })) {
      staticParams.push({
        conceptSchemeIdentifier: encodeFileName(
          Identifier.toString(conceptScheme.identifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
