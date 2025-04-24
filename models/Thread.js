import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  topic: { type: String, default: "General" }, // ✅ new
}, { timestamps: true });


const Thread = mongoose.model('Thread', threadSchema);

export default Thread;
