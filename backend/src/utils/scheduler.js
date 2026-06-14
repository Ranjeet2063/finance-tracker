const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const User = require('../models/User');

const startCronJobs = () => {
  cron.schedule('0 8 * * 1', async () => {
    console.log('Running weekly summary job...');
    const users = await User.find({ isActive: true, 'preferences.notifications.weeklySummary': true });

    for (const user of users) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const expenses = await Transaction.aggregate([
        { $match: { user: user._id, type: 'expense', date: { $gte: weekAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      await Notification.create({
        user: user._id,
        type: 'monthly_summary',
        title: 'Weekly Summary',
        message: `You spent $${(expenses[0]?.total || 0).toFixed(2)} this week.`,
        severity: 'info'
      });
    }
  });

  cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly budget reset job...');
    const budgets = await Budget.find({ isActive: true, rollover: true });

    for (const budget of budgets) {
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: budget.user,
            type: 'expense',
            category: budget.category,
            date: { $gte: budget.startDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const remaining = Math.max(0, budget.amount - (spent[0]?.total || 0));
      if (remaining > 0 && budget.rollover) {
        budget.amount += remaining;
        budget.startDate = new Date();
        await budget.save();
      }
    }
  });
};

module.exports = { startCronJobs };
