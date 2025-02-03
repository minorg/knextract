"use client";

import { UploadAction } from "@/lib/actions/UploadAction";
import { FileUploader } from "@/lib/components/FileUploader";
import { TextUploader } from "@/lib/components/TextUploader";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/lib/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Accept } from "react-dropzone";

/**
 * Component that supports uploading from files, pasted-in text, and from URL.
 */
export function MultiUploader({
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
  const translations = useTranslations("MultiUploader");

  return (
    <Tabs defaultValue="file" className="w-full">
      <TabsList>
        <TabsTrigger data-testid="file-tab-trigger" value="file">
          {translations("File")}
        </TabsTrigger>
        <TabsTrigger data-testid="text-tab-trigger" value="text">
          {translations("Text")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="file">
        <FileUploader
          accept={accept}
          hiddenFormFields={hiddenFormFields}
          metadataFormFields={metadataFormFields}
          uploadAction={uploadAction}
        />
      </TabsContent>
      <TabsContent value="text">
        <TextUploader
          accept={Object.entries(accept).reduce((filteredAccept, entry) => {
            switch (entry[0]) {
              case "text/html":
              case "text/plain":
                filteredAccept[entry[0]] = entry[1];
                break;
            }
            return filteredAccept;
          }, {} as Accept)}
          hiddenFormFields={hiddenFormFields}
          metadataFormFields={metadataFormFields}
          uploadAction={uploadAction}
        />
      </TabsContent>
    </Tabs>
  );
}
