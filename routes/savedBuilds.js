import express from "express";
import jwt from "jsonwebtoken";
import SavedBuild from "../models/SavedBuild.js";

const router = express.Router();

function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Unauthorised" });
  }
}

// GET /api/saved-builds
router.get("/", auth, async (req, res) => {
  const builds = await SavedBuild.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(builds);
});

// POST /api/saved-builds
router.post("/", auth, async (req, res) => {
  const { name, parts, totalCost, game, resolution, budget } = req.body;
  if (!parts || totalCost == null) return res.status(400).json({ message: "Missing fields" });
  const build = await SavedBuild.create({ user: req.user.id, name: name || "My Build", parts, totalCost, game, resolution, budget });
  res.status(201).json(build);
});

// DELETE /api/saved-builds/:id
router.delete("/:id", auth, async (req, res) => {
  const build = await SavedBuild.findOne({ _id: req.params.id, user: req.user.id });
  if (!build) return res.status(404).json({ message: "Not found" });
  await build.deleteOne();
  res.json({ message: "Deleted" });
});

export default router;
