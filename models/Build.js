// models/Build.js
import mongoose from "mongoose";

const buildSchema = new mongoose.Schema({
  title: String,
  image: String,
  description: String,
  parts: String,
  // Structured parts (the actual selected components) for an interactive
  // parts list, buy links, and "open in builder". Optional — older builds
  // and free-text submissions just use the `parts` string above.
  partsData: { type: mongoose.Schema.Types.Mixed, default: null },
  totalCost: { type: Number, default: null },
  game: { type: String, default: null },
  resolution: { type: String, default: null },
  pixelRigLink: {
    type: String,
    unique: true,
  },
  comments: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      text: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
      editedAt: { type: Date, default: null },
      parentCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
    
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  likes: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
  dislikes: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
  createdAt: { type: Date, default: Date.now },

  featured: {type: Boolean, default: false }
});


const Build = mongoose.model("Build", buildSchema);
export default Build;
