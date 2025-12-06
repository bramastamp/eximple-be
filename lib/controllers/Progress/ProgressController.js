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
      console.error('Start level error:', error);
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
      console.error('Get level progress error:', error);
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
      console.error('Update progress error:', error);
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

      // Get level to get points reward
      const level = await Level.findById(parseInt(levelId));
      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      // Get current progress
      let progress = await UserProgress.findByUserAndLevel(userId, parseInt(levelId));
      
      if (!progress) {
        // Create progress if doesn't exist
        progress = await UserProgress.create(userId, parseInt(levelId), {
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
      progress = await UserProgress.complete(userId, parseInt(levelId), pointsReward);

      // Add points to user
      if (pointsReward > 0) {
        await UserPoints.addPoints(userId, pointsReward);
      }

      // Update streak
      await UserStreaks.updateStreak(userId);

      res.status(200).json({
        success: true,
        message: 'Level completed successfully',
        data: {
          ...progress,
          points_earned: pointsReward
        }
      });
    } catch (error) {
      console.error('Complete level error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete level',
        error: error.message
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
      console.error('Get my progress error:', error);
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
      console.error('Get journey map error:', error);
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
      console.error('Get progress stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress statistics',
        error: error.message
      });
    }
  }
}

module.exports = ProgressController;

