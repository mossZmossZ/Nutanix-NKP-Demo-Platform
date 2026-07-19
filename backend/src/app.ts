import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { adminUsersRouter } from "./routes/admin/users";
import { adminLabsRouter } from "./routes/admin/labs";
import { adminAssignmentsRouter } from "./routes/admin/assignments";
import { adminMachinesRouter } from "./routes/admin/machines";
import { adminDashboardRouter } from "./routes/admin/dashboard";
import { adminSettingsRouter } from "./routes/admin/settings";
import { authRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";
import { labFindRouter } from "./routes/labFind";
import { meRouter } from "./routes/me";

export function createApp(): Express {
  const app = express();

  // In prod the backend is only reachable through our own nginx over the internal
  // docker network (no published port), which sets X-Forwarded-For/Proto. Trust it
  // so `req.ip` is the real client (per-IP rate limiter + audit) and `req.secure`
  // reflects the external TLS scheme. Safe here precisely because the backend is
  // never directly exposed, so forwarded headers can't be spoofed by a client.
  app.set("trust proxy", true);

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.use("/api", healthRouter);
  app.use("/api", authRouter);
  app.use("/api", labFindRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/labs", adminLabsRouter);
  app.use("/api/admin/assignments", adminAssignmentsRouter);
  app.use("/api/admin/machines", adminMachinesRouter);
  app.use("/api/admin/dashboard", adminDashboardRouter);
  app.use("/api/admin/settings", adminSettingsRouter);
  app.use("/api/me", meRouter);

  app.use(errorHandler);

  return app;
}
