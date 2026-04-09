import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { initSocketService } from './services/socket.service';
import profileRoutes from './routes/profile.routes';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import executionRoutes from './routes/execution.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notification.routes';

const validateEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET', 'GROQ_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ CRITICAL: Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

validateEnv();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = [FRONTEND_URL, 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '500kb' }));
app.use(cookieParser());

// MongoDB connection
if (process.env.MONGO_URI && process.env.MONGO_URI.includes('mongodb')) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Database'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('⚠️ MONGO_URI not set. Skipping database connection.');
}

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/execute', executionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'DevVerse Backend Engine' });
});

// Initialize WebSocket (Yjs CRDT collaborative sync)
initSocketService({ server, corsOrigin: FRONTEND_URL });

server.listen(PORT, () => {
  console.log(`🚀 DevVerse Backend Server live on port ${PORT}`);
});
