import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  createSlotSchema,
  updateSlotSchema,
  listSlotsQuerySchema,
} from "./slots.validation";
import * as slotsController from "./slots.controller";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listSlotsQuerySchema), slotsController.list);
router.get("/:id", slotsController.getOne);

router.post(
  "/",
  authorize(Role.ADMIN, Role.STAFF),
  validate(createSlotSchema),
  slotsController.create
);
router.patch(
  "/:id",
  authorize(Role.ADMIN, Role.STAFF),
  validate(updateSlotSchema),
  slotsController.update
);

export default router;