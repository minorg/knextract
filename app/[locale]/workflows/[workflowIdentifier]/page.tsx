import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { deleteWorkflow } from "@/lib/actions/deleteWorkflow";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { DeletionDialog } from "@/lib/components/DeletionDialog";
import { Layout } from "@/lib/components/Layout";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { WorkflowViewer } from "@/lib/components/WorkflowViewer";
import { Identifier, Locale } from "@/lib/models";
import { routing } from "@/lib/routing";
import { encodeFileName } from "@kos-kit/next-utils";
import { decodeFileName } from "@kos-kit/next-utils/decodeFileName";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface WorkflowPageParams {
  locale: Locale;
  workflowIdentifier: string;
}

export default async function WorkflowPage({
  params: { locale, workflowIdentifier },
}: {
  params: WorkflowPageParams;
}) {
  unstable_setRequestLocale(locale);

  const modelSet = await project.modelSet({ locale });

  const workflow = (
    await modelSet
      .workflow(Identifier.fromString(decodeFileName(workflowIdentifier)))
      .resolve()
  )
    .toMaybe()
    .extractNullable();
  if (!workflow) {
    notFound();
  }

  const translations = await getTranslations("WorkflowPage");

  return (
    <Layout>
      <div className="flex flex-row justify-between">
        <PageTitleHeading>
          {translations("Workflow")}: {workflow.displayLabel}
        </PageTitleHeading>
        <div className="flex flex-row">
          <ClientProvidersServer>
            <DeletionDialog
              deleteAction={deleteWorkflow}
              description={translations("DeletionDialog.Description")}
              identifier={Identifier.toString(workflow.identifier)}
              title={translations("DeletionDialog.Title")}
            />
          </ClientProvidersServer>
        </div>
      </div>
      <WorkflowViewer workflow={workflow} />
    </Layout>
  );
}

export async function generateMetadata({
  params: { locale, workflowIdentifier },
}: {
  params: WorkflowPageParams;
}): Promise<Metadata> {
  const pageMetadata = await PageMetadata.get({ locale });

  if (!project.nextConfiguration.generatePageMetadata) {
    return pageMetadata.locale;
  }

  return (
    await (
      await project.modelSet({ locale })
    )
      .workflow(Identifier.fromString(decodeFileName(workflowIdentifier)))
      .resolve()
  )
    .map((workflow) => pageMetadata.workflow(workflow))
    .orDefault({});
}

export async function generateStaticParams(): Promise<WorkflowPageParams[]> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: WorkflowPageParams[] = [];

  for (const locale of routing.locales) {
    for (const workflow of await (await project.modelSet({ locale })).workflows(
      {
        query: { includeDeleted: true, type: "All" },
      },
    )) {
      staticParams.push({
        locale,
        workflowIdentifier: encodeFileName(
          Identifier.toString(workflow.identifier),
        ),
      });
    }
  }

  return staticParams;
}
