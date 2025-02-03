import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

export function ErrorAlert({ error }: { error: Error }) {
  const translations = useTranslations("ErrorAlert");

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{translations("Error")}</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
