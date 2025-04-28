import express from 'express';
import mongoose from 'mongoose';
import { containsProfanity } from '../utils/profanityFilter.js';
import jwt from "jsonwebtoken";

import Thread from '../models/Thread.js';
import Reply from '../models/Reply.js';
import User from '../models/User.js';
import Notification from '../models/Notifications.js'

const router = express.Router();

// Get all threads with optional sorting and pagination
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    const sortParam = req.query.sort;
    const sortOption = sortParam === 'popular'
      ? { createdAt: -1 }
      : { createdAt: -1 };

    const rawThreads = await Thread.find()
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const threadsWithCounts = await Promise.all(
      rawThreads.map(async (thread) => {
        const count = await Reply.countDocuments({ threadId: thread._id });
        return { ...thread.toObject(), replyCount: count };
      })
    );

    const sortedThreads = sortParam === 'popular'
      ? threadsWithCounts.sort((a, b) => b.replyCount - a.replyCount)
      : threadsWithCounts;

    const total = await Thread.countDocuments();

    res.json({ threads: sortedThreads, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch threads', error: err.message });
  }
});
router.get('/notifications', async (req, res) => {
  console.log("🔥 /api/community/notifications hit"); // <== confirm route is even being triggered
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId in query' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    console.log("✅ Notifications found:", notifications.length);

    res.json({ notifications });
  } catch (err) {
    console.error('❌ Failed to fetch notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
});
// put /api/notifications/:id
router.put('/notifications/:id/seen', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.seen = true;
    await notification.save();

    res.json({ message: 'Notification marked as seen' });
  } catch (err) {
    console.error('❌ Failed to mark notification seen:', err.message);
    res.status(500).json({ message: 'Failed to mark as seen', error: err.message });
  }
});
router.put('/notifications/markAllSeen/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Notification.updateMany(
      { userId, seen: false },
      { $set: { seen: true } }
    );
    res.json({ message: 'All notifications marked as seen', updated: result.modifiedCount });
  } catch (err) {
    console.error('❌ Error marking all as seen:', err.message);
    res.status(500).json({ message: 'Failed to mark all as seen' });
  }
});
router.delete('/notifications/clear/:userId', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.params.userId });
    res.json({ message: 'Notifications cleared', deleted: result.deletedCount });
  } catch (err) {
    console.error('❌ Failed to clear notifications:', err.message);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

// Get a single thread and its replies
router.get('/:id', async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    const replies = await Reply.find({ threadId: req.params.id });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    res.json({ thread, replies });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching thread', error: error.message });
  }
});

// Create a new thread
router.post('/', async (req, res) => {
  const { title, content, author, topic } = req.body;
  if (containsProfanity(title) || containsProfanity(content)) {
    return res.status(400).json({ message: '🚫 Inappropriate content detected.' });
  }

  if (!title || !content || !author) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newThread = new Thread({
      title,
      content,
      author,
      topic: topic || 'General'
    });

    await newThread.save();
    res.json(newThread);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create thread', error: err.message });
  }
});

//replys
router.post('/:id/reply', async (req, res) => {
  const { content, author, parentReplyId } = req.body;

  if (!content || !author) {
    return res.status(400).json({ message: 'Missing reply data' });
  }

  if (containsProfanity(content)) {
    return res.status(400).json({ message: '🚫 Inappropriate reply detected.' });
  }

  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const reply = new Reply({
      threadId: thread._id,
      content,
      author,
      parentReplyId: parentReplyId || null,
    });

    await reply.save();

    // Notify thread author if it's not the same person replying
    if (thread.author !== author) {
      const threadOwner = await User.findOne({ username: thread.author });
      if (threadOwner) {
        const threadNotification = new Notification({
          userId: threadOwner._id,
          threadId: thread._id,
          replyId: reply._id,
          message: `${author} replied to your thread: ${thread.title}`,
          seen: false,
        });
        await threadNotification.save();
      }
    }

    // Notify parent comment author (if replying to a comment that isn't your own)
    if (parentReplyId) {
      const parentReply = await Reply.findById(parentReplyId);
      if (parentReply && parentReply.author !== author) {
        const commentOwner = await User.findOne({ username: parentReply.author });
        if (commentOwner) {
          const replyNotification = new Notification({
            userId: commentOwner._id,
            threadId: thread._id,
            replyId: reply._id,
            message: `${author} replied to your comment`,
            seen: false,
          });
          await replyNotification.save();
        }
      }
    }

    res.json(reply);
  } catch (err) {
    console.error("❌ Error saving reply:", err.message);
    res.status(500).json({ message: "Failed to save reply", error: err.message });
  }
});



