import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { WorkflowsDataTable } from "@/lib/components/WorkflowsDataTable";
import { Button } from "@/lib/components/ui/button";
import { getHrefs } from "@/lib/getHrefs";
import { Locale } from "@/lib/models";
import { json } from "@/lib/models/impl";
import { routing } from "@/lib/routing";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

interface WorkflowsPageParams {
  locale: Locale;
}

export default async function WorkflowsPage({
  params: { locale },
}: {
  params: WorkflowsPageParams;
}) {
  unstable_setRequestLocale(locale);

  const workflows = await (
    await (
      await project.modelSet({ locale })
    ).workflows({
      query: { includeDeleted: false, type: "All" },
    })
  ).flatResolve();

  const translations = await getTranslations("WorkflowsPage");

  return (
    <Layout>
      <div className="flex flex-row justify-between">
        <PageTitleHeading>{translations("Workflows")}</PageTitleHeading>
        <Button asChild variant="outline" title={translations("New workflow")}>
          <Link href={(await getHrefs()).newWorkflow}>
            {translations("New workflow")}
          </Link>
        </Button>
      </div>
      <ClientProvidersServer>
        <WorkflowsDataTable workflows={workflows.map(json.Workflow.clone)} />
      </ClientProvidersServer>
    </Layout>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: WorkflowsPageParams;
}): Promise<Metadata> {
  return (await PageMetadata.get({ locale })).workflows;
}

export function generateStaticParams(): WorkflowsPageParams[] {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  return routing.locales.map((locale) => ({
    locale,
  }));
}
