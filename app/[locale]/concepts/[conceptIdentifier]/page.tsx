import { project } from "@/app/project";
import { Hrefs } from "@/lib/Hrefs";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptsDataTable } from "@/lib/components/ConceptsDataTable";
import { KosResourceSections } from "@/lib/components/KosResourceSections";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Section } from "@/lib/components/Section";
import { getHrefs } from "@/lib/getHrefs";
import { Identifier, Locale, Note, SemanticRelation } from "@/lib/models";
import { json } from "@/lib/models/impl";
import { routing } from "@/lib/routing";
import { xsd } from "@/lib/vocabularies";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
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
}: {
  conceptSchemes: readonly json.ConceptScheme[];
  hrefs: Hrefs;
}) {
  return (
    <table className="w-full">
      <tbody>
        {conceptSchemes.map((conceptScheme) => (
          <tr key={conceptScheme.identifier}>
            <td>
              <Link
                href={hrefs.conceptScheme({
                  identifier: conceptScheme.identifier,
                })}
              >
                {conceptScheme.displayLabel}
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

  const concept = (
    await (
      await project.modelSet({ locale })
    )
      .concept(Identifier.fromString(decodeFileName(conceptIdentifier)))
      .resolve()
  )
    .toMaybe()
    .extractNullable();
  if (!concept) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("ConceptPage");

  const topConceptOf = (await (await concept.topConceptOf()).resolve()).map(
    (conceptScheme) =>
      conceptScheme
        .map(json.ConceptScheme.clone)
        .mapLeft(json.ConceptScheme.missing)
        .extract(),
  );
  const inSchemes = (await (await concept.inSchemes()).resolve())
    .map((conceptScheme) =>
      conceptScheme
        .map(json.ConceptScheme.clone)
        .mapLeft(json.ConceptScheme.missing)
        .extract(),
    )
    .filter(
      (inScheme) =>
        !topConceptOf.some(
          (topConceptOf) => topConceptOf.identifier === inScheme.identifier,
        ),
    );

  const notations = concept.notations;

  const noteTypeTranslations = await getTranslations("NoteTypes");
  const semanticRelationTypeTranslations = await getTranslations(
    "SemanticRelationTypes",
  );

  return (
    <Layout>
      <PageTitleHeading>
        {translations("Concept")}: {concept.displayLabel}
      </PageTitleHeading>
      <KosResourceSections model={concept} />
      {topConceptOf.length > 0 ? (
        <Section title={translations("Top of concept schemes")}>
          <ConceptSchemesTable conceptSchemes={topConceptOf} hrefs={hrefs} />
        </Section>
      ) : null}
      {inSchemes.length > 0 ? (
        <Section title={translations("In schemes")}>
          <ConceptSchemesTable conceptSchemes={inSchemes} hrefs={hrefs} />
        </Section>
      ) : null}
      {
        await Promise.all(
          Note.Types.map((noteType) => {
            const notes = concept.notes({ types: [noteType] });
            if (notes.length === 0) {
              return null;
            }
            return (
              <Section
                key={noteType.skosProperty.value}
                title={noteTypeTranslations(noteType.skosProperty.value as any)}
              >
                <table className="w-full">
                  <tbody>
                    {notes.map((note, noteI) => (
                      <tr key={noteI}>
                        <td>{note.literalForm.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            );
          }),
        )
      }
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
      {
        await Promise.all(
          SemanticRelation.Types.map(async (semanticRelationType) => {
            const semanticRelations = await concept.semanticRelations(
              semanticRelationType,
              {
                includeInverse: true,
              },
            );
            if (semanticRelations.length === 0) {
              return null;
            }
            return (
              <Section
                key={semanticRelationType.property.value}
                title={semanticRelationTypeTranslations(
                  semanticRelationType.property.value as any,
                )}
              >
                <ClientProvidersServer>
                  <ConceptsDataTable
                    concepts={
                      await Promise.all(
                        semanticRelations[Symbol.iterator]().map(
                          async (concept) =>
                            (await concept.resolve())
                              .map(json.Concept.clone)
                              .mapLeft(json.Concept.missing)
                              .extract(),
                        ),
                      )
                    }
                    pagination={{
                      pageIndex: 0,
                      pageSize: 10,
                    }}
                  />
                </ClientProvidersServer>
              </Section>
            );
          }),
        )
      }
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
    )
      .concept(Identifier.fromString(decodeFileName(conceptIdentifier)))
      .resolve()
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
    for (const concept of await (await project.modelSet({ locale })).concepts({
      limit: null,
      offset: 0,
    })) {
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
