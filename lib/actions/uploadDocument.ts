"use server";

import { project } from "@/app/project";
import { UploadAction } from "@/lib/actions/UploadAction";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { Corpus, Document, Exception, Identifier, Locale } from "@/lib/models";
import { json, synthetic } from "@/lib/models/impl";
import { sha256 } from "js-sha256";
import { Either } from "purify-ts";
import { zfd } from "zod-form-data";

const formDataSchema = zfd.formData({
  corpusIdentifier: zfd.text(),
  file: zfd.file().optional(),
  locale: zfd.text(),
  text: zfd.text().optional(),
  title: zfd.text().optional(),
});

export const uploadDocument: UploadAction = async (formData) => {
  const parseResult = await formDataSchema.safeParseAsync(formData);
  if (!parseResult.success) {
    logger.debug(
      "uploadDocument: failed to parse form data: %s",
      parseResult.error.message,
    );
    return {
      type: "failure",
      value: json.Exception.clone(
        new Exception({
          message: parseResult.error.message,
        }),
      ),
    };
  }

  const { corpusIdentifier, file, title, locale, text } = parseResult.data;

  logger.debug(
    "uploadDocument: corpusIdentifier=%s, file size=%d, locale=%s, text length=%d, title=%s",
    corpusIdentifier,
    file?.size,
    locale,
    text?.length,
    title,
  );

  const blobStore = (await project.blobStore())
    .ifLeft((error) => {
      logger.debug(
        "unable to obtain blob store to upload document to: %s",
        error.message,
      );
    })
    .mapLeft((_) => null)
    .extract();

  let url: string | undefined;
  if (blobStore) {
    if (file) {
      const fileArrayBuffer = await file.arrayBuffer();
      url = (
        await blobStore.put(["file", sha256(fileArrayBuffer)], {
          buffer: Buffer.from(fileArrayBuffer),
          type: "buffer",
        })
      )
        .ifLeft((error) => {
          logger.debug(
            "uploadDocument: error uploading file %s to blob store: %s",
            file.name,
            error.message,
          );
        })
        .mapLeft((_) => undefined)
        .map((_) => _.toString())
        .extract();
    } else if (text) {
      url = (
        await blobStore.put(["file", sha256(text)], {
          buffer: Buffer.from(text),
          type: "buffer",
        })
      )
        .ifLeft((error) => {
          logger.debug(
            "uploadDocument: error uploading text to blob store: %s",
            error.message,
          );
        })
        .mapLeft((_) => undefined)
        .map((_) => _.toString())
        .extract();
    }
  }

  const createDocumentParameters = {
    memberOfCorpus: synthetic.Stub.fromModel(
      Corpus.create({
        identifier: Identifier.fromString(corpusIdentifier),
        label: "Temporary corpus",
      }),
    ),
    mutable: true,
    title,
    url,
  };

  let documentEither: Either<Error, Document>;
  if (file) {
    documentEither = await project.documentFactory.createDocumentFromFileUpload(
      {
        fileUpload: file,
        ...createDocumentParameters,
      },
    );
  } else if (text) {
    const mimeType = formData.get("mimeType") as string | null;

    documentEither = project.documentFactory.createDocumentFromText({
      mimeType,
      text,
      ...createDocumentParameters,
    });
  } else {
    return {
      type: "failure",
      value: json.Exception.clone(
        new Exception({
          message: "document upload doesn't include a file or text",
        }),
      ),
    };
  }

  if (documentEither.isLeft()) {
    const error = documentEither.extract() as Error;
    logger.debug("uploadDocument: error creating document: %s", error.message);
    return {
      type: "failure",
      value: json.Exception.clone(new Exception({ message: error.message })),
    };
  }

  const document = documentEither.unsafeCoerce();

  logger.debug("uploadDocument: adding document to project ModelSet");
  await (await project.modelSet({ locale: locale as Locale })).addModel(
    document,
  );
  logger.debug("uploadDocument: added document to project ModelSet");

  const documentHref = (await getHrefs({ locale: locale as Locale })).document(
    document,
  );
  logger.debug(
    "uploadDocument: uploaded document: identifier=%s, href=%s",
    Identifier.toString(document.identifier),
    documentHref,
  );

  return {
    type: "success",
    value: {
      ...json.Document.clone(document),
      href: documentHref,
    },
  };
};
