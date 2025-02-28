import {
  CategoricalValue,
  Claim,
  ConceptStub,
  evaluateClaims,
} from "@/lib/models";
import { dataFactory } from "@/lib/rdfEnvironment";
import { dcterms } from "@tpluscode/rdf-ns-builders";
import { describe, it } from "vitest";

describe("evaluateClaims", () => {
  const categoricalObjects = [...new Array(3).keys()].map(
    (_, index) =>
      new CategoricalValue({
        value: ConceptStub.create({
          identifier: dataFactory.namedNode(
            `http://example.com/object${index}`,
          ),
        }),
      }),
  );
  const subject = dataFactory.namedNode("http://example.com/subject");
  const predicate = dcterms.subject;

  it("no claims", async ({ expect }) => {
    const result = evaluateClaims([]);
    expect(result.isNothing()).toStrictEqual(true);
  });

  it("one gold categorical claim", async ({ expect }) => {
    const result = evaluateClaims([
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[0],
        gold: true,
      }),
    ]).unsafeCoerce();
    expect(result.falseNegativeClaims).toHaveLength(1);
    expect(result.falsePositiveClaims).toHaveLength(0);
    expect(result.truePositiveClaims).toHaveLength(0);
  });

  it("one inferred categorical claim", async ({ expect }) => {
    const result = evaluateClaims([
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[0],
        gold: false,
      }),
    ]);
    expect(result.isNothing()).toStrictEqual(true);
  });

  it("one matching gold and inferred claim pair", async ({ expect }) => {
    const result = evaluateClaims([
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[0],
        gold: false,
      }),
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[0],
        gold: true,
      }),
    ]).unsafeCoerce();
    expect(result.falseNegativeClaims).toHaveLength(0);
    expect(result.falsePositiveClaims).toHaveLength(0);
    expect(result.truePositiveClaims).toHaveLength(1);
  });

  it("one non-matching gold and inferred categorical claim pair", async ({
    expect,
  }) => {
    const result = evaluateClaims([
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[0],
        gold: false,
      }),
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[1],
        gold: true,
      }),
    ]).unsafeCoerce();
    expect(result.falseNegativeClaims).toHaveLength(1);
    expect(result.falsePositiveClaims).toHaveLength(1);
    expect(result.truePositiveClaims).toHaveLength(0);
  });

  it("1 unmatched gold 1 matched gold-inferred pair", async ({ expect }) => {
    const result = evaluateClaims([
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[0],
        gold: false,
      }),
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[0],
        gold: true,
      }),
      new Claim({
        subject,
        predicate,
        object: categoricalObjects[1],
        gold: true,
      }),
    ]).unsafeCoerce();
    expect(result.falseNegativeClaims).toHaveLength(1);
    expect(result.falsePositiveClaims).toHaveLength(0);
    expect(result.truePositiveClaims).toHaveLength(1);
  });
});
