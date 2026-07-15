import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { UserModel, type Role } from "../../models/User";
import { requireAuth, requireAdmin, type AuthedRequest } from "../../middleware/auth";
import { hashPassword } from "../../services/auth";
import { recordAudit } from "../../services/audit";

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth, requireAdmin);

const isRole = (v: unknown): v is Role => v === "admin" || v === "user";

function publicUser(u: { id: string; username: string; role: Role; createdAt?: Date }) {
  return { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt };
}

adminUsersRouter.get("/", async (_req, res) => {
  const users = await UserModel.find().sort({ createdAt: 1 });
  res.json(users.map((u) => publicUser(u as never)));
});

adminUsersRouter.post("/", async (req: AuthedRequest, res) => {
  const { username, password, role } = req.body ?? {};
  if (typeof username !== "string" || !username.trim()) {
    res.status(400).json({ error: "username is required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "password must be at least 8 characters" });
    return;
  }
  if (!isRole(role)) {
    res.status(400).json({ error: "role must be 'admin' or 'user'" });
    return;
  }
  if (await UserModel.exists({ username: username.trim() })) {
    res.status(409).json({ error: "username already exists" });
    return;
  }
  const user = await UserModel.create({
    username: username.trim(),
    passwordHash: await hashPassword(password),
    role,
  });
  await recordAudit({ actorId: req.user!.id, action: "user.create", targetType: "user", targetLabel: user.username });
  res.status(201).json(publicUser(user as never));
});

adminUsersRouter.patch("/:id", async (req: AuthedRequest, res) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  const user = await UserModel.findById(req.params.id);
  if (!user) {
    res.status(404).json({ error: "user not found" });
    return;
  }

  const { password, role } = req.body ?? {};
  const update: { passwordHash?: string; role?: Role } = {};

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({ error: "password must be at least 8 characters" });
      return;
    }
    update.passwordHash = await hashPassword(password);
  }

  if (role !== undefined) {
    if (!isRole(role)) {
      res.status(400).json({ error: "role must be 'admin' or 'user'" });
      return;
    }
    // Guard: don't demote the last remaining admin.
    if (user.role === "admin" && role === "user" && (await UserModel.countDocuments({ role: "admin" })) <= 1) {
      res.status(409).json({ error: "cannot demote the last admin" });
      return;
    }
    update.role = role;
  }

  Object.assign(user, update);
  await user.save();
  res.json(publicUser(user as never));
});

adminUsersRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  if (id === req.user!.id) {
    res.status(409).json({ error: "cannot delete your own account" });
    return;
  }
  const user = await UserModel.findById(id);
  if (!user) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  // Guard: don't delete the last remaining admin.
  if (user.role === "admin" && (await UserModel.countDocuments({ role: "admin" })) <= 1) {
    res.status(409).json({ error: "cannot delete the last admin" });
    return;
  }
  await user.deleteOne();
  await recordAudit({ actorId: req.user!.id, action: "user.delete", targetType: "user", targetLabel: user.username });
  res.status(204).end();
});