// Delete a thread and its replies
// DELETE a thread and its replies
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const requestingUser = await User.findById(userId);
    if (!requestingUser) return res.status(401).json({ message: "Unauthorized" });

    const isAdmin = requestingUser.isAdmin;
    const isAuthor = username === requestingUser.username;

    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const threadOwner = await User.findOne({ username: thread.author });

    // Delete replies related to thread
    await Reply.deleteMany({ threadId: id });
    await thread.deleteOne();

    // If admin deleted and not the owner, notify the thread owner
    if (isAdmin && !isAuthor && threadOwner) {
      const notification = new Notification({
        userId: threadOwner._id,
        threadId: thread._id,
        message: `❌ Your thread "${thread.title}" was deleted by an admin.`,
        type: "thread-deletion",
        seen: false,
      });
      await notification.save();
      global?.io?.emit("notifications-updated", threadOwner._id);
    }

    res.json({ message: "Thread and replies deleted successfully." });
  } catch (err) {
    console.error("❌ Failed to delete thread:", err.message);
    res.status(500).json({ message: "Failed to delete thread", error: err.message });
  }
});



// DELETE a build by ID (with optional reason and notification)
router.delete("/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // 👈 Receive reason from body

    const build = await Build.findById(id);
    if (!build) return res.status(404).json({ message: "Build not found" });

    const buildOwner = await User.findById(build.user);

    if (buildOwner) {
      // Create a notification for the user
      const notification = new Notification({
        userId: buildOwner._id,
        buildId: build._id,
        pixelRigLink: build.pixelRigLink,
        message: reason 
          ? `🛑 Your build "${build.title}" was removed: ${reason}`
          : `🛑 Your build "${build.title}" was removed by an admin.`,
        seen: false,
        type: "build-deleted",
      });

      await notification.save();

      // Optional: If using socket.io for real-time notifications
      setTimeout(() => {
        global?.io?.emit("notifications-updated", buildOwner._id);
      }, 100);
    }

    await build.deleteOne();

    res.json({ message: "Build deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete build:", err);
    res.status(500).json({ message: "Failed to delete build" });
  }
});




