import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptsDataTable } from "@/lib/components/ConceptsDataTable";
import { DocumentClaimsDataTable } from "@/lib/components/DocumentClaimsDataTable";
import { ProcessViewer } from "@/lib/components/ProcessViewer";
import { PromptViewer } from "@/lib/components/PromptViewer";
import { QuestionViewer } from "@/lib/components/QuestionViewer";
import { ValueViewer } from "@/lib/components/ValueViewer";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";
import { getHrefs } from "@/lib/getHrefs";
import {
  ClaimProperty,
  ConceptStub,
  Identifier,
  LanguageModelInvocation,
  LanguageModelInvocationInput,
  LanguageModelInvocationOutput,
  Locale,
  PromptConstruction,
  PromptConstructionInput,
  PromptConstructionOutput,
  QuestionAdministration,
  QuestionAdministrationInput,
  QuestionAdministrationOutput,
  QuestionAdministrationSubProcesses,
  UnevaluatedClaims,
  Value,
  ValueExtraction,
  ValueExtractionInput,
  ValueExtractionOutput,
  displayLabel,
} from "@/lib/models";
import { getLocale, getTranslations } from "next-intl/server";
import React from "react";

async function LanguageModelInvocationViewer({
  languageModelInvocation,
}: {
  languageModelInvocation: LanguageModelInvocation;
}) {
  const translations = await getTranslations("LanguageModelInvocationViewer");

  return (
    <ProcessViewer
      process={languageModelInvocation}
      renderInput={async (input: LanguageModelInvocationInput) => [
        {
          title: translations("Prompt"),
          content: <PromptViewer prompt={input.prompt} />,
        },
      ]}
      renderOutput={async (output: LanguageModelInvocationOutput) => [
        {
          title: translations("Completion message"),
          content: (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {output.completionMessage.literalForm}
            </pre>
          ),
        },
      ]}
    />
  );
}

async function PromptConstructionViewer({
  promptConstruction,
}: {
  promptConstruction: PromptConstruction;
}) {
  const locale = await getLocale();
  const translations = await getTranslations("PromptConstructionViewer");

  return (
    <ProcessViewer
      process={promptConstruction}
      renderInput={async (input: PromptConstructionInput) => [
        ...input.concepts
          .map((concepts) => ({
            title: translations("Concepts"),
            content: (
              <ClientProvidersServer>
                <ConceptsDataTable
                  concepts={concepts.map(ConceptStub.toJson)}
                  pagination={{ pageIndex: 0, pageSize: 10 }}
                />
              </ClientProvidersServer>
            ),
          }))
          .toList(),
        {
          title: translations("Document"),
          content: <>{displayLabel(input.document, { locale })}</>,
        },
        {
          title: translations("Question"),
          content: <QuestionViewer question={input.question} />,
        },
      ]}
      renderOutput={async (output: PromptConstructionOutput) => [
        {
          title: translations("Prompt"),
          content: <PromptViewer prompt={output.prompt} />,
        },
      ]}
    />
  );
}

async function ValueExtractionViewer({
  valueExtraction,
}: {
  valueExtraction: ValueExtraction;
}) {
  const translations = await getTranslations("ValueExtractionViewer");
  return (
    <ProcessViewer
      process={valueExtraction}
      renderInput={async (input: ValueExtractionInput) => [
        {
          title: translations("Completion message"),
          content: (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {input.completionMessage.literalForm}
            </pre>
          ),
        },
      ]}
      renderOutput={async (output: ValueExtractionOutput) => [
        {
          title: translations("Values"),
          content: <ValuesTable values={output.values} />,
        },
      ]}
    />
  );
}

async function ValuesTable({ values }: { values: readonly Value[] }) {
  const hrefs = await getHrefs();
  const locale = (await getLocale()) as Locale;
  const translations = await getTranslations("ValuesTable");
  const valueTypeTranslations = await getTranslations("ValueTypes");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{translations("Type")}</TableHead>
          <TableHead>{translations("Value")}</TableHead>
        </TableRow>
      </TableHeader>
      {values.map((value) => (
        <TableRow key={Identifier.toString(value.identifier)}>
          <TableCell>{valueTypeTranslations(value.type)}</TableCell>
          <TableCell>
            <ValueViewer hrefs={hrefs} locale={locale} value={value} />
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}

export async function QuestionAdministrationViewer({
  claimProperties,
  questionAdministration,
}: {
  claimProperties: readonly ClaimProperty[];
  questionAdministration: QuestionAdministration;
}) {
  const locale = await getLocale();
  const translations = await getTranslations("QuestionAdministrationViewer");

  return (
    <ProcessViewer
      process={questionAdministration}
      renderInput={async (input: QuestionAdministrationInput) => [
        {
          title: translations("Document"),
          content: <>{displayLabel(input.document, { locale })}</>,
        },
        {
          title: translations("Language model"),
          content: <>{displayLabel(input.languageModel, { locale })}</>,
        },
        {
          title: translations("Question"),
          content: <QuestionViewer question={input.question} />,
        },
      ]}
      renderOutput={async (output: QuestionAdministrationOutput) => [
        {
          title: translations("Answer"),
          content: (
            <ClientProvidersServer>
              <DocumentClaimsDataTable
                claimProperties={claimProperties.map((claimProperty) =>
                  claimProperty.toJson(),
                )}
                documentClaims={new UnevaluatedClaims({
                  claims: output.answer.claims,
                }).toJson()}
              />
            </ClientProvidersServer>
          ),
        },
      ]}
      renderSubProcesses={async (
        subProcesses: QuestionAdministrationSubProcesses,
      ) =>
        subProcesses.promptConstruction
          .map((promptConstruction) => ({
            content: (
              <PromptConstructionViewer
                promptConstruction={promptConstruction}
              />
            ),
            title: translations("Prompt construction"),
          }))
          .toList()
          .concat(
            subProcesses.languageModelInvocation
              .map((languageModelInvocation) => ({
                content: (
                  <LanguageModelInvocationViewer
                    languageModelInvocation={languageModelInvocation}
                  />
                ),
                title: translations("Language model invocation"),
              }))
              .toList(),
          )
          .concat(
            subProcesses.valueExtraction
              .map((valueExtraction) => ({
                content: (
                  <ValueExtractionViewer valueExtraction={valueExtraction} />
                ),
                title: translations("Value extraction"),
              }))
              .toList(),
          )
      }
    />
  );
}
