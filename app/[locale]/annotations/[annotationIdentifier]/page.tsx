import { project } from "@/app/project";
import { Hrefs } from "@/lib/Hrefs";
import { PageMetadata } from "@/lib/PageMetadata";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Section } from "@/lib/components/Section";
import { getHrefs } from "@/lib/getHrefs";
import { Identifier, Locale } from "@/lib/models";
import { json } from "@/lib/models/impl";
import { routing } from "@/lib/routing";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import invariant from "ts-invariant";

interface AnnotationPageParams {
  annotationIdentifier: string;
  locale: Locale;
}

function ConceptPath({
  conceptPath,
  depth,
  hrefs,
}: {
  conceptPath: readonly json.Concept[];
  depth: number;
  hrefs: Hrefs;
}) {
  invariant(conceptPath.length > 0);
  const headConcept = conceptPath[0];
  return (
    <li>
      <Link
        href={hrefs.concept({
          identifier: headConcept.identifier,
        })}
      >
        {headConcept.displayLabel}
      </Link>
      {conceptPath.length > 1 ? (
        <ul className={`list-disc list-inside ml-${(depth + 1) * 2}`}>
          <ConceptPath
            conceptPath={conceptPath.slice(1)}
            depth={depth + 1}
            hrefs={hrefs}
          />
        </ul>
      ) : null}
    </li>
  );
}

export default async function AnnotationPage({
  params: { annotationIdentifier, locale },
}: {
  params: AnnotationPageParams;
}) {
  unstable_setRequestLocale(locale);

  const annotation = (
    await (
      await project.modelSet({ locale })
    )
      .annotation(Identifier.fromString(decodeFileName(annotationIdentifier)))
      .resolve()
  )
    .toMaybe()
    .extractNullable();
  if (!annotation) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("AnnotationPage");

  const conceptPath =
    annotation.type === "ConceptAnnotation"
      ? await Promise.all(
          (await annotation.object.resolve()).map((concept) =>
            concept
              .map(json.Concept.clone)
              .mapLeft(json.Concept.missing)
              .extract(),
          ),
        )
      : undefined;
  const document = (await annotation.subject.resolve())
    .map(json.Document.clone)
    .mapLeft(json.Document.missing)
    .extract();
  const outputOf = await (await annotation.outputOf()).flatResolve();

  return (
    <Layout>
      <PageTitleHeading>{translations("Annotation")}</PageTitleHeading>
      <Section title={translations("Type")}>
        {annotation.gold ? translations("Gold") : translations("Inferred")}
      </Section>
      {conceptPath ? (
        <Section title={translations("Concept path")}>
          <ul className="list-disc list-inside">
            <ConceptPath conceptPath={conceptPath} depth={0} hrefs={hrefs} />
          </ul>
        </Section>
      ) : null}
      <Section title={translations("Document")}>
        <Link
          href={hrefs.document({
            identifier: document.identifier,
          })}
        >
          {document.displayLabel}
        </Link>
      </Section>
      {outputOf.length > 0 ? (
        <Section title={translations("Output of")}>
          <ul className="list list-disc list-inside">
            {outputOf.map((workflowExecution) => (
              <li key={Identifier.toString(workflowExecution.identifier)}>
                <Link
                  href={hrefs.workflowExecution({
                    workflowIdentifier:
                      workflowExecution.input.workflow.identifier,
                    workflowExecutionIdentifier: workflowExecution.identifier,
                  })}
                >
                  {translations("Workflow execution")}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </Layout>
  );
}

export async function generateMetadata({
  params: { annotationIdentifier, locale },
}: {
  params: AnnotationPageParams;
}): Promise<Metadata> {
  const pageMetadata = await PageMetadata.get({ locale });

  if (!project.nextConfiguration.generatePageMetadata) {
    return pageMetadata.locale;
  }

  return (
    await (
      await project.modelSet({ locale })
    )
      .annotation(Identifier.fromString(decodeFileName(annotationIdentifier)))
      .resolve()
  )
    .map((annotation) => pageMetadata.annotation(annotation))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<AnnotationPageParams[]> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: AnnotationPageParams[] = [];

  for (const locale of routing.locales) {
    for (const annotation of await (
      await project.modelSet({ locale })
    ).annotations({
      query: { type: "All" },
    })) {
      staticParams.push({
        annotationIdentifier: encodeFileName(
          Identifier.toString(annotation.identifier),
        ),
        locale: locale,
      });
    }
  }

  return staticParams;
}
