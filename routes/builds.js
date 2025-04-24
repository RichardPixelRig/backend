import express from "express";
import mongoose from "mongoose";
import Build from "../models/Build.js";
import User from "../models/User.js";
import Notification from "../models/Notifications.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { containsProfanity } from "../utils/profanityFilter.js";


const router = express.Router();

// GET all builds
router.get("/", async (req, res) => {
  try {
    const builds = await Build.find().sort({ createdAt: -1 });
    res.json(builds);
  } catch (err) {
    console.error("❌ Error fetching builds:", err);
    res.status(500).json({ message: "Failed to fetch builds" });
  }
});

// GET a build by slug

// builds.js
router.get("/:pixelRigLink", async (req, res) => {
  try {
    const build = await Build.findOne({ pixelRigLink: req.params.pixelRigLink })
      .populate("user", "username") // populate the build owner
      .lean();

    if (!build) return res.status(404).json({ message: "Build not found" });

    // ✅ Populate author info inside each comment
    const populatedComments = await Promise.all(
      build.comments.map(async (comment) => {
        const author = await User.findById(comment.author).select("username");
        return {
          ...comment,
          author: author ? { _id: author._id, username: author.username } : null,
        };
      })
    );

    let userVote = null;
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;

      if (build.likes.some(like => like.userId?.toString() === userId)) userVote = "up";
      else if (build.dislikes.some(dislike => dislike.userId?.toString() === userId)) userVote = "down";
    }

    res.json({
      ...build,
      comments: populatedComments,
      upvotes: build.likes.length,
      downvotes: build.dislikes.length,
      userVote,
    });
  } catch (err) {
    console.error("❌ Build fetch error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});




// POST a new build
import slugify from "slugify"; // install if needed: npm i slugify

router.post("/", async (req, res) => {
  try {
    const { title, image, description, parts, userId } = req.body;

    // 🚫 Check for inappropriate content
    if (
      containsProfanity(title) ||
      containsProfanity(description) ||
      containsProfanity(parts)
    ) {
      return res
        .status(400)
        .json({ message: "🚫 Inappropriate content detected. Please revise your submission." });
    }

    const pixelRigLink = crypto.randomBytes(5).toString("hex");

    const build = new Build({
      title,
      image,
      description,
      parts,
      pixelRigLink,
      user: userId,
      createdAt: new Date(),
    });

    await build.save();

    res.status(201).json({
      message: "Build created successfully",
      pixelRigLink: build.pixelRigLink,
    });
  } catch (err) {
    console.error("❌ Error saving build:", err);
    res.status(500).json({ message: "Failed to save build" });
  }
});


router.post("/:pixelRigLink/vote", async (req, res) => {
  const { userId, type } = req.body;
  const validTypes = ["up", "down", null];

  if (!userId || !validTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid vote data" });
  }

  try {
    const build = await Build.findOne({ pixelRigLink: req.params.pixelRigLink });
    if (!build) return res.status(404).json({ message: "Build not found" });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 🔁 Remove any existing vote from likes/dislikes
    build.likes = build.likes.filter(entry => entry?.userId?.toString() !== userId);
    build.dislikes = build.dislikes.filter(entry => entry?.userId?.toString() !== userId);

    // ➕ Apply the new vote
    if (type === "up") build.likes.push({ userId: userObjectId });
    if (type === "down") build.dislikes.push({ userId: userObjectId });

    await build.save();

    const buildOwner = await User.findById(build.user);

    if (buildOwner && buildOwner._id.toString() !== userId) {
      // 🧹 Remove old vote notifications
      await Notification.deleteMany({
        userId: buildOwner._id,
        buildId: build._id,
        message: { $regex: /liked|disliked/ },
      });

      // 🔔 Send new one (if not a removal)
      if (type && buildOwner._id.toString() !== userId) {
        const verb = type === "up" ? "liked" : "disliked";
        const notification = new Notification({
          userId: buildOwner._id,
          buildId: build._id,
          pixelRigLink: build.pixelRigLink,
          message: `Someone ${verb} your build: ${build.title}`,
          seen: false,
          type: "vote", // 👈 add this so the front end can target #votes
        });
        await notification.save();

        // Trigger notification update on front end
        setTimeout(() => {
          global?.io?.emit("notifications-updated", buildOwner._id); // if you're using socket.io, optional
        }, 100);
      }
    }

    res.json({
      upvotes: build.likes.length,
      downvotes: build.dislikes.length,
      userVote: type,
    });

  } catch (err) {
    console.error("❌ Vote error:", err.message);
    res.status(500).json({ message: "Vote failed", error: err.message });
  }
});


// POST a comment
router.post("/:pixelRigLink/comments", async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;

    if (containsProfanity(text)) {
      return res.status(400).json({ message: "🚫 Inappropriate comment detected." });
    }

    const build = await Build.findOne({ pixelRigLink: req.params.pixelRigLink });
    if (!build) return res.status(404).json({ message: "Build not found" });

    const authHeader = req.headers.authorization;
    let authorId = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      authorId = decoded.id;
    }

    const commentId = new mongoose.Types.ObjectId();

    const comment = {
      _id: commentId,
      text,
      author: authorId,
      createdAt: new Date(),
      parentCommentId: parentCommentId || null,
    };

    build.comments.push(comment);
    await build.save();

    // 🔔 Notification
    if (String(build.user) !== String(authorId)) {
      const buildOwner = await User.findById(build.user);
      if (buildOwner) {
        const notification = new Notification({
          userId: buildOwner._id,
          buildId: build._id,
          pixelRigLink: build.pixelRigLink,
          message: `Someone commented on your build: ${build.title}`,
          commentId,
          type: "comment",
          seen: false,
        });
        await notification.save();
      }
    }
// Notify the parent comment's author if it's a reply
if (parentCommentId) {
  const parentComment = build.comments.find(c => c._id.toString() === parentCommentId);
  
  if (parentComment && parentComment.author.toString() !== authorId) {
    const parentAuthor = await User.findById(parentComment.author);
    if (parentAuthor) {
      const replyNotification = new Notification({
        userId: parentAuthor._id,
        buildId: build._id,
        pixelRigLink: build.pixelRigLink,
        commentId,
        message: `Someone replied to your comment on "${build.title}"`,
        type: "comment-reply",
        seen: false,
      });
      await replyNotification.save();
    }
  }
}

    // ✅ Return the comment with populated author
    const populatedAuthor = await User.findById(authorId).select("username");

    res.status(201).json({
      ...comment,
      author: populatedAuthor,
    });

  } catch (err) {
    console.error("❌ Comment error:", err.message);
    res.status(500).json({ message: "Error adding comment" });
  }
});

