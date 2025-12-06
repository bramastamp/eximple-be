const supabase = require('../config/db');

class UserAchievement {
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (
          id,
          code,
          title,
          description,
          points_reward
        )
      `)
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async grant(userId, achievementId, metadata = {}) {
    const { data, error } = await supabase
      .from('user_achievements')
      .insert([{
        user_id: userId,
        achievement_id: achievementId,
        metadata
      }])
      .select(`
        *,
        achievements (
          id,
          code,
          title,
          description,
          points_reward
        )
      `)
      .single();

    if (error && error.code !== '23505') throw error; // 23505 = unique violation (already have achievement)
    return data;
  }

  static async hasAchievement(userId, achievementId) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }
}

module.exports = UserAchievement;

