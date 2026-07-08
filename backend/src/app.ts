import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { adminUsersRouter } from "./routes/admin/users";
import { authRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", healthRouter);
  app.use("/api", authRouter);
  app.use("/api/admin/users", adminUsersRouter);

  app.use(errorHandler);

  return app;
}
