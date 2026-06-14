const Transaction = require('../models/Transaction');

exports.getIncomes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate, sort = '-date' } = req.query;
    const query = { user: req.userId, type: 'income' };

    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(query);
    const incomes = await Transaction.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      incomes,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), hasMore: page * limit < total }
    });
  } catch (error) {
    next(error);
  }
};

exports.getIncome = async (req, res, next) => {
  try {
    const income = await Transaction.findOne({ _id: req.params.id, user: req.userId, type: 'income' });
    if (!income) return res.status(404).json({ error: 'Income record not found.' });
    res.json({ income });
  } catch (error) {
    next(error);
  }
};

exports.createIncome = async (req, res, next) => {
  try {
    const income = await Transaction.create({
      user: req.userId,
      type: 'income',
      amount: req.body.amount,
      category: req.body.category,
      description: req.body.description,
      date: req.body.date || new Date(),
      tags: req.body.tags || [],
      notes: req.body.notes,
      isRecurring: req.body.isRecurring || false,
      recurringPeriod: req.body.recurringPeriod,
      source: req.body.source || 'manual'
    });

    req.app.get('io').to(`user:${req.userId}`).emit('income:created', income);
    res.status(201).json({ message: 'Income added', income });
  } catch (error) {
    next(error);
  }
};

exports.updateIncome = async (req, res, next) => {
  try {
    const income = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId, type: 'income' },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!income) return res.status(404).json({ error: 'Income record not found.' });
    res.json({ message: 'Income updated', income });
  } catch (error) {
    next(error);
  }
};

exports.deleteIncome = async (req, res, next) => {
  try {
    const income = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId, type: 'income' });
    if (!income) return res.status(404).json({ error: 'Income record not found.' });
    res.json({ message: 'Income deleted' });
  } catch (error) {
    next(error);
  }
};
