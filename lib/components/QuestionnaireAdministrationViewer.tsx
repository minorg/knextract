import { ProcessViewer } from "@/lib/components/ProcessViewer";
import { QuestionAdministrationViewer } from "@/lib/components/QuestionAdministrationViewer";
import { QuestionnaireViewer } from "@/lib/components/QuestionnaireViewer";
import {
  ClaimProperty,
  QuestionnaireAdministration,
  QuestionnaireAdministrationSubProcesses,
} from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";

export async function QuestionnaireAdministrationViewer({
  claimProperties,
  questionnaireAdministration,
}: {
  claimProperties: readonly ClaimProperty[];
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
      renderSubProcesses={async (
        subProcesses: QuestionnaireAdministrationSubProcesses,
      ) =>
        subProcesses.questionAdministrations.map((questionAdministration) => ({
          title: translations("Question administration"),
          content: (
            <QuestionAdministrationViewer
              claimProperties={claimProperties}
              questionAdministration={questionAdministration}
            />
          ),
        }))
      }
    />
  );
}
