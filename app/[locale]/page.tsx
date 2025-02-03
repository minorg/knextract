import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { getHrefs } from "@/lib/getHrefs";
import { Locale } from "@/lib/models";
import { routing } from "@/lib/routing";
import { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

interface LocalePageParams {
  locale: Locale;
}

export default async function LocalePage({
  params: { locale },
}: { params: LocalePageParams }) {
  unstable_setRequestLocale(locale);
  redirect((await getHrefs()).corpora);
}

export async function generateMetadata({
  params: { locale },
}: {
  params: LocalePageParams;
}): Promise<Metadata> {
  return (await PageMetadata.get({ locale })).locale;
}

export function generateStaticParams(): LocalePageParams[] {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  return routing.locales.map((locale) => ({
    locale,
  }));
}
