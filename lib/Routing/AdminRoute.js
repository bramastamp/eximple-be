const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/Admin/AdminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Achievements
router.post('/achievements', AdminController.createAchievement);
router.put('/achievements/:id', AdminController.updateAchievement);
router.delete('/achievements/:id', AdminController.deleteAchievement);

// Subjects
router.post('/subjects', AdminController.createSubject);
router.put('/subjects/:id', AdminController.updateSubject);
router.delete('/subjects/:id', AdminController.deleteSubject);

// Questions
router.post('/questions', AdminController.createQuestion);
router.put('/questions/:id', AdminController.updateQuestion);
router.delete('/questions/:id', AdminController.deleteQuestion);

// Materials
router.post('/materials', AdminController.createMaterial);
router.put('/materials/:id', AdminController.updateMaterial);
router.delete('/materials/:id', AdminController.deleteMaterial);

module.exports = router;





