import { catchAsync } from "../../utils/catchAsync";
import * as authService from "./auth.service";

export const register = catchAsync(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: result,
  });
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json({ success: true, data: user });
});