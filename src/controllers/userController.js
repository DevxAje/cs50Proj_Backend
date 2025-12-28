const supabase = require('../config/database');

const getUserPlan = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    // Get user's workout splits (NO JOINS)
    const { data: splits, error: splitsError } = await supabase
      .from('user_workout_splits')
      .select('*')
      .eq('user_id', userId)
      .eq('week', user.current_week)
      .eq('phase', user.current_phase)
      .order('day_number');

    if (splitsError) throw splitsError;

    // Map splits with default exercises based on workout type
    const workouts = splits.map(split => ({
      id: split.id,
      dayNumber: split.day_number,
      workoutName: split.workout_name,
      exercises: getDefaultExercises(split.workout_name)
    }));

    res.json({
      success: true,
      plan: {
        currentPhase: user.current_phase,
        currentWeek: user.current_week,
        splitType: user.split_type,
        workouts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function - returns default exercises for each workout type
function getDefaultExercises(workoutName) {
  const defaults = {
    'Push': [
      { exerciseId: '7e3a7203-3a8a-4f9f-8d6f-fc341a7e70ba', exerciseName: 'Barbell Bench Press', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: '6d13894c-a7b3-48aa-88f8-72462bbaf84d', exerciseName: 'Incline Barbell Bench Press', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false },
      { exerciseId: 'ac6448fb-acaf-457f-80b0-9635632cd724', exerciseName: 'Dumbbell Bench Press', sets: 3, repRangeMin: 10, repRangeMax: 12, isWarmup: false }
    ],
    'Pull': [
      { exerciseId: '7e3a7203-3a8a-4f9f-8d6f-fc341a7e70ba', exerciseName: 'Barbell Bent Over Row', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: '6d13894c-a7b3-48aa-88f8-72462bbaf84d', exerciseName: 'Lat Pulldown', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false },
      { exerciseId: 'ac6448fb-acaf-457f-80b0-9635632cd724', exerciseName: 'Dumbbell Row', sets: 3, repRangeMin: 10, repRangeMax: 12, isWarmup: false }
    ],
    'Upper': [
      { exerciseId: '7e3a7203-3a8a-4f9f-8d6f-fc341a7e70ba', exerciseName: 'Barbell Bench Press', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: '6d13894c-a7b3-48aa-88f8-72462bbaf84d', exerciseName: 'Barbell Bent Over Row', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false },
      { exerciseId: 'ac6448fb-acaf-457f-80b0-9635632cd724', exerciseName: 'Lat Pulldown', sets: 3, repRangeMin: 10, repRangeMax: 12, isWarmup: false }
    ],
    'Legs': [
      { exerciseId: '7e3a7203-3a8a-4f9f-8d6f-fc341a7e70ba', exerciseName: 'Barbell Back Squat', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: '6d13894c-a7b3-48aa-88f8-72462bbaf84d', exerciseName: 'Leg Press', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false },
      { exerciseId: 'ac6448fb-acaf-457f-80b0-9635632cd724', exerciseName: 'Leg Curl', sets: 3, repRangeMin: 12, repRangeMax: 15, isWarmup: false }
    ],
    'Legs A': [
      { exerciseId: '7e3a7203-3a8a-4f9f-8d6f-fc341a7e70ba', exerciseName: 'Barbell Back Squat', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: '6d13894c-a7b3-48aa-88f8-72462bbaf84d', exerciseName: 'Leg Press', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false }
    ],
    'Legs B': [
      { exerciseId: '7e3a7203-3a8a-4f9f-8d6f-fc341a7e70ba', exerciseName: 'Barbell Romanian Deadlift', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: '6d13894c-a7b3-48aa-88f8-72462bbaf84d', exerciseName: 'Leg Curl', sets: 3, repRangeMin: 12, repRangeMax: 15, isWarmup: false }
    ]
  };

  return defaults[workoutName] || [];
}


const getUserCustomizations = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('user_exercise_customizations')
      .select(`
        id,
        original_exercise_id,
        replacement_exercise_id,
        exercises:replacement_exercise_id(id, name, category, type)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      customizations: data
    });
  } catch (error) {
    next(error);
  }
};

const createCustomization = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { originalExerciseId, replacementExerciseId } = req.body;

    if (!originalExerciseId || !replacementExerciseId) {
      return res.status(400).json({
        success: false,
        message: 'originalExerciseId and replacementExerciseId required',
        code: 'VALIDATION_ERROR'
      });
    }

    const { data, error } = await supabase
      .from('user_exercise_customizations')
      .insert([{
        user_id: userId,
        original_exercise_id: originalExerciseId,
        replacement_exercise_id: replacementExerciseId
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Exercise customization created',
      customization: data
    });
  } catch (error) {
    next(error);
  }
};

const deleteCustomization = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { customizationId } = req.params;

    const { error } = await supabase
      .from('user_exercise_customizations')
      .delete()
      .eq('id', customizationId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Customization deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserPlan,
  getUserCustomizations,
  createCustomization,
  deleteCustomization
};