const supabase = require('../config/db');

class AIChatSession {
  static async create(sessionData) {
    const { user_id, subject_id = null, level_id = null } = sessionData;

    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .insert([{
        user_id,
        subject_id,
        level_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async findById(sessionId) {
    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

module.exports = AIChatSession;

