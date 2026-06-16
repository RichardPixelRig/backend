import express from "express";
import jwt from "jsonwebtoken";
import FpsReport from "../models/FpsReport.js";

// Hardcoded baseline — used to sanity-check submissions before crowd data exists
const HARDCODED_BASE = {
  "Valorant":               { "1080p": 400, "1440p": 300, "4K": 180 },
  "CS2":                    { "1080p": 350, "1440p": 260, "4K": 150 },
  "Fortnite":               { "1080p": 180, "1440p": 120, "4K": 70  },
  "Apex Legends":           { "1080p": 200, "1440p": 140, "4K": 85  },
  "Overwatch 2":            { "1080p": 220, "1440p": 160, "4K": 95  },
  "Rainbow Six Siege":      { "1080p": 280, "1440p": 200, "4K": 110 },
  "Rocket League":          { "1080p": 300, "1440p": 220, "4K": 130 },
  "Call of Duty: Warzone":  { "1080p": 160, "1440p": 110, "4K": 65  },
  "Call of Duty: BO6":      { "1080p": 170, "1440p": 115, "4K": 68  },
  "PUBG":                   { "1080p": 130, "1440p": 90,  "4K": 55  },
  "Escape from Tarkov":     { "1080p": 100, "1440p": 70,  "4K": 42  },
  "Halo Infinite":          { "1080p": 190, "1440p": 130, "4K": 80  },
  "Team Fortress 2":        { "1080p": 380, "1440p": 280, "4K": 160 },
  "Splitgate":              { "1080p": 240, "1440p": 170, "4K": 100 },
  "XDefiant":               { "1080p": 200, "1440p": 140, "4K": 85  },
  "Hunt: Showdown 1896":    { "1080p": 110, "1440p": 78,  "4K": 48  },
  "Cyberpunk 2077":         { "1080p": 80,  "1440p": 55,  "4K": 30  },
  "Elden Ring":             { "1080p": 90,  "1440p": 70,  "4K": 45  },
  "Red Dead Redemption 2":  { "1080p": 85,  "1440p": 60,  "4K": 35  },
  "GTA V":                  { "1080p": 140, "1440p": 95,  "4K": 56  },
  "The Witcher 3":          { "1080p": 100, "1440p": 70,  "4K": 42  },
  "Hogwarts Legacy":        { "1080p": 75,  "1440p": 52,  "4K": 30  },
  "Starfield":              { "1080p": 70,  "1440p": 50,  "4K": 28  },
  "Horizon Zero Dawn":      { "1080p": 95,  "1440p": 68,  "4K": 40  },
  "Horizon Forbidden West": { "1080p": 80,  "1440p": 56,  "4K": 32  },
  "God of War":             { "1080p": 90,  "1440p": 64,  "4K": 38  },
  "Spider-Man Remastered":  { "1080p": 95,  "1440p": 68,  "4K": 40  },
  "Spider-Man 2":           { "1080p": 85,  "1440p": 60,  "4K": 35  },
  "Assassin's Creed Mirage":{ "1080p": 90,  "1440p": 63,  "4K": 38  },
  "Assassin's Creed Shadows":{"1080p": 65,  "1440p": 45,  "4K": 26  },
  "Avatar: Frontiers":      { "1080p": 65,  "1440p": 44,  "4K": 26  },
  "Alan Wake 2":            { "1080p": 70,  "1440p": 48,  "4K": 28  },
  "Black Myth: Wukong":     { "1080p": 72,  "1440p": 50,  "4K": 29  },
  "Indiana Jones":          { "1080p": 78,  "1440p": 54,  "4K": 32  },
  "Baldur's Gate 3":        { "1080p": 95,  "1440p": 68,  "4K": 40  },
  "Diablo IV":              { "1080p": 120, "1440p": 85,  "4K": 50  },
  "Path of Exile 2":        { "1080p": 100, "1440p": 72,  "4K": 43  },
  "Dark Souls III":         { "1080p": 120, "1440p": 85,  "4K": 50  },
  "Monster Hunter: World":  { "1080p": 100, "1440p": 70,  "4K": 42  },
  "Monster Hunter Wilds":   { "1080p": 80,  "1440p": 56,  "4K": 33  },
  "Dragon's Dogma 2":       { "1080p": 68,  "1440p": 47,  "4K": 28  },
  "Palworld":               { "1080p": 90,  "1440p": 64,  "4K": 38  },
  "Helldivers 2":           { "1080p": 85,  "1440p": 60,  "4K": 35  },
  "DOOM Eternal":           { "1080p": 200, "1440p": 140, "4K": 82  },
  "Destiny 2":              { "1080p": 160, "1440p": 110, "4K": 65  },
  "Deep Rock Galactic":     { "1080p": 200, "1440p": 140, "4K": 85  },
  "Warhammer 40K: Space Marine 2": { "1080p": 80, "1440p": 56, "4K": 33 },
  "Dead by Daylight":       { "1080p": 130, "1440p": 90,  "4K": 54  },
  "Phasmophobia":           { "1080p": 110, "1440p": 78,  "4K": 46  },
  "EA FC 25":               { "1080p": 200, "1440p": 140, "4K": 82  },
  "F1 24":                  { "1080p": 180, "1440p": 125, "4K": 73  },
  "Forza Horizon 5":        { "1080p": 160, "1440p": 110, "4K": 65  },
  "Gran Turismo 7":         { "1080p": 170, "1440p": 118, "4K": 70  },
  "NBA 2K25":               { "1080p": 160, "1440p": 112, "4K": 66  },
  "iRacing":                { "1080p": 200, "1440p": 140, "4K": 82  },
  "Microsoft Flight Sim 2024": { "1080p": 50, "1440p": 35, "4K": 20 },
  "Total War: Warhammer III":  { "1080p": 75, "1440p": 52, "4K": 30 },
  "Civilization VII":       { "1080p": 90,  "1440p": 63,  "4K": 37  },
  "Cities: Skylines II":    { "1080p": 65,  "1440p": 45,  "4K": 26  },
  "Age of Empires IV":      { "1080p": 130, "1440p": 90,  "4K": 53  },
  "Minecraft":              { "1080p": 300, "1440p": 220, "4K": 130 },
  "Terraria":               { "1080p": 500, "1440p": 400, "4K": 280 },
  "Stardew Valley":         { "1080p": 500, "1440p": 400, "4K": 280 },
  "Hollow Knight":          { "1080p": 400, "1440p": 300, "4K": 180 },
  "Hades II":               { "1080p": 300, "1440p": 220, "4K": 130 },
  "Celeste":                { "1080p": 500, "1440p": 400, "4K": 280 },
  "Among Us":               { "1080p": 500, "1440p": 400, "4K": 280 },
  "Lethal Company":         { "1080p": 200, "1440p": 140, "4K": 82  },
};

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

// #2 — cross-validate against hardcoded base (always) and bucket mean (when enough reports exist)
function isPlausible(base, game, resolution, existingBases) {
  const hardcoded = HARDCODED_BASE[game]?.[resolution];
  if (hardcoded) {
    // Hard cap: implied base must be within 3× of the hardcoded expectation in either direction
    if (base > hardcoded * 3 || base < hardcoded / 3) return false;
  }
  if (existingBases.length >= 2) {
    const mean = existingBases.reduce((a, b) => a + b, 0) / existingBases.length;
    if (base > mean * 3 || base < mean / 3) return false;
  }
  return true;
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

  if (!isPlausible(thisBase, game, resolution, existingBases)) {
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
