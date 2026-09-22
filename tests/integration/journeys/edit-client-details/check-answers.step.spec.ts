import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { expect } from "chai";
import sinon from "sinon";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import { editApplicationJourney } from "#/journeys/edit-application/editApplication.journey.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { createForgeTestClient } from "../../utils/helpers.js";

type SummaryRow = {
  actions?: { items: Array<{ href: string }> };
  key: { text: string };
  value: { html?: string; text?: string };
  visibleWhen?: boolean;
};

describe("Edit client details check answers step", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";
  const ukApplication: Application = getGetApplicationResponseMock({
    applicationRefNumber: "CW-123456",
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
    scopingQuestions: { priorLegalAid: "yesSameMatter" },
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

  const editApplicationClient = createForgeTestClient(
    editApplicationJourney,
    editApplicationEffectsRegistry,
    {
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

  describe("Edit journey entry navigation", () => {
    it("renders API client data for direct check answers access", async () => {
      const result = await editApplicationClient.get(
        `/cases/${applicationId}/task-list/details/check-answers`,
        { session: {} },
      );

      expect(result.type).to.equal("render");
      const [summaryList] = (result as TestRenderResult).getBlocksByVariant(
        "govukSummaryList",
      );
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
        value: { text: string };
      }>;

      expect(rows.find((row) => row.key.text === "First name")?.value.text).to
        .equal("John");
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

      const rows = await getCheckAnswersRows(session);
      expect(rows.find((row) => row.key.text === "Address")?.value.html).to.equal(
        "No fixed address",
      );
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
      expect(addressRow?.value.html).to.match(
        /10 Some Other Street,<br \/>.*Paris,<br \/>.*France/s,
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
      expect(addressRow?.value.html).to.match(
        /123 Test Street,<br \/>.*Test Area,<br \/>.*Testville,<br \/>.*TE5 7ST/s,
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
          (row) => row.key.text === "Reason for new application for same matter",
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
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
        value: { text: string };
      }>;

      expect(rows.length).to.equal(10);
      expect(rows[0].key.text).to.equal("ECF");
      expect(rows[1].key.text).to.equal("Accessed legal aid before");
      expect(rows[1].value.text).to.equal("Yes, about the same matter");
      expect(rows[2].key.text).to.equal(
        "Did your client get legal help for this matter in the last 6 months?",
      );
      expect(rows[2].value.text).to.equal("Yes");
      expect(rows[3].key.text).to.equal(
        "Reason for new application for same matter",
      );
      expect(rows[3].value.text).to.equal("Some reason for help");
      expect(rows[4].key.text).to.equal("First name");
      expect(rows[4].value.text).to.equal("John");
      expect(rows[5].key.text).to.equal("Last name");
      expect(rows[5].value.text).to.equal("Doe");
      expect(rows[6].key.text).to.equal("Date of birth");
      expect(rows[6].value.text).to.equal("1 January 1990");
      expect(rows[7].key.text).to.equal("National Insurance number");
      expect(rows[7].value.text).to.equal("AB123456C");
      expect(rows[8].key.text).to.equal("Has a home address");
      expect(rows[8].value.text).to.equal("Yes");
      expect(rows[9].key.text).to.equal("Address");
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
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
        value: { html: string };
      }>;
      const addressRow = rows.find((row) => row.key.text === "Address");

      expect(addressRow?.value.html).to.match(
        /123 Test Street,<br \/>.*Test Area,<br \/>.*Testville,<br \/>.*TE5 7ST/s,
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
      const [noNiSummaryList] = result.getBlocksByVariant("govukSummaryList");
      const rows = noNiSummaryList.properties.rows as Array<{
        key: { text: string };
        value: { text: string };
      }>;
      const niNumberRow = rows.find(
        (row) => row.key.text === "National Insurance number",
      );

      expect(niNumberRow?.value.text).to.equal("No");
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
      const homeAddressRow = rows.find(
        (row) => row.key.text === "Has a home address",
      );

      expect(addressRow).to.not.be.undefined;
      expect(homeAddressRow?.value.text).to.equal("No");
      expect(addressRow?.value.html).to.equal("No fixed address");
      expect(addressRow?.actions?.items[0].href).to.equal(
        "have-a-home-address?returnTo=check-answers",
      );
    });

    it("links and renders an overseas address from the API", async () => {
      const result = await getCheckAnswers(overseasApplication);
      const [overseasSummaryList] =
        result.getBlocksByVariant("govukSummaryList");
      const rows = overseasSummaryList.properties.rows as Array<{
        actions?: { items: Array<{ href: string }> };
        key: { text: string };
        value: { html?: string; text?: string };
      }>;
      const addressRow = rows.find((row) => row.key.text === "Address");

      expect(addressRow?.actions?.items[0].href).to.equal(
        "enter-overseas-address?returnTo=check-answers",
      );
      expect(addressRow?.value.html).to.match(
        /10 Some Other Street,<br \/>.*Paris,<br \/>.*France/s,
      );
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
          [JourneyCode.EDIT_CLIENT_DETAILS]: {
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
      const [savedSummaryList] = renderResult.getBlocksByVariant(
        "govukSummaryList",
      );
      const rows = savedSummaryList.properties.rows as Array<{
        actions?: { items: Array<{ href: string }> };
        key: { text: string };
        value: { html?: string; text?: string };
      }>;
      const addressRow = rows.find((row) => row.key.text === "Address");

      expect(addressRow?.actions?.items[0].href).to.equal(
        "enter-overseas-address?returnTo=check-answers",
      );
      expect(addressRow?.value.html).to.match(
        /10 Some Other Street,<br \/>.*Paris,<br \/>.*France/s,
      );
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

      const rows = await getCheckAnswersRows(session);
      expect(rows.find((row) => row.key.text === "First name")?.value.text).to
        .equal("Edited");
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
