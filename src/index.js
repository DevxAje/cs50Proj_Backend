require('dotenv').config();
const express = require('express');
const cors = require('cors');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const workoutRoutes = require('./routes/workouts');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Error handler (MUST be last)
app.use(errorHandler);

app.use(cors({
  origin: 'http://localhost:3000', // Allow your React app
  credentials: true
}));

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});