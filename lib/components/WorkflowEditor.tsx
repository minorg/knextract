"use client";

import { addWorkflow } from "@/lib/actions/addWorkflow";
import { defaultPromptTemplate } from "@/lib/annotators/defaultPromptTemplate";
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
  ConceptSchemeConceptSelector,
  Identifier,
  LanguageModelSpecification,
  Locale,
  PromptMessageTemplate,
  PromptTemplate,
  Stub,
} from "@/lib/models";
import { json, rdf, synthetic } from "@/lib/models/impl";
import { rdfEnvironment } from "@/lib/rdfEnvironment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const defaultPromptTemplatePromptInstructionsMessageTemplateIndex =
  defaultPromptTemplate.messageTemplates.findIndex((messageTemplate) =>
    messageTemplate.role.equals(knextractCbox._Role_Human),
  );

const defaultPromptInstructions =
  defaultPromptTemplate.messageTemplates[
    defaultPromptTemplatePromptInstructionsMessageTemplateIndex
  ].literalForm;

const formSchema = z.object({
  conceptSchemeIdentifier: z.string(),
  label: z.string().min(1),
  languageModelIdentifier: z.string(),
  promptInstructions: z.string(),
  recursive: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function WorkflowEditor({
  conceptSchemes,
  languageModels,
}: {
  conceptSchemes: readonly json.ConceptScheme[];
  languageModels: readonly json.LanguageModelSpecification[];
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      conceptSchemeIdentifier: conceptSchemes[0].identifier,
      label: "",
      languageModelIdentifier: "",
      promptInstructions: defaultPromptInstructions,
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
            conceptScheme: synthetic.Stub.fromModel(
              new synthetic.ConceptScheme({
                identifier: Identifier.fromString(
                  formValues.conceptSchemeIdentifier,
                ),
              }),
            ),
          });

          let languageModel: Stub<LanguageModelSpecification> | undefined;
          if (formValues.languageModelIdentifier) {
            languageModel =
              synthetic.Stub.fromIdentifier<LanguageModelSpecification>(
                Identifier.fromString(formValues.languageModelIdentifier),
              );
          }

          let promptTemplate: PromptTemplate | undefined;
          if (
            formValues.promptInstructions.length > 0 &&
            formValues.promptInstructions !== defaultPromptInstructions
          ) {
            promptTemplate = new PromptTemplate({
              messageTemplates: [
                ...defaultPromptTemplate.messageTemplates.slice(
                  0,
                  defaultPromptTemplatePromptInstructionsMessageTemplateIndex,
                ),
                new PromptMessageTemplate({
                  literalForm: formValues.promptInstructions,
                  role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
                }),
                ...defaultPromptTemplate.messageTemplates.slice(
                  defaultPromptTemplatePromptInstructionsMessageTemplateIndex +
                    1,
                ),
              ],
            });
          }

          const conceptAnnotatorParameters =
            new synthetic.LanguageModelConceptAnnotatorParameters({
              languageModel,
              promptTemplate,
            });

          const workflowRdfString =
            await rdfEnvironment.serializers.serializeToString(
              (
                await rdf.mem.ModelSet.fromModels((modelSet) =>
                  modelSet.addModel(
                    newWorkflow({
                      steps: [
                        newWorkflow.ConceptAnnotatorStep({
                          conceptSelector,
                          conceptAnnotatorParameters,
                          recursive: formValues.recursive ? true : undefined,
                        }),
                      ],
                      label: formValues.label,
                    }),
                  ),
                )
              ).dataset,
              { format: "application/n-quads", sorted: true },
            );

          await addWorkflow.bind(null, {
            locale,
            workflowRdfString,
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
        {languageModels.length > 0 ? (
          <FormField
            control={form.control}
            disabled={form.formState.isSubmitting}
            name="languageModelIdentifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations("Language model")}</FormLabel>
                <ModelSelect
                  disabled={form.formState.isSubmitting}
                  models={languageModels}
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
          name="promptInstructions"
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
