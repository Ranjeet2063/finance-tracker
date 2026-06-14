const Transaction = require('../models/Transaction');
const fs = require('fs');
const { createWorker } = require('tesseract.js');

exports.getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate, search, sort = '-date' } = req.query;
    const query = { user: req.userId, type: 'expense' };

    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Transaction.countDocuments(query);
    const expenses = await Transaction.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getExpense = async (req, res, next) => {
  try {
    const expense = await Transaction.findOne({ _id: req.params.id, user: req.userId, type: 'expense' });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const expenseData = {
      user: req.userId,
      type: 'expense',
      amount: req.body.amount,
      category: req.body.category,
      description: req.body.description,
      date: req.body.date || new Date(),
      tags: req.body.tags || [],
      notes: req.body.notes,
      isRecurring: req.body.isRecurring || false,
      recurringPeriod: req.body.recurringPeriod,
      source: req.body.source || 'manual'
    };

    if (req.file) {
      expenseData.receipt = { url: `/uploads/receipts/${req.file.filename}`, filename: req.file.originalname };
    }

    const expense = await Transaction.create(expenseData);

    req.app.get('io').to(`user:${req.userId}`).emit('expense:created', expense);
    checkBudgetAlerts(req, expense);

    res.status(201).json({ message: 'Expense added', expense });
  } catch (error) {
    next(error);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId, type: 'expense' },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

    req.app.get('io').to(`user:${req.userId}`).emit('expense:updated', expense);
    res.json({ message: 'Expense updated', expense });
  } catch (error) {
    next(error);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId, type: 'expense' });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

    if (expense.receipt?.url) {
      const filePath = `.${expense.receipt.url}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    req.app.get('io').to(`user:${req.userId}`).emit('expense:deleted', expense._id);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

exports.scanReceipt = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Receipt image required.' });

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();

    const lines = text.split('\n').filter(l => l.trim());
    const amountMatch = text.match(/\$?(\d+\.\d{2})/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    const storeName = lines[0] || 'Unknown Store';

    res.json({
      message: 'Receipt scanned',
      data: { storeName, amount, rawText: text, lines }
    });
  } catch (error) {
    next(error);
  }
};

async function checkBudgetAlerts(req, expense) {
  try {
    const Budget = require('../models/Budget');
    const Notification = require('../models/Notification');

    const budgets = await Budget.find({
      user: req.userId,
      category: expense.category,
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
    });

    for (const budget of budgets) {
      const spent = await Transaction.aggregate([
        { $match: { user: req.userId, type: 'expense', category: expense.category } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalSpent = spent[0]?.total || 0;
      const percentage = (totalSpent / budget.amount) * 100;

      if (percentage >= 100) {
        await Notification.create({
          user: req.userId,
          type: 'overspend_alert',
          title: 'Budget Exceeded!',
          message: `You've exceeded your ${budget.category} budget of ${budget.amount}`,
          severity: 'danger'
        });
      } else if (percentage >= budget.alertThreshold) {
        await Notification.create({
          user: req.userId,
          type: 'budget_warning',
          title: 'Budget Warning',
          message: `You've used ${Math.round(percentage)}% of your ${budget.category} budget`,
          severity: 'warning'
        });
      }
    }
  } catch (err) {
    console.error('Budget check error:', err);
  }
}
