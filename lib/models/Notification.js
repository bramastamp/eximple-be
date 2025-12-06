const supabase = require('../config/db');

class Notification {
  static async findByUserId(userId, filters = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.unread_only) {
      query = query.eq('is_read', false);
    }

    if (filters.limit) {
      query = query.limit(parseInt(filters.limit));
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async create(userId, notificationData) {
    const { title, body, data: notificationDataObj = {} } = notificationData;

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        body,
        data: notificationDataObj,
        is_read: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markAsRead(notificationId, userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markAllAsRead(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) throw error;
    return data || [];
  }

  static async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }
}

module.exports = Notification;

