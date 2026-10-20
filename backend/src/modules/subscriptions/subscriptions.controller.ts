import { catchAsync } from "../../utils/catchAsync";
import * as subscriptionsService from "./subscriptions.service";
import {
  MySubscriptionsQuery,
  AllSubscriptionsQuery,
} from "./subscriptions.validation";

export const subscribe = catchAsync(async (req, res) => {
  const result = await subscriptionsService.subscribeToPlan(
    req.user!.id,
    req.body.planId
  );
  res
    .status(201)
    .json({ success: true, message: "Subscribed successfully", data: result });
});

export const listMine = catchAsync(async (req, res) => {
  const { data, meta } = await subscriptionsService.listMySubscriptions(
    req.user!.id,
    res.locals.query as MySubscriptionsQuery
  );
  res.status(200).json({ success: true, data, meta });
});

export const getMyActive = catchAsync(async (req, res) => {
  const data = await subscriptionsService.getMyActiveSubscription(req.user!.id);
  res.status(200).json({ success: true, data });
});

export const listAll = catchAsync(async (req, res) => {
  const { data, meta } = await subscriptionsService.listAllSubscriptions(
    res.locals.query as AllSubscriptionsQuery
  );
  res.status(200).json({ success: true, data, meta });
});