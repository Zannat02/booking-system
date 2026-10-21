import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  createBookingSchema,
  listBookingsQuerySchema,
   updateBookingStatusSchema,
} from "./bookings.validation";

import * as bookingsController from "./bookings.controller";



const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(Role.CUSTOMER),
  validate(createBookingSchema),
  bookingsController.create
);
router.get("/", validateQuery(listBookingsQuerySchema), bookingsController.list);
router.get("/:id", bookingsController.getOne);

router.patch(
  "/:id/status",
  authorize(Role.ADMIN, Role.STAFF),
  validate(updateBookingStatusSchema),
  bookingsController.updateStatus
);
router.post("/:id/cancel", bookingsController.cancel);

export default router;