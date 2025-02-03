import { ValueExtractor } from "@/lib/ValueExtractor";
import { RealValue } from "@/lib/models";
import { describe, it } from "vitest";

describe("ValueExtractor", () => {
  const sut = new ValueExtractor();

  it("should extract boolean values", ({ expect }) => {
    expect(sut.extractBooleanValue("true").unsafeCoerce().value).toStrictEqual(
      true,
    );
    expect(
      sut.extractBooleanValue(JSON.stringify({ answer: true })).unsafeCoerce()
        .value,
    ).toStrictEqual(true);
    expect(
      sut.extractBooleanValue(JSON.stringify({ answer: [true] })).unsafeCoerce()
        .value,
    ).toStrictEqual(true);
  });

  it("should reject a non-boolean value", ({ expect }) => {
    expect(
      sut.extractBooleanValue(JSON.stringify({ answer: "blah" })).isLeft(),
    ).toStrictEqual(true);
  });

  it("should extract categorical values: single value", async ({ expect }) => {
    const values = (
      await sut.extractCategoricalValues("http://example.com")
    ).unsafeCoerce();
    expect(values.length).toStrictEqual(1);
    expect(values[0].value.identifier.value).toStrictEqual(
      "http://example.com",
    );
  });

  it("should extract categorical values: single value with wrapper", async ({
    expect,
  }) => {
    const values = (
      await sut.extractCategoricalValues(
        JSON.stringify({ answer: "http://example.com" }),
      )
    ).unsafeCoerce();
    expect(values.length).toStrictEqual(1);
    expect(values[0].value.identifier.value).toStrictEqual(
      "http://example.com",
    );
  });

  it("should extract categorical values: multiple values", async ({
    expect,
  }) => {
    const values = (
      await sut.extractCategoricalValues(
        JSON.stringify({
          answer: ["http://example.com/1", "http://example.com/2"],
        }),
      )
    ).unsafeCoerce();
    expect(values.length).toStrictEqual(2);
    expect(values[0].value.identifier.value).toStrictEqual(
      "http://example.com/1",
    );
    expect(values[1].value.identifier.value).toStrictEqual(
      "http://example.com/2",
    );
  });

  it("should reject a non-categorical value", async ({ expect }) => {
    expect(
      (
        await sut.extractCategoricalValues(JSON.stringify({ answer: "blah" }))
      ).isLeft(),
    ).toStrictEqual(true);
  });

  it("should extract number values: single value", ({ expect }) => {
    const values = sut.extractRealValues("1").unsafeCoerce();
    expect(values.length).toStrictEqual(1);
    expect(values[0].value).toStrictEqual(1);
  });

  it("should extract number values: single value with wrapper", ({
    expect,
  }) => {
    const values = sut
      .extractRealValues(JSON.stringify({ answer: 1 }))
      .unsafeCoerce();
    expect(values.length).toStrictEqual(1);
    expect(values[0].value).toStrictEqual(1);
  });

  it("should extract number values: multiple values", ({ expect }) => {
    const values = sut
      .extractRealValues(
        JSON.stringify({
          answer: [1, 2],
        }),
      )
      .unsafeCoerce();
    expect(values.length).toStrictEqual(2);
    expect(values[0].value).toStrictEqual(1);
    expect(values[1].value).toStrictEqual(2);
  });

  it("should reject a non-number value", ({ expect }) => {
    expect(
      sut.extractRealValues(JSON.stringify({ answer: "blah" })).isLeft(),
    ).toStrictEqual(true);
  });

  it("should extract string values: single value", ({ expect }) => {
    const values = sut.extractTextValues('"test"').unsafeCoerce();
    expect(values.length).toStrictEqual(1);
    expect(values[0].value).toStrictEqual("test");
  });

  it("should extract string values: single value with wrapper", ({
    expect,
  }) => {
    const values = sut
      .extractTextValues(JSON.stringify({ answer: "test" }))
      .unsafeCoerce();
    expect(values.length).toStrictEqual(1);
    expect(values[0].value).toStrictEqual("test");
  });

  it("should extract string values: multiple values", ({ expect }) => {
    const values = sut
      .extractTextValues(
        JSON.stringify({
          answer: ["test1", "test2"],
        }),
      )
      .unsafeCoerce();
    expect(values.length).toStrictEqual(2);
    expect(values[0].value).toStrictEqual("test1");
    expect(values[1].value).toStrictEqual("test2");
  });

  it("should handle JSON as GitHub-flavored Markdown", async ({ expect }) => {
    const values = (
      await sut.extractValues('```json\n{ "answer": [2, 7] }\n```', {
        question: { type: "RealValuedQuestion" },
      })
    ).unsafeCoerce();
    for (const value of values) {
      expect(value.type).toStrictEqual("RealValue");
    }
    expect((values[0] as RealValue).value).toStrictEqual(2);
    expect((values[1] as RealValue).value).toStrictEqual(7);
  });

  it("should accept boolean or number as a string value", ({ expect }) => {
    const values = sut
      .extractTextValues(
        JSON.stringify({
          answer: [1, true],
        }),
      )
      .unsafeCoerce();
    expect(values.length).toStrictEqual(2);
    expect(values[0].value).toStrictEqual("1");
    expect(values[1].value).toStrictEqual("true");
  });
});
