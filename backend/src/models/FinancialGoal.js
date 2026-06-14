const mongoose = require('mongoose');

const financialGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0, min: 0 },
  deadline: Date,
  category: { type: String, enum: ['savings', 'investment', 'debt', 'emergency', 'custom'], default: 'savings' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  isCompleted: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('FinancialGoal', financialGoalSchema);
