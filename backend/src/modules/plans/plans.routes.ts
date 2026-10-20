import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  createPlanSchema,
  updatePlanSchema,
  listPlansQuerySchema,
} from "./plans.validation";
import * as plansController from "./plans.controller";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listPlansQuerySchema), plansController.list);
router.get("/:id", plansController.getOne);

// Shudhu Admin plan banate/bodlate pare
router.post("/", authorize(Role.ADMIN), validate(createPlanSchema), plansController.create);
router.patch("/:id", authorize(Role.ADMIN), validate(updatePlanSchema), plansController.update);

export default router;