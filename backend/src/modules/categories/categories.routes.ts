import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
} from "./categories.validation";
import * as categoriesController from "./categories.controller";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listCategoriesQuerySchema), categoriesController.list);
router.get("/:id", categoriesController.getOne);

router.post(
  "/",
  authorize(Role.ADMIN, Role.STAFF),
  validate(createCategorySchema),
  categoriesController.create
);
router.patch(
  "/:id",
  authorize(Role.ADMIN, Role.STAFF),
  validate(updateCategorySchema),
  categoriesController.update
);

export default router;