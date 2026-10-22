import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import * as dashboardController from "./dashboard.controller";

const router = Router();

router.get("/", authenticate, dashboardController.get);

export default router;