const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  description: { type: String, trim: true, maxlength: 500 },
  date: { type: Date, required: true, default: Date.now },
  currency: { type: String, default: 'USD' },
  tags: [{ type: String, trim: true, lowercase: true }],
  receipt: { url: String, filename: String },
  isRecurring: { type: Boolean, default: false },
  recurringPeriod: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
  notes: { type: String, trim: true, maxlength: 1000 },
  source: { type: String, enum: ['manual', 'voice', 'ocr', 'import'], default: 'manual' }
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
