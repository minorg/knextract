import path from "node:path";
import { fileURLToPath } from "node:url";
import { RdfModelSetTestData } from "@/__tests__/unit/data/RdfModelSetTestData";
import { SyntheticTestData } from "@/__tests__/unit/data/SyntheticTestData";
import { Project } from "@/lib/Project";

const testDataDirectoryPath = path.dirname(fileURLToPath(import.meta.url));

const medlinePlus = await RdfModelSetTestData.fromProject(
  new Project({
    env: {},
    rootDirectoryPath: path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "..",
      "projects",
      "test",
    ),
  }),
);

const testDocumentFilePath = (key: string) =>
  path.resolve(testDataDirectoryPath, `test_document.${key}`);

export const testData = {
  medlinePlus,
  synthetic: await SyntheticTestData.create(medlinePlus),
  testDocumentFilePaths: {
    doc: testDocumentFilePath("doc"),
    docx: testDocumentFilePath("docx"),
    html: testDocumentFilePath("html"),
    odt: testDocumentFilePath("odt"),
    pdf: testDocumentFilePath("pdf"),
    rtf: testDocumentFilePath("rtf"),
    txt: testDocumentFilePath("txt"),
  },
};
