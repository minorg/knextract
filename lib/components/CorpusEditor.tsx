"use client";

import { addCorpus } from "@/lib/actions/addCorpus";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Button } from "@/lib/components/ui/button";
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
import { Locale } from "@/lib/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  label: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export function CorpusEditor() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      label: "",
    },
  });

  const formValues = form.watch();
  const locale: Locale = useLocale() as Locale;
  const translations = useTranslations("CorpusEditor");

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit(async () => {
          await addCorpus.bind(null, {
            label: formValues.label,
            locale,
          })(null as any); // FormData is ignored
        })}
      >
        <PageTitleHeading>
          {translations("Corpus")}
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
                <Input
                  data-testid="label-input"
                  placeholder={translations("Label")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.isValid ? (
          <div className="flex flex-row justify-center">
            <Button
              data-testid="submit-button"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
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
