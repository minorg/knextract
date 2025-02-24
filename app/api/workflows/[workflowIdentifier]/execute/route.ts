import { project } from "@/app/project";
import { WorkflowEngine } from "@/lib/WorkflowEngine";
import { logger } from "@/lib/logger";
import {
  DocumentStub,
  Identifier,
  Locale,
  ModelSet,
  WorkflowStub,
} from "@/lib/models";
import { decodeFileName } from "@kos-kit/next-utils";
import { Either, Left, Right } from "purify-ts";
import { z } from "zod";

const requestBodySchema = z.object({
  corpusIdentifier: z.string().optional(),
  documentIdentifier: z.string().optional(),
  locale: z.string(),
  skipPreviouslyAnnotatedDocuments: z.boolean().optional(),
});

interface RequestParameters {
  documents: readonly DocumentStub[];
  locale: Locale;
  modelSet: ModelSet;
  skipPreviouslyAnnotatedDocuments: boolean;
  workflow: WorkflowStub;
}

async function readRequestParameters(
  request: Request,
  params: { workflowIdentifier: string },
): Promise<Either<Response, RequestParameters>> {
  const requestBodyParseReturn = await requestBodySchema.safeParseAsync(
    await request.json(),
  );
  if (requestBodyParseReturn.error) {
    return Left(
      new Response(requestBodyParseReturn.error.message, { status: 400 }),
    );
  }
  const requestBody = requestBodyParseReturn.data!;

  const locale = requestBody.locale as Locale;
  const modelSet = await project.modelSet({ locale });

  let documents: readonly DocumentStub[];
  if (requestBody?.corpusIdentifier) {
    const corpusIdentifier = Identifier.fromString(
      requestBody.corpusIdentifier,
    );
    const documentsEither = await modelSet.documentStubs({
      limit: null,
      offset: 0,
      query: {
        includeDeleted: false,
        corpusIdentifier,
        type: "MemberOfCorpus",
      },
    });
    if (documentsEither.isLeft()) {
      logger.warn(
        "error retrieving documents: %s",
        (documentsEither.extract() as Error).message,
      );
      return Left(new Response("error retrieving documents", { status: 500 }));
    }
    documents = documentsEither.unsafeCoerce();
  } else if (requestBody?.documentIdentifier) {
    const documentEither = await modelSet.documentStub(
      Identifier.fromString(requestBody.documentIdentifier),
    );
    if (documentEither.isLeft()) {
      logger.warn(
        "error retrieving document: %s",
        (documentEither.extract() as Error).message,
      );
      return Left(new Response("error retrieving document", { status: 500 }));
    }
    documents = [documentEither.unsafeCoerce()];
  } else {
    logger.warn("request does not specify a corpus or document identifier");
    return Left(
      new Response("must specify corpus or document", { status: 400 }),
    );
  }

  const workflowEither = await modelSet.workflowStub(
    Identifier.fromString(decodeFileName(params.workflowIdentifier)),
  );
  if (workflowEither.isLeft()) {
    logger.warn(
      "error retrieving workflow: %s",
      (workflowEither.extract() as Error).message,
    );
    return Left(new Response("error retrieving workflow", { status: 500 }));
  }

  return Right({
    documents,
    locale,
    modelSet,
    skipPreviouslyAnnotatedDocuments:
      !!requestBody.skipPreviouslyAnnotatedDocuments,
    workflow: workflowEither.unsafeCoerce(),
  });
}

export async function POST(
  request: Request,
  { params }: { params: { workflowIdentifier: string } },
) {
  const requestParametersEither = await readRequestParameters(request, params);
  if (requestParametersEither.isLeft()) {
    return requestParametersEither.extract() as Response;
  }
  const {
    documents,
    locale,
    modelSet,
    skipPreviouslyAnnotatedDocuments,
    workflow,
  } = requestParametersEither.extract() as RequestParameters;

  const responseStream = new ReadableStream({
    async start(controller) {
      const textEncoder = new TextEncoder();

      const workflowEngine = new WorkflowEngine({
        languageModelFactory: await project.languageModelFactory(),
        modelSet: await project.modelSet({ locale }),
      });

      workflowEngine.onAny(async (_eventName, eventData) => {
        controller.enqueue(
          textEncoder.encode(`data: ${JSON.stringify(eventData.toJson())}\n\n`),
        );
      });

      for (const document of documents) {
        if (skipPreviouslyAnnotatedDocuments) {
          if (
            (
              await modelSet.claims({
                query: {
                  documentIdentifier: document.identifier,
                  gold: false,
                  type: "Document",
                },
              })
            ).orDefault([]).length > 0
          ) {
            logger.info(
              "skipping previously-annotated document %s",
              Identifier.toString(document.identifier),
            );
          }
          continue;
        }

        const workflowExecution = await workflowEngine.execute({
          document,
          workflow,
        });

        await modelSet.addModel(workflowExecution);
      }

      controller.close();
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