// Delete a reply and its children
router.delete('/reply/:replyId', async (req, res) => {
  try {
    const { replyId } = req.params;
    const reason = req.query.reason || "";

    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const requestingUser = await User.findById(userId);
    const isAdmin = requestingUser?.isAdmin;

    const reply = await Reply.findById(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    const isAuthor = reply.author === requestingUser.username;
    const thread = await Thread.findById(reply.threadId);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    // 🧠 Only author or admin can delete
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "You can only delete your own replies." });
    }

    // ✂️ Recursive function to delete reply and all its children
    const deleteReplyAndChildren = async (id) => {
      const children = await Reply.find({ parentReplyId: id });

      for (const child of children) {
        await deleteReplyAndChildren(child._id);
      }

      // Remove notifications related to this reply
      await Notification.deleteMany({ replyId: id });

      await Reply.findByIdAndDelete(id);
    };

    await deleteReplyAndChildren(replyId);

    // 🛎️ Send notification if admin deleted someone else's reply
    if (isAdmin && !isAuthor) {
      const replyOwner = await User.findOne({ username: reply.author });
      if (replyOwner) {
        const notification = new Notification({
          userId: replyOwner._id,
          threadId: thread._id,
          message: `❌ Your reply on "${thread.title}" was deleted by an admin.${reason ? ` Reason: ${reason}` : ""}`,
          type: "reply-deletion",
          seen: false,
        });
        await notification.save();

        global?.io?.emit("notifications-updated", replyOwner._id);
      }
    }

    res.json({ message: "Reply and nested replies deleted successfully" });

  } catch (err) {
    console.error("❌ Error deleting reply:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// Vote on a reply
router.post('/:id/vote', async (req, res) => {
  const { userId, type } = req.body;
  const validTypes = ['up', 'down'];
  if (!userId || (type !== null && !validTypes.includes(type))) {
    return res.status(400).json({ message: 'Invalid vote data' });
  }

  try {
    const reply = await Reply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    reply.upvotes = reply.upvotes.filter(id => id.toString() !== userObjectId.toString());
    reply.downvotes = reply.downvotes.filter(id => id.toString() !== userObjectId.toString());

    if (type === 'up') reply.upvotes.push(userObjectId);
    else if (type === 'down') reply.downvotes.push(userObjectId);

    await reply.save();

// ✅ Only notify if the user is not voting on their own reply
// Only create notification if it's a NEW vote (not null)
// 🧹 If vote was removed (type is null), delete any existing vote notifications
if (type && reply.author !== userId) {
  const replyOwner = await User.findOne({ username: reply.author });
  if (replyOwner) {
    const voteType = type === 'up' ? 'liked' : 'disliked';
    const voteNotification = new Notification({
      userId: replyOwner._id,
      threadId: reply.threadId,
      replyId: reply._id,
      message: `Someone ${voteType} your reply`,
      seen: false,
    });
    await voteNotification.save();
  }
}

// 🧹 Remove notification if vote was removed
if (!type && reply.author !== userId) {
  const replyOwner = await User.findOne({ username: reply.author });
  if (replyOwner) {
    await Notification.deleteMany({
      userId: replyOwner._id,
      threadId: reply.threadId,
      replyId: reply._id,
      message: { $regex: /liked|disliked/ },
    });
  }
}



    res.json({
      upvotes: reply.upvotes,
      downvotes: reply.downvotes,
      userVote: type,
    });
  } catch (err) {
    res.status(500).json({ message: 'Vote failed', error: err.message });
  }
});

// Fetch user-authored threads with reply + view info
// Fetch user-authored threads with reply + view info
router.get('/user/:username/relevant', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch only the threads authored by the user
    const threads = await Thread.find({ author: user.username }).sort({ createdAt: -1 });

    const threadsWithData = await Promise.all(
      threads.map(async (thread) => {
        const replies = await Reply.find({ threadId: thread._id }).sort({ createdAt: -1 });
        const replyCount = replies.length;
        const latestReplyAt = replies[0]?.createdAt || null;
        const lastViewed = user.lastViewedMap?.get(thread._id.toString()) || null;

        const isReplyByAuthor = thread.author === user.username;
        const isNew = latestReplyAt && (!lastViewed || new Date(latestReplyAt) > new Date(lastViewed)) && !isReplyByAuthor;

        return {
          ...thread.toObject(),
          replyCount,
          latestReplyAt,
          lastViewed,
          isNew,  // Attach 'isNew' flag to each thread
        };
      })
    );

    res.json({ threads: threadsWithData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch threads', error: err.message });
  }
});


// Fetch all threads for notification check
router.get('/user/:username/relevant', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch only the threads authored by the user
    const threads = await Thread.find({ author: user.username }).sort({ createdAt: -1 });

    const threadsWithData = await Promise.all(
      threads.map(async (thread) => {
        const replies = await Reply.find({ threadId: thread._id }).sort({ createdAt: -1 });
        const replyCount = replies.length;
        const latestReplyAt = replies[0]?.createdAt || null;
        const lastViewed = user.lastViewedMap?.get(thread._id.toString()) || null;

        const isReplyByAuthor = thread.author === user.username;
        const isNew = latestReplyAt && (!lastViewed || new Date(latestReplyAt) > new Date(lastViewed)) && !isReplyByAuthor;

        return {
          ...thread.toObject(),
          replyCount,
          latestReplyAt,
          lastViewed,
          isNew,  // Attach 'isNew' flag to each thread
        };
      })
    );

    res.json({ threads: threadsWithData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch threads', error: err.message });
  }
});
// GET /api/notifications





// Mark thread as viewed
router.put('/markViewed', async (req, res) => {
  const { username, threadId } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.lastViewedMap) {
      user.lastViewedMap = new Map();
    }

    user.lastViewedMap.set(threadId, new Date());
    await user.save();

    res.json({ message: 'Marked as viewed' });
  } catch (err) {
    console.error('❌ Error marking as viewed:', err.message);
    res.status(500).json({ message: 'Failed to update view time', error: err.message });
  }
});


export default router;
