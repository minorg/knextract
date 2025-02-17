import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptSelectorViewer } from "@/lib/components/ConceptSelectorViewer";
import { ConceptsDataTable } from "@/lib/components/ConceptsDataTable";
import { DocumentAnnotationsDataTable } from "@/lib/components/DocumentAnnotationsDataTable";
import { ProcessViewer } from "@/lib/components/ProcessViewer";
import { PromptTemplateViewer } from "@/lib/components/PromptTemplateViewer";
import { PromptViewer } from "@/lib/components/PromptViewer";
import { getTranslations } from "next-intl/server";
import React from "react";

async function CompletionMessageProcessingViewer({
  completionMessageProcessing,
}: {
  completionMessageProcessing: LanguageModelConceptAnnotatorExecution.CompletionMessageProcessing;
}) {
  const translations = await getTranslations(
    "CompletionMessageProcessingViewer",
  );
  return (
    <ProcessViewer
      process={completionMessageProcessing}
      renderInput={async (completionMessage) => [
        {
          title: translations("Completion message"),
          content: (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {completionMessage.literalForm}
            </pre>
          ),
        },
      ]}
      renderOutput={async (annotations) => [
        {
          title: translations("Annotations"),
          content: (
            <ClientProvidersServer>
              <DocumentAnnotationsDataTable
                annotations={
                  await Promise.all(annotations.map(json.Annotation.clone))
                }
                annotationsEvaluation={null}
              />
            </ClientProvidersServer>
          ),
        },
      ]}
      renderSubProcesses={async () => []}
    />
  );
}

async function ConceptSelectionViewer({
  conceptSelection,
}: {
  conceptSelection: LanguageModelConceptAnnotatorExecution.ConceptSelection;
}) {
  const translations = await getTranslations("ConceptSelectionViewer");

  return (
    <ProcessViewer
      process={conceptSelection}
      renderInput={async (conceptSelector) => [
        {
          title: translations("Concept selector"),
          content: <ConceptSelectorViewer conceptSelector={conceptSelector} />,
        },
      ]}
      renderOutput={async (concepts) => [
        {
          title: translations("Concepts"),
          content: (
            <ClientProvidersServer>
              <ConceptsDataTable
                concepts={
                  await Promise.all(
                    (await concepts.flatResolve()).map(json.Concept.clone),
                  )
                }
                pagination={{ pageIndex: 0, pageSize: 10 }}
              />
            </ClientProvidersServer>
          ),
        },
      ]}
      renderSubProcesses={async () => []}
    />
  );
}

async function LanguageModelInvocationViewer({
  languageModelInvocation,
}: {
  languageModelInvocation: LanguageModelConceptAnnotatorExecution.LanguageModelInvocation;
}) {
  const translations = await getTranslations("LanguageModelInvocationViewer");

  return (
    <ProcessViewer
      process={languageModelInvocation}
      renderInput={async (prompt) => [
        {
          title: translations("Prompt"),
          content: <PromptViewer prompt={prompt} />,
        },
      ]}
      renderOutput={async (completionMessage) => [
        {
          title: translations("Completion message"),
          content: (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {completionMessage.literalForm}
            </pre>
          ),
        },
      ]}
      renderSubProcesses={async () => []}
    />
  );
}

async function PromptConstructionViewer({
  promptConstruction,
}: {
  promptConstruction: LanguageModelConceptAnnotatorExecution.PromptConstruction;
}) {
  const translations = await getTranslations("PromptConstructionViewer");

  return (
    <ProcessViewer
      process={promptConstruction}
      renderInput={async ({ conceptList, promptTemplate }) => [
        {
          title: translations("Concepts"),
          content: (
            <ClientProvidersServer>
              <ConceptsDataTable
                concepts={
                  await Promise.all(
                    (await conceptList.flatResolve()).map(json.Concept.clone),
                  )
                }
                pagination={{ pageIndex: 0, pageSize: 10 }}
              />
            </ClientProvidersServer>
          ),
        },
        ...promptTemplate
          .map((promptTemplate) => ({
            title: translations("Prompt template"),
            content: <PromptTemplateViewer promptTemplate={promptTemplate} />,
          }))
          .toList(),
      ]}
      renderOutput={async (prompt) => [
        {
          title: translations("Prompt"),
          content: <PromptViewer prompt={prompt} />,
        },
      ]}
      renderSubProcesses={async () => []}
    />
  );
}

export async function QuestionnaireAdministration({
  conceptAnnotatorExecution,
}: {
  conceptAnnotatorExecution: ConceptAnnotatorExecution;
}) {
  const translations = await getTranslations("ConceptAnnotatorExecutionViewer");

  return (
    <ProcessViewer<
      ConceptAnnotatorExecution["input"],
      readonly Annotation[],
      ConceptAnnotatorExecution["subProcesses"]
    >
      process={conceptAnnotatorExecution}
      renderInput={async ({ conceptSelector, parameters }) => [
        {
          title: translations("Concept selector"),
          content: <ConceptSelectorViewer conceptSelector={conceptSelector} />,
        },
        {
          title: translations("Concept annotator parameters"),
          content: (
            <ConceptAnnotatorParametersViewer
              conceptAnnotatorParameters={parameters}
            />
          ),
        },
      ]}
      renderOutput={async (annotations) => [
        {
          title: translations("Annotations"),
          content: (
            <ClientProvidersServer>
              <DocumentAnnotationsDataTable
                annotations={
                  await Promise.all(annotations.map(json.Annotation.clone))
                }
                annotationsEvaluation={null}
              />
            </ClientProvidersServer>
          ),
        },
      ]}
      renderSubProcesses={async () => {
        switch (conceptAnnotatorExecution.type) {
          case "EveryConceptAnnotatorExecution":
            return [];
          case "RecursiveConceptAnnotatorExecution": {
            return conceptAnnotatorExecution.subProcesses.map(
              (conceptAnnotatorExecution, conceptAnnotatorExecutionI) => ({
                title: `${translations("Concept annotator execution")} ${conceptAnnotatorExecutionI}`,
                content: (
                  <ConceptAnnotatorExecutionViewer
                    conceptAnnotatorExecution={conceptAnnotatorExecution}
                  />
                ),
              }),
            );
          }
          case "LanguageModelConceptAnnotatorExecution": {
            const subProcesses = conceptAnnotatorExecution.subProcesses;
            const subProcessSections: {
              content: React.ReactElement;
              title: string;
            }[] = [];

            subProcesses.conceptSelection.ifJust((conceptSelection) => {
              subProcessSections.push({
                title: translations("Concept selection"),
                content: (
                  <ConceptSelectionViewer conceptSelection={conceptSelection} />
                ),
              });
            });

            subProcesses.promptConstruction.ifJust((promptConstruction) => {
              subProcessSections.push({
                title: translations("Prompt construction"),
                content: (
                  <PromptConstructionViewer
                    promptConstruction={promptConstruction}
                  />
                ),
              });
            });

            subProcesses.languageModelInvocation.ifJust(
              (languageModelInvocation) => {
                subProcessSections.push({
                  title: translations("Language model invocation"),
                  content: (
                    <LanguageModelInvocationViewer
                      languageModelInvocation={languageModelInvocation}
                    />
                  ),
                });
              },
            );

            subProcesses.completionMessageProcessing.ifJust(
              (completionMessageProcessing) => {
                subProcessSections.push({
                  title: translations("Completion message processing"),
                  content: (
                    <CompletionMessageProcessingViewer
                      completionMessageProcessing={completionMessageProcessing}
                    />
                  ),
                });
              },
            );

            return subProcessSections;
          }
        }
      }}
    />
  );
}
