import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { CorpusEditor } from "@/lib/components/CorpusEditor";
import { Layout } from "@/lib/components/Layout";
import { Locale } from "@/lib/models";
import { routing } from "@/lib/routing";
import { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";

interface NewCorpusPageParams {
  locale: Locale;
}

export default async function NewCorpusPage({
  params: { locale },
}: {
  params: NewCorpusPageParams;
}) {
  unstable_setRequestLocale(locale);

  return (
    <Layout>
      <ClientProvidersServer>
        <CorpusEditor />
      </ClientProvidersServer>
    </Layout>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: NewCorpusPageParams;
}): Promise<Metadata> {
  return (await PageMetadata.get({ locale })).corpusNew;
}

export function generateStaticParams(): NewCorpusPageParams[] {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  return routing.locales.map((locale) => ({
    locale,
  }));
}
