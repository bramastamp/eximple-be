const Notification = require('../../models/Notification');

class NotificationController {
  // Get all notifications
  static async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { unread_only, limit } = req.query;

      const filters = {};
      if (unread_only === 'true') {
        filters.unread_only = true;
      }
      if (limit) {
        filters.limit = parseInt(limit);
      }

      const notifications = await Notification.findByUserId(userId, filters);

      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  // Get unread count
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await Notification.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await Notification.markAsRead(parseInt(id), userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // Mark all as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const notifications = await Notification.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: { updated_count: notifications.length }
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;

