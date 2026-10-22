import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import categoriesRoutes from "../modules/categories/categories.routes";
import servicesRoutes from "../modules/services/services.routes";
import plansRoutes from "../modules/plans/plans.routes";
import subscriptionsRoutes from "../modules/subscriptions/subscriptions.routes";
import slotsRoutes from "../modules/slots/slots.routes";
import bookingsRoutes from "../modules/bookings/bookings.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import activityRoutes from "../modules/activity/activity.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/services", servicesRoutes);
router.use("/plans", plansRoutes);
router.use("/subscriptions", subscriptionsRoutes);
router.use("/slots", slotsRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/activity", activityRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;