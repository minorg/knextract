import { project } from "@/app/project";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { DocumentAnnotations } from "@/lib/components/DocumentAnnotations";
import { Link } from "@/lib/components/Link";
import { Section } from "@/lib/components/Section";
import { syntaxHiglighterStyle } from "@/lib/components/syntaxHighlighterStyle";
import { getHrefs } from "@/lib/getHrefs";
import { Document, Identifier, Locale } from "@/lib/models";
import { json } from "@/lib/models/impl";
import { deduplicateAnnotations } from "@/lib/utilities/deduplicateAnnotations";
import { getLocale, getTranslations } from "next-intl/server";
import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight";

export async function DocumentViewer({
  document,
  includeAnnotations,
}: {
  document: Document;
  includeAnnotations: boolean;
}) {
  const annotations = includeAnnotations
    ? await Promise.all(
        deduplicateAnnotations(
          await (await document.annotations()).flatResolve(),
        ).map(json.Annotation.clone),
      )
    : [];
  const hrefs = await getHrefs();
  const html = document.html.extractNullable();
  const images = document.images;
  const modelSet = await project.modelSet({
    locale: (await getLocale()) as Locale,
  });
  const text = document.text.extractNullable();
  const memberOfCorpus: json.Corpus = (await document.memberOfCorpus.resolve())
    .map(json.Corpus.clone)
    .mapLeft(json.Corpus.missing)
    .extract();
  const translations = await getTranslations("DocumentViewer");

  return (
    <>
      {html ? (
        <Section title={`${translations("Document HTML")}`}>
          <SyntaxHighlighter
            data-testid="document-html"
            language="html"
            style={{ ...syntaxHiglighterStyle }}
            wrapLongLines
          >
            {html}
          </SyntaxHighlighter>
        </Section>
      ) : null}
      {text ? (
        <Section title={`${translations("Document text")}`}>
          <pre style={{ whiteSpace: "pre-wrap" }}>{text}</pre>
        </Section>
      ) : null}
      {images.length > 0 ? (
        <Section title={`${translations("Document images")}`}>
          <div className="flex flex-row gap-2">
            {images.map((image) => (
              <img
                alt={translations("Image of the document content")}
                height={image.heightPx}
                key={Identifier.toString(image.identifier)}
                src={image.url}
                style={{
                  maxHeight: "400px",
                  maxWidth: "400px",
                }}
                width={image.widthPx}
              />
            ))}
          </div>
        </Section>
      ) : null}
      <Section title={translations("Annotations")}>
        <ClientProvidersServer>
          <DocumentAnnotations
            annotations={annotations}
            annotationsEvaluation={(await document.evaluateAnnotations())
              .map(json.AnnotationsEvaluation.clone)
              .extractNullable()}
            document={json.Document.clone(document)}
            workflows={(
              await Promise.all(
                (
                  await modelSet.workflows({
                    query: { includeDeleted: false, type: "All" },
                  })
                )
                  [Symbol.iterator]()
                  .map(async (workflow) =>
                    (
                      await workflow.resolve()
                    )
                      .map(json.Workflow.clone)
                      .toMaybe()
                      .toList(),
                  ),
              )
            ).flat()}
          />
        </ClientProvidersServer>
      </Section>
      <Section title={translations("Member of corpus")}>
        <ul className="list-disc list-inside">
          <li key={memberOfCorpus.identifier}>
            <Link href={hrefs.corpus(memberOfCorpus)}>
              {memberOfCorpus.displayLabel}
            </Link>
          </li>
        </ul>
      </Section>
    </>
  );
}
