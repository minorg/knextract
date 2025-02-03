// Adapted from https://github.com/shadcn-ui/ui/discussions/1694#discussioncomment-9694510
"use client";

import * as React from "react";
import { cn } from "@/lib/utilities";

export const LoadingSpinner = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
    className?: string;
}>(({className, ...rest}, ref) => {
    return <div ref={ref} className={cn("w-16 h-16 border-4 border-t-4 border-gray-200 border-t-gray-600 rounded-full animate-spin", className)} {...rest} />;
});
