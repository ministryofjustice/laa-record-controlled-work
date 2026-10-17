import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { NunjucksRenderer } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import { expect } from "chai";
import express from "express";
import { parse } from "node-html-parser";
import sinon from "sinon";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import { editApplicationJourney } from "#/journeys/edit-application/editApplication.journey.js";
import { editApplicationTransformersRegistry } from "#/journeys/edit-application/editApplication.transformers.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";
import { setupNunjucks } from "#/middleware/setupNunjucks.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { createForgeTestClient } from "../../utils/helpers.js";

type SummaryRow = {
  actions?: { items: Array<{ href: string }> };
  key: { text: string };
  value: {
    blocks?: Array<{
      properties?: Record<string, unknown>;
      variant?: string;
    }>;
    html?: string;
    text?: string;
  };
  visibleWhen?: boolean;
};

describe("Edit client details check answers step", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";
  const ukApplication: Application = getGetApplicationResponseMock({
    applicationRefNumber: "CW-123456",
    ecfFlag: false,
    clientDetails: {
      ...getGetApplicationResponseMock().clientDetails,
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-01-01",
      niNumber: "AB123456C", // gitleaks:allow - fake NI number used to test data mapping
      hasFixedAddress: true,
      address: {
        id: null,
        addressLine1: "123 Test Street",
        addressLine2: "Test Area",
        addressLine3: null,
        addressLine4: null,
        townOrCity: "Testville",
        postCode: "TE5 7ST",
        county: null,
        country: "GB",
        createdAt: null,
        modifiedAt: null,
      },
    },
    reasonForReapplication: "Some reason for help",
    scopingQuestions: {
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: false,
      needsProtectiveInjunction: false,
      laspoEvidenceScope: "domesticAbuse",
    },
  });
  const overseasApplication: Application = getGetApplicationResponseMock({
    ...ukApplication,
    clientDetails: {
      ...ukApplication.clientDetails,
      address: {
        id: null,
        addressLine1: "10 Some Other Street",
        addressLine2: null,
        addressLine3: "Paris",
        addressLine4: null,
        townOrCity: null,
        postCode: null,
        county: null,
        country: "FR",
        createdAt: null,
        modifiedAt: null,
      },
    },
  });
  const draftKey = `${JourneyCode.EDIT_CLIENT_DETAILS}:${applicationId}`;
  const getApplicationStub = sinon
    .stub()
    .resolves({ status: 200, data: ukApplication });
  const updateApplicationStatusStub = sinon
    .stub()
    .resolves({ status: 204, data: undefined });

  beforeEach(() => {
    getApplicationStub.resolves({ status: 200, data: ukApplication });
  });

  const renderer = new NunjucksRenderer({ nunjucksEnv: setupNunjucks(express()) });
  renderer.assemblePage = (_context, blocks) => blocks.join("");

  const editApplicationClient = createForgeTestClient(
    editApplicationJourney,
    editApplicationEffectsRegistry,
    {
      additionalFunctions: [editApplicationTransformersRegistry],
      renderer,
      disableReachabilityChecks: false,
      dependencies: {
        getApplication: getApplicationStub,
        updateApplicationStatus: updateApplicationStatusStub,
      },
    },
  );

  const getCheckAnswers = async (application: Application = ukApplication) => {
    const session = {};
    getApplicationStub.resolves({ status: 200, data: application });

    const taskListResult = await editApplicationClient.get(
      `/cases/${applicationId}/task-list`,
      { session },
    );
    expect(taskListResult.type).to.equal("render");

    const result = await editApplicationClient.get(
      `/cases/${applicationId}/task-list/details/check-answers`,
      { session },
    );
    expect(result.type).to.equal("render");

    return result as TestRenderResult;
  };

  const getCheckAnswersRows = async (
    session: Record<string, unknown>,
  ): Promise<SummaryRow[]> => {
    const result = await editApplicationClient.get(
      `/cases/${applicationId}/task-list/details/check-answers`,
      { session },
    );
    expect(result.type).to.equal("render");

    const [summaryList] = (result as TestRenderResult).getBlocksByVariant(
      "govukSummaryList",
    );

    return summaryList.properties.rows as SummaryRow[];
  };

  const incompleteTag = (
    row?: SummaryRow,
  ): Record<string, unknown> | undefined =>
    row?.value.blocks?.find(
      (block) =>
        block.variant === "govukTag" &&
        block.properties?.visibleWhen === true,
    )?.properties;

  const expectSummaryValue = (
    result: TestRenderResult,
    label: string,
    value: string | string[],
  ): void => {
    const [summaryList] = result.getBlocksByVariant("govukSummaryList");
    const rows = summaryList.properties.rows as SummaryRow[];
    const row = rows.find((item) => item.key.text === label);

    const content = row?.value.blocks?.find(
      (block) => block.properties?.visibleWhen === true,
    )?.properties?.content;
    expect(content, label).to.be.a("string");

    const lines = (content as string)
      .split("<br />")
      .map((line) => line.trim())
      .filter(Boolean);
    expect(lines, label).to.deep.equal(Array.isArray(value) ? value : [value]);

    const html = parse(result.output as string);
    const key = html.querySelectorAll("dt").find(
      (item) => item.text.trim() === label,
    );
    const renderedLines = key?.nextElementSibling?.textContent
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    expect(renderedLines, label).to.deep.equal(lines);
  };

  const expectOverseasAddress = (result: TestRenderResult): void => {
    const [summaryList] = result.getBlocksByVariant("govukSummaryList");
    const rows = summaryList.properties.rows as SummaryRow[];
    const addressRow = rows.find((row) => row.key.text === "Address");

    expect(addressRow?.actions?.items[0].href).to.equal(
      "enter-overseas-address?returnTo=check-answers",
    );
    expectSummaryValue(result, "Address", [
      "10 Some Other Street,",
      "Paris,",
      "France",
    ]);
  };

  const expectDraftValue = async (
    session: Record<string, unknown>,
    label: string,
    value: string | string[],
  ): Promise<void> => {
    const result = await editApplicationClient.get(
      `/cases/${applicationId}/task-list/details/check-answers`,
      { session },
    );
    expect(result.type).to.equal("render");
    expectSummaryValue(result as TestRenderResult, label, value);
  };

  describe("Incomplete saved details", () => {
    const complete = ApplicationDto.toAnswers(ukApplication);
    it("renders completed text safely beside incomplete tags", async () => {
      // TODO: why is there HTML in the parameter?
      const session = {
        journeyDrafts: {
          [draftKey]: {
        ...complete, firstName: "<b>Client</b>", ecf: undefined,
      } } };
      const result = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session },
      );
      expect(result.type, result.type === "error" ? JSON.stringify(result.error) : undefined).to.equal("render");
      const html = parse((result as TestRenderResult).output as string);
      const key = html.querySelectorAll("dt").find(
        (item) => item.text.trim() === "First name",
      );

      expect(key?.nextElementSibling?.text.trim()).to.equal("<b>Client</b>");
      expect(html.querySelector("b")).to.equal(null);
      expect(html.querySelector(".govuk-tag--blue")?.text.trim()).to.equal("INCOMPLETE");
    });

    const cases = [
      ["ecf", "ECF"],
      ["familyLawClassification", "Type of family law"],
      ["legalAidBefore", "Accessed legal aid before"],
      ["needsAdviceOnEUOrInternationalMaintenance", "Transitional EU arrangements or an international maintenance agreement"],
      ["needsProtectiveInjunction", "Legal aid to get a protective injunction order"],
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["dateOfBirth", "Date of birth"],
      ["hasNINumber", "National Insurance number"],
      ["niNumber", "National Insurance number"],
      ["haveAHomeAddress", "Has a home address"],
      ["ukAddressLine1", "Address"],
      ["ukTownOrCity", "Address"],
      ["ukPostcode", "Address"],
      ["ukCountry", "Address"],
      ["legalAidLast6Months", "Did your client get legal help for this matter in the last 6 months?"],
      ["reasonForYes", "Reason for new application for same matter"],
    ] as const;

    for (const [key, label] of cases) {
      it(`tags missing ${key} and blocks submission without clearing the draft`, async () => {
        const draft = { ...complete, [key]: undefined };
        const session = { journeyDrafts: { [draftKey]: draft } };
        const rows = await getCheckAnswersRows(session);
        const row = rows.find((item) => item.key.text === label);
        expect(incompleteTag(row)).to.include({
          classes: "govuk-tag--blue",
          text: "INCOMPLETE",
        });

        const result = await editApplicationClient.post(
          `/cases/${applicationId}/task-list/details/check-answers`,
          { session },
        );
        expect(result.type).to.equal("render");
        expect(session.journeyDrafts[draftKey]).to.deep.equal(draft);
      });
    }

    it("renders null scoping questions and ECF without choosing a law branch", async () => {
      const result = await getCheckAnswers({ ...ukApplication, scopingQuestions: null, ecfFlag: null });
      const [summary] = result.getBlocksByVariant("govukSummaryList");
      const rows = summary.properties.rows as SummaryRow[];
      for (const label of ["ECF", "Type of family law", "Accessed legal aid before"]) {
        const row = rows.find((item) => item.key.text === label);
        expect(incompleteTag(row)).to.include({
          classes: "govuk-tag--blue",
          text: "INCOMPLETE",
        });
      }
      expect(rows.filter((row) => row.visibleWhen !== false).some((row) =>
        ["Letter from local authority", "Legal aid to get a protective injunction order"].includes(row.key.text),
      )).to.equal(false);
    });

    it("requires public care proceedings and clears the tag after answering its existing page", async () => {
      const session = { journeyDrafts: { [draftKey]: {
        ...complete,
        familyLawClassification: "public",
        careProceedingsStarted: undefined,
      } } };
      const rows = await getCheckAnswersRows(session);
      const row = rows.find((item) => item.actions?.items[0].href.startsWith("care-proceedings"));
      expect(incompleteTag(row)).to.include({
        classes: "govuk-tag--blue",
        text: "INCOMPLETE",
      });
      expect((await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/check-answers`, { session },
      )).type).to.equal("render");

      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/care-proceedings`,
        { session, query: { returnTo: "check-answers" }, body: { careProceedingsStarted: "no" } },
      );
      expect(result.type).to.equal("redirect");
      await expectDraftValue(session, "Local authority is initiating care proceedings", "No");
      expect((await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/check-answers`, { session },
      )).type).to.equal("redirect");
    });

    it("hides and ignores inactive answers, including an injunction skipped by maintenance", async () => {
      const session = { journeyDrafts: { [draftKey]: {
        ...complete,
        legalAidBefore: "no",
        legalAidLast6Months: "yes",
        reasonForYes: undefined,
        needsAdviceOnEUOrInternationalMaintenance: "yes",
        needsProtectiveInjunction: undefined,
        careProceedingsStarted: undefined,
        haveAHomeAddress: "no",
        ukAddressLine1: undefined,
        ukTownOrCity: undefined,
        ukPostcode: undefined,
      } } };
      const rows = await getCheckAnswersRows(session);
      const visible = rows.filter((row) => row.visibleWhen !== false);
      expect(visible.some((row) => row.key.text === "Legal aid to get a protective injunction order")).to.equal(false);
      expect(visible.some((row) => row.key.text === "Reason for new application for same matter")).to.equal(false);
      expect(visible.some((row) => incompleteTag(row)?.text === "INCOMPLETE")).to.equal(false);
      expect((await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/check-answers`, { session },
      )).type).to.equal("redirect");
    });

    it("requires only the reached overseas address fields", async () => {
      for (const key of ["osAddressLine1", "osCountry"] as const) {
        const session = { journeyDrafts: { [draftKey]: {
          ...ApplicationDto.toAnswers(overseasApplication), [key]: "",
        } } };
        const rows = await getCheckAnswersRows(session);
        const row = rows.find((item) => item.key.text === "Address");
        expect(incompleteTag(row)).to.include({
          classes: "govuk-tag--blue",
          text: "INCOMPLETE",
        });
        expect((await editApplicationClient.post(
          `/cases/${applicationId}/task-list/details/check-answers`, { session },
        )).type).to.equal("render");
      }
    });

    it("requires explicit ECF and removes the tag after answering", async () => {
      const session = { journeyDrafts: { [draftKey]: { ...complete, ecf: undefined } } };
      await editApplicationClient.post(`/cases/${applicationId}/task-list/details/ecf`, {
        session, query: { returnTo: "check-answers" }, body: { ecf: "no" },
      });
      await expectDraftValue(session, "ECF", "No");
      expect((await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/check-answers`, { session },
      )).type).to.equal("redirect");
    });
  });

  describe("Edit journey entry navigation", () => {
    it("retains the original version when a later parent GET reloads the case", async () => {
      const session: {
        journeyDrafts?: Record<string, Record<string, unknown>>;
        journeyDraftVersions?: Record<string, string>;
      } = {};
      getApplicationStub.resolves({
        status: 200,
        data: ukApplication,
        headers: new Headers({ etag: '"00023"' }),
      });

      const initial = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session },
      );
      expect(initial.type).to.equal("render");
      expect(session.journeyDraftVersions?.[draftKey]).to.equal('"00023"');
      session.journeyDrafts![draftKey].firstName = "Edited draft";

      getApplicationStub.resolves({
        status: 200,
        data: {
          ...ukApplication,
          clientDetails: { ...ukApplication.clientDetails, firstName: "Reloaded" },
        },
        headers: new Headers({ etag: '"42"' }),
      });
      const taskList = await editApplicationClient.get(
        `/cases/${applicationId}/task-list`,
        { session },
      );
      expect(taskList.type).to.equal("render");

      const refreshed = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session },
      );

      expect(refreshed.type).to.equal("render");
      expect(session.journeyDraftVersions?.[draftKey]).to.equal('"00023"');
      expect(session.journeyDrafts?.[draftKey]?.firstName).to.equal("Edited draft");
    });

    it("clears only the edit draft and version when ECF leads to dropout", async () => {
      const otherDraftKey = `${JourneyCode.EDIT_CLIENT_DETAILS}:application-2`;
      const session: {
        journeyDrafts?: Record<string, Record<string, unknown>>;
        journeyDraftVersions?: Record<string, string>;
      } = {};
      getApplicationStub.resolves({
        status: 200,
        data: ukApplication,
        headers: new Headers({ etag: '"00023"' }),
      });

      const initial = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session },
      );
      expect(initial.type).to.equal("render");
      expect(session.journeyDraftVersions?.[draftKey]).to.equal('"00023"');
      session.journeyDraftVersions ??= {};
      session.journeyDrafts![otherDraftKey] = { firstName: "Other case" };
      session.journeyDraftVersions![otherDraftKey] = '"42"';

      const ecfResult = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/ecf`,
        { session, body: { ecf: "yes" } },
      );
      expect(ecfResult.type).to.equal("redirect");
      expect((ecfResult as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/ecf-dropout`,
      );

      const dropoutResult = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/ecf-dropout`,
        { session },
      );

      expect(dropoutResult.type).to.equal("redirect");
      expect((dropoutResult as TestRedirectResult).url).to.equal("/");
      expect(session.journeyDrafts?.[draftKey]).to.be.undefined;
      expect(session.journeyDraftVersions?.[draftKey]).to.be.undefined;
      expect(session.journeyDrafts?.[otherDraftKey]).to.deep.equal({
        firstName: "Other case",
      });
      expect(session.journeyDraftVersions?.[otherDraftKey]).to.equal('"42"');

      getApplicationStub.resolves({
        status: 200,
        data: ukApplication,
        headers: new Headers({ etag: '"99"' }),
      });
      const reentered = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session },
      );

      expect(reentered.type).to.equal("render");
      expect(session.journeyDraftVersions?.[draftKey]).to.equal('"99"');
    });

    it("stores a normalized NI number when editing client details", async () => {
      const session: {
        journeyDrafts?: Record<string, Record<string, unknown>>;
      } = {};

      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/ni-number`,
        {
          query: { returnTo: "check-answers" },
          session,
          body: {
            hasNINumber: "yes",
            niNumber: "j.n12-3456a", // gitleaks:allow - fake NI number used to test normalization
          },
        },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/check-answers`,
      );
      expect(session.journeyDrafts?.[draftKey]?.niNumber).to.equal("JN123456A");
    });

    it("renders API client data for direct check answers access", async () => {
      const result = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session: {} },
      );

      expect(result.type).to.equal("render");
      expectSummaryValue(result as TestRenderResult, "First name", "John");
    });

    it("redirects to check answers", async () => {
      const result = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/`,
        { session: {} },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/check-answers`,
      );
    });

    it("redirects direct address access to check answers", async () => {
      const result = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/enter-address-manually`,
        {
          session: {
            journeyDrafts: {
              [`${JourneyCode.EDIT_CLIENT_DETAILS}:${applicationId}`]: {
                ecf: "no",
                haveAHomeAddress: "no",
                legalAidBefore: "no",
              },
            },
          },
        },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/check-answers`,
      );
    });
  });

  describe("Address branch changes from check answers", () => {
    it("submitted 'no fixed address' clears address data and redirects to check-answers", async () => {
      const session = {
        journeyDrafts: {
          [draftKey]: {
            ...ApplicationDto.toAnswers(ukApplication),
            osAddressLine1: "10 Some Other Street",
            osCountry: "France",
          },
        },
      };

      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/have-a-home-address`,
        {
          body: { haveAHomeAddress: "no" },
          query: { returnTo: "check-answers" },
          session,
        },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/check-answers`,
      );

      await expectDraftValue(session, "Address", "No fixed address");
    });

    it("redirect to UK address capture when 'has fixed address' is 'yes'", async () => {
      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/have-a-home-address`,
        {
          body: { haveAHomeAddress: "yes" },
          query: { returnTo: "check-answers" },
          session: {
            journeyDrafts: {
              [draftKey]: {
                ...ApplicationDto.toAnswers(ukApplication),
                haveAHomeAddress: "no",
              },
            },
          },
        },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/enter-address-manually?returnTo=check-answers`,
      );
    });

    it("clear UK address when submitting overseas address and redirect to check-answers", async () => {
      const session = {
        journeyDrafts: {
          [draftKey]: ApplicationDto.toAnswers(ukApplication),
        },
      };

      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/enter-overseas-address`,
        {
          body: {
            osAddressLine1: "10 Some Other Street",
            osAddressLine3: "Paris",
            osCountry: "France",
          },
          query: { returnTo: "check-answers" },
          session,
        },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/check-answers`,
      );

      const rows = await getCheckAnswersRows(session);
      const addressRow = rows.find((row) => row.key.text === "Address");
      expect(addressRow?.actions?.items[0].href).to.equal(
        "enter-overseas-address?returnTo=check-answers",
      );
      await expectDraftValue(session, "Address",
        ["10 Some Other Street,", "Paris,", "France"],
      );
    });

    it("clear overseas address answers when submitting UK address and redirect to check-answers", async () => {
      const session = {
        journeyDrafts: {
          [draftKey]: ApplicationDto.toAnswers(overseasApplication),
        },
      };

      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/enter-address-manually`,
        {
          body: {
            ukAddressLine1: "123 Test Street",
            ukAddressLine2: "Test Area",
            ukTownOrCity: "Testville",
            ukPostcode: "TE5 7ST",
            ukCountry: "United Kingdom",
          },
          query: { returnTo: "check-answers" },
          session,
        },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/check-answers`,
      );

      const rows = await getCheckAnswersRows(session);
      const addressRow = rows.find((row) => row.key.text === "Address");
      expect(addressRow?.actions?.items[0].href).to.equal(
        "enter-address-manually?returnTo=check-answers",
      );
      await expectDraftValue(session, "Address",
        ["123 Test Street,", "Test Area,", "Testville,", "TE5 7ST"],
      );
    });
  });

  describe("Legal aid branch changes from check answers", () => {
    it("clear dependent answers when 'legal aid before' changes to 'no' and redirect to check-answers", async () => {
      const session = {
        journeyDrafts: {
          [draftKey]: {
            ...ApplicationDto.toAnswers(ukApplication),
            legalAidBefore: "yesSameMatter",
            legalAidLast6Months: "yes",
            reasonForYes: "Some reason",
          },
        },
      };

      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/legal-aid-before`,
        {
          body: { legalAidBefore: "no" },
          query: { returnTo: "check-answers" },
          session,
        },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/check-answers`,
      );

      const rows = await getCheckAnswersRows(session);
      const visibleRows = rows.filter((row) => row.visibleWhen !== false);
      expect(
        visibleRows.some(
          (row) =>
            row.key.text ===
            "Did your client get legal help for this matter in the last 6 months?",
        ),
      ).to.equal(false);
      expect(
        visibleRows.some(
          (row) =>
            row.key.text === "Reason for new application for same matter",
        ),
      ).to.equal(false);
    });

    it("redirect to recent legal aid questions when 'yes, same matter' is selected", async () => {
      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/legal-aid-before`,
        {
          body: { legalAidBefore: "yesSameMatter" },
          query: { returnTo: "check-answers" },
          session: {
            journeyDrafts: {
              [draftKey]: ApplicationDto.toAnswers(ukApplication),
            },
          },
        },
      );

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal(
        `/cases/${applicationId}/task-list/details/legal-aid-last-6-months?returnTo=check-answers`,
      );
    });
  });

  describe("GET /cases/:applicationID/task-list/details/check-answers", () => {
    let renderResult: TestRenderResult;
    let summaryList: RenderBlock;
    let submitButton: RenderBlock;

    before(async () => {
      renderResult = await getCheckAnswers();
      [summaryList] = renderResult.getBlocksByVariant("govukSummaryList");
      [submitButton] = renderResult.getBlocksByVariant("govukButton");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal("Check your answers");
    });

    it("renders the API client data in a summary list", () => {
  expect(summaryList.properties.rows).to.have.lengthOf(15);
      const values = [
        { key: "ECF", value: "No" },
        { key: "Type of family law", value: "Private" },
        {
          key: "Transitional EU arrangements or an international maintenance agreement",
          value: "No",
        },
        { key: "Legal aid to get a protective injunction order", value: "No" },
        { key: "Evidence case is in scope", value: "Evidence of domestic abuse (Schedule 1)" },
        {
          key: "Accessed legal aid before",
          value: "Yes, about the same matter",
        },
        {
          key: "Did your client get legal help for this matter in the last 6 months?",
          value: "Yes",
        },
        {
          key: "Reason for new application for same matter",
          value: "Some reason for help",
        },
        { key: "First name", value: "John" },
        { key: "Last name", value: "Doe" },
        { key: "Date of birth", value: "1 January 1990" },
        { key: "National Insurance number", value: "AB123456C" },
        { key: "Has a home address", value: "Yes" },
      ];
      for (const { key, value } of values) {
        expectSummaryValue(renderResult, key, value);
      }
    });

    it("links the home address row to the home address question", () => {
      const rows = summaryList.properties.rows as Array<{
        actions?: { items: Array<{ href: string }> };
        key: { text: string };
      }>;
      const homeAddressRow = rows.find(
        (row) => row.key.text === "Has a home address",
      );

      expect(homeAddressRow?.actions?.items[0].href).to.equal(
        "have-a-home-address?returnTo=check-answers",
      );
    });

    it("links a UK address to the UK address step", () => {
      const rows = summaryList.properties.rows as Array<{
        actions?: { items: Array<{ href: string }> };
        key: { text: string };
      }>;
      const addressRow = rows.find((row) => row.key.text === "Address");

      expect(addressRow?.actions?.items[0].href).to.equal(
        "enter-address-manually?returnTo=check-answers",
      );
    });

    it("renders the API UK address in the correct format", () => {
      expectSummaryValue(renderResult, "Address",
        ["123 Test Street,", "Test Area,", "Testville,", "TE5 7ST"],
      );
    });

    it("renders the submit button", () => {
      expect(submitButton.properties.text).to.equal("Save and continue");
    });

    it("renders no when the API has no national insurance number", async () => {
      const result = await getCheckAnswers({
        ...ukApplication,
        clientDetails: {
          ...ukApplication.clientDetails,
          niNumber: null,
        },
      });
      expectSummaryValue(result, "National Insurance number", "No");
    });

    it("renders no fixed address when the API has no fixed address", async () => {
      const result = await getCheckAnswers({
        ...ukApplication,
        clientDetails: {
          ...ukApplication.clientDetails,
          hasFixedAddress: false,
          address: null,
        },
      });
      const [noAddressSummaryList] =
        result.getBlocksByVariant("govukSummaryList");
      const rows = noAddressSummaryList.properties.rows as Array<{
        actions?: { items: Array<{ href: string }> };
        key: { text: string };
        value: { html?: string; text?: string };
      }>;
      const addressRow = rows.find((row) => row.key.text === "Address");
      expect(addressRow).to.not.be.undefined;
      expectSummaryValue(result, "Has a home address", "No");
      expectSummaryValue(result, "Address", "No fixed address");
      expect(addressRow?.actions?.items[0].href).to.equal(
        "have-a-home-address?returnTo=check-answers",
      );
    });

    it("links a missing fixed address to the UK address step", async () => {
      const result = await getCheckAnswers({
        ...ukApplication,
        clientDetails: {
          ...ukApplication.clientDetails,
          hasFixedAddress: true,
          address: null,
        },
      });
      const [summaryList] = result.getBlocksByVariant("govukSummaryList");
      const rows = summaryList.properties.rows as Array<{
        actions?: { items: Array<{ href: string }> };
        key: { text: string };
      }>;
      const addressRow = rows.find((row) => row.key.text === "Address");

      expect(addressRow?.actions?.items[0].href).to.equal(
        "enter-address-manually?returnTo=check-answers",
      );
    });

    it("links and renders an overseas address from the API", async () => {
      const result = await getCheckAnswers(overseasApplication);
      expectOverseasAddress(result);
    });

    it("renders the saved overseas address after switching from UK", async () => {
      const {
        ukAddressLine1,
        ukAddressLine2,
        ukCountry,
        ukCounty,
        ukPostcode,
        ukTownOrCity,
        ...savedAnswers
      } = ApplicationDto.toAnswers(ukApplication);
      const session = {
        journeyDrafts: {
          [draftKey]: {
            ...savedAnswers,
            osAddressLine1: "10 Some Other Street",
            osAddressLine3: "Paris",
            osCountry: "France",
          },
        },
      };

      const result = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session },
      );
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expectOverseasAddress(renderResult);
    });

    it("preserves draft answers when navigating between edit steps", async () => {
      const session = {
        journeyDrafts: {
          [draftKey]: {
            ...ApplicationDto.toAnswers(ukApplication),
            firstName: "Edited",
          },
        },
      };

      const clientDetailsResult = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/client-details`,
        { session },
      );
      expect(clientDetailsResult.type).to.equal("render");

      await expectDraftValue(session, "First name", "Edited");
    });
  });

  describe("POST /cases/:applicationID/task-list/details/check-answers", () => {
    it("redirects to the task list", async () => {
      const result = await editApplicationClient.post(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session: {} },
      );

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(`/cases/${applicationId}/task-list`);
    });
  });
});
