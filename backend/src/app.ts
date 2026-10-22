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

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;