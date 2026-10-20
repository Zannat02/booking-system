import { catchAsync } from "../../utils/catchAsync";
import * as usersService from "./users.service";
import { ListUsersQuery } from "./users.validation";

export const createStaff = catchAsync(async (req, res) => {
  const staff = await usersService.createStaff(req.body);
  res.status(201).json({ success: true, message: "Staff created", data: staff });
});

export const list = catchAsync(async (_req, res) => {
  const { data, meta } = await usersService.listUsers(
    res.locals.query as ListUsersQuery
  );
  res.status(200).json({ success: true, data, meta });
});