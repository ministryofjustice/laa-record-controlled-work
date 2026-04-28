import { INTERNAL_SERVER_ERROR, OK } from "#/lib/constants/httpStatus.js";
import { getPerson, postPerson } from "#/controllers/personController.js";
import { validatePerson } from "#/controllers/personSchema.js";
import { exampleApiService } from "#/services/exampleApiService.js";
import type { NextFunction, Request, Response } from "express";
import express from "express";

// Create a new router
const router = express.Router();

/* GET home page. */
router.get("/", (req: Request, res: Response): void => {
  res.render("main/index");
});

router.get("/landing", (req: Request, res: Response): void => {
  res.render("main/landing");
});

// GET users from external API using BaseApiService pattern
router.get(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use the BaseApiService - returns raw axios response (no domain transformation)
      const response = await exampleApiService.getUsers(req.axiosMiddleware, {
        _page: typeof req.query.page === "string" ? req.query.page : "1",
        _limit: typeof req.query.limit === "string" ? req.query.limit : "10",
      });

      // Template users add their own response handling here
      res.json(response.data);
    } catch (error) {
      next(error);
    }
  },
);

// GET single user by ID (demonstrates BaseApiService pattern)
router.get(
  "/users/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [userId] = Array.isArray(req.params.id)
        ? req.params.id
        : [req.params.id];
      const response = await exampleApiService.getUserById(
        req.axiosMiddleware,
        userId,
      );

      // Template users add their own response handling here
      res.json(response.data);
    } catch (error) {
      next(error);
    }
  },
);

// liveness and readiness probes for Helm deployments
router.get("/status", (_req: Request, res: Response): void => {
  res.status(OK).send("OK");
});

router.get("/health", (_req: Request, res: Response): void => {
  res.status(OK).send("Healthy");
});

router.get("/error", (_req: Request, res: Response): void => {
  // Simulate an error
  res
    .set("X-Error-Tag", "TEST_500_ALERT")
    .status(INTERNAL_SERVER_ERROR)
    .send("Internal Server Error");
});

// GET endpoint to render the person change form
router.get("/change/person", getPerson);

router.post("/change/person", validatePerson(), postPerson);

export default router;
