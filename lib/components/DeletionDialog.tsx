"use client";

import { Button } from "@/lib/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/lib/components/ui/dialog";
import { Locale } from "@/lib/models";
import { Delete } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export function DeletionDialog({
  deleteAction,
  description,
  identifier,
  title,
}: {
  deleteAction: ({
    identifier,
    locale,
  }: {
    identifier: string;
    locale: Locale;
  }) => Promise<void>;
  description: string;
  identifier: string;
  title: string;
}) {
  const locale = useLocale() as Locale;
  const translations = useTranslations("DeletionDialog");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          data-testid="delete-button"
          title={translations("Delete")}
          variant="ghost"
        >
          <Delete className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row">
          <DialogClose asChild>
            <Button
              data-testid="cancel-deletion-button"
              type="button"
              variant="secondary"
            >
              {translations("Cancel")}
            </Button>
          </DialogClose>
          <Button
            data-testid="confirm-deletion-button"
            onClick={() =>
              deleteAction({
                identifier,
                locale,
              })
            }
            variant="destructive"
          >
            {translations("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
