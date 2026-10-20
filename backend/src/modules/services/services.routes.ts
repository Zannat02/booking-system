import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
} from "./services.validation";
import * as servicesController from "./services.controller";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listServicesQuerySchema), servicesController.list);
router.get("/:id", servicesController.getOne);

router.post(
  "/",
  authorize(Role.ADMIN, Role.STAFF),
  validate(createServiceSchema),
  servicesController.create
);
router.patch(
  "/:id",
  authorize(Role.ADMIN, Role.STAFF),
  validate(updateServiceSchema),
  servicesController.update
);

export default router;