import fs from "node:fs";
import path from "node:path";
import { dataFactory } from "@/lib/rdfEnvironment";
import { convertHtmlToText } from "@/lib/utilities";
import { Literal, NamedNode } from "@rdfjs/types";
import { toRdf } from "rdf-literal";
import { z } from "zod";

const jsonObjectSchema = z.object({
  characteristics: z.any(),
  CommonName: z.string().nullable(),
  Id: z.number(),
  ScientificName: z.string().transform((arg) => convertHtmlToText(arg)),
  ScientificSort: z.string(),
  Symbol: z.string(),
});

// Converted from https://plants.usda.gov/assets/docs/PLANTS_Help_Document.pdf
const plantProfileCharacteristicDefinitionsByName: Record<
  string,
  {
    readonly text: string;
    readonly values: readonly string[];
  }
> = {
  "Active Growth Period": {
    text: "Plants have their most active growth in which seasonal period?",
    values: [
      "Spring",
      "Spring & Fall",
      "Spring & Summer",
      "Spring Summer & Fall",
      "Summer",
      "Summer & Fall",
      "Fall",
      "Fall Winter & Spring",
      "Year-round",
    ],
  },
  "After Harvest Regrowth Rate": {
    text: "What is the relative rate of regrowth of a herbaceous plant after a harvest of above ground herbage? Woody plants are left blank here.",
    values: ["Slow", "Moderate", "Rapid"],
  },
  Bloat: {
    text: "What is the relative potential of an herbaceous plant to cause bloat in livestock? Woody plants are scored 'None' here by default.",
    values: ["None", "Low", "Medium", "High"],
  },
  "C:N Ratio": {
    text: "C:N ratio is the percentage of organic carbon divided by the percentage of total nitrogen in organic material. We specify the organic material as either the above-ground biomass of an herbaceous plant or the above-ground herbaceous material of a woody plant.",
    values: ["Low", "Medium", "High"],
  },
  "Coppice Potential": {
    text: "Is the tree or shrub suitable for the coppice method of silviculture? Coppicing completely removes the canopy of woody plants, cutting them at or just above ground level.",
    values: ["Yes", "No"],
  },
  "Fall Conspicuous": {
    text: "Are the leaves or fruits conspicuous during Autumn from a landscaping aesthetics standpoint?",
    values: ["Yes", "No"],
  },
  "Fire Resistant": {
    text: "Is the plant known to resist burning? If the plant can carry a fire—and most can—this value will be no.",
    values: ["Yes", "No"],
  },
  "Flower Color": {
    text: "What is the predominant color of the flowers?",
    values: [
      "Blue",
      "Brown",
      "Green",
      "Orange",
      "Purple",
      "Red",
      "White",
      "Yellow",
    ],
  },
  "Flower Conspicuous": {
    text: "Are the flowers conspicuous from a landscaping aesthetics standpoint?",
    values: ["Yes", "No"],
  },
  "Foliage Color": {
    text: "What is the predominant color of the foliage?",
    values: [
      "Dark Green",
      "Green",
      "Gray-Green",
      "Red",
      "White-Gray",
      "Yellow-Green",
    ],
  },
  "Foliage Porosity Summer": {
    text: "How porous is the foliage during the summer months?",
    values: ["Porous", "Moderate", "Dense"],
  },
  "Foliage Porosity Winter": {
    text: "How porous is the foliage during the winter months?",
    values: ["Porous", "Moderate", "Dense"],
  },
  "Foliage Texture": {
    text: "What is the general texture of the plant’s foliage relative to other species with the same growth habit?",
    values: ["Fine", "Medium", "Coarse"],
  },
  "Fruit/Seed Color": {
    text: "What is the predominant and conspicuous color of the mature fruit or seed from a landscaping aesthetics standpoint?",
    values: [
      "Black",
      "Blue",
      "Brown",
      "Green",
      "Orange",
      "Purple",
      "Red",
      "White",
      "Yellow",
    ],
  },
  "Fruit/Seed Conspicuous": {
    text: "Is the fruit or seed conspicuous from a landscaping aesthetics standpoint?",
    values: ["Yes", "No"],
  },
  "Growth Form": {
    text: "What is the primary growth form on the landscape in relation to soil stabilization on slopes and streamsides? Each plant species is assigned the single growth form that most enhances its ability to stabilize soil.",
    values: [
      "Bunch",
      "Colonizing",
      "Multiple Stems",
      "Rhizomatous",
      "Single Crown",
      "Single Stem",
      "Stoloniferous",
      "Thicket Forming",
    ],
  },
  "Growth Rate": {
    text: "What is the growth rate after successful establishment relative to other species with the same growth habit?",
    values: ["Slow", "Moderate", "Rapid"],
  },
  "Height at Maturity": {
    text: "Expected height (in feet) of the plant at maturity. This is an estimate of the median mature height for planning purposes.",
    values: [],
  },
  "Known Allelopath": {
    text: "Has this plant species been shown to be allelopathic to at least one other species?",
    values: ["Yes", "No"],
  },
  "Leaf Retention": {
    text: "Does the tree, shrub, or sub-shrub retain its leaves year-round? Plants with other growth habits are scored 'No' by default.",
    values: ["Yes", "No"],
  },
  Lifespan: {
    text: "What is the expected lifespan (in years) of a perennial plant relative to other species with the same growth habit? For Trees: Short < 100; Moderate: 100-250; Long > 250.",
    values: ["Short", "Moderate", "Long"],
  },
  "Low Growing Grass": {
    text: 'Does the growing point (terminal meristem) of the vegetative grass tiller remain either at or near the crown? Plants other than grasses are scored "No" here by default.',
    values: ["Yes", "No"],
  },
  "Nitrogen Fixation": {
    text: "How much nitrogen is fixed by this plant in monoculture? Relative values are None (0 lb. N/acre/year); Low (<85); Medium (85-160); High (>160).",
    values: ["None", "Low", "Medium", "High"],
  },
  "Resprout Ability": {
    text: "Will the woody perennial resprout following top (above ground biomass) removal? Herbaceous plants are scored 'No' by default.",
    values: ["Yes", "No"],
  },
  "Shape and Orientation": {
    text: "What is the growth form or predominant shape of an individual plant? (This characteristic is especially useful for selecting species for windbreaks.)",
    values: [
      "Climbing",
      "Columnar",
      "Conical",
      "Decumbent",
      "Erect",
      "Irregular",
      "Oval",
      "Prostrate",
      "Rounded",
      "Semi-Erect",
      "Vase",
    ],
  },
  Toxicity: {
    text: "What is the relative toxicity of the plant to either humans or livestock?",
    values: ["None", "Slight", "Moderate", "Severe"],
  },
  "Adapted to Coarse Textured Soils": {
    text: "Can this plant establish and grow in soil with a coarse-textured surface layer?",
    values: ["Yes", "No"],
  },
  "Adapted to Medium Textured Soils": {
    text: "Can this plant establish and grow in soil with a medium-textured surface layer?",
    values: ["Yes", "No"],
  },
  "Adapted to Fine Textured Soils": {
    text: "Can this plant establish and grow in soil with a fine-textured surface layer?",
    values: ["Yes", "No"],
  },
  "Anaerobic Tolerance": {
    text: "What is the relative tolerance to anaerobic soil conditions?",
    values: ["None", "Low", "Medium", "High"],
  },
  "CaCO3 Tolerance": {
    text: "What is the relative tolerance to calcareous soil? Calcareous soil is defined as soil containing sufficient free CaCO3 and other carbonates to effervesce visibly or audibly when treated with cold 0.1M HCl.",
    values: ["None", "Low", "Medium", "High"],
  },
  "Cold Stratification Required": {
    text: "Will cold stratification significantly increase the seed germination percentage of this plant?",
    values: ["Yes", "No"],
  },
  "Drought Tolerance": {
    text: "What is the relative tolerance of the plant to drought conditions compared to other species with the same growth habit from the same geographical region?",
    values: ["None", "Low", "Medium", "High"],
  },
  "Fertility Requirement": {
    text: "What relative level of nutrition (N, P, K) is required for normal growth and development?",
    values: ["Low", "Medium", "High"],
  },
  "Fire Tolerance": {
    text: "What is the relative ability to resprout, regrow, or reestablish from residual seed after a fire?",
    values: ["None", "Low", "Medium", "High"],
  },
  "Frost Free Days, Minimum": {
    text: "The minimum average number of frost-free days within the plant’s known geographical range. For cultivars, this refers to the area where the cultivar is well adapted rather than marginally adapted.",
    values: [],
  },
  "Hedge Tolerance": {
    text: 'What is the relative tolerance of woody perennials to hedging (close cropping) by livestock or wildlife? Herbaceous plants are scored "None" here by default.',
    values: ["None", "Low", "Medium", "High"],
  },
  "Moisture Use": {
    text: "Ability to use (i.e., remove) available soil moisture relative to other species in the same (or similar) soil moisture availability region.",
    values: ["Low", "Medium", "High"],
  },
  "pH, Minimum": {
    text: "The minimum soil pH, of the top 12 inches of soil, within the plant’s known geographical range. For cultivars, this applies to the area where the cultivar is well adapted rather than marginally adapted.",
    values: [],
  },
  "pH, Maximum": {
    text: "The maximum soil pH, of the top 12 inches of soil, within the plant’s known geographical range. For cultivars, this applies to the area where the cultivar is well adapted rather than marginally adapted.",
    values: [],
  },
  "Planting Density Per Acre, Minimum": {
    text: "Recommended minimum number of individual plants to plant per acre.",
    values: [],
  },
  "Planting Density Per Acre, Maximum": {
    text: "Recommended maximum number of individual plants to plant per acre.",
    values: [],
  },
  "Precipitation, Minimum": {
    text: "Minimum tolerable rainfall (in inches), expressed as the average annual minimum precipitation that occurs 20% of the time at the driest climate station within the plant's known range.",
    values: [],
  },
  "Precipitation, Maximum": {
    text: "Maximum tolerable rainfall (in inches), expressed as the annual average precipitation at the wettest climate station within the plant’s known range.",
    values: [],
  },
  "Root Depth, Minimum": {
    text: "The minimum depth of soil (in inches) required for good growth. Plants without roots, such as rootless aquatic plants, are assigned a minimum root depth value of zero.",
    values: [],
  },
  "Salinity Tolerance": {
    text: "What is the plant’s tolerance to soil salinity? None = tolerant to 0-2 dS/m; Low = 2.1-4.0 dS/m; Medium = 4.1-8.0 dS/m; High = >8.0 dS/m.",
    values: ["None", "Low", "Medium", "High"],
  },
  "Shade Tolerance": {
    text: "What is the relative tolerance to shade conditions?",
    values: ["Intolerant", "Intermediate", "Tolerant"],
  },
  "Temperature, Minimum": {
    text: "The minimum tolerable temperature is the lowest temperature recorded in the plant’s historical range. If this is not available, the record low January temperature recorded at climate stations within the current geographical range of the plant is used. This definition does not apply to summer annuals.",
    values: [],
  },
  "Bloom Period": {
    text: "During what seasonal period in the U.S. does the plant bloom the most? The bloom period is defined as the time when pollen is shed and stigmas are receptive.",
    values: [
      "Spring",
      "Early Spring",
      "Mid Spring",
      "Late Spring",
      "Summer",
      "Early Summer",
      "Mid Summer",
      "Late Summer",
      "Fall",
      "Winter",
      "Late Winter",
      "Indeterminate",
    ],
  },
  "Commercial Availability": {
    text: "What is the availability of plant propagules in the commercial marketplace?",
    values: [
      "No known source",
      "Routinely available",
      "Contracting only",
      "Field collections only",
    ],
  },
  "Fruit/Seed Abundance": {
    text: "What is the amount of seed produced by the plant compared to other species with the same growth habit?",
    values: ["None", "Low", "Medium", "High"],
  },
  "Fruit/Seed Period Begin": {
    text: "Season in which the earliest fruit or seed of the fruit/seed period is visually obvious.",
    values: ["Spring", "Summer", "Fall", "Winter", "Year-round"],
  },
  "Fruit/Seed Period End": {
    text: "Season in which the latest fruit or seed of the fruit/seed period is visually obvious.",
    values: ["Spring", "Summer", "Fall", "Winter", "Year-round"],
  },
  "Fruit/Seed Persistence": {
    text: "Are the fruit or seed generally recognized as being persistent on the plant?",
    values: ["Yes", "No"],
  },
  "Propagated by Bare Root": {
    text: "Is it practical to propagate this plant as a bare root product?",
    values: ["Yes", "No"],
  },
  "Propagated by Bulb": {
    text: "Is it practical to propagate this plant as bulbs?",
    values: ["Yes", "No"],
  },
  "Propagated by Container": {
    text: "Does the plant lend itself to being developed as a container product?",
    values: ["Yes", "No"],
  },
  "Propagated by Corm": {
    text: "Is it practical to propagate this plant as corms?",
    values: ["Yes", "No"],
  },
  "Propagated by Cuttings": {
    text: "Is it practical to propagate this plant as either stem or root cuttings?",
    values: ["Yes", "No"],
  },
  "Propagated by Seed": {
    text: "Is it practical to propagate this plant by seed?",
    values: ["Yes", "No"],
  },
  "Propagated by Sod": {
    text: "Does the plant lend itself to being developed as a sod product?",
    values: ["Yes", "No"],
  },
  "Propagated by Sprigs": {
    text: "Is it practical to propagate this plant by sprigs?",
    values: ["Yes", "No"],
  },
  "Propagated by Tubers": {
    text: "Is it practical to propagate this plant by tubers?",
    values: ["Yes", "No"],
  },
  "Seed per Pound": {
    text: "How many seeds per pound are in an average seed lot?",
    values: [],
  },
  "Seed Spread Rate": {
    text: "What is the capability of the plant to spread through its seed production compared to other species with the same growth habit?",
    values: ["None", "Slow", "Moderate", "Rapid"],
  },
  "Seedling Vigor": {
    text: "What is the expected seedling survival percentage of the plant compared to other species with the same growth habit?",
    values: ["Low", "Medium", "High"],
  },
  "Small Grain": {
    text: "Is this plant a small grain?",
    values: ["Yes", "No"],
  },
  "Vegetative Spread Rate": {
    text: "At what rate can this plant spread compared to other species with the same growth habit?",
    values: ["None", "Slow", "Moderate", "Rapid"],
  },
  "Berry/Nut/Seed Product": {
    text: "Is the woody perennial suitable for the commercial production of either berries, nuts, or seeds? Herbaceous plants are scored 'No' here by default.",
    values: ["Yes", "No"],
  },
  "Christmas Tree Product": {
    text: "Is the plant known to be suitable for the Christmas tree market?",
    values: ["Yes", "No"],
  },
  "Fodder Product": {
    text: "Is the plant known to be used as animal fodder material? Fodder is defined as coarse grasses such as corn or sorghum harvested with the seed and leaves green or alive, then cured and fed in their entirety as forage.",
    values: ["Yes", "No"],
  },
  "Fuelwood Product": {
    text: "What is the relative suitability or potential of this tree or shrub to produce fuelwood? If suitability is unknown, we have expressed fuelwood potential in terms of weight (in lbs) per cubic foot of green wood. Relative values correspond to these numerical ranges: Low: <28; Medium: 28-35; High: >35.",
    values: ["Low", "Medium", "High"],
  },
  "Lumber Product": {
    text: "Is the plant suitable, or does it have potential, for use as a commercial lumber producer?",
    values: ["Yes", "No"],
  },
  "Naval Store Product": {
    text: 'Is the woody perennial suitable for production of naval store products? Navel Store Products are defined as tar, pitch, turpentine, pine oil, rosin, and terpenes obtained from pine and other coniferous trees. Herbaceous plants are scored "No" here by default.',
    values: ["Yes", "No"],
  },
  "Nursery Stock Product": {
    text: "Is the plant suitable for production of nursery stock",
    values: ["Yes", "No"],
  },
  "Palatable Browse Animal": {
    text: "What is the relative palatability of this plant to browsing animals?",
    values: ["Low", "Moderate", "High"],
  },
  "Palatable Graze Animal": {
    text: "What is the relative palatability of this plant to grazing animals?",
    values: ["Low", "Moderate", "High"],
  },
  "Palatable Human": {
    text: "Does the plant produce berries, nuts, seeds, or fruits that are palatable to humans?",
    values: ["Yes", "No"],
  },
  "Post Product": {
    text: 'Is the tree or shrub commonly used or does it have high potential for the production of posts, poles, mine timbers, or railroad ties? Plants other than trees and shrubs are scored "No" here by default.',
    values: ["Yes", "No"],
  },
  "Protein Potential": {
    text: "What is the relative protein content of the plant parts that are grazed or browsed by animals?",
    values: ["Low", "Moderate", "High"],
  },
  "Pulpwood Product": {
    text: 'Is the woody perennial commonly used or does it have high potential to be used for the production of pulpwood? Herbaceous plants are scored "No" here by default.',
    values: ["Yes", "No"],
  },
  "Veneer Product": {
    text: "Is the tree commonly used or does it have high potential to be used for commercial veneer or plywood? Plants other than trees are scored “No” here by default.",
    values: ["Yes", "No"],
  },
};

