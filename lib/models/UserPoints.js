const supabase = require('../config/db');

class UserPoints {
  static async initialize(userId) {
    const { data, error } = await supabase
      .from('user_points')
      .insert([
        {
          user_id: userId,
          total_points: 0,
          weekly_points: 0,
          monthly_points: 0
        }
      ])
      .select()
      .single();

    if (error && error.code !== '23505') throw error;
    return data;
  }

  static async getByUserId(userId) {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async addPoints(userId, points) {
    if (!points || points <= 0) {
      return await this.getByUserId(userId);
    }

    const current = await this.getByUserId(userId);
    
    if (!current) {
      await this.initialize(userId);
      return await this.addPoints(userId, points);
    }

    const currentTotal = current.total_points || 0;
    const currentWeekly = current.weekly_points || 0;
    const currentMonthly = current.monthly_points || 0;

    const { data, error } = await supabase
      .from('user_points')
      .update({
        total_points: currentTotal + points,
        weekly_points: currentWeekly + points,
        monthly_points: currentMonthly + points,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = UserPoints;
