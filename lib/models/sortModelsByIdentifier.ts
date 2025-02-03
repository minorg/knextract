import { Identifier } from "@/lib/models";

export function sortModelsByIdentifier<
  ModelT extends { identifier: Identifier },
>(models: ModelT[]): ModelT[] {
  models.sort((left, right) =>
    left.identifier.value.localeCompare(right.identifier.value),
  );
  return models;
}
