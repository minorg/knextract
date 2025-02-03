import { Identifier, Locale } from "@/lib/models";
import { json } from "@/lib/models/impl";
import { encodeFileName } from "@kos-kit/next-utils";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@microsoft/fetch-event-source";
import { Either, Left, Right } from "purify-ts";
import invariant from "ts-invariant";
import { logger } from "./logger";

class FatalError extends Error {}
// class RetryableError extends Error {}

export class ApiClient {
  readonly abortController = new AbortController();

  async executeWorkflow({
    corpus,
    document,
    locale,
    onClose,
    onOpen,
    onWorkflowExecutionEvent,
    skipPreviouslyAnnotatedDocuments,
    workflow,
  }: {
    corpus?: { identifier: Identifier };
    document?: { identifier: Identifier };
    locale: Locale;
    onClose?: () => void;
    onOpen?: () => Promise<void>;
    onWorkflowExecutionEvent: (
      workflowExecutionEvent: json.WorkflowExecutionEvent,
    ) => void;
    skipPreviouslyAnnotatedDocuments?: boolean;
    workflow: { identifier: Identifier };
  }): Promise<Either<Error, null>> {
    // Adapted from example on https://www.npmjs.com/package/@microsoft/fetch-event-source
    try {
      await fetchEventSource(
        `/api/workflows/${encodeFileName(Identifier.toString(workflow.identifier))}/execute`,
        {
          body: JSON.stringify({
            corpusIdentifier: corpus
              ? Identifier.toString(corpus.identifier)
              : undefined,
            documentIdentifier: document
              ? Identifier.toString(document.identifier)
              : undefined,
            locale,
            skipPreviouslyAnnotatedDocuments,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          onclose: onClose,
          onerror: (error) => {
            logger.warn("error executing workflow:", error);
            throw error;
            // if (error instanceof FatalError) {
            //   throw error; // rethrow to stop the operation
            // }
            // Do nothing to automatically retry. Can also
            // return a specific retry interval here.
          },
          onmessage: (eventSourceMessage) => {
            onWorkflowExecutionEvent(JSON.parse(eventSourceMessage.data));
          },
          onopen: async (response) => {
            if (
              response.ok &&
              response.status === 200 &&
              response.headers
                .get("content-type")
                ?.includes(EventStreamContentType)
            ) {
              if (onOpen) {
                await onOpen();
              }
              return;
            }

            if (
              response.status >= 400 &&
              response.status < 500 &&
              response.status !== 429
            ) {
              logger.warn("client-side error executing workflow:", response);
              throw new FatalError("error executing workflow");
            }

            throw new FatalError();
          },
          openWhenHidden: false, // Keep the request open even if the document is hidden
          signal: this.abortController.signal,
        },
      );
      return Right(null);
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }
  }
}
