import { FormControl } from "@/lib/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { json } from "@/lib/models/impl";
import { SelectProps } from "@radix-ui/react-select";

export function ModelSelect({
  models,
  placeholder,
  ...selectProps
}: {
  models: readonly json.DisplayableModel[];
  placeholder?: string;
} & Pick<SelectProps, "disabled" | "onValueChange" | "value">) {
  return (
    <Select {...selectProps}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.identifier} value={model.identifier}>
            {model.displayLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
