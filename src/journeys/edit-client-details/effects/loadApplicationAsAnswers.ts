import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { getJourneyDraftKey } from "#/journeys/journeyDraftKey.js";
import { getSessionDataOrThrow } from "#/journeys/shared.helper.js";

export const loadApplicationAsAnswers =
  () =>
  (context: EditApplicationContext, journeyCode: string): void => {
    const session = getSessionDataOrThrow(context);
    const draftKey = getJourneyDraftKey(context, journeyCode);

    if (session.journeyDrafts?.[draftKey]) {
      return;
    }

    const applicationETag = context.getData(CONTEXT_DATA_KEYS.applicationETag);
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

    if (typeof applicationETag === "string") {
      session.journeyDraftVersions ??= {};
      session.journeyDraftVersions[draftKey] = applicationETag;
    } else if (session.journeyDraftVersions) {
      const {
        [draftKey]: _staleJourneyDraftVersion,
        ...otherJourneyDraftVersions
      } = session.journeyDraftVersions;
      session.journeyDraftVersions = otherJourneyDraftVersions;
    }
  };
