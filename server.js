import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import communityRoutes from './routes/community.js';
import buildsRoutes from "./routes/builds.js";
import pollRoutes from "./routes/polls.js";
import guideRoutes from "./routes/guides.js";
import adminRoutes from "./routes/admin.js";  // Adjust path if needed
import Visit from "./models/Visit.js"; // import Visit model
import visitRoutes from "./routes/visit.js";
import usersRouter from './routes/users.js'; // Adjust path if needed
import challengeRoutes from "./routes/Challenge.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', authRoutes); // Handles: /api/register, /api/login, /api/me
app.use('/api/community', communityRoutes); // Handles threads & replies
app.use("/api/builds", buildsRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/users', usersRouter);  // ✅ MOUNT users router properly
app.use("/api/visit", visitRoutes);
app.use("/api/challenge", challengeRoutes);
app.use(async (req, res, next) => {
  try {
    if (req.method === "GET") {
      await Visit.create({
        ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"]
      });
    }
  } catch (err) {
    console.error("❌ Error tracking visit:", err.message);
  }
  next();
});
// Base test route
app.get('/', (req, res) => {
  res.send('🎮 Pixel Rigs API is live!');
});

// DB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
  });
