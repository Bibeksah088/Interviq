import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import generateRoutes from './routes/generate.js';
import ragRoutes from './routes/rag.js';

config();

// Validate required env vars
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('❌ GEMINI_API_KEY missing in .env'); process.exit(1); }
if (!process.env.JWT_SECRET) { console.error('❌ JWT_SECRET missing in .env'); process.exit(1); }
if (!process.env.MONGO_URI) { console.error('❌ MONGO_URI missing in .env'); process.exit(1); }

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

// Public routes
app.get('/health', (req, res) => res.json({
  status: 'ok',
  key: KEY.slice(0, 8) + '...',
  db: 'MongoDB Atlas',
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/rag', ragRoutes);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ Backend → http://localhost:${PORT}`);
    console.log(`   API Key: ${KEY.slice(0, 8)}...`);
    console.log(`   Database: MongoDB Atlas`);
    console.log(`   Auth: JWT enabled\n`);
  });
});