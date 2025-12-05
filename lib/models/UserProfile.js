const supabase = require('../config/db');

class UserProfile {
  static async create(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        grade_levels (id, name),
        classes (id, name, grade_level_id)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async update(userId, profileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async isComplete(userId) {
    const profile = await this.findByUserId(userId);
    
    if (!profile) return false;

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (user?.role === 'student') {
      return !!(profile.full_name && profile.grade_level_id && profile.class_id);
    } else {
      return !!profile.full_name;
    }
  }

  static async validateClassGrade(classId, gradeLevelId) {
    if (!classId || !gradeLevelId) return false;

    const { data, error } = await supabase
      .from('classes')
      .select('grade_level_id')
      .eq('id', classId)
      .eq('grade_level_id', gradeLevelId)
      .single();

    if (error || !data) return false;
    return true;
  }
}

module.exports = UserProfile;
