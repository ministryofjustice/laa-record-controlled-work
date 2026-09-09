import type { Express } from "express";

import { Forge } from "@ministryofjustice/hmpps-forge/core";
import {
  createExpressRouter,
  nunjucksFunctions,
} from "@ministryofjustice/hmpps-forge/express-nunjucks";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { mojComponents } from "@ministryofjustice/hmpps-forge/moj-components";

import { getAllProviderOffices } from "#/api/clients/pda/schema/provider-firms-endpoints/provider-firms-endpoints.gen.js";
import {
  createApplication,
  getApplication,
  getApplications,
  updateApplicationDeclaration,
  updateApplicationEvidence,
  updateApplicationStatus,
} from "#/api/clients/rcw/schema/applications/applications.gen.js";
import { requireAuth } from "#/app/middleware/requireAuth.middleware.js";
import { autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import createApplicationJourney from "#/journeys/create-application/create-application.index.js";
import declaration from "#/journeys/declaration/declaration.package.js";
import { editApplicationPackage } from "#/journeys/edit-application/editApplication.package.js";
import { evidencePackage } from "#/journeys/evidence/evidence.package.js";
import { selectOfficePackage } from "#/journeys/select-office/select-office.journey.js";
import { viewApplicationPackage } from "#/journeys/view-application/viewApplication.package.js";
import { yourCasesPackage } from "#/journeys/your-cases/your-cases.journey.js";
import { setupNunjucks } from "#/middleware/setupNunjucks.js";

/**
 * Initializes Forge for the Express application.
 *
 * @param app The Express application instance.
 */
export function initForge(app: Express): void {
  const nunjucksEnv = setupNunjucks(app);
  const forge = new Forge({});

  forge
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerPackage(yourCasesPackage, { getApplications })
    .registerPackage(selectOfficePackage, { getAllProviderOffices })
    .registerPackage(editApplicationPackage, {
      getApplication,
      updateApplicationStatus,
    })
    .registerPackage(createApplicationJourney, { createApplication })
    .registerPackage(declaration, { updateApplicationDeclaration })
    .registerPackage(evidencePackage, { updateApplicationEvidence })
    .registerPackage(viewApplicationPackage, { getApplication });

  const forgeRouter = createExpressRouter(forge, { nunjucksEnv });
  app.use("/", requireAuth, forgeRouter);
}
