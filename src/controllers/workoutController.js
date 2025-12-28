const supabase = require('../config/database');

// Helper: Generate default exercises by workout name
function getDefaultExercises(workoutName) {
  const exerciseIds = {
    bench: '7e3a7203-3a8a-4f9f-8d6f-fc341a7e70ba',
    incline: '6d13894c-a7b3-48aa-88f8-72462bbaf84d', 
    dumbbell: 'ac6448fb-acaf-457f-80b0-9635632cd724'
  };

  const templates = {
    'Push': [
      { exerciseId: exerciseIds.bench, exerciseName: 'Barbell Bench Press', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: exerciseIds.incline, exerciseName: 'Incline Barbell Bench Press', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false },
      { exerciseId: exerciseIds.dumbbell, exerciseName: 'Dumbbell Bench Press', sets: 3, repRangeMin: 10, repRangeMax: 12, isWarmup: false }
    ],
    'Pull': [
      { exerciseId: exerciseIds.bench, exerciseName: 'Barbell Bent Over Row', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: exerciseIds.incline, exerciseName: 'Lat Pulldown', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false },
      { exerciseId: exerciseIds.dumbbell, exerciseName: 'Dumbbell Row', sets: 3, repRangeMin: 10, repRangeMax: 12, isWarmup: false }
    ],
    'Upper': [
      { exerciseId: exerciseIds.bench, exerciseName: 'Barbell Bench Press', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: exerciseIds.incline, exerciseName: 'Barbell Bent Over Row', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false },
      { exerciseId: exerciseIds.dumbbell, exerciseName: 'Lat Pulldown', sets: 3, repRangeMin: 10, repRangeMax: 12, isWarmup: false }
    ],
    'Legs': [
      { exerciseId: exerciseIds.bench, exerciseName: 'Barbell Back Squat', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: exerciseIds.incline, exerciseName: 'Leg Press', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false },
      { exerciseId: exerciseIds.dumbbell, exerciseName: 'Leg Curl', sets: 3, repRangeMin: 12, repRangeMax: 15, isWarmup: false }
    ],
    'Legs A': [
      { exerciseId: exerciseIds.bench, exerciseName: 'Barbell Back Squat', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: exerciseIds.incline, exerciseName: 'Leg Press', sets: 3, repRangeMin: 8, repRangeMax: 10, isWarmup: false }
    ],
    'Legs B': [
      { exerciseId: exerciseIds.bench, exerciseName: 'Barbell Romanian Deadlift', sets: 4, repRangeMin: 6, repRangeMax: 8, isWarmup: false },
      { exerciseId: exerciseIds.incline, exerciseName: 'Leg Curl', sets: 3, repRangeMin: 12, repRangeMax: 15, isWarmup: false }
    ]
  };

  return templates[workoutName] || [];
}

const startWorkout = async (req, res, next) => {
  try {
    const { userWorkoutSplitId } = req.body;
    const userId = req.user.userId;

    if (!userWorkoutSplitId) {
      return res.status(400).json({
        success: false,
        message: 'userWorkoutSplitId required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get workout split (NO RELATIONSHIP JOINS)
    const { data: split, error: splitError } = await supabase
      .from('user_workout_splits')
      .select('*')
      .eq('id', userWorkoutSplitId)
      .eq('user_id', userId)
      .single();

    if (splitError || !split) {
      return res.status(404).json({
        success: false,
        message: 'Workout split not found',
        code: 'NOT_FOUND'
      });
    }

    // Create workout session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert([{
        user_id: userId,
        user_workout_split_id: userWorkoutSplitId,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      }])
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Get exercises from helper function
    const exercises = getDefaultExercises(split.workout_name);

    res.status(201).json({
      success: true,
      message: 'Workout started',
      session: {
        id: session.id,
        startedAt: session.started_at,
        workoutName: split.workout_name,
        exercises: exercises
      }
    });
  } catch (error) {
    next(error);
  }
};

const recordSet = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { exerciseId, setNumber, repsCompleted, weightUsed, rpe } = req.body;
    const userId = req.user.userId;

    if (!exerciseId || !setNumber || !repsCompleted || !weightUsed) {
      return res.status(400).json({
        success: false,
        message: 'exerciseId, setNumber, repsCompleted, weightUsed required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Workout session not found',
        code: 'NOT_FOUND'
      });
    }

    // Record set
    const { data: setRecord, error: recordError } = await supabase
      .from('set_records')
      .insert([{
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        reps_completed: repsCompleted,
        weight_used: weightUsed,
        rpe: rpe || null
      }])
      .select()
      .single();

    if (recordError) throw recordError;

    res.status(201).json({
      success: true,
      message: 'Set recorded',
      setRecord: {
        id: setRecord.id,
        setNumber: setRecord.set_number,
        repsCompleted: setRecord.reps_completed,
        weightUsed: setRecord.weight_used,
        rpe: setRecord.rpe
      }
    });
  } catch (error) {
    next(error);
  }
};

const completeWorkout = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;
    const userId = req.user.userId;

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Workout session not found',
        code: 'NOT_FOUND'
      });
    }

    // Update session
    const { data: updated, error: updateError } = await supabase
      .from('workout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Workout completed',
      session: {
        id: updated.id,
        status: updated.status,
        completedAt: updated.completed_at,
        notes: updated.notes
      }
    });
  } catch (error) {
    next(error);
  }
};

const getWorkoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        set_records (
          id,
          exercise_id,
          set_number,
          reps_completed,
          weight_used,
          rpe
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Workout session not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        notes: session.notes,
        setRecords: session.set_records
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { startWorkout, recordSet, completeWorkout, getWorkoutSession };
