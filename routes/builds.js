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
    const builds = await Build.find()
  .sort({ createdAt: -1 })
  .populate("user", "username"); // <-- add this

    res.json(builds);
  } catch (err) {
    console.error("❌ Error fetching builds:", err);
    res.status(500).json({ message: "Failed to fetch builds" });
  }
});


// Get featured builds
// Get featured builds
router.get('/featured', async (req, res) => {
  try {
    const featuredBuilds = await Build.find({ featured: true })
      .populate("user", "username"); // 👈 ADD THIS to populate user info
    res.json(featuredBuilds);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch featured builds", error: err.message });
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
    const { title, image, description, parts, partsData, totalCost, game, resolution, userId } = req.body;

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
      partsData: partsData || null,
      totalCost: totalCost || null,
      game: game || null,
      resolution: resolution || null,
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
// Unfeature a build
router.patch("/id/:id/unfeature", async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: "Build not found" });

    build.featured = false;
    await build.save();

    res.json({ message: "Build unfeatured successfully" });
  } catch (err) {
    console.error("❌ Error unfeaturing build:", err.message);
    res.status(500).json({ message: "Failed to unfeature build" });
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

//featured notification
router.post("/:pixelRigLink/feature", async (req, res) => {
  try {
    const build = await Build.findOne({ pixelRigLink: req.params.pixelRigLink });
    if (!build) return res.status(404).json({ message: "Build not found" });

    build.featured = true; // 🔥 Mark as featured
    await build.save();

    const buildOwner = await User.findById(build.user);
    if (buildOwner) {
      const notification = new Notification({
        userId: buildOwner._id,
        buildId: build._id,
        pixelRigLink: build.pixelRigLink,
        message: `🎉 Your build "${build.title}" was selected as a Featured Build!`,
        type: "featured",
        seen: false,
      });
      await notification.save();
    }

    res.status(200).json({ message: "Build featured and notification sent!" });
  } catch (err) {
    console.error("❌ Error featuring build:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
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



// PATCH edit a comment (author only, within 15 minutes)
router.patch("/:pixelRigLink/comments/:commentId/like", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    const userId = decoded.id;

    const build = await Build.findOne({ pixelRigLink: req.params.pixelRigLink });
    if (!build) return res.status(404).json({ message: "Build not found" });

    const comment = build.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const userObjId = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = comment.likes.some(id => id.toString() === userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userObjId);
      if (comment.author.toString() !== userId) {
        const author = await User.findById(comment.author);
        if (author) {
          await new Notification({
            userId: author._id,
            buildId: build._id,
            pixelRigLink: build.pixelRigLink,
            commentId: comment._id,
            message: `Someone liked your comment on "${build.title}"`,
            type: "comment-like",
            seen: false,
          }).save();
        }
      }
    }

    await build.save();
    res.json({ likes: comment.likes.length, liked: !alreadyLiked });
  } catch (err) {
    console.error("❌ Like comment error:", err.message);
    res.status(500).json({ message: "Failed to like comment" });
  }
});

router.patch("/:pixelRigLink/comments/:commentId", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Text required" });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    const userId = decoded.id;

    const build = await Build.findOne({ pixelRigLink: req.params.pixelRigLink });
    if (!build) return res.status(404).json({ message: "Build not found" });

    const comment = build.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.author.toString() !== userId) return res.status(403).json({ message: "Not your comment" });

    const ageMinutes = (Date.now() - new Date(comment.createdAt)) / 60000;
    if (ageMinutes > 15) return res.status(403).json({ message: "Comments can only be edited within 15 minutes of posting" });

    comment.text = text.trim();
    comment.editedAt = new Date();
    await build.save();

    res.json({ message: "Comment updated", editedAt: comment.editedAt });
  } catch (err) {
    console.error("❌ Edit comment error:", err.message);
    res.status(500).json({ message: "Failed to edit comment" });
  }
});

// DELETE a comment and its nested replies
// DELETE a comment and its nested replies
router.delete("/:pixelRigLink/comments/:commentId", async (req, res) => {
  try {
    const { pixelRigLink, commentId } = req.params;
    const reason = req.query.reason || "";

    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const build = await Build.findOne({ pixelRigLink });
    if (!build) return res.status(404).json({ message: "Build not found" });

    const commentToDelete = build.comments.find((c) => c._id.toString() === commentId);
    if (!commentToDelete) return res.status(404).json({ message: "Comment not found" });

    const requestingUser = await User.findById(userId);
    const isAdmin = requestingUser?.isAdmin;

    const isAuthor = commentToDelete.author.toString() === userId;

    if (!isAuthor && !isAdmin) {
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
    build.comments = build.comments.filter((c) => !idsToRemove.includes(c._id.toString()));

    await build.save();

    // 🔔 Send notification if ADMIN deletes someone else's comment
    if (isAdmin && !isAuthor) {
      const commentAuthor = await User.findById(commentToDelete.author);
      if (commentAuthor) {
        const notification = new Notification({
          userId: commentAuthor._id,
          buildId: build._id,
          pixelRigLink: build.pixelRigLink,
          message: `❌ Your comment on "${build.title}" was deleted by an admin.${reason ? ` Reason: ${reason}` : ""}`,
          type: "comment-deletion",
          seen: false,
        });
        await notification.save();

        global?.io?.emit("notifications-updated", commentAuthor._id); // If using socket.io
      }
    }

    res.json({ message: "Comment and its replies deleted." });

  } catch (err) {
    console.error("❌ Delete comment error:", err.message);
    res.status(500).json({ message: "Error deleting comment" });
  }
});

// Correct single route: delete a build by ID (Admin or Owner)
router.delete("/id/:buildId", async (req, res) => {
  try {
    const { buildId } = req.params;
    const reason = req.query.reason || "";

    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }

    const build = await Build.findById(buildId);
    if (!build) return res.status(404).json({ message: "Build not found" });

    const buildOwner = await User.findById(build.user);
    const requestingUser = await User.findById(userId);

    const isAdmin = requestingUser?.isAdmin;
    const isOwner = build.user.toString() === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized to delete this build" });
    }

    if (buildOwner && isAdmin) {
      const notification = new Notification({
        userId: buildOwner._id,
        buildId: build._id,
        pixelRigLink: build.pixelRigLink,
        message: `❌ Your build "${build.title}" was deleted by an admin.${reason ? ` Reason: ${reason}` : ""}`,
        type: "build-deletion",
        seen: false,
      });
      await notification.save();

      // Optional real-time update
      global?.io?.emit("notifications-updated", buildOwner._id);
    }

    await build.deleteOne();

    res.json({ message: "Build deleted successfully." });

  } catch (err) {
    console.error("❌ Failed to delete build:", err.message);
    res.status(500).json({ message: "Failed to delete build" });
  }
});





export default router;
