import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { Question } from "#/export/sections/meansAssessment/answers/answers.types.js";

import { formatAnswer } from "#/export/sections/meansAssessment/answers/answers.formatter.js";
import { initializeI18nextSync } from "#/lib/i18n.js";

describe("saved answer formatting", () => {
  before(initializeI18nextSync);

  for (const { name, value } of [
    { name: "null", value: null },
    { name: "undefined", value: undefined },
  ]) {
    const questions = [
      {
        expected: "No",
        question: { kind: "boolean", label: "", select: () => value },
      },
      {
        expected: "Not provided",
        question: {
          choices: {},
          kind: "choice",
          label: "",
          select: () => value,
        },
      },
      {
        expected: "Not applicable",
        question: {
          choices: {},
          kind: "frequency",
          label: "",
          select: () => value,
        },
      },
      {
        expected: "Not applicable",
        question: { kind: "gbp", label: "", select: () => value },
      },
      {
        expected: "Not applicable",
        question: { kind: "percentage", label: "", select: () => value },
      },
      {
        expected: "Not applicable",
        question: { kind: "text", label: "", select: () => value },
      },
    ] satisfies Array<{
      expected: string;
      question: Question<EligibilityData>;
    }>;

    for (const { expected, question } of questions) {
      it(`formats ${name} ${question.kind} answers as CCQ does`, () => {
        expect(formatAnswer(question, {}, 0)).to.equal(expected);
      });
    }
  }

  for (const { expected, question } of [
    {
      expected: "Yes",
      question: { kind: "boolean", label: "", select: () => true },
    },
    {
      expected: "No",
      question: { kind: "boolean", label: "", select: () => false },
    },
    {
      expected: "£0.00",
      question: { kind: "gbp", label: "", select: () => 0 },
    },
    {
      expected: "0%",
      question: { kind: "percentage", label: "", select: () => 0 },
    },
    {
      expected: "",
      question: { kind: "text", label: "", select: () => "" },
    },
  ] satisfies Array<{
    expected: string;
    question: Question<EligibilityData>;
  }>) {
    it(`preserves a ${question.kind} answer of ${JSON.stringify(expected)}`, () => {
      expect(formatAnswer(question, {}, 0)).to.equal(expected);
    });
  }
});
