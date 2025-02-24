import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { deleteDocument } from "@/lib/actions/deleteDocument";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { DeletionDialog } from "@/lib/components/DeletionDialog";
import { DocumentViewer } from "@/lib/components/DocumentViewer";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import {
  Identifier,
  Locale,
  UnevaluatedClaims,
  displayLabel,
  evaluateClaims,
} from "@/lib/models";
import { routing } from "@/lib/routing";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Metadata } from "next";
import {
  getLocale,
  getTranslations,
  unstable_setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import React from "react";

interface DocumentPageParams {
  documentIdentifier: string;
  locale: Locale;
}

export default async function DocumentPage({
  params: { documentIdentifier, locale },
}: {
  params: DocumentPageParams;
}) {
  unstable_setRequestLocale(locale);

  const modelSet = await project.modelSet({ locale });

  const document = (
    await modelSet.document(
      Identifier.fromString(decodeFileName(documentIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!document) {
    notFound();
  }
  const documentClaims = (
    await modelSet.claims({
      query: {
        documentIdentifier: document.identifier,
        type: "Document",
      },
    })
  ).orDefault([]);
  const translations = await getTranslations("DocumentPage");
  const url = document.url.extractNullable();

  let heading = (
    <>
      {" "}
      {translations("Document")}: <i>{displayLabel(document, { locale })}</i>
    </>
  );
  if (url !== null) {
    heading = <Link href={url}>{heading}</Link>;
  }

  return (
    <Layout>
      <div className="flex flex-row justify-between">
        <PageTitleHeading>{heading}</PageTitleHeading>
        {document.mutable ? (
          <ClientProvidersServer>
            <DeletionDialog
              deleteAction={deleteDocument}
              description={translations("DeletionDialog.Description")}
              identifier={Identifier.toString(document.identifier)}
              title={translations("DeletionDialog.Title")}
            />
          </ClientProvidersServer>
        ) : null}
      </div>
      <DocumentViewer
        document={document}
        documentClaims={
          evaluateClaims(documentClaims).extract() ??
          new UnevaluatedClaims({ claims: documentClaims })
        }
        workflows={(
          await modelSet.workflowStubs({
            query: { includeDeleted: false, type: "All" },
          })
        ).orDefault([])}
      />
    </Layout>
  );
}

export async function generateMetadata({
  params: { documentIdentifier, locale },
}: {
  params: DocumentPageParams;
}): Promise<Metadata> {
  const pageMetadata = await PageMetadata.get({ locale });

  if (!project.nextConfiguration.generatePageMetadata) {
    return pageMetadata.locale;
  }

  return (
    await (
      await project.modelSet({ locale })
    ).documentStub(Identifier.fromString(decodeFileName(documentIdentifier)))
  )
    .map((document) => pageMetadata.document(document))
    .orDefault({});
}

export async function generateStaticParams(): Promise<DocumentPageParams[]> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: DocumentPageParams[] = [];

  for (const locale of routing.locales) {
    for (const document of (
      await (
        await project.modelSet({ locale })
      ).documentStubs({
        limit: null,
        offset: 0,
        query: { includeDeleted: true, type: "All" },
      })
    ).orDefault([])) {
      staticParams.push({
        documentIdentifier: encodeFileName(
          Identifier.toString(document.identifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
