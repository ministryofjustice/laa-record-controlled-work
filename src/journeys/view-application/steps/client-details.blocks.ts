import { t } from "#/lib/i18n.js";
import { MOJSubNavigation } from "@ministryofjustice/hmpps-forge/moj-components";

export function subNavigation(): ReturnType<typeof MOJSubNavigation> {
  return MOJSubNavigation({
    items: [
      {
        active: true,
        href: "client-details",
        text: t("pages.view.tabs.ClientDetails"),
      },
      {
        href: "means-assessment",
        text: t("pages.view.tabs.meansAssessment"),
      },
      {
        href: "evidence",
        text: t("pages.view.tabs.evidence"),
      },
    ],
  });
}

