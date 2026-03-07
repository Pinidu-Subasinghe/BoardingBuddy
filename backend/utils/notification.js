// Simple in-memory notification store for demo (replace with DB or push in production)
const notifications = [];

function addNotification({ userId, message, type, data }) {
  notifications.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    message,
    type,
    data,
    read: false,
    createdAt: new Date()
  });
}

function getUserNotifications(userId) {
  return notifications.filter(n => n.userId.toString() === userId.toString());
}

function markAllRead(userId) {
  notifications.forEach(n => {
    if (n.userId.toString() === userId.toString()) n.read = true;
  });
}

function removeNotification(userId, notificationId) {
  const idx = notifications.findIndex(
    n => n.userId.toString() === userId.toString() && n.id === notificationId
  );
  if (idx !== -1) notifications.splice(idx, 1);
}

module.exports = { addNotification, getUserNotifications, markAllRead, removeNotification };
