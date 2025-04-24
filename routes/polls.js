// routes/polls.js
import express from "express";
import Poll from "../models/Poll.js";

const router = express.Router();

// 🔹 Get the most recent poll
router.get("/current", async (req, res) => {
  try {
    const poll = await Poll.findOne().sort({ createdAt: -1 });
    if (!poll) return res.status(404).json({ message: "No poll found" });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch poll", error: err.message });
  }
});

// 🔹 Submit a vote
router.post("/vote", async (req, res) => {
  const { pollId, optionIndex } = req.body;

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (!poll.options[optionIndex]) {
      return res.status(400).json({ message: "Invalid option" });
    }

    poll.options[optionIndex].votes += 1;
    await poll.save();

    res.json({ message: "Vote recorded", poll });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit vote", error: err.message });
  }
});

export default router;
