-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  split_type INT NOT NULL CHECK (split_type IN (3, 4, 5)),
  current_phase INT DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 6),
  current_week INT DEFAULT 1 CHECK (current_week BETWEEN 1 AND 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('push', 'pull', 'legs')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('primary', 'accessory')),
  instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workout templates
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  split_type INT NOT NULL CHECK (split_type IN (3, 4, 5)),
  phase INT NOT NULL CHECK (phase BETWEEN 1 AND 6),
  is_deload BOOLEAN DEFAULT FALSE,
  workout_name VARCHAR(100) NOT NULL,
  day_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(split_type, phase, is_deload, day_number)
);

-- Template exercises
CREATE TABLE template_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  position INT NOT NULL,
  sets INT NOT NULL CHECK (sets > 0),
  rep_range_min INT NOT NULL CHECK (rep_range_min > 0),
  rep_range_max INT NOT NULL CHECK (rep_range_max >= rep_range_min),
  is_warmup BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User workout splits
CREATE TABLE user_workout_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  phase INT NOT NULL CHECK (phase BETWEEN 1 AND 6),
  week INT NOT NULL CHECK (week BETWEEN 1 AND 8),
  day_number INT NOT NULL,
  is_deload BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, phase, week, day_number)
);

-- User exercise customizations
CREATE TABLE user_exercise_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE NOT NULL,
  original_exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  replacement_exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, template_id, original_exercise_id)
);

-- Workout sessions
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_workout_split_id UUID REFERENCES user_workout_splits(id) ON DELETE SET NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Set records
CREATE TABLE set_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INT NOT NULL CHECK (set_number > 0),
  reps_completed INT CHECK (reps_completed IS NULL OR reps_completed > 0),
  weight_used DECIMAL(10, 2) CHECK (weight_used IS NULL OR weight_used > 0),
  rpe INT CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Progress tracking
CREATE TABLE progress_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  phase INT,
  max_weight DECIMAL(10, 2),
  max_reps INT,
  average_rpe DECIMAL(3, 1),
  total_volume DECIMAL(12, 2),
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, exercise_id, phase)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_templates_split_phase ON workout_templates(split_type, phase);
CREATE INDEX idx_user_splits_user ON user_workout_splits(user_id);
CREATE INDEX idx_user_splits_phase_week ON user_workout_splits(user_id, phase, week);
CREATE INDEX idx_customizations_user ON user_exercise_customizations(user_id);
CREATE INDEX idx_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_sessions_completed ON workout_sessions(user_id, is_completed);
CREATE INDEX idx_set_records_session ON set_records(workout_session_id);
CREATE INDEX idx_set_records_exercise ON set_records(exercise_id);
CREATE INDEX idx_progress_user ON progress_tracking(user_id);