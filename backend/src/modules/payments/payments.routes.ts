import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  payBookingSchema,
  listPaymentsQuerySchema,
} from "./payments.validation";
import * as paymentsController from "./payments.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(Role.CUSTOMER),
  validate(payBookingSchema),
  paymentsController.pay
);
router.get(
  "/",
  authorize(Role.ADMIN, Role.CUSTOMER),
  validateQuery(listPaymentsQuerySchema),
  paymentsController.list
);
router.get(
  "/:id",
  authorize(Role.ADMIN, Role.CUSTOMER),
  paymentsController.getOne
);

export default router;