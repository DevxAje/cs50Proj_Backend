const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/database');

const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '48h'
  });
};

// HELPER: Generate Phase 1 workout splits based on split type
function generatePhase1Splits(userId, splitType) {
  const splits = [];
  const workouts = {
    3: [
      { name: 'Push', day: 1 },
      { name: 'Pull', day: 2 },
      { name: 'Legs', day: 3 }
    ],
    4: [
      { name: 'Push', day: 1 },
      { name: 'Pull', day: 2 },
      { name: 'Upper', day: 3 },
      { name: 'Legs', day: 4 }
    ],
    5: [
      { name: 'Push', day: 1 },
      { name: 'Pull', day: 2 },
      { name: 'Legs A', day: 3 },
      { name: 'Upper', day: 4 },
      { name: 'Legs B', day: 5 }
    ]
  };

  const rotation = workouts[splitType];

  for (let week = 1; week <= 8; week++) {
    for (const workout of rotation) {
      splits.push({
        user_id: userId,
        phase: 1,
        week,
        day_number: workout.day,
        workout_name: workout.name
      });
    }
  }

  return splits;
}

const signup = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, splitType } = req.body;

    if (!email || !password || !firstName || !lastName || !splitType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, firstName, lastName, splitType',
        code: 'VALIDATION_ERROR'
      });
    }

    if (![3, 4, 5].includes(splitType)) {
      return res.status(400).json({
        success: false,
        message: 'Split type must be 3, 4, or 5',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if email exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        split_type: splitType,
        current_phase: 1,
        current_week: 1
      }])
      .select()
      .single();

    if (createError) throw createError;

    // CREATE WORKOUT SPLITS FOR PHASE 1 (Week 1-8)
    const splits = generatePhase1Splits(user.id, splitType);
    const { error: splitsError } = await supabase
      .from('user_workout_splits')
      .insert(splits);

    if (splitsError) throw splitsError;

    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      message: 'User created successfully with workout plan',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        splitType: user.split_type,
        currentPhase: user.current_phase,
        currentWeek: user.current_week
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
        code: 'VALIDATION_ERROR'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        splitType: user.split_type,
        currentPhase: user.current_phase,
        currentWeek: user.current_week
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        splitType: user.split_type,
        currentPhase: user.current_phase,
        currentWeek: user.current_week
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
