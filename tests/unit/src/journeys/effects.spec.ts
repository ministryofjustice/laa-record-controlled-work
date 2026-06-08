import { expect } from "chai";
import { describe, it } from "mocha";
import { createForgeTestClient } from "../../../integration/utils/helpers.js";
import { ecfStep } from "#/journeys/create-application/steps/1-ecf.step.js";
import { TestRenderResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { JourneyEffects } from "#/journeys/effects.js";
import { access, step } from "@ministryofjustice/hmpps-forge/core/authoring";

const clearDraftStep = step({
  blocks: [],
  onAccess: [
    access({
      effects: [JourneyEffects.ClearDraftAnswers("testJourney")],
    }),
  ],
  path: "/clear-draft",
  reachability: { entryWhen: true },
  title: "Clear Draft",
});

const client = createForgeTestClient(ecfStep("testJourney"), clearDraftStep);
let session: Record<string, unknown> = {};

beforeEach(() => {
  session = {};
});

describe("SaveDraftAnswers", () => {
  it("persists draft answers in the session under the journey key", async () => {
    await client.post("/create-application/ecf", {
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

    await client.post("/create-application/ecf", {
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

    await client.post("/create-application/ecf", {
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

    await client.post("/create-application/ecf", {
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

    const result = await client.get("/create-application/ecf", {
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
    const result = await client.get("/create-application/ecf", {
      session,
    });
    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    const [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");

    expect(radioInput.properties.value).to.equal(undefined);
  });
});

describe("ClearDraftAnswers", () => {
  it("removes the journey's draft from the session", async () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
    };

    await client.get("/create-application/clear-draft", { session });

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(drafts.testJourney).to.be.undefined;
  });

  it("preserves drafts for other journeys", async () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
      anotherJourney: { someAnswer: "yes" },
    };

    await client.get("/create-application/clear-draft", { session });

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect((drafts.anotherJourney as Record<string, unknown>).someAnswer).to.equal(
      "yes",
    );
  });

  it("does nothing when no draft exists for the journey", async () => {
    session.journeyDrafts = { anotherJourney: { someAnswer: "yes" } };

    await client.get("/create-application/clear-draft", { session });

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(drafts.anotherJourney).to.exist;
  });
});
