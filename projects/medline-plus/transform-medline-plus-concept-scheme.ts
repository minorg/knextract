import { printModelSet } from "@/cli/printModelSet";
import { Concept } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { dataFactory } from "@/lib/rdfEnvironment";
import { rdfVocabulary, skos } from "@/lib/vocabularies";
import AdmZip from "adm-zip";
import { command, positional, run } from "cmd-ts";
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
): AsyncGenerator<RdfjsDatasetModelSet> {
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(
    mplusTopicsXml,
  );
  const healthTopics = (await healthTopicsSchema.parseAsync(parsed))[
    "health-topics"
  ];

  // Transformed models
  const groupConceptsByUrl: Record<string, Concept> = {};

  // Groups concept scheme
  const groupsModelSet = new RdfjsDatasetModelSet();
  // Manually construct some minimal SKOS for the groups ConceptScheme and Concepts instead of having a more general rdf.mem.ConceptScheme.clone.
  const groupsConceptSchemeIdentifier = groupsModelSet.mutableResourceSet
    .mutableNamedResource({
      identifier: dataFactory.namedNode(
        "urn:medline-plus:health-topics:groups",
      ),
      mutateGraph: dataFactory.defaultGraph(),
    })
    .add(rdfVocabulary.type, skos.ConceptScheme)
    .add(
      skos.prefLabel,
      dataFactory.literal("MedlinePlus Health Topic Groups"),
    ).identifier;
  const groupsConceptScheme = groupsModelSet
    .conceptSchemeSync(groupsConceptSchemeIdentifier)
    .unsafeCoerce();

  for (const healthTopic of healthTopics["health-topic"]) {
    if (healthTopic["@_language"] !== "English") {
      continue;
    }

    for (const group of arrayOrSingletonArray(healthTopic.group)) {
      let groupConcept = groupConceptsByUrl[group["@_url"]];
      if (!groupConcept) {
        const groupConceptIdentifier = groupsModelSet.mutableResourceSet
          .mutableNamedResource({
            identifier: dataFactory.namedNode(group["@_url"]),
            mutateGraph: dataFactory.defaultGraph(),
          })
          .add(rdfVocabulary.type, skos.Concept)
          .add(skos.prefLabel, dataFactory.literal(group["#text"])).identifier;
        groupsModelSet.mutableResourceSet
          .mutableNamedResource({
            identifier: groupsConceptScheme.identifier,
            mutateGraph: dataFactory.defaultGraph(),
          })
          .add(skos.hasTopConcept, groupConceptIdentifier);

        groupConcept = groupConceptsByUrl[group["@_url"]] = groupsModelSet
          .conceptSync(groupConceptIdentifier)
          .unsafeCoerce();
      }
    }
  }

  yield groupsModelSet;
}

const cmd = command({
  name: "transform-medline-plus-concept-scheme",
  args: {
    mplusTopicsCompressedZipFilePath: positional({
      displayName: "mplusTopicsCompressedZipFilePath",
      description: "path to an mplus_topics_compressed .zip file to transform",
    }),
  },
  handler: async ({ mplusTopicsCompressedZipFilePath }) => {
    const zipFile = new AdmZip(mplusTopicsCompressedZipFilePath);
    const zipEntries = zipFile.getEntries();
    invariant(zipEntries.length === 1);
    const mplusTopicsXml = zipFile.readAsText(zipEntries[0]);
    for await (const modelSet of transform(mplusTopicsXml)) {
      await printModelSet(modelSet);
    }
  },
});

run(cmd, process.argv.slice(2));
