import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import { createStaffSchema, listUsersQuerySchema } from "./users.validation";
import * as usersController from "./users.controller";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.post("/staff", validate(createStaffSchema), usersController.createStaff);
router.get("/", validateQuery(listUsersQuerySchema), usersController.list);

export default router;