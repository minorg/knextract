import { fail } from "node:assert";
import { EqualsResult } from "@/lib/models";

export function expectUnequalResult(actualEqualsResult: EqualsResult): void {
  if (actualEqualsResult.isRight()) {
    fail("expected equals");
  }
}
