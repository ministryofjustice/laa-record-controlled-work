import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { Status } from "#/journeys/journey.types.js";

const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== "";

const statusFor = (values: unknown[]): Status =>
  values.some((value): boolean => hasValue(value))
    ? Status.COMPLETED
    : Status.INCOMPLETE;

const determineStepStatus = (
  prerequisiteStatus: Status,
  values: unknown[],
): Status =>
  prerequisiteStatus === Status.COMPLETED
    ? statusFor(values)
    : Status.CANNOT_START;

const getClientDetailsValues = ({ clientDetails }: Application): unknown[] => {
  const { address } = clientDetails;

  return [
    clientDetails.firstName,
    clientDetails.lastName,
    clientDetails.dateOfBirth,
    clientDetails.niNumber,
    address?.addressLine1,
    address?.addressLine2,
    address?.addressLine3,
    address?.addressLine4,
    address?.townOrCity,
    address?.postCode,
    address?.county,
    address?.country,
  ];
};

const getEvidenceValues = ({ evidence }: Application): unknown[] => [
  evidence?.evidenceStatus,
];

const getDeclarationValues = ({ declaration }: Application): unknown[] => [
  declaration?.clientDeclarationStatus,
  declaration?.declarationConfirmation,
];

export const setTaskListStatuses =
  () =>
  (context: EditApplicationContext): void => {
    const application = context.getData(CONTEXT_DATA_KEYS.application);
    const clientDetailsStatus = statusFor(getClientDetailsValues(application));

    const meansAssessment = determineStepStatus(clientDetailsStatus, [
      application.eligibility?.result,
    ]);

    const evidenceStatus = determineStepStatus(
      meansAssessment,
      getEvidenceValues(application),
    );

    const declarationStatus = determineStepStatus(
      evidenceStatus,
      getDeclarationValues(application),
    );

    context.setData(CONTEXT_DATA_KEYS.clientDetailsStatus, clientDetailsStatus);
    context.setData(CONTEXT_DATA_KEYS.evidenceStatus, evidenceStatus);
    context.setData(CONTEXT_DATA_KEYS.declarationStatus, declarationStatus);
    context.setData(CONTEXT_DATA_KEYS.meansAssessment, meansAssessment);
  };
