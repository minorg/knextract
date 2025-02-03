"use client";

import { UploadAction } from "@/lib/actions/UploadAction";
import { UploaderForm } from "@/lib/components/UploaderForm";
import { FileUploader as ReactDropzoneFileUploader } from "@/lib/components/ui/file-uploader";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/lib/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { Accept } from "react-dropzone";
import { useForm } from "react-hook-form";
import invariant from "ts-invariant";
import { z } from "zod";

const formSchema = z.object({
  files: z.array(z.instanceof(File)),
  title: z.string().min(1),
});

type FormSchema = z.infer<typeof formSchema>;

export function FileUploader({
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
      files: [],
      title: metadataFormFields?.title ? "" : "dummy",
    },
    resolver: zodResolver(formSchema),
  });

  const formValuesToFormData = useCallback((formValues: FormSchema) => {
    const formData = new FormData();
    invariant(formValues.files.length === 1);
    formData.append("file", formValues.files[0]);
    return formData;
  }, []);

  return (
    <UploaderForm<FormSchema>
      form={form}
      formValuesToFormData={formValuesToFormData}
      hiddenFormFields={hiddenFormFields}
      isSubmittable={(formValues) => formValues.files.length > 0}
      metadataFormFields={metadataFormFields}
      uploadAction={uploadAction}
    >
      <FormField
        control={form.control}
        name="files"
        render={({ field }) => (
          <div className="space-y-6">
            <FormItem className="w-full">
              <FormControl>
                <ReactDropzoneFileUploader
                  accept={accept}
                  disabled={form.formState.isSubmitting}
                  maxFileCount={1}
                  maxSize={4 * 1024 * 1024}
                  onValueChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>
        )}
      />
    </UploaderForm>
  );
}
