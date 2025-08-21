require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: allow your Vercel frontend
app.use(cors({
  origin: ['https://yamba-platform.vercel.app'],
  credentials: true,
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Health
app.get('/api/health', (_req, res) => res.json({ status: 'Backend is running 🚀' }));

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
