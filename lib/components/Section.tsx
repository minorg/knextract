import { cn } from "@/lib/utilities";
import { PropsWithChildren } from "react";

export function Section({
  children,
  className,
  title,
}: PropsWithChildren<{
  className?: string;
  title: React.ReactElement | string;
}>) {
  return (
    <fieldset className={cn("border-gray-400 border-2 rounded p-4", className)}>
      <legend className="px-1">{title}</legend>
      {children}
    </fieldset>
  );
}
