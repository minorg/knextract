import path from "node:path";
import { dataFactory } from "@/lib/rdfEnvironment";

// Separate test data for end-to-end tests to avoid Playwright ESM import issues
const testDataDirectoryPath = path.resolve(__dirname, "..", "unit", "data");

export const testData = {
  medlinePlus: {
    concept: {
      displayLabel: "Blood, Heart and Circulation",
      identifier: dataFactory.namedNode(
        "https://medlineplus.gov/bloodheartandcirculation.html",
      ),
    },
    conceptScheme: {
      displayLabel: "MedlinePlus Health Topic Groups",
      identifier: dataFactory.namedNode(
        "urn:medline-plus:health-topics:groups",
      ),
    },
    corpus: {
      displayLabel: "Medline Plus Health Topics 2024-06-06",
      identifier: dataFactory.namedNode(
        "urn:medline-plus:health-topics:2024-06-06",
      ),
    },
    document: {
      claims: [
        {
          concept: {
            displayLabel: "Diabetes Mellitus",
            identifier: dataFactory.namedNode(
              "https://medlineplus.gov/diabetesmellitus.html",
            ),
          },
          identifier: dataFactory.namedNode(
            "urn:knextract:conceptAnnotation:3b49d8bc31ce7b291c9963d024123756b0a49e44f290364fd0e877108bcbbe3c",
          ),
        },
        {
          concept: {
            displayLabel: "Diagnostic Tests",
            identifier: dataFactory.namedNode(
              "https://medlineplus.gov/diagnostictests.html",
            ),
          },
          identifier: dataFactory.namedNode(
            "urn:knextract:conceptAnnotation:4a26307b30bf61f13e192591886b304dd607e758f89ebbcc2bb59b7b4b0ec38a",
          ),
        },
        {
          concept: {
            displayLabel: "Glycated Hemoglobin",
            identifier: dataFactory.namedNode(
              "http://id.nlm.nih.gov/mesh/2024/D006442",
            ),
          },
          identifier: dataFactory.namedNode(
            "urn:knextract:conceptAnnotation:922db7b4e941830e1aa2b535e9c2cfdc0d4706967156d9a200d6ca00766bbb5c",
          ),
        },
      ],
      displayLabel: "A1C",
      identifier: dataFactory.namedNode("https://medlineplus.gov/a1c.html"),
    },
  },
  test: {
    document: {
      filePath: path.resolve(testDataDirectoryPath, "test_document.txt"),
    },
  },
  synthetic: {
    corpus: {
      displayLabel: "Test corpus (with synthetic documents)",
      document: {
        identifier: dataFactory.namedNode(
          "http://example.com/document/mutable-only",
        ),
      },
      identifier: dataFactory.namedNode(
        "http://example.com/corpus/with-synthetic-documents",
      ),
    },
    workflow: {
      displayLabel: "singleAllConceptsConceptAnnotatorStep",
      identifier: dataFactory.namedNode(
        "http://example.com/workflow/singleAllConceptsConceptAnnotatorStep",
      ),
    },
  },
};
