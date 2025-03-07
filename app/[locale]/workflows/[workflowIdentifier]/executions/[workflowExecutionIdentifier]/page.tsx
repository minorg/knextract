import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { WorkflowExecutionViewer } from "@/lib/components/WorkflowExecutionViewer";
import { getHrefs } from "@/lib/getHrefs";
import { Identifier, Locale, displayLabel } from "@/lib/models";
import { routing } from "@/lib/routing";
import { encodeFileName } from "@kos-kit/next-utils";
import { decodeFileName } from "@kos-kit/next-utils/decodeFileName";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import * as React from "react";

interface WorkflowExecutionPageParams {
  locale: Locale;
  workflowExecutionIdentifier: string;
  workflowIdentifier: string;
}

export default async function WorkflowExecutionPage({
  params: { locale, workflowExecutionIdentifier, workflowIdentifier },
}: {
  params: WorkflowExecutionPageParams;
}) {
  unstable_setRequestLocale(locale);

  const modelSet = await project.modelSet({ locale });

  const workflow = (
    await modelSet.workflow(
      Identifier.fromString(decodeFileName(workflowIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!workflow) {
    notFound();
  }

  const workflowExecution = (
    await modelSet.workflowExecution(
      Identifier.fromString(decodeFileName(workflowExecutionIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!workflowExecution) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("WorkflowExecutionPage");

  return (
    <Layout>
      <div className="flex flex-col">
        <PageTitleHeading>
          {translations("Workflow")}:{" "}
          <Link href={hrefs.workflow(workflow)}>
            {displayLabel(workflow, { locale })}
          </Link>
        </PageTitleHeading>
        <h2 className="text-lg">{translations("Execution")}</h2>
      </div>
      <WorkflowExecutionViewer
        modelSet={modelSet}
        workflow={workflow}
        workflowExecution={workflowExecution}
      />
    </Layout>
  );
}

export async function generateMetadata({
  params: { locale, workflowExecutionIdentifier, workflowIdentifier },
}: {
  params: WorkflowExecutionPageParams;
}): Promise<Metadata> {
  const pageMetadata = await PageMetadata.get({ locale });

  if (!project.nextConfiguration.generatePageMetadata) {
    return pageMetadata.locale;
  }

  const modelSet = await project.modelSet({ locale });

  const workflow = (
    await modelSet.workflowStub(
      Identifier.fromString(decodeFileName(workflowIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (workflow === null) {
    return {};
  }

  const workflowExecution = (
    await modelSet.workflowExecutionStub(
      Identifier.fromString(decodeFileName(workflowExecutionIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (workflowExecution === null) {
    return {};
  }

  return pageMetadata.workflowExecution({
    workflow,
    workflowExecution,
  });
}

export async function generateStaticParams(): Promise<
  WorkflowExecutionPageParams[]
> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: WorkflowExecutionPageParams[] = [];

  for (const locale of routing.locales) {
    const modelSet = await project.modelSet({ locale });

    for (const workflow of (
      await modelSet.workflowStubs({
        query: { includeDeleted: true, type: "All" },
      })
    ).unsafeCoerce()) {
      for (const execution of (
        await modelSet.workflowExecutionStubs({
          query: { workflowIdentifier: workflow.identifier, type: "Workflow" },
        })
      ).unsafeCoerce()) {
        staticParams.push({
          locale,
          workflowExecutionIdentifier: encodeFileName(
            Identifier.toString(execution.identifier),
          ),
          workflowIdentifier: encodeFileName(
            Identifier.toString(workflow.identifier),
          ),
        });
      }
    }
  }

  return staticParams;
}
