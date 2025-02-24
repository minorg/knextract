"use client";

import { FormControl } from "@/lib/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { Identifier, displayLabel } from "@/lib/models";
import { SelectProps } from "@radix-ui/react-select";
import { useLocale } from "next-intl";

export function ModelSelect({
  models,
  placeholder,
  ...selectProps
}: {
  models: readonly Parameters<typeof displayLabel>[0][];
  placeholder?: string;
} & Pick<SelectProps, "disabled" | "onValueChange" | "value">) {
  const locale = useLocale();

  return (
    <Select {...selectProps}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {models.map((model) => (
          <SelectItem
            key={Identifier.toString(model.identifier)}
            value={Identifier.toString(model.identifier)}
          >
            {displayLabel(model, { locale })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
