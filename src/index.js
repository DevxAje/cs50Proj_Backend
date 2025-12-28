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

// --- FIX START ---
// We combine everything into one CORS block. 
// Do NOT include /#/auth in the origin string.
app.use(cors({
  origin: [
    'https://cs50-frontend-iw1hs3qi1-devxajes-projects.vercel.app', // Base Vercel URL
    'http://localhost:5173' // Your local Vite dev server
  ],
  credentials: true
}));
// --- FIX END ---

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Friendly message for the base URL
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Workout API is live and healthy!' });
});

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

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
