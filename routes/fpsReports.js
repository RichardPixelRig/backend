import express from "express";
import jwt from "jsonwebtoken";
import FpsReport from "../models/FpsReport.js";

const router = express.Router();

const REFERENCE_CPU = 3828;
const REFERENCE_GPU = 16000;
const MIN_REPORTS   = 3;    // #3 — don't trust crowd data until this many reports exist
const BLEND_FULL_AT = 10;   // #4 — at this many reports, crowd data is 100% trusted

function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Unauthorised" });
  }
}

function impliedBase(r) {
  const weight =
    r.resolution === "1080p" ? { cpu: 0.35, gpu: 0.65 } :
    r.resolution === "1440p" ? { cpu: 0.2,  gpu: 0.8  } :
                               { cpu: 0.1,  gpu: 0.9  };
  const combined = (r.cpuScore / REFERENCE_CPU) * weight.cpu +
                   (r.gpuScore / REFERENCE_GPU) * weight.gpu;
  return r.fps / combined;
}

// #2 — cross-validate: reject if implied base is >3x or <1/3 of the current bucket mean
function isPlausible(base, existingBases) {
  if (existingBases.length < 2) return true;
  const mean = existingBases.reduce((a, b) => a + b, 0) / existingBases.length;
  return base >= mean / 3 && base <= mean * 3;
}

// #1 — remove outliers beyond 2 standard deviations
function removeOutliers(values) {
  if (values.length < 5) return values;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std  = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
  return values.filter(v => Math.abs(v - mean) <= 2 * std);
}

// POST /api/fps-reports
router.post("/", auth, async (req, res) => {
  const { cpuId, gpuId, cpuScore, gpuScore, game, resolution, fps } = req.body;
  if (!cpuId || !gpuId || !cpuScore || !gpuScore || !game || !resolution || !fps) {
    return res.status(400).json({ message: "Missing fields" });
  }
  if (fps < 1 || fps > 9999) {
    return res.status(400).json({ message: "Invalid FPS value" });
  }

  // #2 — cross-validate against existing reports before accepting
  const existing = await FpsReport.find({ game, resolution });
  const existingBases = existing.map(impliedBase);
  const thisBase = impliedBase({ cpuScore, gpuScore, fps, resolution });

  if (!isPlausible(thisBase, existingBases)) {
    return res.status(422).json({
      message: "Your reported FPS looks inconsistent with other reports for this game and resolution. Double-check your settings and try again.",
    });
  }

  const report = await FpsReport.findOneAndUpdate(
    { user: req.user.id, game, resolution },
    { cpuId, gpuId, cpuScore, gpuScore, fps },
    { upsert: true, new: true }
  );

  res.json({ message: "Reported", report });
});

// GET /api/fps-reports/averages
router.get("/averages", async (req, res) => {
  const reports = await FpsReport.find({});

  // Group implied bases by game+resolution
  const buckets = {};
  for (const r of reports) {
    const key = `${r.game}||${r.resolution}`;
    if (!buckets[key]) buckets[key] = { game: r.game, resolution: r.resolution, bases: [] };
    buckets[key].bases.push(impliedBase(r));
  }

  const averages = {};
  for (const { game, resolution, bases } of Object.values(buckets)) {
    // #3 — skip bucket if not enough reports
    if (bases.length < MIN_REPORTS) continue;

    // #1 — remove statistical outliers
    const clean = removeOutliers(bases);
    if (clean.length < MIN_REPORTS) continue;

    const crowdBase  = clean.reduce((a, b) => a + b, 0) / clean.length;
    const count      = clean.length;

    // #4 — blend crowd base with hardcoded fallback, weight grows with count
    // crowdWeight: 0 at MIN_REPORTS, 1.0 at BLEND_FULL_AT
    const crowdWeight = Math.min(1, (count - MIN_REPORTS) / (BLEND_FULL_AT - MIN_REPORTS));

    if (!averages[game]) averages[game] = {};
    averages[game][resolution] = {
      base:        Math.round(crowdBase),  // raw crowd base for reference
      crowdWeight: +crowdWeight.toFixed(2),
      count,
    };
  }

  res.json(averages);
});

export default router;
