import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { getJourneyDraftKey } from "#/journeys/journeyDraftKey.js";
import { getSessionData } from "#/journeys/shared.helper.js";

export const loadApplicationAsAnswers =
  () =>
  (context: EditApplicationContext, journeyCode: string): void => {
    const session = getSessionData(context);
    const draftKey = getJourneyDraftKey(context, journeyCode);

    if (session.journeyDrafts?.[draftKey]) {
      return;
    }

    const application: Application = context.getData(
      CONTEXT_DATA_KEYS.application,
    );

    const answersArray = ApplicationDto.toAnswers(application);

    for (const [code, value] of Object.entries(answersArray)) {
      context.setAnswer(code, value);
    }

    session.journeyDrafts ??= {};

    session.journeyDrafts[draftKey] = {
      ...session.journeyDrafts[draftKey],
      ...context.getAllAnswers(),
    };
  };
