// models/Poll.js
import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  label: String,
  votes: { type: Number, default: 0 },
});

const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [optionSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Poll", pollSchema);
