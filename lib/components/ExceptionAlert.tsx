import { ErrorAlert } from "@/lib/components/ErrorAlert";
import { Exception } from "@/lib/models";
import React from "react";

export function ExceptionAlert({ exception }: { exception: Exception }) {
  return <ErrorAlert error={new Error(exception.message)} />;
}
