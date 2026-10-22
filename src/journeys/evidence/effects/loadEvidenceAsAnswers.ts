import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { EvidenceDto } from "#/api/dto/evidence/evidence.dto.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { getJourneyDraftKey } from "#/journeys/journeyDraftKey.js";
import { getSessionDataOrThrow } from "#/journeys/shared.helper.js";
import { logger } from "#/logger.js";

export const loadEvidenceAsAnswers =
  () =>
  (context: EditApplicationContext, journeyCode: string): void => {
    const session = getSessionDataOrThrow(context);
    const draftKey = getJourneyDraftKey(context, journeyCode);

    logger.error("MMMMMM: session:", session.journeyDrafts);

    if (session.journeyDrafts?.[draftKey]) {
      return;
    }

    const application: Application = context.getData(
      CONTEXT_DATA_KEYS.application,
    );

    const answersArray = application.evidence
      ? EvidenceDto.toAnswers(application.evidence)
      : {};

    logger.error("MMMMMM: Answers array:", answersArray);

    for (const [code, value] of Object.entries(answersArray)) {
      context.setAnswer(code, value);
    }

    session.journeyDrafts ??= {};

    session.journeyDrafts[draftKey] = {
      ...session.journeyDrafts[draftKey],
      ...context.getAllAnswers(),
    };
  };
