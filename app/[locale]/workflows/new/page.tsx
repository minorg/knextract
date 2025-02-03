import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { Layout } from "@/lib/components/Layout";
import { WorkflowEditor } from "@/lib/components/WorkflowEditor";
import { Locale } from "@/lib/models";
import { json } from "@/lib/models/impl";
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
            await (
              await modelSet.conceptSchemes({
                limit: null,
                offset: 0,
              })
            ).flatResolve()
          ).map(json.ConceptScheme.clone)}
          languageModels={(
            await (await modelSet.languageModelSpecifications()).flatResolve()
          )
            .filter(
              (machineLearningModel) =>
                machineLearningModel.type === "LanguageModel",
            )
            .map(json.LanguageModelSpecification.clone)}
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
