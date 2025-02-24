import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { Layout } from "@/lib/components/Layout";
import { WorkflowEditor } from "@/lib/components/WorkflowEditor";
import { ConceptSchemeStub, Locale } from "@/lib/models";
import { routing } from "@/lib/routing";
import { Metadata } from "next";

interface NewWorkflowPageParams {
  locale: Locale;
}

export default async function NewWorkflowPage({
  params: { locale },
}: {
  params: NewWorkflowPageParams;
}) {
  const modelSet = await project.modelSet({ locale });

  return (
    <Layout>
      <ClientProvidersServer>
        <WorkflowEditor
          conceptSchemes={(
            await modelSet.conceptSchemeStubs({
              limit: null,
              offset: 0,
              query: { type: "All" },
            })
          )
            .unsafeCoerce()
            .map((conceptScheme) => ConceptSchemeStub.toJson(conceptScheme))}
          languageModelSpecifications={(
            await modelSet.languageModelSpecificationStubs()
          )
            .unsafeCoerce()
            .map((languageModelSpecification) =>
              languageModelSpecification.toJson(),
            )}
        />
      </ClientProvidersServer>
    </Layout>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: NewWorkflowPageParams;
}): Promise<Metadata> {
  return (await PageMetadata.get({ locale })).workflowNew;
}

export function generateStaticParams(): NewWorkflowPageParams[] {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  return routing.locales.map((locale) => ({
    locale,
  }));
}
