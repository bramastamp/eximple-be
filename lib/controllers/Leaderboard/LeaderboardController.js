const UserPoints = require('../../models/UserPoints');
const User = require('../../models/User');
const supabase = require('../../config/db');

class LeaderboardController {
  // Get leaderboard by type (total, weekly, monthly)
  static async getLeaderboard(req, res) {
    try {
      const { type = 'total', limit = 100 } = req.query;
      
      let orderColumn = 'total_points';
      if (type === 'weekly') {
        orderColumn = 'weekly_points';
      } else if (type === 'monthly') {
        orderColumn = 'monthly_points';
      }

      const { data, error } = await supabase
        .from('user_points')
        .select(`
          *,
          users!inner (
            id,
            username,
            role,
            user_profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('users.role', 'student')
        .order(orderColumn, { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      const leaderboard = (data || []).map((item, index) => {
        // Handle user_profiles as array or single object
        const userProfile = Array.isArray(item.users.user_profiles) 
          ? item.users.user_profiles[0] 
          : item.users.user_profiles;

        return {
          rank: index + 1,
          user_id: item.users.id,
          username: item.users.username,
          full_name: userProfile?.full_name || null,
          avatar_url: userProfile?.avatar_url || null,
          points: item[orderColumn] || 0
        };
      });

      res.status(200).json({
        success: true,
        data: {
          type,
          leaderboard
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard',
        error: error.message
      });
    }
  }

  // Get user's rank
  static async getMyRank(req, res) {
    try {
      const userId = req.user.id;
      const { type = 'total' } = req.query;

      // Check if user is a student, only students can have rank
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // If user is not a student, return null rank
      if (!user || user.role !== 'student') {
        return res.status(200).json({
          success: true,
          data: {
            rank: null,
            points: 0,
            type
          }
        });
      }

      let orderColumn = 'total_points';
      if (type === 'weekly') {
        orderColumn = 'weekly_points';
      } else if (type === 'monthly') {
        orderColumn = 'monthly_points';
      }

      // Get user points
      const userPoints = await UserPoints.getByUserId(userId);
      if (!userPoints) {
        return res.status(200).json({
          success: true,
          data: {
            rank: null,
            points: 0,
            type
          }
        });
      }

      // Count students with higher points (exclude admin and teacher)
      const { count, error } = await supabase
        .from('user_points')
        .select(`
          *,
          users!inner (
            id,
            role
          )
        `, { count: 'exact', head: true })
        .eq('users.role', 'student')
        .gt(orderColumn, userPoints[orderColumn] || 0);

      if (error) throw error;

      const rank = (count || 0) + 1;

      res.status(200).json({
        success: true,
        data: {
          rank,
          points: userPoints[orderColumn] || 0,
          type
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to fetch rank',
        error: error.message
      });
    }
  }
}

module.exports = LeaderboardController;

