import { ConceptAnnotation, Document } from "@/lib/models";
import { synthetic } from "@/lib/models/impl";
import { dataFactory } from "@/lib/rdfEnvironment";
import { evaluateAnnotations } from "@/lib/utilities";
import { describe, it } from "vitest";

describe("evaluateAnnotations", () => {
  const document = Document.create({
    memberOfCorpus: synthetic.Stub.fromIdentifier(
      dataFactory.namedNode("http://example.com/corpus"),
    ),
  });

  it("no annotations", async ({ expect }) => {
    const result = evaluateAnnotations([]);
    expect(result.isNothing()).toStrictEqual(true);
  });

  it("one gold annotation", async ({ expect }) => {
    const result = evaluateAnnotations([
      ConceptAnnotation.create({
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
    const result = evaluateAnnotations([
      ConceptAnnotation.create({
        object: new synthetic.Concept(),
        subject: synthetic.Stub.fromModel(document),
        gold: false,
      }),
    ]);
    expect(result.isNothing()).toStrictEqual(true);
  });

  it("one matching gold and inferred annotation pair", async ({ expect }) => {
    const concept = new synthetic.Concept();
    const result = evaluateAnnotations([
      ConceptAnnotation.create({
        object: concept,
        subject: synthetic.Stub.fromModel(document),
        gold: false,
      }),
      ConceptAnnotation.create({
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
    const result = evaluateAnnotations([
      ConceptAnnotation.create({
        object: new synthetic.Concept(),
        subject: synthetic.Stub.fromModel(document),
        gold: false,
      }),
      ConceptAnnotation.create({
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
    const result = evaluateAnnotations([
      ConceptAnnotation.create({
        object: concept,
        subject: synthetic.Stub.fromModel(document),
        gold: false,
      }),
      ConceptAnnotation.create({
        object: concept,
        subject: synthetic.Stub.fromModel(document),
        gold: true,
      }),
      ConceptAnnotation.create({
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
