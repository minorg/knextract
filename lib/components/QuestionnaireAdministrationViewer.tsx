import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptSelectorViewer } from "@/lib/components/ConceptSelectorViewer";
import { ConceptsDataTable } from "@/lib/components/ConceptsDataTable";
import { DocumentAnnotationsDataTable } from "@/lib/components/DocumentClaimsDataTable";
import { ProcessViewer } from "@/lib/components/ProcessViewer";
import { PromptTemplateViewer } from "@/lib/components/PromptTemplateViewer";
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
      renderOutput={async () => {
        if (questionnaireAdministration.output.type === "Exception") {
          return [
            {
              content: questionnaireAdministration.output.message,
              title: translations("Exception"),
            },
          ];
        }

        return [{}];
      }}
      // [
      //   {
      //     title: translations("Annotations"),
      //     content: (
      //       <ClientProvidersServer>
      //         <DocumentAnnotationsDataTable
      //           annotations={
      //             await Promise.all(annotations.map(json.Annotation.clone))
      //           }
      //           annotationsEvaluation={null}
      //         />
      //       </ClientProvidersServer>
      //     ),
      //   },
      // ]}
      // renderSubProcesses={async () => {
      //   switch (conceptAnnotatorExecution.type) {
      //     case "EveryConceptAnnotatorExecution":
      //       return [];
      //     case "RecursiveConceptAnnotatorExecution": {
      //       return conceptAnnotatorExecution.subProcesses.map(
      //         (conceptAnnotatorExecution, conceptAnnotatorExecutionI) => ({
      //           title: `${translations("Concept annotator execution")} ${conceptAnnotatorExecutionI}`,
      //           content: (
      //             <ConceptAnnotatorExecutionViewer
      //               conceptAnnotatorExecution={conceptAnnotatorExecution}
      //             />
      //           ),
      //         }),
      //       );
      //     }
      //     case "LanguageModelConceptAnnotatorExecution": {
      //       const subProcesses = conceptAnnotatorExecution.subProcesses;
      //       const subProcessSections: {
      //         content: React.ReactElement;
      //         title: string;
      //       }[] = [];

      //       subProcesses.conceptSelection.ifJust((conceptSelection) => {
      //         subProcessSections.push({
      //           title: translations("Concept selection"),
      //           content: (
      //             <ConceptSelectionViewer conceptSelection={conceptSelection} />
      //           ),
      //         });
      //       });

      //       subProcesses.promptConstruction.ifJust((promptConstruction) => {
      //         subProcessSections.push({
      //           title: translations("Prompt construction"),
      //           content: (
      //             <PromptConstructionViewer
      //               promptConstruction={promptConstruction}
      //             />
      //           ),
      //         });
      //       });

      //       subProcesses.languageModelInvocation.ifJust(
      //         (languageModelInvocation) => {
      //           subProcessSections.push({
      //             title: translations("Language model invocation"),
      //             content: (
      //               <LanguageModelInvocationViewer
      //                 languageModelInvocation={languageModelInvocation}
      //               />
      //             ),
      //           });
      //         },
      //       );

      //       subProcesses.completionMessageProcessing.ifJust(
      //         (completionMessageProcessing) => {
      //           subProcessSections.push({
      //             title: translations("Completion message processing"),
      //             content: (
      //               <CompletionMessageProcessingViewer
      //                 completionMessageProcessing={completionMessageProcessing}
      //               />
      //             ),
      //           });
      //         },
      //       );

      //       return subProcessSections;
      //     }
      //   }
      // }}
    />
  );
}
