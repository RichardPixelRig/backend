// routes/challenge.js
import express from "express";
import ChallengeEntry from "../models/challengeEntry.js";
import Notification from "../models/Notifications.js";

const router = express.Router();
// Create (Submit) a new challenge entry
router.post("/submit", async (req, res) => {
    const { title, image, userId } = req.body;
  
    if (!title || !image || !userId) {
      return res.status(400).json({ message: "Missing fields" });
    }
  
    try {
      const themeMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
      const entry = await ChallengeEntry.create({
        user: userId,
        buildTitle: title,
        buildImage: image,
        themeMonth,
      });
  
      res.status(201).json({ message: "Entry submitted successfully!", entry });
    } catch (err) {
      console.error("❌ Error submitting entry:", err);
      res.status(500).json({ message: "Failed to submit entry" });
    }
  });
  // Fetch all challenge submissions (for current month)
router.get("/submissions", async (req, res) => {
    try {
      const themeMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
      const entries = await ChallengeEntry.find({ 
        themeMonth,
        deleted: { $ne: true } 
      })
      .populate("user", "username")
      .sort({ createdAt: -1 });
  
      res.json(entries);
    } catch (err) {
      console.error("❌ Error fetching submissions:", err);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  
  
// Vote on a challenge entry
// Vote on a challenge entry
router.post("/vote/:entryId", async (req, res) => {
    const { userId } = req.body;
  
    try {
      const entry = await ChallengeEntry.findById(req.params.entryId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
  
      if (entry.votes.includes(userId)) {
        return res.status(400).json({ message: "Already voted" });
      }
  
      entry.votes.push(userId);
      await entry.save();
  
      // 🔔 Create a notification with the correct deep link to the challenge build page
      await Notification.create({
        userId: entry.user,
        message: "🎯 You received a new vote on your challenge entry!",
        pixelRigLink: `community/challengebuildpage/${entry._id}`, // ✅ Correct link here
        type: "vote",
        threadId: null,
      });
  
      res.json({ message: "Vote recorded" });
    } catch (err) {
      console.error("❌ Error voting:", err);
      res.status(500).json({ message: "Voting failed" });
    }
  });
  
// Fetch a single challenge build by ID
router.get("/build/:id", async (req, res) => {
    try {
      const build = await ChallengeEntry.findById(req.params.id).populate("user", "username");
      if (!build) return res.status(404).json({ message: "Build not found" });
  
      res.json(build);
    } catch (err) {
      console.error("Error fetching single build:", err);
      res.status(500).json({ message: "Failed to fetch build" });
    }
  });
  // routes/challenge.js


  
// Get total number of challenge submissions
router.get("/submissions/count", async (req, res) => {
  try {
    const count = await ChallengeEntry.countDocuments({ deleted: { $ne: true } });
    res.json({ count });
  } catch (err) {
    console.error("❌ Error fetching submission count:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// Fetch a single challenge build by ID
router.get("/submissions/:id", async (req, res) => {
    try {
      const build = await ChallengeEntry.findById(req.params.id).populate("user", "username");
      if (!build) {
        return res.status(404).json({ message: "Build not found" });
      }
      res.json(build);
    } catch (err) {
      console.error("❌ Error fetching build by ID:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  // 🆕 Count only current month's submissions
router.get("/submissions/count/current", async (req, res) => {
    try {
      const themeMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
      const count = await ChallengeEntry.countDocuments({ 
        themeMonth,
        deleted: { $ne: true }
      });
  
      res.json({ count });
    } catch (err) {
      console.error("❌ Error fetching current month submission count:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // 🆕 Fetch last month's top 3 winners
// Get last month's Top 3 winners
// Fetch winners (with tie handling)
// Fetch last month's Top 3 winners
router.get("/winners", async (req, res) => {
    try {
      const themeMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toLocaleString('default', { month: 'long', year: 'numeric' });
  
      const entries = await ChallengeEntry.find({
        themeMonth,
        deleted: { $ne: true }
      })
      .populate("user", "username")
      .sort({ votes: -1, createdAt: 1 });
  
      if (!entries.length) return res.json([]);
  
      let winners = [];
      let lastVoteCount = null;
      let currentPlace = 1;
      let placeCounter = 1;
  
      for (const entry of entries) {
        if (lastVoteCount !== null && entry.votes.length < lastVoteCount) {
          placeCounter++;
        }
  
        if (placeCounter > 3) break; // Only Top 3
  
        winners.push({
          ...entry.toObject(),
          place: placeCounter,
        });
  
        lastVoteCount = entry.votes.length;
      }
  
      res.json(winners);
    } catch (err) {
      console.error("❌ Failed to fetch winners:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  // Admin: Notify Top 3 Winners
router.post("/notify-top3", async (req, res) => {
    const { winners } = req.body; // expect an array of { userId, place, buildId }
  
    try {
      if (!Array.isArray(winners)) {
        return res.status(400).json({ message: "Winners must be an array" });
      }
  
      for (const winner of winners) {
        await Notification.create({
          userId: winner.userId,
          message: `🏆 Congratulations! You placed ${winner.place} in the Monthly Build Challenge!`,
          pixelRigLink: `community/challengebuildpage/${winner.buildId}`,
        });
      }
  
      res.json({ message: "Winners notified!" });
    } catch (err) {
      console.error("❌ Error notifying winners:", err);
      res.status(500).json({ message: "Failed to notify winners" });
    }
  });
  
  
  

export default router;
