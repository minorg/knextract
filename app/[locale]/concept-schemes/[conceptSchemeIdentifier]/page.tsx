import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptSchemeConceptsDataTable } from "@/lib/components/ConceptSchemeConceptsDataTable";
import { KosResourceLabelSections } from "@/lib/components/KosResourceLabelSections";
import { Layout } from "@/lib/components/Layout";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Section } from "@/lib/components/Section";
import { Identifier, Locale, displayLabel } from "@/lib/models";
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
  const modelSet = await project.modelSet({ locale });
  const conceptScheme = (await modelSet.conceptScheme(conceptSchemeIdentifier))
    .toMaybe()
    .extractNullable();
  if (!conceptScheme) {
    notFound();
  }

  const conceptsCount = (
    await modelSet.conceptsCount({
      conceptSchemeIdentifier: conceptScheme.identifier,
      type: "TopConceptOf",
    })
  ).orDefault(0);
  const topConcepts = (
    await modelSet.conceptStubs({
      limit: null,
      offset: 0,
      query: {
        conceptSchemeIdentifier: conceptScheme.identifier,
        type: "TopConceptOf",
      },
    })
  ).orDefault([]);

  const translations = await getTranslations("ConceptSchemePage");

  return (
    <Layout>
      <PageTitleHeading>
        {translations("Concept scheme")}:{" "}
        {displayLabel(conceptScheme, { locale })}
      </PageTitleHeading>
      <KosResourceLabelSections kosResource={conceptScheme} />
      {topConcepts.length > 0 ? (
        <Section title={translations("Top concepts")}>
          <div className="flex flex-col gap-2">
            <ClientProvidersServer>
              <ConceptSchemeConceptsDataTable
                conceptsCount={conceptsCount}
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
    ).conceptSchemeStub(
      Identifier.fromString(decodeFileName(conceptSchemeIdentifier)),
    )
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
    for (const conceptScheme of (
      await (
        await project.modelSet({ locale })
      ).conceptSchemeStubs({ limit: null, offset: 0, query: { type: "All" } })
    ).unsafeCoerce()) {
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
