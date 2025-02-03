import { Hrefs } from "@/lib/Hrefs";
import { useClientConfiguration } from "@/lib/hooks/useClientConfiguration";
import { Locale } from "@/lib/models";
import { useLocale } from "next-intl";

export function useHrefs(): Hrefs {
  const clientConfiguration = useClientConfiguration();
  const locale = useLocale() as Locale;
  return new Hrefs({
    basePath: clientConfiguration.basePath,
    locale,
  });
}
