import { DocumentStub, ModelSet } from "@/lib/models";
import Emittery from "emittery";

type EventData = {
  postDocumentExportEvent: { document: DocumentStub };
  preDocumentExportEvent: { document: DocumentStub };
};

/**
 * Abstract base class for corpus claim exporters.
 */
export abstract class CorpusClaimsExporter extends Emittery<EventData> {
  abstract export(parameters: {
    documents: AsyncIterable<DocumentStub>;
    modelSet: ModelSet;
  }): Promise<void>;
}
