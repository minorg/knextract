import fs from "node:fs";
import path from "node:path";
import { logger } from "@/lib/logger";
import {
  CorpusStub,
  Document,
  DocumentTitle,
  Identifier,
  TextualEntity,
} from "@/lib/models";
import { convertHtmlToText } from "@/lib/utilities";
import {
  DocumentFormatConverter,
  DocumentTextExtractor,
} from "@/lib/utilities/server";
import mime from "mime";
import { Either, Left, Right } from "purify-ts";
import * as tmp from "tmp-promise";
import invariant from "ts-invariant";

export interface CreateDocumentPassThroughParameters {
  memberOfCorpus: CorpusStub;
  mutable?: boolean;
  title?: string;
  url?: string;
}

export class DocumentFactory {
  private readonly cachesDirectoryPath: string;

  constructor({ cachesDirectoryPath }: { cachesDirectoryPath: string }) {
    this.cachesDirectoryPath = cachesDirectoryPath;
  }

  async createDocumentFromFileUpload({
    fileUpload,
    ...passThroughParameters
  }: {
    fileUpload: File;
  } & CreateDocumentPassThroughParameters): Promise<Either<Error, Document>> {
    const contents = Buffer.from(await fileUpload.arrayBuffer());
    logger.debug(
      "creating document from file upload: name=%s, size=%d",
      fileUpload.name,
      fileUpload.size,
    );
    return await this.createDocumentFromFile({
      contents,
      mimeType: fileUpload.type,
      name: fileUpload.name,
      toTempFile: (useTempFile) =>
        tmp.withFile(async ({ path }) => {
          await fs.promises.writeFile(path, contents);
          return useTempFile(path);
        }),
      ...passThroughParameters,
    });
  }

  async createDocumentFromLocalFile({
    filePath,
    ...passThroughParameters
  }: {
    filePath: string;
  } & CreateDocumentPassThroughParameters): Promise<Either<Error, Document>> {
    logger.debug("creating document from local file: %s", filePath);

    const mimeType = mime.getType(filePath);
    if (mimeType === null) {
      const errorMessage = `unable to guess MIME type from file path: ${filePath}`;
      logger.warn(errorMessage);
      return Left(new Error(errorMessage));
    }

    return this.createDocumentFromFile({
      contents: await fs.promises.readFile(filePath),
      mimeType,
      name: path.basename(filePath),
      toTempFile: (useTempFile) => useTempFile(filePath),
      ...passThroughParameters,
    });
  }

  createDocumentFromText({
    identifier: identifierParameter,
    mimeType: mimeTypeParameter,
    text,
    title,
    ...passThroughParameters
  }: {
    identifier?: Identifier | null;
    mimeType?: string | null;
    text: string;
  } & CreateDocumentPassThroughParameters): Either<Error, Document> {
    let identifier: Identifier | undefined;
    if (identifierParameter != null) {
      identifier = identifierParameter;
    }

    let mimeType: string;
    if (mimeTypeParameter != null) {
      mimeType = mimeTypeParameter;
    } else if (convertHtmlToText(text) !== text) {
      mimeType = "text/html";
    } else {
      mimeType = "text/plain";
    }

    let textualEntity: TextualEntity;
    switch (mimeType.toLowerCase()) {
      case "text/html":
        textualEntity = new TextualEntity({
          encodingType:
            "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml",
          literalForm: text,
        });
        break;
      case "text/plain":
        textualEntity = new TextualEntity({
          encodingType:
            "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
          literalForm: text,
        });
        break;
      default:
        return Left(new Error(`unrecognized text MIME type: ${mimeType}`));
    }

    return Right(
      new Document({
        identifier,
        textualEntities: [textualEntity],
        title: title
          ? new DocumentTitle({
              encodingType:
                "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
              literalForm: title,
            })
          : undefined,
        ...passThroughParameters,
      }),
    );
  }

