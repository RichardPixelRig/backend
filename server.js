import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import communityRoutes from './routes/community.js';
import buildsRoutes from "./routes/builds.js";
import pollRoutes from "./routes/polls.js";

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