// DELETE a comment and its nested replies
router.delete("/:pixelRigLink/comments/:commentId", async (req, res) => {
  try {
    const { pixelRigLink, commentId } = req.params;

    const build = await Build.findOne({ pixelRigLink });
    if (!build) return res.status(404).json({ message: "Build not found" });

    const commentToDelete = build.comments.find((c) => c._id.toString() === commentId);
    if (!commentToDelete) return res.status(404).json({ message: "Comment not found" });

    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }

    // Make sure the requester is the author of the comment
    if (commentToDelete.author.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own comments." });
    }

    // 🧹 Recursively collect all nested replies to delete
    const collectNestedIds = (id) => {
      const children = build.comments.filter((c) => c.parentCommentId?.toString() === id);
      return children.reduce(
        (acc, child) => [...acc, child._id.toString(), ...collectNestedIds(child._id.toString())],
        []
      );
    };

    const idsToRemove = [commentId, ...collectNestedIds(commentId)];

    // 💥 Remove from the build.comments array
    build.comments = build.comments.filter(
      (c) => !idsToRemove.includes(c._id.toString())
    );

    await build.save();
    res.json({ message: "Comment and its replies deleted." });
  } catch (err) {
    console.error("❌ Delete comment error:", err.message);
    res.status(500).json({ message: "Error deleting comment" });
  }
});






// DELETE a build
router.delete("/:pixelRigLink", async (req, res) => {
  try {
    const build = await Build.findOne({ pixelRigLink: req.params.pixelRigLink });
    if (!build) return res.status(404).json({ message: "Build not found" });

    await build.deleteOne();
    res.json({ message: "Build deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete build:", err);
    res.status(500).json({ message: "Failed to delete build" });
  }
});

export default router;
