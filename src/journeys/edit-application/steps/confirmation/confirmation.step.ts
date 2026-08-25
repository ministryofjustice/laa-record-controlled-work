import { step, submit, redirect } from "@ministryofjustice/hmpps-forge/core/authoring";
import { confirmationPanel, heading, statement, returnButton } from "./confirmation.blocks.js";

export const confirmationStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
        confirmationPanel(),
        heading(),
        ...statement(),
        returnButton(),
    ],
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
