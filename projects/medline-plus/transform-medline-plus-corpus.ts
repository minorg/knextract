import { printModelSet } from "@/cli/printModelSet";
import {
  CategoricalValue,
  Claim,
  ConceptStub,
  Corpus,
  Document,
  DocumentTitle,
  TextualEntity,
  stubify,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { dataFactory } from "@/lib/rdfEnvironment";
import { dcterms } from "@tpluscode/rdf-ns-builders";
import AdmZip from "adm-zip";
import { command, flag, positional, run } from "cmd-ts";
import { XMLParser } from "fast-xml-parser";
import invariant from "ts-invariant";
import { healthTopicsSchema } from "./medlinePlusXmlSchema";

function arrayOrSingletonArray<T extends object>(obj: T | T[]): T[] {
  if (Array.isArray(obj)) {
    return obj;
  }
  return [obj];
}

async function* transform(
  mplusTopicsXml: string,
  options?: { sample?: boolean },
): AsyncGenerator<RdfjsDatasetModelSet> {
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(
    mplusTopicsXml,
  );
  const sample = !!options?.sample;
  const healthTopics = (await healthTopicsSchema.parseAsync(parsed))[
    "health-topics"
  ];

  // Health Topics corpus
  const corpus = new Corpus({
    identifier: dataFactory.namedNode(
      `urn:medline-plus:health-topics:${healthTopics["@_date-generated"].toISOString().split("T")[0]}`,
    ),
    label: `Medline Plus Health Topics ${healthTopics["@_date-generated"].toISOString().split("T")[0]}`,
  });
  const corpusStub = stubify(corpus);
  yield new RdfjsDatasetModelSet().addModelSync(corpus);

  const groupDocumentCountsByDocumentUrl: Record<string, number> = {};
  for (const healthTopic of healthTopics["health-topic"]) {
    if (healthTopic["@_language"] !== "English") {
      continue;
    }

    // Count the number of documents in each group
    // If sampling, include two representative documents for each group.
    let includeDocument = false;
    for (const group of arrayOrSingletonArray(healthTopic.group)) {
      groupDocumentCountsByDocumentUrl[group["@_url"]] =
        (groupDocumentCountsByDocumentUrl[group["@_url"]] ?? 0) + 1;
      if (!sample || groupDocumentCountsByDocumentUrl[group["@_url"]] <= 2) {
        includeDocument = true;
      }
    }
    if (!includeDocument) {
      continue;
    }

    const document = new Document({
      textualEntities: [
        new TextualEntity({
          encodingType:
            "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml",
          literalForm: healthTopic["full-summary"],
        }),
      ],
      identifier: dataFactory.namedNode(healthTopic["@_url"]),
      memberOfCorpus: corpusStub,
      title: new DocumentTitle({
        encodingType:
          "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
        literalForm: healthTopic["@_title"],
      }),
      url: healthTopic["@_url"],
    });
    yield new RdfjsDatasetModelSet().addModelSync(document);

    for (const group of arrayOrSingletonArray(healthTopic.group)) {
      yield new RdfjsDatasetModelSet().addModelSync(
        new Claim({
          gold: true,
          predicate: dcterms.subject,
          object: new CategoricalValue({
            value: ConceptStub.create({
              identifier: dataFactory.namedNode(group["@_url"]),
              prefLabel: [dataFactory.literal(group["#text"])],
            }),
          }),
          subject: document.identifier,
        }),
      );
    }

    if (healthTopic["mesh-heading"]) {
      for (const meshHeading of arrayOrSingletonArray(
        healthTopic["mesh-heading"],
      )) {
        yield new RdfjsDatasetModelSet().addModelSync(
          new Claim({
            gold: true,
            object: new CategoricalValue({
              value: ConceptStub.create({
                identifier: dataFactory.namedNode(
                  `http://id.nlm.nih.gov/mesh/${healthTopics["@_date-generated"].getFullYear()}/${meshHeading["descriptor"]["@_id"]}`,
                ),
              }),
            }),
            predicate: dcterms.subject,
            subject: document.identifier,
          }),
        );
      }
    }
  }
}

const cmd = command({
  name: "transform-medline-plus-corpus",
  args: {
    mplusTopicsCompressedZipFilePath: positional({
      displayName: "mplusTopicsCompressedZipFilePath",
      description: "path to an mplus_topics_compressed .zip file to transform",
    }),
    sample: flag({
      long: "sample",
    }),
  },
  handler: async ({ mplusTopicsCompressedZipFilePath, sample }) => {
    const zipFile = new AdmZip(mplusTopicsCompressedZipFilePath);
    const zipEntries = zipFile.getEntries();
    invariant(zipEntries.length === 1);
    const mplusTopicsXml = zipFile.readAsText(zipEntries[0]);
    for await (const modelSet of transform(mplusTopicsXml, { sample })) {
      await printModelSet(modelSet);
    }
  },
});

run(cmd, process.argv.slice(2));
