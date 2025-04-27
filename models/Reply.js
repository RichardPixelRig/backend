import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  parentReplyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply', default: null },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
createdAt: { type: Date, default: Date.now }


}, { timestamps: true });

export default mongoose.model('Reply', replySchema);
