import { step } from "@ministryofjustice/hmpps-forge/core/authoring";

import { t } from "#/lib/i18n.js";

import { backLink, caption } from "../../common.blocks.js";
import {
  confirmHeading,
  confirmSignedCheckbox,
  confirmSignedDate,
  continueReturnButtons,
  downloadButton,
  heading,
  statement,
} from "./sign.blocks.js";

export const signStep = (): ReturnType<typeof step> => {
  return step({
    blocks: [
      backLink("/cases/new/declaration/confirm"),
      caption,
      heading(),
      ...statement(),
      downloadButton(),
      confirmHeading(),
      confirmSignedCheckbox(),
      confirmSignedDate(),
      continueReturnButtons(),
    ],
    onSubmission: [],
    path: "/sign",
    title: t("journeys.declaration.title"),
  });
};
