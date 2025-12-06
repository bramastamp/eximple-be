const express = require('express');
const router = express.Router();
const LearningController = require('../controllers/LearningController');
const { authenticate } = require('../middleware/auth');

// All learning routes require authentication
router.use(authenticate);

// Subjects routes
router.get('/subjects', LearningController.getAllSubjects);
router.get('/subjects/:subjectId', LearningController.getSubjectById);
router.get('/subjects/:subjectId/levels', LearningController.getLevelsBySubject);
router.get('/subjects/:subjectId/subject-levels', LearningController.getSubjectLevelsBySubject);

// Subjects by class
router.get('/classes/:classId/subjects', LearningController.getSubjectsByClass);

// Levels routes
router.get('/levels/:levelId', LearningController.getLevelById);
router.get('/levels/:levelId/materials', LearningController.getMaterialsByLevel);

// Subject levels routes
router.get('/subject-levels/:subjectLevelId/levels', LearningController.getLevelsBySubjectLevel);

module.exports = router;

