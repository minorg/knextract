import { evaluateClaims } from "@/lib/models";
import { dataFactory } from "@/lib/rdfEnvironment";
import { dcterms } from "@/lib/vocabularies";
import { describe, it } from "vitest";

describe("evaluateClaims", () => {
  const subject = dataFactory.namedNode("http://example.com/subject");
  const predicate = dcterms.subject;

  it("no annotations", async ({ expect }) => {
    const result = evaluateClaims([]);
    expect(result.isNothing()).toStrictEqual(true);
  });

  it("one gold annotation", async ({ expect }) => {
    const result = evaluateClaims([
      new Claim.create({
        object: new synthetic.Concept(),
        subject: synthetic.Stub.fromModel(document),
        gold: true,
      }),
    ]).unsafeCoerce();
    expect(result.falseNegativeCount).toStrictEqual(1);
    expect(result.falsePositiveCount).toStrictEqual(0);
    expect(result.truePositiveCount).toStrictEqual(0);
  });

  it("one inferred annotation", async ({ expect }) => {
    const result = evaluateClaims([
      ConceptClaim.create({
        object: new synthetic.Concept(),
        subject: synthetic.Stub.fromModel(document),
        gold: false,
      }),
    ]);
    expect(result.isNothing()).toStrictEqual(true);
  });

  it("one matching gold and inferred annotation pair", async ({ expect }) => {
    const concept = new synthetic.Concept();
    const result = evaluateClaims([
      ConceptClaim.create({
        object: concept,
        subject: synthetic.Stub.fromModel(document),
        gold: false,
      }),
      ConceptClaim.create({
        object: concept,
        subject: synthetic.Stub.fromModel(document),
        gold: true,
      }),
    ]).unsafeCoerce();
    expect(result.falseNegativeCount).toStrictEqual(0);
    expect(result.falsePositiveCount).toStrictEqual(0);
    expect(result.truePositiveCount).toStrictEqual(1);
  });

  it("one non-matching gold and inferred annotation pair", async ({
    expect,
  }) => {
    const result = evaluateClaims([
      ConceptClaim.create({
        object: new synthetic.Concept(),
        subject: synthetic.Stub.fromModel(document),
        gold: false,
      }),
      ConceptClaim.create({
        object: new synthetic.Concept(),
        subject: synthetic.Stub.fromModel(document),
        gold: true,
      }),
    ]).unsafeCoerce();
    expect(result.falseNegativeCount).toStrictEqual(1);
    expect(result.falsePositiveCount).toStrictEqual(1);
    expect(result.truePositiveCount).toStrictEqual(0);
  });

  it("1 unmatched gold 1 matched gold-inferred pair", async ({ expect }) => {
    const concept = new synthetic.Concept();
    const result = evaluateClaims([
      ConceptClaim.create({
        object: concept,
        subject: synthetic.Stub.fromModel(document),
        gold: false,
      }),
      ConceptClaim.create({
        object: concept,
        subject: synthetic.Stub.fromModel(document),
        gold: true,
      }),
      ConceptClaim.create({
        object: new synthetic.Concept(),
        subject: synthetic.Stub.fromModel(document),
        gold: true,
      }),
    ]).unsafeCoerce();
    expect(result.falseNegativeCount).toStrictEqual(1);
    expect(result.falsePositiveCount).toStrictEqual(0);
    expect(result.truePositiveCount).toStrictEqual(1);
  });
});
