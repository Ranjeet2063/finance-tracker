const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const query = { user: req.userId };
    if (unread === 'true') query.read = false;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      notifications,
      unreadCount: await Notification.countDocuments({ user: req.userId, read: false }),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    res.json({ message: 'Marked as read', notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.userId, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getNotificationPreferences = async (req, res) => {
  const user = req.user;
  res.json({ preferences: user.preferences.notifications });
};

exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const allowed = ['email', 'push', 'billReminders', 'overspendAlerts', 'weeklySummary'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[`preferences.notifications.${field}`] = req.body[field];
    });

    const user = req.user;
    Object.entries(updates).forEach(([key, value]) => {
      const keys = key.split('.');
      if (keys.length === 2) user.preferences[keys[0]][keys[1]] = value;
      else user[key] = value;
    });
    await user.save();

    res.json({ message: 'Preferences updated', preferences: user.preferences.notifications });
  } catch (error) {
    next(error);
  }
};
