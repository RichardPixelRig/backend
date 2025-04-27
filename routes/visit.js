import express from "express";
import Visit from "../models/Visit.js";

const router = express.Router();

// Record a new visit
router.post("/", async (req, res) => {
  try {
    const visit = new Visit({
      ipAddress: req.ip, // or req.headers["x-forwarded-for"] || req.connection.remoteAddress
      userAgent: req.headers["user-agent"] || "",
    });
    await visit.save();
    res.status(201).json({ message: "Visit recorded" });
  } catch (err) {
    console.error("❌ Error recording visit:", err);
    res.status(500).json({ message: "Error recording visit" });
  }
});

export default router;
