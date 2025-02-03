import { Claim } from "@/lib/models";
import { InformationRetrievalMetrics } from "@/lib/models/InformationRetrievalMetrics";

export interface ClaimEvaluation extends InformationRetrievalMetrics {
  readonly truePositives: {
    readonly goldClaim: ReturnType<Claim["toJson"]>;
    readonly inferredClaim: ReturnType<Claim["toJson"]>;
  }[];
}