export class UsdaPlantsDatabase {
  async *plantProfiles(): AsyncGenerator<UsdaPlantsDatabase.PlantProfile> {
    for (const jsonObject of JSON.parse(
      (
        await fs.promises.readFile(
          path.resolve(__dirname, "data", "usda", "usda-plants.json"),
        )
      ).toString(),
    )) {
      yield new UsdaPlantsDatabase.PlantProfile(
        await jsonObjectSchema.parseAsync(jsonObject),
      );
    }
  }
}

export namespace UsdaPlantsDatabase {
  export class PlantProfile {
    constructor(
      private readonly jsonObject: z.infer<typeof jsonObjectSchema>,
    ) {}

    get characteristics(): readonly PlantProfile.Characteristic[] {
      if (typeof this.jsonObject.characteristics !== "object") {
        return [];
      }

      return Object.entries(this.jsonObject.characteristics).flatMap(
        ([
          nameText,
          valueText,
        ]): readonly UsdaPlantsDatabase.PlantProfile.Characteristic[] => {
          if (typeof valueText !== "string") {
            return [];
          }

          const name: UsdaPlantsDatabase.PlantProfile.Characteristic.Name = {
            iri: dataFactory.namedNode(
              `https://plants.usda.gov/characteristics/${encodeURIComponent(nameText)}`,
            ),
            text: nameText,
          };

          const valueIri = (valueText: string) =>
            dataFactory.namedNode(
              `${name.iri.value}/values/${encodeURIComponent(valueText)}`,
            );

          const jsonDefinition =
            plantProfileCharacteristicDefinitionsByName[nameText];
          const definition:
            | UsdaPlantsDatabase.PlantProfile.Characteristic.Definition
            | undefined = jsonDefinition
            ? {
                text: jsonDefinition.text,
                values: jsonDefinition.values.map((valueText) => ({
                  term: valueIri(valueText),
                  text: valueText,
                })),
              }
            : undefined;

          const valueNumber = Number.parseFloat(valueText);
          if (!Number.isNaN(valueNumber)) {
            return [
              {
                definition,
                name,
                value: {
                  term: toRdf(valueNumber),
                  text: valueText,
                },
              },
            ];
          }

          return [
            {
              definition,
              name,
              value: {
                term: valueIri(valueText),
                text: valueText,
              },
            },
          ];
        },
      );
    }

    get commonName(): string | undefined {
      return this.jsonObject.CommonName ?? undefined;
    }

    get scientificSort(): string {
      return this.jsonObject.ScientificSort;
    }

    get symbol(): string {
      return this.jsonObject.Symbol;
    }

    get url() {
      return `https://plants.usda.gov/plant-profile/${this.jsonObject.Symbol}`;
    }
  }

  export namespace PlantProfile {
    export interface Characteristic {
      readonly definition?: Characteristic.Definition;
      readonly name: Characteristic.Name;
      readonly value: Characteristic.Value;
    }

    export namespace Characteristic {
      export interface Definition {
        readonly text: string;
        readonly values: readonly Value[];
      }

      export interface Name {
        readonly iri: NamedNode;
        readonly text: string;
      }

      export interface Value {
        readonly term: Literal | NamedNode;
        readonly text: string;
      }
    }
  }
}
