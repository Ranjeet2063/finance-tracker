const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const { period = 'monthly', month, year } = req.query;
    const now = new Date();
    const y = parseInt(year) || now.getFullYear();
    const m = parseInt(month) || now.getMonth() + 1;

    let startDate, endDate;
    if (period === 'yearly') {
      startDate = new Date(y, 0, 1);
      endDate = new Date(y + 1, 0, 1);
    } else {
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 1);
    }

    const matchPeriod = { user: req.userId, date: { $gte: startDate, $lt: endDate } };

    const [incomeResult, expenseResult, recentTransactions, categoryBreakdown, trends] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...matchPeriod, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...matchPeriod, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.find({ user: req.userId })
        .sort('-date').limit(10).lean(),
      Transaction.aggregate([
        { $match: { ...matchPeriod, type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Transaction.aggregate([
        { $match: { user: req.userId, date: { $gte: new Date(y - 1, 0, 1) } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const totalIncome = incomeResult[0]?.total || 0;
    const totalExpenses = expenseResult[0]?.total || 0;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    res.json({
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate: parseFloat(savingsRate),
      recentTransactions,
      categoryBreakdown,
      trends,
      period: { month: m, year: y }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();

    const data = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          date: { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
      const income = data.find(d => d._id.month === i + 1 && d._id.type === 'income');
      const expense = data.find(d => d._id.month === i + 1 && d._id.type === 'expense');
      return {
        month: i + 1,
        monthName: new Date(y, i).toLocaleString('en', { month: 'short' }),
        income: income?.total || 0,
        expenses: expense?.total || 0,
        net: (income?.total || 0) - (expense?.total || 0)
      };
    });

    res.json({ year: y, months });
  } catch (error) {
    next(error);
  }
};

exports.getYearlyReport = async (req, res, next) => {
  try {
    const years = await Transaction.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: { year: { $year: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1 } }
    ]);

    const report = years.reduce((acc, item) => {
      const year = item._id.year;
      if (!acc[year]) acc[year] = { year, income: 0, expenses: 0, count: 0 };
      if (item._id.type === 'income') acc[year].income = item.total;
      else acc[year].expenses = item.total;
      acc[year].count += item.count;
      return acc;
    }, {});

    res.json({ report: Object.values(report) });
  } catch (error) {
    next(error);
  }
};
