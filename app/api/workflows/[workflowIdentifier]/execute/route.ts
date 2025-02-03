import { project } from "@/app/project";
import { WorkflowEngine } from "@/lib/WorkflowEngine";
import { ConceptAnnotatorFactory } from "@/lib/annotators";
import { logger } from "@/lib/logger";
import {
  Document,
  Identifier,
  Locale,
  ModelSet,
  Stub,
  Workflow,
} from "@/lib/models";
import { json } from "@/lib/models/impl";
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
  documentStubs: Iterable<Stub<Document>>;
  modelSet: ModelSet;
  skipPreviouslyAnnotatedDocuments: boolean;
  workflowStub: Stub<Workflow>;
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

  let documentStubs: Iterable<Stub<Document>>;
  if (requestBody?.corpusIdentifier) {
    const corpusIdentifier = Identifier.fromString(
      requestBody.corpusIdentifier,
    );
    const corpus = (await modelSet.corpus(corpusIdentifier).resolve())
      .toMaybe()
      .extractNullable();
    if (corpus === null) {
      logger.warn("no such corpus: %s", Identifier.toString(corpusIdentifier));
      return Left(
        new Response(
          `no such corpus: ${Identifier.toString(corpusIdentifier)}`,
          { status: 404 },
        ),
      );
    }
    documentStubs = await corpus.documents({
      includeDeleted: false,
      limit: null,
      offset: 0,
    });
  } else if (requestBody?.documentIdentifier) {
    documentStubs = [
      modelSet.document(Identifier.fromString(requestBody.documentIdentifier)),
    ];
  } else {
    logger.warn("request does not specify a corpus or document identifier");
    return Left(
      new Response("must specify corpus or document", { status: 400 }),
    );
  }

  const workflowStub = modelSet.workflow(
    Identifier.fromString(decodeFileName(params.workflowIdentifier)),
  );

  return Right({
    documentStubs,
    modelSet,
    skipPreviouslyAnnotatedDocuments:
      !!requestBody.skipPreviouslyAnnotatedDocuments,
    workflowStub,
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
    documentStubs,
    modelSet,
    skipPreviouslyAnnotatedDocuments,
    workflowStub,
  } = requestParametersEither.extract() as RequestParameters;

  const responseStream = new ReadableStream({
    async start(controller) {
      const textEncoder = new TextEncoder();

      const workflowEngine = new WorkflowEngine({
        annotatorFactory: new ConceptAnnotatorFactory({
          languageModelFactory: await project.languageModelFactory(),
        }),
      });

      workflowEngine.onAny(async (_eventName, eventData) => {
        const jsonEventData =
          await json.WorkflowExecutionEvent.clone(eventData);
        controller.enqueue(
          textEncoder.encode(`data: ${JSON.stringify(jsonEventData)}\n\n`),
        );
      });

      for (const documentStub of documentStubs) {
        if (skipPreviouslyAnnotatedDocuments) {
          const document = (await documentStub.resolve())
            .toMaybe()
            .extractNullable();
          if (document !== null) {
            const annotations = await (
              await document.annotations()
            ).flatResolve();
            if (annotations.some((annotation) => !annotation.gold)) {
              logger.info(
                "skipping previously-annotated document %s",
                Identifier.toString(documentStub.identifier),
              );
              continue;
            }
          }
        }

        const workflowExecution = await workflowEngine.execute({
          documentStub,
          workflowStub,
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
