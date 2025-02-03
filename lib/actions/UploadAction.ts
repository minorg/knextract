import { json } from "@/lib/models/impl";

export type UploadAction = (
  formData: FormData,
) => Promise<
  | { type: "success"; value: json.Model & { readonly href: string } }
  | { type: "failure"; value: json.Exception }
>;
