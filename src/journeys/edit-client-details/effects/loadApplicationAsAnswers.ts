import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { isJourneySession } from "#/journeys/effects.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export const loadApplicationAsAnswers =
  () =>
  async (
    context: EditApplicationContext,
    journeyCode: string,
  ): Promise<void> => {
    const session = context.getSession();

    if (!isJourneySession(session)) {
      return;
    }

    const application = context.getData(CONTEXT_DATA_KEYS.application);

    const answersArray = ApplicationDto.toAnswers(application);

    for (const [code, value] of Object.entries(answersArray)) {
      if (!context.hasAnswer(code)) {
        context.setAnswer(code, value);
      }
    }

    session.journeyDrafts ??= {};

    session.journeyDrafts[journeyCode] = {
      ...session.journeyDrafts[journeyCode],
      ...context.getAllAnswers(),
    };
  };
