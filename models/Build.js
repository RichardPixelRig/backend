// models/Build.js
import mongoose from "mongoose";

const buildSchema = new mongoose.Schema({
  title: String,
  image: String,
  description: String,
  parts: String,
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
      parentCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
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
