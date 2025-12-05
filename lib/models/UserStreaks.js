const supabase = require('../config/db');

class UserStreaks {
  static async initialize(userId) {
    const { data, error } = await supabase
      .from('user_streaks')
      .insert([
        {
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null
        }
      ])
      .select()
      .single();

    if (error && error.code !== '23505') throw error;
    return data;
  }

  static async getByUserId(userId) {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateStreak(userId) {
    const today = new Date().toISOString().split('T')[0];
    const current = await this.getByUserId(userId);

    if (!current) {
      await this.initialize(userId);
      return await this.updateStreak(userId);
    }

    let newStreak = 1;
    let longestStreak = current.longest_streak;

    if (current.last_active_date) {
      const lastDate = new Date(current.last_active_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        newStreak = current.current_streak + 1;
      } else if (lastDate.toISOString().split('T')[0] === today) {
        return current;
      }
    }

    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }

    const { data, error } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_active_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = UserStreaks;
