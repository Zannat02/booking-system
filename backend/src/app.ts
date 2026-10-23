import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrls.length > 0 ? env.clientUrls : true }));
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Booking System API is running",
    frontend: "https://service-booking-system-ashy.vercel.app/",
    health: "/api/health",
    documentation: "See the README for available API endpoints",
  });
});

app.use("/api", routes); 

app.use(notFound);
app.use(errorHandler);

export default app;