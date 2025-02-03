import * as React from "react";
import { PropsWithChildren } from "react";

export function PageTitleHeading({ children }: PropsWithChildren) {
  return (
    <h1 className="font-bold text-xl" data-testid="page-title-heading">
      {children}
    </h1>
  );
}
