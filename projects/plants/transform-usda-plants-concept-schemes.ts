import { printModelSet } from "@/cli/printModelSet";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { dataFactory } from "@/lib/rdfEnvironment";
import { UsdaPlantsDatabase } from "@/projects/plants/UsdaPlantsDatabase";
import { NamedNode } from "@rdfjs/types";
import { rdf, skos } from "@tpluscode/rdf-ns-builders";
import { command, run } from "cmd-ts";

const cmd = command({
  name: "transform-usda-plants-concept-schemes",
  args: {},
  handler: async () => {
    const transformedCharacteristicsByName: Record<
      string,
      {
        conceptScheme?: NamedNode;
        concepts: Record<string, NamedNode>;
        loggedMissingDefinition?: boolean;
      }
    > = {};

    for await (const plantProfile of new UsdaPlantsDatabase().plantProfiles()) {
      for (const characteristic of plantProfile.characteristics) {
        let transformedCharacteristic =
          transformedCharacteristicsByName[characteristic.name.text];
        if (!transformedCharacteristic) {
          transformedCharacteristic = transformedCharacteristicsByName[
            characteristic.name.text
          ] = { concepts: {} };
        }

        if (!characteristic.definition) {
          if (
            typeof transformedCharacteristic.loggedMissingDefinition ===
            "undefined"
          ) {
            process.stderr.write(
              `characteristic ${characteristic.name.text} has no definition\n`,
            );
            transformedCharacteristic.loggedMissingDefinition = true;
          }
          continue;
        }

        if (characteristic.value.term.termType !== "NamedNode") {
          // Ignore numeric values
          continue;
        }

        if (!transformedCharacteristic.conceptScheme) {
          const conceptSchemeModelSet = new RdfjsDatasetModelSet();
          // Manually construct some minimal SKOS for the groups ConceptScheme and Concepts instead of having a more general rdf.mem.ConceptScheme.clone.
          transformedCharacteristic.conceptScheme =
            conceptSchemeModelSet.mutableResourceSet
              .mutableNamedResource({
                identifier: characteristic.name.iri,
                mutateGraph: dataFactory.defaultGraph(),
              })
              .add(rdf.type, skos.ConceptScheme)
              .add(
                skos.definition,
                dataFactory.literal(characteristic.definition.text),
              )
              .add(
                skos.prefLabel,
                dataFactory.literal(characteristic.name.text),
              ).identifier;
          await printModelSet(conceptSchemeModelSet);
        }

        if (
          typeof transformedCharacteristic.concepts[
            characteristic.value.text
          ] === "undefined"
        ) {
          if (
            characteristic.definition.values.length > 0 &&
            !characteristic.definition.values.some(
              (definitionValue) =>
                definitionValue.text === characteristic.value.text,
            )
          ) {
            process.stderr.write(
              `plant profile ${plantProfile.symbol} has characteristic ${characteristic.name.text} with undefined value "${characteristic.value.text}" (defined values: ${JSON.stringify(characteristic.definition.values.map((value) => value.text))})\n`,
            );
          }

          const conceptModelSet = new RdfjsDatasetModelSet();
          transformedCharacteristic.concepts[characteristic.value.text] =
            conceptModelSet.mutableResourceSet
              .mutableNamedResource({
                identifier: characteristic.value.term,
                mutateGraph: dataFactory.defaultGraph(),
              })
              .add(rdf.type, skos.Concept)
              .add(
                skos.prefLabel,
                dataFactory.literal(characteristic.value.text),
              )
              .add(
                skos.topConceptOf,
                transformedCharacteristic.conceptScheme!,
              ).identifier;
          await printModelSet(conceptModelSet);
        }
      }
    }
  },
});

run(cmd, process.argv.slice(2));
