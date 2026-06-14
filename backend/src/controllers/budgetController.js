const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

exports.getBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.userId, isActive: true });
    const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: req.userId,
            type: 'expense',
            category: budget.category,
            date: { $gte: budget.startDate, $lte: budget.endDate || new Date() }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      return {
        ...budget.toObject(),
        spent: spent[0]?.total || 0,
        remaining: Math.max(0, budget.amount - (spent[0]?.total || 0)),
        percentage: Math.min(100, ((spent[0]?.total || 0) / budget.amount) * 100)
      };
    }));
    res.json({ budgets: budgetsWithSpending });
  } catch (error) {
    next(error);
  }
};

exports.createBudget = async (req, res, next) => {
  try {
    const budget = await Budget.create({
      user: req.userId,
      category: req.body.category,
      amount: req.body.amount,
      period: req.body.period || 'monthly',
      startDate: req.body.startDate || new Date(),
      endDate: req.body.endDate,
      alertsEnabled: req.body.alertsEnabled !== false,
      alertThreshold: req.body.alertThreshold || 80,
      rollover: req.body.rollover || false
    });
    res.status(201).json({ message: 'Budget created', budget });
  } catch (error) {
    next(error);
  }
};

exports.updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ error: 'Budget not found.' });
    res.json({ message: 'Budget updated', budget });
  } catch (error) {
    next(error);
  }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!budget) return res.status(404).json({ error: 'Budget not found.' });
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getBudgetReport = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.userId, isActive: true });
    const report = [];

    for (const budget of budgets) {
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: req.userId,
            type: 'expense',
            category: budget.category,
            date: { $gte: budget.startDate, $lte: budget.endDate || new Date() }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      report.push({
        category: budget.category,
        budgeted: budget.amount,
        spent: spent[0]?.total || 0,
        transactions: spent[0]?.count || 0,
        remaining: Math.max(0, budget.amount - (spent[0]?.total || 0)),
        percentage: Math.min(100, ((spent[0]?.total || 0) / budget.amount) * 100),
        status: (spent[0]?.total || 0) > budget.amount ? 'over' : 'on_track'
      });
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
};
