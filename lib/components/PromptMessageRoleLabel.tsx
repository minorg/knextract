import { PromptMessage } from "@/lib/models";
import { getTranslations } from "next-intl/server";

export async function PromptMessageRoleLabel({
  promptMessageRole,
}: { promptMessageRole: PromptMessage["role"] }) {
  const translations = await getTranslations("PromptMessageRoleLabel");

  switch (promptMessageRole.value) {
    case "http://purl.archive.org/purl/knextract/cbox#_Role_AI":
      return translations("AI");
    case "http://purl.archive.org/purl/knextract/cbox#_Role_Human":
      return translations("Human");
    case "http://purl.archive.org/purl/knextract/cbox#_Role_System":
      return translations("System");
  }
}
