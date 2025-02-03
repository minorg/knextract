"use client";

import { UploadAction } from "@/lib/actions/UploadAction";
import {
  UploaderForm,
  uploaderFormSchema,
} from "@/lib/components/UploaderForm";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { Textarea } from "@/lib/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Accept } from "react-dropzone";
import { useForm } from "react-hook-form";
import invariant from "ts-invariant";
import { z } from "zod";

const formSchema = uploaderFormSchema.extend({
  mimeType: z.string().min(1),
  text: z.string().min(1),
});

type FormSchema = z.infer<typeof formSchema>;

export function TextUploader({
  accept,
  hiddenFormFields,
  metadataFormFields,
  uploadAction,
}: {
  accept: Accept;
  hiddenFormFields: Record<string, string>;
  metadataFormFields: { title: boolean };
  uploadAction: UploadAction;
}) {
  const form = useForm<FormSchema>({
    defaultValues: {
      title: metadataFormFields?.title ? "" : "dummy",
      mimeType: "auto",
      text: "",
    },
    resolver: zodResolver(formSchema),
  });

  const formValuesToFormData = useCallback((formValues: FormSchema) => {
    const formData = new FormData();
    invariant(formValues.text.length > 0);
    if (formValues.mimeType !== "auto") {
      formData.append("mimeType", formValues.mimeType);
    }
    formData.append("text", formValues.text);
    return formData;
  }, []);

  const mimeTypeTranslations = useTranslations("MimeTypes");
  const translations = useTranslations("TextUploader");

  return (
    <UploaderForm<FormSchema>
      form={form}
      formValuesToFormData={formValuesToFormData}
      hiddenFormFields={hiddenFormFields}
      isSubmittable={(formValues) => formValues.text.length > 0}
      metadataFormFields={metadataFormFields}
      uploadAction={uploadAction}
    >
      <FormField
        control={form.control}
        name="text"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea
                data-testid="text-textarea"
                disabled={form.formState.isSubmitting}
                placeholder={translations("Paste text here")}
                rows={10}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="mimeType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{translations("Type")}</FormLabel>
            <Select
              disabled={form.formState.isSubmitting}
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="auto">
                  {translations("Auto-detect")}
                </SelectItem>
                {Object.keys(accept).map((mimeType) => (
                  <SelectItem key={mimeType} value={mimeType}>
                    {mimeTypeTranslations(mimeType as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </UploaderForm>
  );
}
