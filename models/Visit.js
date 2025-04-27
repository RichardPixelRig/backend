import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Visit", visitSchema);
