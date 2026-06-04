// Import MOJ Frontend
import { initAll as initMOJ } from "@ministryofjustice/frontend";
// Import GOV.UK Frontend
import { initAll as initGOVUK } from "govuk-frontend";

/**
 * Initialises both GOV.UK Frontend and MOJ Frontend packages.
 * Only runs in browser environment and includes error handling.
 *
 * @returns {void}
 */
const initialiseFrontendPackages = (): void => {
  if (typeof window !== "undefined") {
    try {
      initGOVUK();
      initMOJ();
      // Only log in development/debug mode
      if (process.env.NODE_ENV !== "production") {
        console.log("Frontend packages loaded and initialised");
      }
    } catch (error: unknown) {
      // Always log errors, even in production
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`Frontend initialization error: ${errorMessage}`);
    }
  }
};

// Initialise the frontend packages
initialiseFrontendPackages();
