import mongoose from "mongoose";
import crypto from "crypto"; // 👈 you'll need this if you do random links

const challengeEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  buildTitle: { type: String, required: true },
  buildImage: { type: String },
  themeMonth: { type: String, required: true },
  description: { type: String },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  link: { type: String, unique: true }, // 🆕 ADD THIS
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedReason: { type: String },
});

// Before saving a new entry, generate a random link if missing
challengeEntrySchema.pre("save", function (next) {
  if (!this.link) {
    this.link = crypto.randomBytes(5).toString("hex"); // 🔥 10-character random string
  }
  next();
});

export default mongoose.model("ChallengeEntry", challengeEntrySchema);
