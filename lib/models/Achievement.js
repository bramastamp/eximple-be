const supabase = require('../config/db');

class Achievement {
  static async findAll() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async findById(achievementId) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByCode(code) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

module.exports = Achievement;

