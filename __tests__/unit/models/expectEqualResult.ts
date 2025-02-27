import { fail } from "node:assert";
import { EqualsResult } from "@/lib/models";

export function expectEqualResult(actualEqualsResult: EqualsResult): void {
  if (actualEqualsResult.isLeft()) {
    fail("expected equals");
  }
}
