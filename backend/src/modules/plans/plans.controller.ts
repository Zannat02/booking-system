import { catchAsync } from "../../utils/catchAsync";
import * as plansService from "./plans.service";
import { ListPlansQuery } from "./plans.validation";

export const create = catchAsync(async (req, res) => {
  const plan = await plansService.createPlan(req.body);
  res.status(201).json({ success: true, message: "Plan created", data: plan });
});

export const list = catchAsync(async (req, res) => {
  const { data, meta } = await plansService.listPlans(
    res.locals.query as ListPlansQuery,
    req.user!.role
  );
  res.status(200).json({ success: true, data, meta });
});

export const getOne = catchAsync(async (req, res) => {
  const plan = await plansService.getPlanById(
    req.params.id as string,
    req.user!.role
  );
  res.status(200).json({ success: true, data: plan });
});

export const update = catchAsync(async (req, res) => {
  const plan = await plansService.updatePlan(req.params.id as string, req.body);
  res.status(200).json({ success: true, message: "Plan updated", data: plan });
});