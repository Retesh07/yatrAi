const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error('NOTIFICATION FETCH ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.deleteOne();

    res.status(200).json({ success: true, notification, deleted: true });
  } catch (error) {
    console.error('NOTIFICATION UPDATE ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
