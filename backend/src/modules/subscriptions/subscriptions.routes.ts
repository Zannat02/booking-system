import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  subscribeSchema,
  mySubscriptionsQuerySchema,
  allSubscriptionsQuerySchema,
} from "./subscriptions.validation";
import * as subscriptionsController from "./subscriptions.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(Role.CUSTOMER),
  validate(subscribeSchema),
  subscriptionsController.subscribe
);
router.get(
  "/my",
  authorize(Role.CUSTOMER),
  validateQuery(mySubscriptionsQuerySchema),
  subscriptionsController.listMine
);
router.get(
  "/my/active",
  authorize(Role.CUSTOMER),
  subscriptionsController.getMyActive
);
router.get(
  "/",
  authorize(Role.ADMIN),
  validateQuery(allSubscriptionsQuerySchema),
  subscriptionsController.listAll
);

export default router;