import fs from "node:fs";
import path from "node:path";
import { cachesDirectoryPath } from "@/__tests__/unit/caches/cachesDirectoryPath";
import { testData } from "@/__tests__/unit/data";
import { DocumentFactory } from "@/lib/DocumentFactory";
import { Corpus, Identifier, Stub } from "@/lib/models";
import { synthetic } from "@/lib/models/impl";
import { describe, it } from "vitest";

describe("DocumentFactory", async () => {
  const memberOfCorpus: Stub<Corpus> = synthetic.Stub.fromModel(
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
            expect(document.html.unsafeCoerce()).toStrictEqual(
              testDocumentHtml,
            );
            break;
          case ".txt":
            expect(document.text.unsafeCoerce().trim()).toStrictEqual(
              testDocumentText,
            );
            break;
          default:
            expect(document.html.unsafeCoerce()).to.include("Test document");
            expect(document.text.unsafeCoerce()).to.include("Test document");
            break;
        }
      });
    },
  );

  it("should create a file from a file upload", async ({ expect }) => {
    const text = "test";
    const buffer = new TextEncoder().encode(text);
    const document = (
      await sut.createDocumentFromFileUpload({
        fileUpload: {
          arrayBuffer: async () => buffer,
          lastModified: Date.now(),
          name: "test.txt",
          size: buffer.length,
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
    expect(document.html.extractNullable()).toBeNull();
    expect(document.mutable).toStrictEqual(mutable);
    expect(document.text.unsafeCoerce()).toStrictEqual(text);
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
    expect(document.html.unsafeCoerce()).toStrictEqual(testDocumentHtml);
    expect(document.mutable).toStrictEqual(mutable);
    expect(document.text.extractNullable()).toBeNull();
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
    expect(document.html.extractNullable()).toBeNull();
    expect(document.mutable).toStrictEqual(mutable);
    expect(document.text.unsafeCoerce()).toStrictEqual(testDocumentText);
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
    expect(document.html.unsafeCoerce()).toStrictEqual(testDocumentText);
    expect(document.mutable).toStrictEqual(mutable);
    expect(document.text.extractNullable()).toBeNull();
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
    expect(document.identifier.equals(identifier)).toStrictEqual(true);
    expect(document.mutable).toStrictEqual(mutable);
    expect(document.title.extractNullable()?.literalForm).toStrictEqual(title);
  });
});
