import { cn } from "@/lib/utilities";
import NextLink from "next/link";
import * as React from "react";

export function Link({
  children,
  className,
  href,
  ...otherProps
}: { href: string } & Omit<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
  "href"
>) {
  return (
    <NextLink
      className={cn(className, "cursor-pointer", "underline")}
      href={href}
      {...otherProps}
    >
      {children}
    </NextLink>
  );
}
