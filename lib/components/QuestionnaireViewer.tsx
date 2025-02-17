import { PromptTemplateLikeViewer } from "@/lib/components/PromptTemplateLikeViewer";
import { QuestionViewer } from "@/lib/components/QuestionViewer";
import { Section } from "@/lib/components/Section";
import { Identifier, Questionnaire } from "@/lib/models";
import { getTranslations } from "next-intl/server";

export async function QuestionnaireViewer({
  questionnaire,
}: { questionnaire: Questionnaire }) {
  const translations = await getTranslations("QuestionnaireViewer");

  return (
    <>
      {questionnaire.members.map((member) => {
        switch (member.type) {
          case "Instruction":
            return (
              <Section
                key={Identifier.toString(member.identifier)}
                title={translations("Instructions")}
              >
                <PromptTemplateLikeViewer
                  promptTemplateLike={member.promptMessage}
                />
              </Section>
            );
          default:
            return (
              <QuestionViewer
                key={Identifier.toString(member.identifier)}
                question={member}
              />
            );
        }
      })}
    </>
  );
}