  private async createDocumentFromFile({
    contents,
    mimeType,
    name,
    title,
    toTempFile,
    ...passThroughParameters
  }: {
    contents: Buffer;
    mimeType: string;
    name: string;
    toTempFile: <T>(
      useTempFile: (tempFilePath: string) => Promise<T>,
    ) => Promise<T>;
  } & CreateDocumentPassThroughParameters): Promise<Either<Error, Document>> {
    switch (mimeType) {
      case "application/msword":
      case "application/pdf":
      case "application/rtf":
      case "application/vnd.oasis.opendocument.text":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "text/rtf":
        return await toTempFile(
          async (tempDocumentFilePath): Promise<Either<Error, Document>> => {
            logger.trace(
              "using temporary document file path %s",
              tempDocumentFilePath,
            );

            const extractDocument = async (
              documentFilePath: string,
            ): Promise<Either<Error, Document>> => {
              logger.trace("extracting text/HTML from %s", documentFilePath);

              const documentTextExtractor = await this.documentTextExtractor();
              if (documentTextExtractor.isLeft()) {
                return documentTextExtractor;
              }

              let documentTextExtractorResult: DocumentTextExtractor.Result;
              try {
                documentTextExtractorResult = await documentTextExtractor
                  .unsafeCoerce()
                  .extractDocumentText(documentFilePath);
              } catch (e) {
                invariant(e instanceof Error);
                return Left(e);
              }

              return Right(
                new Document({
                  textualEntities: [
                    new TextualEntity({
                      encodingType:
                        "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml",
                      literalForm: documentTextExtractorResult.html,
                    }),
                    new TextualEntity({
                      encodingType:
                        "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
                      literalForm: documentTextExtractorResult.text,
                    }),
                  ],
                  title: new DocumentTitle({
                    encodingType:
                      "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
                    literalForm: title ?? name,
                  }),
                  ...passThroughParameters,
                }),
              );
            };

            if (mimeType === "application/pdf") {
              return extractDocument(tempDocumentFilePath);
            }

            const documentFormatConverter =
              await this.documentFormatConverter();
            if (documentFormatConverter.isLeft()) {
              return documentFormatConverter;
            }
            return await tmp.withDir(
              async ({ path: tempDirectoryPath }) => {
                const tempPdfFilePath = path.resolve(
                  tempDirectoryPath,
                  "temp.pdf",
                );
                try {
                  await documentFormatConverter.unsafeCoerce().convert({
                    inputFilePath: tempDocumentFilePath,
                    outputFilePath: tempPdfFilePath,
                  });
                } catch (e) {
                  invariant(e instanceof Error);
                  return Left(e);
                }

                return await extractDocument(tempPdfFilePath);
              },
              {
                unsafeCleanup: true,
              },
            );
          },
        );
      case "text/html":
        logger.trace("document is HTML");
        return Right(
          new Document({
            textualEntities: [
              new TextualEntity({
                encodingType:
                  "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml",
                literalForm: contents.toString(),
              }),
            ],
            title: new DocumentTitle({
              encodingType:
                "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
              literalForm: title ?? name,
            }),
            ...passThroughParameters,
          }),
        );
      case "text/plain":
        logger.trace("document is plaintext");
        return Right(
          new Document({
            textualEntities: [
              new TextualEntity({
                encodingType:
                  "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
                literalForm: contents.toString(),
              }),
            ],
            title: new DocumentTitle({
              encodingType:
                "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
              literalForm: title ?? name,
            }),
            ...passThroughParameters,
          }),
        );
      default: {
        const errorMessage = `unrecognized document type: ${mimeType}`;
        logger.warn(errorMessage);
        return Left(new Error(errorMessage));
      }
    }
  }

  private documentFormatConverter(): Promise<
    Either<Error, DocumentFormatConverter>
  > {
    return DocumentFormatConverter.create({
      cacheDirectoryPath: path.resolve(
        this.cachesDirectoryPath,
        "document-format-conversions",
      ),
    });
  }

  private documentTextExtractor(): Promise<
    Either<Error, DocumentTextExtractor>
  > {
    return DocumentTextExtractor.create({
      cacheDirectoryPath: path.resolve(this.cachesDirectoryPath, "textract"),
    });
  }
}
