import { ProcessViewer } from "@/lib/components/ProcessViewer";
import { QuestionnaireViewer } from "@/lib/components/QuestionnaireViewer";
import { QuestionnaireAdministration } from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";

export async function QuestionnaireAdministrationViewer({
  questionnaireAdministration,
}: {
  questionnaireAdministration: QuestionnaireAdministration;
}) {
  const translations = await getTranslations(
    "QuestionnaireAdministrationViewer",
  );
  return (
    <ProcessViewer
      process={questionnaireAdministration}
      renderInput={async () => [
        {
          title: translations("Questionnaire"),
          content: (
            <QuestionnaireViewer
              questionnaire={questionnaireAdministration.input.questionnaire}
            />
          ),
        },
      ]}
    />
  );
}
