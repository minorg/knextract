import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { DocumentClaimsViewer } from "@/lib/components/DocumentClaimsViewer";
import { Link } from "@/lib/components/Link";
import { Section } from "@/lib/components/Section";
import { syntaxHiglighterStyle } from "@/lib/components/syntaxHighlighterStyle";
import { getHrefs } from "@/lib/getHrefs";
import {
  ClaimProperty,
  Document,
  DocumentClaims,
  Identifier,
  Locale,
  WorkflowStub,
  displayLabel,
  stubify,
} from "@/lib/models";
import { getLocale, getTranslations } from "next-intl/server";
import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight";

export async function DocumentViewer({
  claimProperties,
  document,
  documentClaims,
  workflows,
}: {
  claimProperties: readonly ClaimProperty[];
  document: Document;
  documentClaims: DocumentClaims | null;
  workflows: readonly WorkflowStub[];
}) {
  const hrefs = await getHrefs();
  const html = document.textualEntities.find(
    (textualEntity) =>
      textualEntity.encodingType.value ===
      "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml",
  )?.literalForm;
  const images = document.images;
  const locale = (await getLocale()) as Locale;
  const text = document.textualEntities.find(
    (textualEntity) =>
      textualEntity.encodingType.value ===
      "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
  )?.literalForm;
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
      {documentClaims !== null ? (
        <Section title={translations("Claims")}>
          <ClientProvidersServer>
            <DocumentClaimsViewer
              claimProperties={claimProperties.map((claimProperty) =>
                claimProperty.toJson(),
              )}
              document={stubify(document).toJson()}
              documentClaims={documentClaims?.toJson()}
              workflows={workflows.map((workflow) => workflow.toJson())}
            />
          </ClientProvidersServer>
        </Section>
      ) : null}
      <Section title={translations("Member of corpus")}>
        <ul className="list-disc list-inside">
          <li key={Identifier.toString(document.memberOfCorpus.identifier)}>
            <Link href={hrefs.corpus(document.memberOfCorpus)}>
              {displayLabel(document.memberOfCorpus, { locale })}
            </Link>
          </li>
        </ul>
      </Section>
    </>
  );
}
