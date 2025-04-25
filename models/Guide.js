import mongoose from "mongoose";

const GuideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ⬇️ Fix: explicitly export default
const Guide = mongoose.model("Guide", GuideSchema);
export default Guide;
