import {
  CorpusStub,
  Document,
  DocumentTitle,
  Prompt,
  PromptLiteralInputValue,
  PromptMessage,
  PromptMessageTemplate,
  PromptSparqlSelectInputValue,
  PromptTemplate,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { OxigraphModelSet } from "@/lib/models/impl/rdf/sparql/OxigraphModelSet";
import { dataFactory } from "@/lib/rdfEnvironment";
import { formatPromptTemplate } from "@/lib/utilities/server";
import { describe, expect, it } from "vitest";

describe("formatPromptTemplate", async () => {
  const modelSet = new RdfjsDatasetModelSet();
  await modelSet.addModel(
    new Document({
      identifier: dataFactory.namedNode("http://example.com/document/1"),
      memberOfCorpus: new CorpusStub({
        identifier: dataFactory.namedNode("http://example.com/corpus"),
      }),
      title: new DocumentTitle({
        encodingType:
          "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
        literalForm: "Test 1",
      }),
    }),
  );
  await modelSet.addModel(
    new Document({
      identifier: dataFactory.namedNode("http://example.com/document/2"),
      memberOfCorpus: new CorpusStub({
        identifier: dataFactory.namedNode("http://example.com/corpus"),
      }),
      title: new DocumentTitle({
        encodingType:
          "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
        literalForm: "Test 2",
      }),
    }),
  );
  const rdfSparqlModelSet = OxigraphModelSet.clone(modelSet);

  async function testPromptTemplate({
    expectedPrompt,
    promptTemplate,
  }: {
    expectedPrompt: Prompt;
    promptTemplate: PromptTemplate;
  }) {
    const actualPrompt = (
      await formatPromptTemplate({
        ambientInputValues: {},
        modelSet: rdfSparqlModelSet,
        promptTemplate,
      })
    ).unsafeCoerce();
    expect(actualPrompt.equals(expectedPrompt).extract()).toStrictEqual(true);
  }

  it("should format a message template with no variables", async () => {
    await testPromptTemplate({
      expectedPrompt: new Prompt({
        messages: [
          new PromptMessage({
            literalForm: "Test",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
      promptTemplate: new PromptTemplate({
        messageTemplates: [
          new PromptMessageTemplate({
            literalForm: "Test",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
    });
  });

  it("should format a message template with a message-level literal variable", async () => {
    await testPromptTemplate({
      expectedPrompt: new Prompt({
        messages: [
          new PromptMessage({
            literalForm: "Test",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
      promptTemplate: new PromptTemplate({
        inputValues: [
          new PromptLiteralInputValue({
            literalForm: "Should be overridden",
            variable: "test",
          }),
        ],
        messageTemplates: [
          new PromptMessageTemplate({
            inputValues: [
              new PromptLiteralInputValue({
                literalForm: "Test",
                variable: "test",
              }),
            ],
            literalForm: "{{test}}",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
    });
  });

  it("should format a message template with a prompt-level literal variable", async () => {
    await testPromptTemplate({
      expectedPrompt: new Prompt({
        messages: [
          new PromptMessage({
            literalForm: "Test",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
      promptTemplate: new PromptTemplate({
        inputValues: [
          new PromptLiteralInputValue({
            literalForm: "Test",
            variable: "test",
          }),
        ],
        messageTemplates: [
          new PromptMessageTemplate({
            literalForm: "{{test}}",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
    });
  });

  it("should format a message template with a message-level SPARQL SELECT variable that only has one solution", async () => {
    await testPromptTemplate({
      expectedPrompt: new Prompt({
        messages: [
          new PromptMessage({
            literalForm: "http://example.com/document/1",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
      promptTemplate: new PromptTemplate({
        messageTemplates: [
          new PromptMessageTemplate({
            inputValues: [
              new PromptSparqlSelectInputValue({
                sparqlSelect:
                  "SELECT ?document WHERE { VALUES ?document { <http://example.com/document/1> } }",
              }),
            ],
            literalForm: "{{{document}}}",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
    });
  });

  it("should format a message template with a message-level SPARQL SELECT variable that has multiple solutions", async () => {
    await testPromptTemplate({
      expectedPrompt: new Prompt({
        messages: [
          new PromptMessage({
            literalForm:
              "http://example.com/document/1 http://example.com/document/2",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
      promptTemplate: new PromptTemplate({
        messageTemplates: [
          new PromptMessageTemplate({
            inputValues: [
              new PromptSparqlSelectInputValue({
                sparqlSelect:
                  "SELECT ?document WHERE { VALUES ?document { <http://example.com/document/1> <http://example.com/document/2> } } ORDER BY ?document",
              }),
            ],
            literalForm: "{{{document0}}} {{{document1}}}",
            role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
          }),
        ],
      }),
    });
  });
});
