import { logger } from "@/lib/logger";
import { rdfEnvironment } from "@/lib/rdfEnvironment";
import ValidationReport from "rdf-validate-shacl/src/validation-report";

export async function logShaclValidationReport({
  dataGraphDescription,
  validationReport,
}: {
  dataGraphDescription: string;
  validationReport: ValidationReport;
}) {
  if (validationReport.conforms) {
    logger.debug("%s conforms to ontology", dataGraphDescription);
  } else {
    logger.info("%s does not conform to ontology", dataGraphDescription);
    logger.info("SHACL validation results:");
    logger.info(
      await rdfEnvironment.serializers.serializeToString(
        validationReport.dataset,
        { format: "text/turtle" },
      ),
    );
  }
}
