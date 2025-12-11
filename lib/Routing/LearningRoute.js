const express = require('express');
const router = express.Router();
const LearningController = require('../controllers/Learning/LearningController');
const { authenticate } = require('../middleware/auth');

// All learning routes require authentication
router.use(authenticate);

// Subjects routes
router.get('/subjects', LearningController.getAllSubjects);
// Subjects by class - must be before /subjects/:subjectId to avoid route conflict
router.get('/subjects/class/:classId', LearningController.getSubjectsByClass);
router.get('/subjects/:subjectId', LearningController.getSubjectById);
router.get('/subjects/:subjectId/levels', LearningController.getLevelsBySubject);
router.get('/subjects/:subjectId/subject-levels', LearningController.getSubjectLevelsBySubject);

// Subjects by class (alternative endpoint - kept for backward compatibility)
router.get('/classes/:classId/subjects', LearningController.getSubjectsByClass);

// Levels routes
// Alias endpoint for frontend compatibility - must be before /levels/:levelId to avoid route conflict
router.get('/levels/subject-level/:subjectLevelId', LearningController.getLevelsBySubjectLevel);
router.get('/levels/:levelId', LearningController.getLevelById);
router.get('/levels/:levelId/materials', LearningController.getMaterialsByLevel);

// Subject levels routes
router.get('/subject-levels/:subjectLevelId/levels', LearningController.getLevelsBySubjectLevel);

module.exports = router;

