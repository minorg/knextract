import { project } from "@/app/project";
import { Hrefs } from "@/lib/Hrefs";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptsDataTable } from "@/lib/components/ConceptsDataTable";
import { KosResourceLabelSections } from "@/lib/components/KosResourceLabelSections";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Section } from "@/lib/components/Section";
import { getHrefs } from "@/lib/getHrefs";
import {
  ConceptSchemeStub,
  ConceptStub,
  Identifier,
  Locale,
  conceptSemanticRelations,
  displayLabel,
  kosResourceNotes,
} from "@/lib/models";
import { routing } from "@/lib/routing";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { xsd } from "@tpluscode/rdf-ns-builders";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface ConceptPageParams {
  conceptIdentifier: string;
  locale: Locale;
}

function ConceptSchemesTable({
  conceptSchemes,
  hrefs,
  locale,
}: {
  conceptSchemes: readonly ConceptSchemeStub[];
  hrefs: Hrefs;
  locale: Locale;
}) {
  return (
    <table className="w-full">
      <tbody>
        {conceptSchemes.map((conceptScheme) => (
          <tr key={Identifier.toString(conceptScheme.identifier)}>
            <td>
              <Link
                href={hrefs.conceptScheme({
                  identifier: conceptScheme.identifier,
                })}
              >
                {displayLabel(conceptScheme, { locale })}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function ConceptPage({
  params: { conceptIdentifier, locale },
}: {
  params: ConceptPageParams;
}) {
  unstable_setRequestLocale(locale);

  const modelSet = await project.modelSet({ locale });

  const concept = (
    await modelSet.concept(
      Identifier.fromString(decodeFileName(conceptIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!concept) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("ConceptPage");

  const topConceptOf = (
    await modelSet.conceptSchemeStubs({
      limit: null,
      offset: 0,
      query: { conceptIdentifier: concept.identifier, type: "HasTopConcept" },
    })
  ).orDefault([]);

  const inSchemes = (
    await modelSet.conceptSchemeStubs({
      limit: null,
      offset: 0,
      query: { conceptIdentifier: concept.identifier, type: "HasConcept" },
    })
  )
    .orDefault([])
    .filter(
      (inScheme) =>
        !topConceptOf.some((topConceptOf) =>
          topConceptOf.identifier.equals(inScheme.identifier),
        ),
    );

  const notations = concept.notation;

  const notePropertyTranslations = await getTranslations("NoteProperties");
  const semanticRelationPropertyTranslations = await getTranslations(
    "SemanticRelationProperties",
  );

  return (
    <Layout>
      <PageTitleHeading>
        {translations("Concept")}: {displayLabel(concept, { locale })}
      </PageTitleHeading>
      <KosResourceLabelSections kosResource={concept} />
      {topConceptOf.length > 0 ? (
        <Section title={translations("Top of concept schemes")}>
          <ConceptSchemesTable
            conceptSchemes={topConceptOf}
            locale={locale}
            hrefs={hrefs}
          />
        </Section>
      ) : null}
      {inSchemes.length > 0 ? (
        <Section title={translations("In schemes")}>
          <ConceptSchemesTable
            conceptSchemes={inSchemes}
            locale={locale}
            hrefs={hrefs}
          />
        </Section>
      ) : null}
      {kosResourceNotes(concept).map(([noteProperty, notes]) => {
        if (notes.length === 0) {
          return null;
        }
        return (
          <Section
            key={Identifier.toString(noteProperty.identifier)}
            title={notePropertyTranslations(noteProperty.translationKey as any)}
          >
            <table className="w-full">
              <tbody>
                {notes.map((note, noteI) => (
                  <tr key={noteI}>
                    <td>{note.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        );
      })}
      {notations.length > 0 ? (
        <Section title={translations("Notations")}>
          <ul className="list-disc list-inside">
            {notations.map((notation, notationI) => (
              <li key={notationI}>
                {notation.value}
                {!notation.datatype.equals(xsd.string)
                  ? ` ${notation.datatype.value} `
                  : ""}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {conceptSemanticRelations(concept).map(
        ([semanticRelationProperty, semanticallyRelatedConcepts]) => {
          if (semanticallyRelatedConcepts.length === 0) {
            return null;
          }
          return (
            <Section
              key={Identifier.toString(semanticRelationProperty.identifier)}
              title={semanticRelationPropertyTranslations(
                semanticRelationProperty.translationKey as any,
              )}
            >
              <ClientProvidersServer>
                <ConceptsDataTable
                  concepts={semanticallyRelatedConcepts.map((concept) =>
                    ConceptStub.toJson(concept),
                  )}
                  pagination={{
                    pageIndex: 0,
                    pageSize: 10,
                  }}
                />
              </ClientProvidersServer>
            </Section>
          );
        },
      )}
    </Layout>
  );
}

export async function generateMetadata({
  params: { conceptIdentifier, locale },
}: {
  params: ConceptPageParams;
}): Promise<Metadata> {
  const pageMetadata = await PageMetadata.get({ locale });

  if (!project.nextConfiguration.generatePageMetadata) {
    return pageMetadata.locale;
  }

  return (
    await (
      await project.modelSet({ locale })
    ).conceptStub(Identifier.fromString(decodeFileName(conceptIdentifier)))
  )
    .map((concept) => pageMetadata.concept(concept))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<ConceptPageParams[]> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: ConceptPageParams[] = [];

  for (const locale of routing.locales) {
    for (const concept of (
      await (
        await project.modelSet({ locale })
      ).conceptStubs({
        limit: null,
        offset: 0,
        query: { type: "All" },
      })
    ).unsafeCoerce()) {
      staticParams.push({
        conceptIdentifier: encodeFileName(
          Identifier.toString(concept.identifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
