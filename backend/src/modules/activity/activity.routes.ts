import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validateQuery } from "../../middlewares/validate";
import { listActivityQuerySchema } from "./activity.validation";
import * as activityController from "./activity.controller";

const router = Router();

router.use(authenticate);
router.get("/", validateQuery(listActivityQuerySchema), activityController.list);

export default router;