// seedGuides.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Guide from "./models/Guide.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const guides = [
  {
    title: "How to Choose the Right GPU in 2025",
    content: "Understand how to pick a graphics card based on your budget, resolution, and gaming preferences.",
  },
  {
    title: "Beginner’s Guide to Cable Management",
    content: "Keep your rig looking clean and airflow optimized with these pro cable techniques.",
  },
  {
    title: "Air vs Liquid Cooling: What’s Best?",
    content: "A no-fluff comparison of cooling types for casual gamers vs performance enthusiasts.",
  },
  {
    title: "Optimizing Your Gaming Setup for Performance",
    content: "Tweak settings, reduce background processes, and configure BIOS for maximum FPS.",
  },
  {
    title: "Top 10 Budget PC Builds of 2025",
    content: "We explore the best bang-for-buck builds across entry and mid-tier rigs.",
  },
  {
    title: "RGB Lighting Without Going Overboard",
    content: "Balance style and functionality with tasteful RGB setups.",
  },
  {
    title: "How to Benchmark Your Build Like a Pro",
    content: "Step-by-step instructions on using benchmarking tools for testing stability and performance.",
  },
  {
    title: "Troubleshooting Boot Problems",
    content: "What to do when your rig won’t power on. Common causes and quick fixes.",
  },
  {
    title: "Upgrading from SATA to NVMe",
    content: "What to expect in speed boosts, and how to clone your old drive to a blazing new one.",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    await Guide.deleteMany(); // Optional: clear old data
    const inserted = await Guide.insertMany(guides);
    console.log(`✅ Seeded ${inserted.length} guides.`);
    process.exit();
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seed();
