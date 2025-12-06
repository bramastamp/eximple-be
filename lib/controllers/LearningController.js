const Subject = require('../models/Subject');
const SubjectLevel = require('../models/SubjectLevel');
const Level = require('../models/Level');
const Material = require('../models/Material');

class LearningController {
  // Get all subjects
  static async getAllSubjects(req, res) {
    try {
      const subjects = await Subject.findAll();

      res.status(200).json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('Get all subjects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects',
        error: error.message
      });
    }
  }

  // Get subjects by class ID
  static async getSubjectsByClass(req, res) {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'classId', message: 'Class ID is required', code: 'CLASS_ID_REQUIRED' }]
        });
      }

      const subjects = await Subject.findByClassId(parseInt(classId));

      res.status(200).json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('Get subjects by class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects by class',
        error: error.message
      });
    }
  }

  // Get subject by ID
  static async getSubjectById(req, res) {
    try {
      const { subjectId } = req.params;

      const subject = await Subject.findById(parseInt(subjectId));

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      res.status(200).json({
        success: true,
        data: subject
      });
    } catch (error) {
      console.error('Get subject by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject',
        error: error.message
      });
    }
  }

  // Get levels by subject ID
  static async getLevelsBySubject(req, res) {
    try {
      const { subjectId } = req.params;

      const levels = await Level.findBySubjectId(parseInt(subjectId));

      res.status(200).json({
        success: true,
        data: levels
      });
    } catch (error) {
      console.error('Get levels by subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch levels',
        error: error.message
      });
    }
  }

  // Get levels by subject level ID
  static async getLevelsBySubjectLevel(req, res) {
    try {
      const { subjectLevelId } = req.params;

      const levels = await Level.findBySubjectLevelId(parseInt(subjectLevelId));

      res.status(200).json({
        success: true,
        data: levels
      });
    } catch (error) {
      console.error('Get levels by subject level error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch levels',
        error: error.message
      });
    }
  }

  // Get level by ID with materials
  static async getLevelById(req, res) {
    try {
      const { levelId } = req.params;

      const level = await Level.findByIdWithMaterials(parseInt(levelId));

      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      res.status(200).json({
        success: true,
        data: level
      });
    } catch (error) {
      console.error('Get level by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch level',
        error: error.message
      });
    }
  }

  // Get materials by level ID
  static async getMaterialsByLevel(req, res) {
    try {
      const { levelId } = req.params;

      const materials = await Material.findByLevelId(parseInt(levelId));

      res.status(200).json({
        success: true,
        data: materials
      });
    } catch (error) {
      console.error('Get materials by level error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch materials',
        error: error.message
      });
    }
  }

  // Get subject levels by subject ID
  static async getSubjectLevelsBySubject(req, res) {
    try {
      const { subjectId } = req.params;

      const subjectLevels = await SubjectLevel.findBySubjectId(parseInt(subjectId));

      res.status(200).json({
        success: true,
        data: subjectLevels
      });
    } catch (error) {
      console.error('Get subject levels by subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject levels',
        error: error.message
      });
    }
  }
}

module.exports = LearningController;

