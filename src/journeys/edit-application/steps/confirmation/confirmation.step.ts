import {
  redirect,
  step,
  StepDefinition,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  confirmationPanel,
  heading,
  returnButton,
  statement,
} from "./confirmation.blocks.js";

export const confirmationStep = (): StepDefinition =>
  step({
    blocks: [confirmationPanel(), heading(), ...statement(), returnButton()],
    onSubmission: [
      submit({
        onAlways: {
          next: [
            redirect({
              goto: "/cases",
            }),
          ],
        },
      }),
    ],
    path: "/confirmation",
    title: "Confirmation",
  });
