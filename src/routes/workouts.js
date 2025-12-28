const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const workoutController = require('../controllers/workoutController');

router.post('/sessions', authenticateToken, workoutController.startWorkout);
router.get('/sessions/:sessionId', authenticateToken, workoutController.getWorkoutSession);
router.post('/sessions/:sessionId/set-record', authenticateToken, workoutController.recordSet);
router.post('/sessions/:sessionId/complete', authenticateToken, workoutController.completeWorkout);

module.exports = router;