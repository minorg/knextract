import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { deleteCorpus } from "@/lib/actions/deleteCorpus";
import { AnnotateCorpusForm } from "@/lib/components/AnnotateCorpusForm";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { CorpusDocumentsDataTable } from "@/lib/components/CorpusDocumentsDataTable";
import { DeletionDialog } from "@/lib/components/DeletionDialog";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { getHrefs } from "@/lib/getHrefs";
import { Identifier, Locale, displayLabel, stubify } from "@/lib/models";
import { routing } from "@/lib/routing";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Upload } from "lucide-react";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface CorpusPageParams {
  corpusIdentifier: string;
  locale: Locale;
}

export default async function CorpusPage({
  params: { corpusIdentifier: corpusIdentifierProp, locale },
}: {
  params: CorpusPageParams;
}) {
  unstable_setRequestLocale(locale);

  const modelSet = await project.modelSet({ locale });

  const corpusIdentifier = Identifier.fromString(
    decodeFileName(corpusIdentifierProp),
  );
  const corpus = (await modelSet.corpus(corpusIdentifier))
    .toMaybe()
    .extractNullable();
  if (!corpus) {
    notFound();
  }

  const translations = await getTranslations("CorpusPage");

  return (
    <Layout>
      <div className="flex flex-row justify-between">
        <PageTitleHeading>
          {translations("Corpus")}: {displayLabel(corpus, { locale })}
        </PageTitleHeading>
        <div className="flex flex-row items-center gap-2">
          <ClientProvidersServer>
            <AnnotateCorpusForm
              claimProperties={(await modelSet.claimProperties())
                .orDefault([])
                .map((claimProperty) => claimProperty.toJson())}
              corpus={stubify(corpus).toJson()}
              workflows={(
                await modelSet.workflowStubs({
                  query: { includeDeleted: false, type: "All" },
                })
              )
                .orDefault([])
                .map((workflow) => workflow.toJson())}
            />
          </ClientProvidersServer>
          {corpus.mutable ? (
            <>
              <Link
                href={(await getHrefs()).uploadDocument(corpus)}
                title={translations("Upload document")}
              >
                <Upload className="h-6 w-6" />
              </Link>
              <ClientProvidersServer>
                <DeletionDialog
                  deleteAction={deleteCorpus}
                  description={translations("DeletionDialog.Description")}
                  identifier={Identifier.toString(corpus.identifier)}
                  title={translations("DeletionDialog.Title")}
                />
              </ClientProvidersServer>
            </>
          ) : null}
        </div>
      </div>
      <ClientProvidersServer>
        <CorpusDocumentsDataTable
          corpusIdentifier={Identifier.toString(corpusIdentifier)}
          documentsCount={(
            await modelSet.documentsCount({
              corpusIdentifier: corpusIdentifier,
              includeDeleted: false,
              type: "MemberOfCorpus",
            })
          ).orDefault(0)}
        />
      </ClientProvidersServer>
    </Layout>
  );
}

export async function generateMetadata({
  params: { corpusIdentifier, locale },
}: {
  params: CorpusPageParams;
}): Promise<Metadata> {
  const pageMetadata = await PageMetadata.get({ locale });

  if (!project.nextConfiguration.generatePageMetadata) {
    return pageMetadata.locale;
  }

  return (
    await (
      await project.modelSet({ locale })
    ).corpusStub(Identifier.fromString(decodeFileName(corpusIdentifier)))
  )
    .map((corpus) => pageMetadata.corpus(corpus))
    .orDefault({});
}

export async function generateStaticParams(): Promise<CorpusPageParams[]> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: CorpusPageParams[] = [];

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
