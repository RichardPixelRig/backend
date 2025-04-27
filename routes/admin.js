import express from "express";
import User from "../models/User.js";
import Thread from "../models/Thread.js";
import Reply from "../models/Reply.js";
import Build from "../models/Build.js";
import Notification from "../models/Notifications.js";
import Visit from "../models/Visit.js";
import ChallengeEntry from "../models/ChallengeEntry.js"; // ✅

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    // 🧹 Moved everything inside the route
    const [
      totalUsers,
      newUsersThisMonth,
      totalThreads,
      totalReplies,
      totalBuilds,
      totalNotifications,
      totalVisits,
      visitsThisMonth,
      threadsThisMonth,
      repliesThisMonth,
      buildsThisMonth,
      notificationsThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      Thread.countDocuments(),
      Reply.countDocuments(),
      Build.countDocuments(),
      Notification.countDocuments(),
      Visit.countDocuments(),
      Visit.countDocuments({ createdAt: { $gte: monthStart } }),
      Thread.countDocuments({ createdAt: { $gte: monthStart } }),
      Reply.countDocuments({ createdAt: { $gte: monthStart } }),
      Build.countDocuments({ createdAt: { $gte: monthStart } }),
      Notification.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);

    const builds = await Build.find({}, "likes dislikes");
    const totalVotes = builds.reduce((acc, build) => acc + build.likes.length + build.dislikes.length, 0);

    // 🏆 Challenge stats
    const challengeSubmissionsThisMonth = await ChallengeEntry.countDocuments({
      themeMonth: currentMonth,
      deleted: { $ne: true },
    });

    const challengeVotesDocs = await ChallengeEntry.find({
      themeMonth: currentMonth,
      deleted: { $ne: true },
    });
    const challengeVotesThisMonth = challengeVotesDocs.reduce((sum, entry) => sum + (entry.votes?.length || 0), 0);

    res.json({
      totalUsers,
      newUsersThisMonth,
      totalThreads,
      totalReplies,
      totalBuilds,
      totalNotifications,
      totalVisits,
      visitsThisMonth,
      threadsThisMonth,
      repliesThisMonth,
      buildsThisMonth,
      notificationsThisMonth,
      totalVotes,
      challengeSubmissionsThisMonth,
      challengeVotesThisMonth, // ✅ now included
    });
  } catch (err) {
    console.error("❌ Error fetching admin stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
