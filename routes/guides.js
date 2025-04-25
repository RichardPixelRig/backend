import express from "express";
import Guide from "../models/Guide.js";


const router = express.Router();

// GET all guides
router.get("/", async (req, res) => {
  try {
    const guides = await Guide.find().sort({ createdAt: -1 });
    res.json(guides);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch guides", error: err.message });
  }
});

// POST a new guide (use this for admin adding guides)
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;
    const guide = new Guide({ title, content });
    await guide.save();
    res.status(201).json(guide);
  } catch (err) {
    res.status(500).json({ message: "Failed to create guide", error: err.message });
  }
});

export default router;
