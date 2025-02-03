"use client";

import { Button } from "@/lib/components/ui/button";
import { useToast } from "@/lib/components/ui/use-toast";
import { Pi } from "lucide-react";
import { useTranslations } from "next-intl";

export function CopyToClipboardButton({
  text,
}: {
  text: string;
}) {
  const { toast } = useToast();
  const translations = useTranslations("CopyToClipboardButton");

  return (
    <Button
      onClick={(e) => {
        navigator.clipboard.writeText(text).then(() => {
          toast({
            description: translations("Copied to clipboard"),
          });
        });
        e.preventDefault();
      }}
      variant="ghost"
      size="icon"
    >
      <Pi className="h-4 w-4" />
    </Button>
  );
}
