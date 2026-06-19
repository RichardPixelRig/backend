import mongoose from "mongoose";

const savedBuildSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:       { type: String, default: "My Build" },
  parts:      { type: Object, required: true },
  totalCost:  { type: Number, required: true },
  game:       { type: String },
  resolution: { type: String },
  budget:     { type: Number },
}, { timestamps: true });

export default mongoose.model("SavedBuild", savedBuildSchema);
