const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  period: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  alertsEnabled: { type: Boolean, default: true },
  alertThreshold: { type: Number, default: 80, min: 0, max: 100 },
  isActive: { type: Boolean, default: true },
  rollover: { type: Boolean, default: false }
}, { timestamps: true });

budgetSchema.index({ user: 1, category: 1, period: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
