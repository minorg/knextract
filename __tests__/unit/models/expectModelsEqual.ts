import { EqualsResult } from "@/lib/models";
import { expect } from "vitest";

export function expectModelsEqual<
  ModelT extends { equals: (other: ModelT) => EqualsResult; toJson: () => any },
>(expectedModel: ModelT, actualModel?: ModelT | null): void {
  expect(actualModel).not.toBeNull();
  const equalsResult = expectedModel.equals(actualModel!);
  if (equalsResult.isRight()) {
    return;
  }
  const actualModelJson = actualModel?.toJson();
  const expectedModelJson = expectedModel.toJson();
  expect(actualModelJson).toStrictEqual(expectedModelJson);
}
