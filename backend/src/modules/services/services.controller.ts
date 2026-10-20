import { catchAsync } from "../../utils/catchAsync";
import * as servicesService from "./services.service";
import { ListServicesQuery } from "./services.validation";

export const create = catchAsync(async (req, res) => {
  const service = await servicesService.createService(req.body);
  res.status(201).json({ success: true, message: "Service created", data: service });
});

export const list = catchAsync(async (req, res) => {
  const { data, meta } = await servicesService.listServices(
    res.locals.query as ListServicesQuery,
    req.user!.role
  );
  res.status(200).json({ success: true, data, meta });
});

export const getOne = catchAsync(async (req, res) => {
  const service = await servicesService.getServiceById(
    req.params.id as string,
    req.user!.role
  );
  res.status(200).json({ success: true, data: service });
});

export const update = catchAsync(async (req, res) => {
  const service = await servicesService.updateService(
    req.params.id as string,
    req.body
  );
  res.status(200).json({ success: true, message: "Service updated", data: service });
});