import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { AppError } from "../utils/AppError";

const formatIssues = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.map(String).join("."),
    message: issue.message,
  }));

export const validate =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError("Validation failed", 400, formatIssues(result.error)));
    }
    req.body = result.data;
    next();
  };

export const validateQuery =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new AppError("Invalid query parameters", 400, formatIssues(result.error)));
    }
    res.locals.query = result.data;
    next();
  };