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
    const current = await this.getByUserId(userId);
    
    if (!current) {
      await this.initialize(userId);
      return await this.addPoints(userId, points);
    }

    const { data, error } = await supabase
      .from('user_points')
      .update({
        total_points: current.total_points + points,
        weekly_points: current.weekly_points + points,
        monthly_points: current.monthly_points + points,
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
