import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';

import path from 'path';

dotenv.config();
// Load frontend .env to read VITE_GEMINI_API_KEY if not in server env
dotenv.config({ path: path.resolve('../cosostyle/.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images from different origins if needed
}));

// Rate limiting to prevent DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

app.use('/api', apiLimiter);

// Enable CORS for client calls
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// Mount API router paths
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CosoStyle backend server is running.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

// Boot Database & Listen
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`CosoStyle Server running on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Server failed to start:', err);
});
