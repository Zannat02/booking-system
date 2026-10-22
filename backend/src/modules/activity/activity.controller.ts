import { catchAsync } from "../../utils/catchAsync";
import * as activityService from "./activity.service";
import { ListActivityQuery } from "./activity.validation";

export const list = catchAsync(async (req, res) => {
  const { data, meta } = await activityService.listActivities(
    req.user!,
    res.locals.query as ListActivityQuery
  );
  res.status(200).json({ success: true, data, meta });
});