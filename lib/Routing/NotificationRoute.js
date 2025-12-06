const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/Notification/NotificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/:id/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);

module.exports = router;

