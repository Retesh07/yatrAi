const Notification = require('../models/Notification');
const { emitToUser } = require('./socketService');

async function createNotification({ userId, title, message, data = {}, type = 'trip' }) {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    data,
    type,
  });

  emitToUser(userId, 'notification', {
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    createdAt: notification.createdAt,
    read: notification.read,
  });

  return notification;
}

module.exports = { createNotification };
