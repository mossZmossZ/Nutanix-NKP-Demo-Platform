import { Router } from "express";
import { UserModel } from "../models/User";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { AUTH_COOKIE, cookieOptions, signToken, verifyPassword } from "../services/auth";

export const authRouter = Router();

authRouter.post("/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const user = await UserModel.findOne({ username });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ id: user.id, role: user.role });
  res.cookie(AUTH_COOKIE, token, cookieOptions);
  res.json({ id: user.id, username: user.username, role: user.role });
});

authRouter.post("/auth/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
});

authRouter.get("/auth/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await UserModel.findById(req.user!.id);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ id: user.id, username: user.username, role: user.role });
});
