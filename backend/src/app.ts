import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { adminUsersRouter } from "./routes/admin/users";
import { adminLabsRouter } from "./routes/admin/labs";
import { adminAssignmentsRouter } from "./routes/admin/assignments";
import { adminMachinesRouter } from "./routes/admin/machines";
import { authRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";
import { meRouter } from "./routes/me";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", healthRouter);
  app.use("/api", authRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/labs", adminLabsRouter);
  app.use("/api/admin/assignments", adminAssignmentsRouter);
  app.use("/api/admin/machines", adminMachinesRouter);
  app.use("/api/me", meRouter);

  app.use(errorHandler);

  return app;
}
