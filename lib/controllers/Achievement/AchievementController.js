const Achievement = require('../../models/Achievement');
const UserAchievement = require('../../models/UserAchievement');

class AchievementController {
  // Get all achievements
  static async getAllAchievements(req, res) {
    try {
      const achievements = await Achievement.findAll();

      res.status(200).json({
        success: true,
        data: achievements
      });
    } catch (error) {
      console.error('Get all achievements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch achievements',
        error: error.message
      });
    }
  }

  // Get user's achievements
  static async getMyAchievements(req, res) {
    try {
      const userId = req.user.id;

      const userAchievements = await UserAchievement.findByUserId(userId);

      res.status(200).json({
        success: true,
        data: userAchievements
      });
    } catch (error) {
      console.error('Get my achievements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch achievements',
        error: error.message
      });
    }
  }
}

module.exports = AchievementController;

