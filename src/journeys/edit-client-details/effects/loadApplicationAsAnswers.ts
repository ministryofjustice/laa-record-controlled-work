import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { isJourneySession } from "#/journeys/effects.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { logger } from "#/logger.js";

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

    const application: Application = context.getData(
      CONTEXT_DATA_KEYS.application,
    );

    logger.error("MMMMMM load appliction as answers - application", application);

    const answersArray = ApplicationDto.toAnswers(application);

      for (const [code, value] of Object.entries(answersArray)) {
        context.setAnswer(code, value);
      }


    session.journeyDrafts ??= {};

    session.journeyDrafts[journeyCode] = {
      ...session.journeyDrafts[journeyCode],
      ...context.getAllAnswers(),
    };

    logger.error(
      "MMMMMM load appliction as answers - session.journeyDrafts[journeyCode]",
      session.journeyDrafts[journeyCode],
    );
  };
