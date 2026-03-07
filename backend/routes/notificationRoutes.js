const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserNotifications, markAllRead, removeNotification } = require('../utils/notification');

// Get notifications for logged-in user
router.get('/', protect, (req, res) => {
  const notifications = getUserNotifications(req.user._id);
  res.json(notifications);
});

// Mark all as read
router.post('/read', protect, (req, res) => {
  markAllRead(req.user._id);
  res.json({ message: 'All notifications marked as read' });
});

// Delete a single notification
router.delete('/:id', protect, (req, res) => {
  removeNotification(req.user._id, req.params.id);
  res.json({ message: 'Notification removed' });
});

module.exports = router;
