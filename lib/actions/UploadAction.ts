import { Exception } from "@/lib/models";

export type UploadAction = (
  formData: FormData,
) => Promise<
  | {
      type: "success";
      value: { readonly "@id": string; readonly href: string };
    }
  | { type: "failure"; value: ReturnType<Exception["toJson"]> }
>;
