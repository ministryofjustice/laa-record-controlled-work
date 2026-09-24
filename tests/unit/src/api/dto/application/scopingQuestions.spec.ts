import { expect } from "chai";
import { describe, it } from "mocha";

import { parseScopingQuestions } from "#/api/dto/application/scopingQuestions.js";

const scopingQuestions = { priorLegalAid: "no" } as const;

describe("parseScopingQuestions", () => {
  for (const [description, malformedScopingQuestions] of [
    ["null", null],
    ["an array", [scopingQuestions]],
    ["a primitive", "yesSameMatter"],
  ] as const) {
    it(`returns no recognised answers when scoping questions is ${description}`, () => {
      expect(parseScopingQuestions(malformedScopingQuestions)).to.deep.equal(
        {},
      );
    });
  }

  describe("priorLegalAid", () => {
    for (const value of [
      "yesSameMatter",
      "yesDifferentMatter",
      "no",
    ] as const) {
      it(`returns ${value} when it is recognised`, () => {
        expect(
          parseScopingQuestions({ ...scopingQuestions, priorLegalAid: value })
            .priorLegalAid,
        ).to.equal(value);
      });
    }

    for (const [description, priorLegalAid] of [
      ["missing", undefined],
      ["non-string", true],
      ["unrecognised", "yes"],
    ] as const) {
      it(`returns undefined when it is ${description}`, () => {
        expect(
          parseScopingQuestions({ ...scopingQuestions, priorLegalAid })
            .priorLegalAid,
        ).to.equal(undefined);
      });
    }
  });
});


