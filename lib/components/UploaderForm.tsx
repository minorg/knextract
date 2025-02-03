import { UploadAction } from "@/lib/actions/UploadAction";
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
import { useToast } from "@/lib/components/ui/use-toast";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useCallback } from "react";
import { FieldPath, UseFormReturn } from "react-hook-form";
import invariant from "ts-invariant";
import { z } from "zod";

export const uploaderFormSchema = z.object({
  title: z.string().min(1),
});

type UploaderFormSchema = z.infer<typeof uploaderFormSchema>;

export function UploaderForm<FormSchemaT extends UploaderFormSchema>({
  children,
  form,
  formValuesToFormData,
  isSubmittable,
  hiddenFormFields,
  metadataFormFields,
  uploadAction,
}: PropsWithChildren<{
  form: UseFormReturn<FormSchemaT>;
  formValuesToFormData: (formValues: FormSchemaT) => FormData;
  hiddenFormFields: Record<string, string>;
  isSubmittable: (formValues: FormSchemaT) => boolean;
  metadataFormFields: { title: boolean };
  uploadAction: UploadAction;
}>) {
  const formValues = form.watch();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const translations = useTranslations("UploaderForm");

  const onSubmit = useCallback(async () => {
    const formData = formValuesToFormData(formValues);

    if (hiddenFormFields) {
      for (const [name, value] of Object.entries(hiddenFormFields)) {
        formData.append(name, value);
      }
    }

    if (metadataFormFields?.title) {
      invariant(formValues.title.length > 0 && formValues.title !== "dummy");
      formData.append("title", formValues.title);
    }

    formData.append("locale", locale);

    const result = await uploadAction(formData);

    switch (result.type) {
      case "failure":
        toast({
          description: result.value.message,
          title: translations("Server exception"),
          variant: "destructive",
        });
        break;
      case "success": {
        router.push(result.value.href);
        break;
      }
    }
  }, [
    formValues,
    formValuesToFormData,
    hiddenFormFields,
    locale,
    metadataFormFields,
    router,
    toast,
    translations,
    uploadAction,
  ]);

  return (
    <Form {...form}>
      <form
        className="flex w-full flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {metadataFormFields?.title ? (
          <FormField
            disabled={form.formState.isSubmitting}
            control={form.control}
            name={"title" as FieldPath<FormSchemaT>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations("Title")}</FormLabel>
                <FormControl>
                  <Input
                    data-testid="title-input"
                    placeholder={translations("Title")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {children}
        {isSubmittable(formValues) ? (
          <div className="text-center">
            <Button
              className="w-fit"
              data-testid="submit-button"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <LoadingSpinner className="w-8 h-8" />
              ) : (
                <span>{translations("Upload")}</span>
              )}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
