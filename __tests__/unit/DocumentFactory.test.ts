import fs from "node:fs";
import path from "node:path";
import { cachesDirectoryPath } from "@/__tests__/unit/caches/cachesDirectoryPath";
import { testData } from "@/__tests__/unit/data";
import { expectTermsEqual } from "@/__tests__/unit/models/expectTermsEqual";
import { DocumentFactory } from "@/lib/DocumentFactory";
import { Document, Identifier, stubify } from "@/lib/models";
import { describe, it } from "vitest";

function documentHtml(document: Document): string | undefined {
  return document.textualEntities.find(
    (textualEntity) =>
      textualEntity.encodingType.value ===
      "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml",
  )?.literalForm;
}

function documentText(document: Document): string | undefined {
  return document.textualEntities.find(
    (textualEntity) =>
      textualEntity.encodingType.value ===
      "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
  )?.literalForm;
}

describe("DocumentFactory", async () => {
  const memberOfCorpus = stubify(
    testData.synthetic.corpora.withSyntheticDocuments,
  );
  const mutable = true;
  const title = "Test document title";

  const sut = new DocumentFactory({
    cachesDirectoryPath,
  });
  const testDocumentHtml = (
    await fs.promises.readFile(testData.testDocumentFilePaths.html)
  )
    .toString()
    .trim();
  const testDocumentText = (
    await fs.promises.readFile(testData.testDocumentFilePaths.txt)
  )
    .toString()
    .trim();

  Object.values(testData.testDocumentFilePaths).forEach(
    (testDocumentFilePath) => {
      it(`should create a document from a local file ${testDocumentFilePath}`, async ({
        expect,
      }) => {
        switch (path.extname(testDocumentFilePath)) {
          case ".html":
          case ".txt":
            break;
          default:
            if (process.env["CI"]) {
              return;
            }
            break;
        }

        const document = (
          await sut.createDocumentFromLocalFile({
            filePath: testDocumentFilePath,
            memberOfCorpus,
            mutable,
          })
        ).unsafeCoerce();

        expect(document.mutable).toStrictEqual(mutable);
        expect(document.title.extractNullable()?.literalForm).toStrictEqual(
          path.basename(testDocumentFilePath),
        );

        switch (path.extname(testDocumentFilePath)) {
          case ".html":
            expect(documentHtml(document)).toStrictEqual(testDocumentHtml);
            break;
          case ".txt":
            expect(documentText(document)?.trim()).toStrictEqual(
              testDocumentText,
            );
            break;
          default:
            expect(documentHtml(document)).to.include("Test document");
            expect(documentText(document)).to.include("Test document");
            break;
        }
      });
    },
  );

  it("should create a file from a file upload", async ({ expect }) => {
    const text = "test";
    const array = new TextEncoder().encode(text);
    const document = (
      await sut.createDocumentFromFileUpload({
        // @ts-ignore
        fileUpload: {
          arrayBuffer: async () => array.buffer as ArrayBuffer,
          // bytes: async () => array,
          lastModified: Date.now(),
          name: "test.txt",
          size: array.length,
          slice: () => {
            throw new Error("not implemented");
          },
          stream: () => {
            throw new Error("not implemented");
          },
          text: () => {
            throw new Error("not implemented");
          },
          type: "text/plain",
          webkitRelativePath: "",
        },
        memberOfCorpus,
        mutable,
        title,
      })
    ).unsafeCoerce();
    expect(documentHtml(document)).toBeUndefined();
    expect(document.mutable).toStrictEqual(mutable);
    expect(documentText(document)).toStrictEqual(text);
    expect(document.title.extractNullable()?.literalForm).toStrictEqual(title);
  });

  it("should create a document from HTML text (no MIME type)", async ({
    expect,
  }) => {
    const document = sut
      .createDocumentFromText({
        memberOfCorpus,
        mutable,
        text: testDocumentHtml,
        title,
      })
      .unsafeCoerce();
    expect(documentHtml(document)).toStrictEqual(testDocumentHtml);
    expect(document.mutable).toStrictEqual(mutable);
    expect(documentText(document)).toBeUndefined();
    expect(document.title.extractNullable()?.literalForm).toStrictEqual(title);
  });

  it("should create a document from plain text (no MIME type)", async ({
    expect,
  }) => {
    const document = sut
      .createDocumentFromText({
        memberOfCorpus,
        mutable,
        text: testDocumentText,
        title,
      })
      .unsafeCoerce();
    expect(documentHtml(document)).toBeUndefined();
    expect(document.mutable).toStrictEqual(mutable);
    expect(documentText(document)).toStrictEqual(testDocumentText);
    expect(document.title.extractNullable()?.literalForm).toStrictEqual(title);
  });

  it("should create a document from plain text (explicit text/html type)", async ({
    expect,
  }) => {
    const document = sut
      .createDocumentFromText({
        memberOfCorpus,
        mimeType: "text/html",
        mutable,
        text: testDocumentText,
        title,
      })
      .unsafeCoerce();
    expect(documentHtml(document)).toStrictEqual(testDocumentText);
    expect(document.mutable).toStrictEqual(mutable);
    expect(documentText(document)).toBeUndefined();
    expect(document.title.extractNullable()?.literalForm).toStrictEqual(title);
  });

  it("should create a document from plain text (explicit identifier)", async ({
    expect,
  }) => {
    const identifier = Identifier.fromString("http://example.com/document");
    const document = sut
      .createDocumentFromText({
        identifier,
        memberOfCorpus,
        mutable,
        text: testDocumentText,
        title,
      })
      .unsafeCoerce();
    expectTermsEqual(identifier, document.identifier);
    expect(document.mutable).toStrictEqual(mutable);
    expect(document.title.extractNullable()?.literalForm).toStrictEqual(title);
  });
});
