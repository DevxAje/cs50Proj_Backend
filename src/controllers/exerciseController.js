const supabase = require('../config/database');

const getExercises = async (req, res, next) => {
  try {
    const { category, type } = req.query;

    let query = supabase.from('exercises').select('*');

    if (category) query = query.eq('category', category);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      message: `Found ${data.length} exercises`,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getExerciseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExercises, getExerciseById };