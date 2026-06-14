const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['bill_reminder', 'overspend_alert', 'budget_warning', 'monthly_summary', 'goal_milestone', 'ai_insight'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'danger', 'success'], default: 'info' },
  read: { type: Boolean, default: false },
  actionable: { type: Boolean, default: false },
  actionUrl: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
