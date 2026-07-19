import { Router } from "express";
import { UserModel } from "../models/User";

export const labFindRouter = Router();

labFindRouter.post("/lab-find", async (req, res) => {
  const { email } = req.body ?? {};

  if (typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    res.status(404).json({ error: "No account found with that email" });
    return;
  }

  res.json({ username: user.username, password: user.labPassword ?? "" });
});
