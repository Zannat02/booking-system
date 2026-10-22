import { catchAsync } from "../../utils/catchAsync";
import * as dashboardService from "./dashboard.service";

export const get = catchAsync(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user!);
  res.status(200).json({ success: true, data });
});