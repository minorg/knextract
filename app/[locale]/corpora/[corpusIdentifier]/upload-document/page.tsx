import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { uploadDocument } from "@/lib/actions/uploadDocument";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { Layout } from "@/lib/components/Layout";
import { MultiUploader } from "@/lib/components/MultiUploader";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Identifier, Locale, displayLabel } from "@/lib/models";
import { routing } from "@/lib/routing";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import mime from "mime";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Accept } from "react-dropzone";

const accept: Accept = [
  "application/pdf",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/html",
  "text/plain",
  "text/rtf",
].reduce(
  (accept, mimeType) => {
    accept[mimeType] = [...(mime.getAllExtensions(mimeType) ?? new Set())].map(
      (fileExtension) => `.${fileExtension}`,
    );
    return accept;
  },
  {} as Record<string, string[]>,
);

interface UploadDocumentPageParams {
  corpusIdentifier: string;
  locale: Locale;
}

export default async function UploadDocumentPage({
  params: { corpusIdentifier: corpusIdentifierProp, locale },
}: {
  params: UploadDocumentPageParams;
}) {
  unstable_setRequestLocale(locale);

  const corpusIdentifier = Identifier.fromString(
    decodeFileName(corpusIdentifierProp),
  );
  const corpus = (
    await (await project.modelSet({ locale })).corpus(corpusIdentifier)
  )
    .toMaybe()
    .extractNullable();
  if (!corpus) {
    notFound();
  }

  const translations = await getTranslations("UploadDocumentPage");

  return (
    <Layout>
      <PageTitleHeading>
        {displayLabel(corpus, { locale })}: {translations("Upload document")}
      </PageTitleHeading>
      <ClientProvidersServer>
        <MultiUploader
          accept={accept}
          hiddenFormFields={{
            corpusIdentifier: Identifier.toString(corpusIdentifier),
          }}
          metadataFormFields={{ title: true }}
          uploadAction={uploadDocument}
        />
      </ClientProvidersServer>
    </Layout>
  );
}

export async function generateMetadata({
  params: { corpusIdentifier, locale },
}: {
  params: UploadDocumentPageParams;
}): Promise<Metadata> {
  if (!project.nextConfiguration.generateStaticParams) {
    return {};
  }

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await (
      await project.modelSet({ locale })
    ).corpusStub(Identifier.fromString(decodeFileName(corpusIdentifier)))
  )
    .map((corpus) => pageMetadata.corpusUploadDocument(corpus))
    .orDefault({});
}

export async function generateStaticParams(): Promise<
  UploadDocumentPageParams[]
> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: UploadDocumentPageParams[] = [];

  for (const locale of routing.locales) {
    for (const corpus of (
      await (
        await project.modelSet({ locale })
      ).corpusStubs({
        query: { includeDeleted: true, type: "All" },
      })
    ).unsafeCoerce()) {
      staticParams.push({
        corpusIdentifier: encodeFileName(
          Identifier.toString(corpus.identifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
