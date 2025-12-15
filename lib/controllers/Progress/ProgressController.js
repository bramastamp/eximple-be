const UserProgress = require('../../models/UserProgress');
const Level = require('../../models/Level');
const UserPoints = require('../../models/UserPoints');
const UserStreaks = require('../../models/UserStreaks');

class ProgressController {
  // Start learning a level
  static async startLevel(req, res) {
    try {
      const userId = req.user.id;
      const { levelId } = req.params;

      // Check if level exists
      const level = await Level.findById(parseInt(levelId));
      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      // Check if progress already exists
      const existingProgress = await UserProgress.findByUserAndLevel(userId, parseInt(levelId));
      
      if (existingProgress) {
        return res.status(200).json({
          success: true,
          message: 'Level already started',
          data: existingProgress
        });
      }

      // Create new progress
      const progress = await UserProgress.create(userId, parseInt(levelId), {
        status: 'in_progress',
        progress: { percent: 0 }
      });

      res.status(201).json({
        success: true,
        message: 'Level started successfully',
        data: progress
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to start level',
        error: error.message
      });
    }
  }

  // Get progress for a specific level
  static async getLevelProgress(req, res) {
    try {
      const userId = req.user.id;
      const { levelId } = req.params;

      const progress = await UserProgress.findByUserAndLevel(userId, parseInt(levelId));

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: 'Progress not found. Please start the level first.'
        });
      }

      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress',
        error: error.message
      });
    }
  }

  // Update progress
  static async updateProgress(req, res) {
    try {
      const userId = req.user.id;
      const { levelId } = req.params;
      const { progress: progressData, percent } = req.body;

      const updateData = {};
      if (progressData) updateData.progress = progressData;
      if (percent !== undefined) {
        updateData.progress = {
          ...updateData.progress,
          percent: Math.min(100, Math.max(0, percent))
        };
      }

      const progress = await UserProgress.update(userId, parseInt(levelId), updateData);

      res.status(200).json({
        success: true,
        message: 'Progress updated successfully',
        data: progress
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to update progress',
        error: error.message
      });
    }
  }

  // Complete a level
  static async completeLevel(req, res) {
    try {
      const userId = req.user.id;
      const { levelId } = req.params;
      const parsedLevelId = parseInt(levelId);

      if (isNaN(parsedLevelId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid level ID'
        });
      }

      // Get level to get points reward
      const level = await Level.findById(parsedLevelId);
      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      // Validate level has required fields
      if (!level.subject_level_id || level.level_index === undefined) {
        return res.status(500).json({
          success: false,
          message: 'Level data is incomplete',
          error: 'Missing subject_level_id or level_index'
        });
      }

      // Get current progress
      let progress = await UserProgress.findByUserAndLevel(userId, parsedLevelId);
      
      if (!progress) {
        // Create progress if doesn't exist
        progress = await UserProgress.create(userId, parsedLevelId, {
          status: 'in_progress'
        });
      }

      // Check if already completed
      if (progress.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Level already completed'
        });
      }

      const pointsReward = level.points_reward || 0;

      // Complete the progress
      progress = await UserProgress.complete(userId, parsedLevelId, pointsReward);

      // Add points to user (with error handling)
      if (pointsReward > 0) {
        try {
        await UserPoints.addPoints(userId, pointsReward);
        } catch (pointsError) {
          // Continue even if points update fails
        }
      }

      // Update streak (with error handling)
      try {
      await UserStreaks.updateStreak(userId);
      } catch (streakError) {
        // Continue even if streak update fails
      }

      // Auto-start next level if exists (with error handling)
      let nextLevel = null;
      let nextLevelProgress = null;
      
      try {
        nextLevel = await Level.findNextLevel(level.subject_level_id, level.level_index);
      
      if (nextLevel) {
        // Check if next level progress already exists
        const existingNextProgress = await UserProgress.findByUserAndLevel(userId, nextLevel.id);
        
        if (!existingNextProgress) {
          // Auto-start next level
          nextLevelProgress = await UserProgress.create(userId, nextLevel.id, {
            status: 'in_progress',
            progress: { percent: 0 }
          });
        }
        }
      } catch (nextLevelError) {
        // Continue even if next level logic fails
      }

      res.status(200).json({
        success: true,
        message: 'Level completed successfully',
        data: {
          ...progress,
          points_earned: pointsReward,
          next_level_unlocked: nextLevel ? true : false,
          next_level_id: nextLevel?.id || null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete level',
        error: 'Internal server error'
      });
    }
  }

  // Get all user progress
  static async getMyProgress(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const filters = {};
      if (status) {
        filters.status = status;
      }

      const progress = await UserProgress.findByUserId(userId, filters);

      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress',
        error: error.message
      });
    }
  }

  // Get journey map for a subject level
  static async getJourneyMap(req, res) {
    try {
      const userId = req.user.id;
      const { subjectLevelId } = req.params;

      const journeyMap = await UserProgress.getJourneyMap(userId, parseInt(subjectLevelId));

      res.status(200).json({
        success: true,
        data: journeyMap
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to fetch journey map',
        error: error.message
      });
    }
  }

  // Get progress statistics
  static async getProgressStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await UserProgress.getProgressStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress statistics',
        error: error.message
      });
    }
  }
}

module.exports = ProgressController;

