import { catchAsync } from "../../utils/catchAsync";
import * as slotsService from "./slots.service";
import { ListSlotsQuery } from "./slots.validation";

export const create = catchAsync(async (req, res) => {
  const slot = await slotsService.createSlot(req.user!, req.body);
  res.status(201).json({ success: true, message: "Slot created", data: slot });
});

export const list = catchAsync(async (req, res) => {
  const { data, meta } = await slotsService.listSlots(
    res.locals.query as ListSlotsQuery,
    req.user!.role
  );
  res.status(200).json({ success: true, data, meta });
});

export const getOne = catchAsync(async (req, res) => {
  const slot = await slotsService.getSlotById(
    req.params.id as string,
    req.user!.role
  );
  res.status(200).json({ success: true, data: slot });
});

export const update = catchAsync(async (req, res) => {
  const slot = await slotsService.updateSlot(
    req.user!,
    req.params.id as string,
    req.body
  );
  res.status(200).json({ success: true, message: "Slot updated", data: slot });
});