// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Thread",
    default: null,
  },
  replyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reply",
    default: null,
  },
  buildId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Build",
    default: null,
  },
  pixelRigLink: String,

  message: String,
  seen: { type: Boolean, default: false },

  // ✅ Add these two fields 👇
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  type: {
    type: String, // e.g. "comment", "vote"
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
