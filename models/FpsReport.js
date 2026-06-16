import mongoose from "mongoose";

const fpsReportSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cpuId:      { type: String, required: true },
  gpuId:      { type: String, required: true },
  cpuScore:   { type: Number, required: true },
  gpuScore:   { type: Number, required: true },
  game:       { type: String, required: true },
  resolution: { type: String, required: true },
  fps:        { type: Number, required: true, min: 1, max: 9999 },
}, { timestamps: true });

// One report per user per game+resolution combo — update in place
fpsReportSchema.index({ user: 1, game: 1, resolution: 1 }, { unique: true });

export default mongoose.model("FpsReport", fpsReportSchema);
