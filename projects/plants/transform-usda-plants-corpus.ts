import { printModels } from "@/cli/printModels";
import {
  CategoricalValue,
  Claim,
  ConceptStub,
  Corpus,
  Document,
  DocumentTitle,
  stubify,
} from "@/lib/models";
import { dataFactory } from "@/lib/rdfEnvironment";
import { UsdaPlantsDatabase } from "@/projects/plants/UsdaPlantsDatabase";
import { dcterms } from "@tpluscode/rdf-ns-builders";
import { command, run } from "cmd-ts";

const cmd = command({
  name: "transform-usda-plants-corpus",
  args: {},
  handler: async () => {
    const corpus = new Corpus({
      label: "USDA Plants",
    });
    const corpusStub = stubify(corpus);
    await printModels(corpus);

    for await (const plantProfile of new UsdaPlantsDatabase().plantProfiles()) {
      const document = new Document({
        identifier: dataFactory.namedNode(plantProfile.url),
        memberOfCorpus: corpusStub,
        title: new DocumentTitle({
          encodingType:
            "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
          literalForm: plantProfile.commonName ?? plantProfile.scientificSort,
        }),
        url: plantProfile.url,
      });
      await printModels(document);

      for (const characteristic of plantProfile.characteristics) {
        if (characteristic.value.term.termType !== "NamedNode") {
          continue;
        }
        await printModels(
          new Claim({
            object: new CategoricalValue({
              value: ConceptStub.create({
                identifier: characteristic.value.term,
              }),
            }),
            predicate: dcterms.subject,
            subject: document.identifier,
            gold: true,
          }),
        );
      }
    }
  },
});

run(cmd, process.argv.slice(2));
