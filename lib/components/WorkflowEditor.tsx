"use client";

import { addWorkflow } from "@/lib/actions/addWorkflow";
import { ModelSelect } from "@/lib/components/ModelSelect";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Button } from "@/lib/components/ui/button";
import { Checkbox } from "@/lib/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/components/ui/form";
import { Input } from "@/lib/components/ui/input";
import { LoadingSpinner } from "@/lib/components/ui/loading-spinner";
import { Textarea } from "@/lib/components/ui/textarea";
import {
  CategoricalQuestion,
  ConceptSchemeConceptSelector,
  ConceptSchemeStub,
  Identifier,
  Instruction,
  LanguageModelSpecificationStub,
  Locale,
  PromptMessage,
  PromptMessageTemplate,
  PromptTemplate,
  Questionnaire,
  Workflow,
  WorkflowQuestionnaireStep,
} from "@/lib/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { dcterms } from "@tpluscode/rdf-ns-builders";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const instructionsDefault = [
  "I will give you a document in HTML.",
  "I will also give you a JSON array of JSON objects describing concepts the document could be about.",
  "You should determine which concepts the document is about, and return those concept numbers as a JSON object with the format { matches: [number, number, number] }",
  "Please do not return any other text, just the JSON object.",
].join(" ");

const formSchema = z.object({
  conceptSchemeIdentifier: z.string(),
  label: z.string().min(1),
  languageModelSpecificationIdentifier: z.string(),
  instructions: z.string(),
  recursive: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function WorkflowEditor(json: {
  conceptSchemes: readonly ReturnType<typeof ConceptSchemeStub.toJson>[];
  languageModelSpecifications: readonly ReturnType<
    LanguageModelSpecificationStub["toJson"]
  >[];
}) {
  const conceptSchemes = useMemo(
    () =>
      json.conceptSchemes.flatMap((json) =>
        ConceptSchemeStub.fromJson(json).toMaybe().toList(),
      ),
    [json],
  );
  const languageModelSpecifications = useMemo(
    () =>
      json.languageModelSpecifications.flatMap((json) =>
        LanguageModelSpecificationStub.fromJson(json).toMaybe().toList(),
      ),
    [json],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      conceptSchemeIdentifier: Identifier.toString(
        conceptSchemes[0].identifier,
      ),
      label: "",
      languageModelSpecificationIdentifier: "",
      instructions: instructionsDefault,
      recursive: false,
    },
  });

  const formValues = form.watch();
  const locale = useLocale() as Locale;
  const translations = useTranslations("WorkflowEditor");

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit(async () => {
          const conceptSelector = new ConceptSchemeConceptSelector({
            conceptScheme: conceptSchemes.find(
              (conceptScheme) =>
                conceptScheme.identifier.value ===
                formValues.conceptSchemeIdentifier,
            )!,
          });

          let languageModelSpecification:
            | LanguageModelSpecificationStub
            | undefined;
          if (formValues.languageModelSpecificationIdentifier) {
            languageModelSpecification = languageModelSpecifications.find(
              (languageModelSpecification) =>
                languageModelSpecification.identifier.value ===
                formValues.languageModelSpecificationIdentifier,
            );
          }

          const questionnaire = new Questionnaire({
            members: [
              new Instruction({
                promptMessage: new PromptMessage({
                  literalForm:
                    "You are an expert document classifier. You help people classify documents so that they can be easily found.",
                  role: "http://purl.archive.org/purl/knextract/cbox#_Role_System",
                }),
              }),
              new CategoricalQuestion({
                conceptSelector,
                path: dcterms.subject,
                promptTemplate: new PromptTemplate({
                  messageTemplates: [
                    new PromptMessageTemplate({
                      literalForm:
                        formValues.instructions.length > 0
                          ? formValues.instructions
                          : instructionsDefault,
                      role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
                    }),
                    new PromptMessageTemplate({
                      literalForm: "Okay, please provide the document.",
                      role: "http://purl.archive.org/purl/knextract/cbox#_Role_AI",
                    }),
                    new PromptMessageTemplate({
                      literalForm: "{{{document.text}}}",
                      role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
                    }),
                    new PromptMessageTemplate({
                      literalForm: "Okay, please provide the concepts list.",
                      role: "http://purl.archive.org/purl/knextract/cbox#_Role_AI",
                    }),
                    new PromptMessageTemplate({
                      literalForm: "{{{concepts | json}}}",
                      role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
                    }),
                  ],
                }),
              }),
            ],
          });

          const workflow = new Workflow({
            label: formValues.label,
            steps: [
              new WorkflowQuestionnaireStep({
                languageModel: languageModelSpecification,
                questionnaire,
              }),
            ],
          });

          await addWorkflow.bind(null, {
            locale,
            workflow: workflow.toJson(),
          })(null as any); // FormData is ignored
        })}
      >
        <PageTitleHeading>
          {translations("Workflow")}
          {formValues.label ? `: ${formValues.label}` : ""}
        </PageTitleHeading>
        <FormField
          control={form.control}
          disabled={form.formState.isSubmitting}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations("Label")}</FormLabel>
              <FormControl>
                <Input placeholder={translations("Label")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          disabled={form.formState.isSubmitting}
          name="conceptSchemeIdentifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations("Concept scheme")}</FormLabel>
              <ModelSelect
                disabled={form.formState.isSubmitting}
                models={conceptSchemes}
                onValueChange={field.onChange}
                value={field.value}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          disabled={form.formState.isSubmitting}
          name="recursive"
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row gap-2 items-center">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>{translations("Recursive")}</FormLabel>
              </div>
            </FormItem>
          )}
        />
        {languageModelSpecifications.length > 0 ? (
          <FormField
            control={form.control}
            disabled={form.formState.isSubmitting}
            name="languageModelSpecificationIdentifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations("Language model")}</FormLabel>
                <ModelSelect
                  disabled={form.formState.isSubmitting}
                  models={languageModelSpecifications}
                  onValueChange={field.onChange}
                  value={field.value}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          disabled={form.formState.isSubmitting}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations("Prompt instructions")}</FormLabel>
              <FormControl>
                <Textarea
                  disabled={form.formState.isSubmitting}
                  rows={8}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.isValid ? (
          <div className="flex flex-row justify-center">
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? (
                <LoadingSpinner className="w-8 h-8" />
              ) : (
                translations("Save")
              )}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
