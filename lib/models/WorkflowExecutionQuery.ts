import { Identifier } from "./Identifier.js";

export type WorkflowExecutionQuery =
  | { readonly type: "All" }
  | {
      // Executions that generated the given claim
      readonly claimIdentifier: Identifier;
      readonly type: "ClaimGenerator";
    }
  | {
      // Executions of the given workflow
      readonly type: "Workflow";
      readonly workflowIdentifier: Identifier;
    };
