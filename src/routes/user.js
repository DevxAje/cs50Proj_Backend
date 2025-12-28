const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/plan', authenticateToken, userController.getUserPlan);
router.get('/customizations', authenticateToken, userController.getUserCustomizations);
router.post('/customizations', authenticateToken, userController.createCustomization);
router.delete('/customizations/:customizationId', authenticateToken, userController.deleteCustomization);

module.exports = router;