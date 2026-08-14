import { expect } from "chai";
import { describe, it } from "mocha";
import { createForgeTestClient } from "../../../integration/utils/helpers.js";
import { ecfStep } from "#/journeys/create-application/steps/ecf.step.js";
import { TestRenderResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { JourneyEffects } from "#/journeys/effects.js";
import { access, step } from "@ministryofjustice/hmpps-forge/core/authoring";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";

const clearDraftStep = step({
  blocks: [],
  onAccess: [
    access({
      effects: [JourneyEffects.ClearAllDraftAnswers("testJourney")],
    }),
  ],
  path: "/clear-draft",
  reachability: { entryWhen: true },
  title: "Clear Draft",
});

const clearAnswerStep = step({
  blocks: [],
  onAccess: [
    access({
      effects: [
        JourneyEffects.ClearFieldAnswers("testJourney", [
          "adressLine2",
          "adressLine3",
        ]),
      ],
    }),
  ],
  path: "/clear-answers",
  reachability: { entryWhen: true },
  title: "Clear Answers",
});

  const client = createForgeTestClient(
    createApplicationJourney,
    createApplicationEffectsRegistry,
    {
      accessHooks: [access({ effects: [JourneyEffects.LoadDraftAnswers("testJourney")] })],
      steps: [
        ecfStep("testJourney"),
        clearDraftStep,
        clearAnswerStep,
      ],
    },
  );

let session: Record<string, unknown> = {};

beforeEach(() => {
  session = {};
});

describe("SaveDraftAnswers", () => {
  it("persists draft answers in the session under the journey key", async () => {
    await client.post("/cases/new/ecf", {
      session,
      body: { ecf: "yes" },
    });
    const drafts = session.journeyDrafts as Record<
      string,
      Record<string, unknown>
    >;

    expect(drafts?.testJourney?.ecf).to.equal("yes");
  });

  it("preserves draft answers from other journeys", async () => {
    session.journeyDrafts = {
      anotherJourney: { someAnswer: "yes" },
    };

    await client.post("/cases/new/ecf", {
      session,
      body: { ecf: "yes" },
    });

    const drafts = session.journeyDrafts as Record<
      string,
      Record<string, unknown>
    >;

    expect(drafts?.testJourney?.ecf).to.equal("yes");
    expect(drafts?.anotherJourney?.someAnswer).to.equal("yes");
  });

  it("merges with existing draft answers for the same journey", async () => {
    session.journeyDrafts = {
      testJourney: { existingAnswer: "foo" },
    };

    await client.post("/cases/new/ecf", {
      session,
      body: { ecf: "yes" },
    });

    const drafts = session.journeyDrafts as Record<
      string,
      Record<string, unknown>
    >;

    expect(drafts?.testJourney?.existingAnswer).to.equal("foo");
    expect(drafts?.testJourney?.ecf).to.equal("yes");
  });

  it("overwrites existing draft answer for the same question", async () => {
    session.journeyDrafts = {
      testJourney: { ecf: "no" },
    };

    await client.post("/cases/new/ecf", {
      session,
      body: { ecf: "yes" },
    });

    const drafts = session.journeyDrafts as Record<
      string,
      Record<string, unknown>
    >;

    expect(drafts?.testJourney?.ecf).to.equal("yes");
  });
});

describe("LoadDraftAnswers", () => {
  it("loads draft answers from the session into the context", async () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
    };

    const result = await client.get("/cases/new/ecf", {
      session,
    });
    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    const [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");

    expect(radioInput.properties.value).to.equal("yes");
  });

  it("does nothing when no draft exists for this journey", async () => {
    session.journeyDrafts = {
      testJourney: {},
    };
    const result = await client.get("/cases/new/ecf", {
      session,
    });
    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    const [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");

    expect(radioInput.properties.value).to.equal(undefined);
  });
});

describe("ClearAllDraftAnswers", () => {
  it("removes the journey's draft from the session", async () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
    };

    await client.get("/cases/new/clear-draft", { session });

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(drafts.testJourney).to.be.undefined;
  });

  it("preserves drafts for other journeys", async () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
      anotherJourney: { someAnswer: "yes" },
    };

    await client.get("/cases/new/clear-draft", { session });

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(
      (drafts.anotherJourney as Record<string, unknown>).someAnswer,
    ).to.equal("yes");
  });

  it("does nothing when no draft exists for the journey", async () => {
    session.journeyDrafts = { anotherJourney: { someAnswer: "yes" } };

    await client.get("/cases/new/clear-draft", { session });

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(drafts.anotherJourney).to.exist;
  });
});

describe("ClearFieldAnswers", () => {
  it("removes specificy field answers from the journey's draft and retains other fields", async () => {
    session.journeyDrafts = {
      testJourney: {
        adressLine1: "adressLine1",
        adressLine2: "adressLine2",
        adressLine3: "adressLine3",
      },
    };

    await client.get("/cases/new/clear-answers", { session });
    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(
      (drafts.testJourney as Record<string, unknown>).adressLine1,
    ).to.equal("adressLine1");
    expect(
      (drafts.testJourney as Record<string, unknown>).adressLine2,
    ).to.be.undefined;
    expect(
      (drafts.testJourney as Record<string, unknown>).adressLine3,
    ).to.be.undefined;
  });
});
