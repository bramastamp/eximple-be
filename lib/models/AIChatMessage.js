const supabase = require('../config/db');

class AIChatMessage {
  static async create(messageData) {
    const { session_id, sender, message, metadata = {} } = messageData;

    const { data, error } = await supabase
      .from('ai_chat_messages')
      .insert([{
        session_id,
        sender,
        message,
        metadata
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

module.exports = AIChatMessage;

