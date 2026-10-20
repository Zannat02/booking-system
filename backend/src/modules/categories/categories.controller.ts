import { catchAsync } from "../../utils/catchAsync";
import * as categoriesService from "./categories.service";
import { ListCategoriesQuery } from "./categories.validation";

export const create = catchAsync(async (req, res) => {
  const category = await categoriesService.createCategory(req.body);
  res.status(201).json({ success: true, message: "Category created", data: category });
});

export const list = catchAsync(async (req, res) => {
  const { data, meta } = await categoriesService.listCategories(
    res.locals.query as ListCategoriesQuery,
    req.user!.role
  );
  res.status(200).json({ success: true, data, meta });
});

export const getOne = catchAsync(async (req, res) => {
  const category = await categoriesService.getCategoryById(
    req.params.id as string,
    req.user!.role
  );
  res.status(200).json({ success: true, data: category });
});

export const update = catchAsync(async (req, res) => {
  const category = await categoriesService.updateCategory(
    req.params.id as string,
    req.body
  );
  res.status(200).json({ success: true, message: "Category updated", data: category });
});