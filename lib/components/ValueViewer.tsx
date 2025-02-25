import { Hrefs } from "@/lib/Hrefs";
import { Link } from "@/lib/components/Link";
import { Locale, Value, displayLabel } from "@/lib/models";

export function ValueViewer({
  hrefs,
  locale,
  value,
}: {
  hrefs: Hrefs;
  locale: Locale;
  value: Value;
}) {
  switch (value.type) {
    case "BooleanValue":
    case "RealValue":
    case "TextValue":
      return value.value.toString();
    case "CategoricalValue":
      return (
        <Link href={hrefs.concept(value.value)}>
          {displayLabel(value.value, { locale })}
        </Link>
      );
  }
}
