const axios = require('axios');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

exports.getPredictions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.userId }).sort({ date: -1 }).limit(365).lean();
    if (transactions.length < 7) {
      return res.json({
        predictions: null,
        message: 'Need at least 7 days of data for predictions.'
      });
    }

    const { data } = await axios.post(`${AI_SERVICE_URL}/predict`, {
      transactions,
      userId: req.userId.toString()
    }, { timeout: 15000 });

    res.json(data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      const localPrediction = generateLocalPrediction(transactions);
      return res.json(localPrediction);
    }
    next(error);
  }
};

exports.getSavingAdvice = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.userId }).sort({ date: -1 }).limit(180).lean();
    const budgets = await Budget.find({ user: req.userId }).lean();

    const advice = generateSavingAdvice(transactions, budgets);
    res.json({ advice });
  } catch (error) {
    next(error);
  }
};

exports.getFinancialHealth = async (req, res, next) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const transactions = await Transaction.find({
      user: req.userId,
      date: { $gte: sixMonthsAgo }
    }).lean();

    const budgets = await Budget.find({ user: req.userId }).lean();
    const health = calculateFinancialHealth(transactions, budgets);

    res.json({ health });
  } catch (error) {
    next(error);
  }
};

exports.chatbot = async (req, res, next) => {
  try {
    const { message, context } = req.body;

    const transactions = await Transaction.find({ user: req.userId })
      .sort({ date: -1 }).limit(50).lean();

    const { data } = await axios.post(`${AI_SERVICE_URL}/chat`, {
      message,
      context: {
        transactions,
        userCurrency: req.user.currency,
        ...context
      }
    }, { timeout: 20000 });

    res.json(data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.json({
        reply: generateLocalChatResponse(req.body.message),
        source: 'local'
      });
    }
    next(error);
  }
};

exports.voiceExpense = async (req, res, next) => {
  try {
    const { transcript } = req.body;
    const extracted = parseVoiceCommand(transcript);

    if (!extracted.amount || !extracted.category) {
      return res.status(400).json({
        error: 'Could not parse expense. Say something like "Spent 25 dollars on food"',
        parsed: extracted
      });
    }

    const expense = await Transaction.create({
      user: req.userId,
      type: 'expense',
      amount: extracted.amount,
      category: extracted.category,
      description: extracted.description || transcript,
      source: 'voice',
      date: new Date()
    });

    res.status(201).json({ message: 'Expense recorded via voice', expense, parsed: extracted });
  } catch (error) {
    next(error);
  }
};

function parseVoiceCommand(text) {
  const categories = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'education', 'health'];
  const lower = text.toLowerCase();
  let amount = null;
  let category = 'Other';
  let description = text;

  const amountMatch = lower.match(/(\d+[.,]?\d*)\s*(dollars?|usd?|\$|eur?|euros?|inr?|rupees?|rs\.?)/i);
  const numMatch = lower.match(/\b(\d+[.,]?\d*)\b/);
  if (amountMatch) amount = parseFloat(amountMatch[1].replace(',', '.'));
  else if (numMatch) amount = parseFloat(numMatch[1].replace(',', '.'));

  for (const cat of categories) {
    if (lower.includes(cat)) {
      category = cat.charAt(0).toUpperCase() + cat.slice(1);
      description = text.replace(new RegExp(`\\b${cat}\\b`, 'i'), '').trim();
      break;
    }
  }

  return { amount, category, description: description || 'Voice entry' };
}

function generateLocalPrediction(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  if (expenses.length < 7) return { predictions: null, message: 'Insufficient data' };

  const recent = expenses.slice(0, 30);
  const avgExpense = recent.reduce((s, t) => s + t.amount, 0) / recent.length;
  const weekly = expenses.slice(0, 7).reduce((s, t) => s + t.amount, 0);
  const monthly = expenses.slice(0, 30).reduce((s, t) => s + t.amount, 0);
  const incomes = transactions.filter(t => t.type === 'income');
  const avgIncome = incomes.slice(0, 3).reduce((s, t) => s + t.amount, 0) / Math.min(3, incomes.length);

  return {
    predictions: {
      nextWeek: { amount: Math.round(weekly * 1.05), confidence: 70 },
      nextMonth: { amount: Math.round(monthly * 1.08), confidence: 65 },
      nextMonthSavings: Math.round(avgIncome - monthly * 1.08),
      trend: weekly > monthly / 4 ? 'increasing' : 'stable'
    },
    source: 'local'
  };
}

function generateSavingAdvice(transactions, budgets) {
  const advices = [];
  const expenses = transactions.filter(t => t.type === 'expense');
  const categoryTotals = {};
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const totalExpenses = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  for (const [cat, total] of Object.entries(categoryTotals)) {
    const percentage = (total / totalExpenses) * 100;
    if (percentage > 30 && cat !== 'Bills') {
      advices.push({
        type: 'reduce_spending',
        category: cat,
        message: `Your ${cat} spending is ${Math.round(percentage)}% of total expenses. Consider reducing it to 20% to save more.`,
        potentialSavings: Math.round(total * 0.3)
      });
    }
  }

  const eatingOut = categoryTotals['Food'] || 0;
  if (eatingOut > 200) {
    advices.push({
      type: 'cooking_tip',
      category: 'Food',
      message: 'Try cooking at home more often. You could save significantly on food expenses.',
      potentialSavings: Math.round(eatingOut * 0.4)
    });
  }

  if (advices.length === 0) {
    advices.push({
      type: 'good_job',
      message: 'Your spending habits look healthy! Consider increasing your savings rate.',
      potentialSavings: 0
    });
  }

  return advices;
}

function calculateFinancialHealth(transactions, budgets) {
  const incomes = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  const savingsScore = Math.min(100, savingsRate * 100 * 1.5);

  const categorySpread = new Set(expenses.map(t => t.category)).size;
  const spreadScore = Math.min(100, (categorySpread / 8) * 100);

  const budgetScore = budgets.length > 0
    ? Math.min(100, (budgets.filter(b => b.isActive).length / budgets.length) * 100)
    : 30;

  const consistency = calculateConsistency(transactions);

  const healthScore = Math.round(
    savingsScore * 0.35 + spreadScore * 0.25 + budgetScore * 0.25 + consistency * 0.15
  );

  let category, description, improvements;

  if (healthScore >= 80) {
    category = 'Excellent';
    description = 'Your financial health is outstanding! Keep up the great habits.';
    improvements = ['Maintain your emergency fund', 'Consider investing for long-term growth'];
  } else if (healthScore >= 60) {
    category = 'Good';
    description = 'You have a solid foundation. A few tweaks can improve your score.';
    improvements = [
      savingsRate < 0.2 ? 'Try to save at least 20% of your income' : null,
      budgetScore < 50 ? 'Set budgets for your top spending categories' : null
    ].filter(Boolean);
  } else if (healthScore >= 40) {
    category = 'Fair';
    description = 'Room for improvement. Focus on building better financial habits.';
    improvements = [
      'Create a monthly budget and stick to it',
      'Reduce unnecessary expenses',
      'Build an emergency fund of 3-6 months of expenses'
    ];
  } else {
    category = 'Needs Attention';
    description = 'Time to take control of your finances. Start with small steps.';
    improvements = [
      'Track every expense for 30 days',
      'Cut non-essential spending by 50%',
      'Set up automatic savings transfers',
      'Create a realistic budget'
    ];
  }

  return {
    score: healthScore,
    category,
    description,
    components: {
      savingsRate: Math.round(savingsScore),
      spendingBehavior: Math.round(spreadScore),
      budgetDiscipline: Math.round(budgetScore),
      financialConsistency: Math.round(consistency)
    },
    improvements
  };
}

function calculateConsistency(transactions) {
  if (transactions.length < 30) return 50;
  const grouped = {};
  transactions.forEach(t => {
    const key = t.date.toISOString().slice(0, 7);
    if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
    grouped[key][t.type] += t.amount;
  });
  const months = Object.values(grouped);
  if (months.length < 2) return 50;
  const avgExpense = months.reduce((s, m) => s + m.expense, 0) / months.length;
  const variance = months.reduce((s, m) => s + Math.abs(m.expense - avgExpense), 0) / months.length;
  const consistency = Math.max(0, 100 - (variance / avgExpense) * 50);
  return Math.min(100, Math.round(consistency));
}

function generateLocalChatResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes('save') || msg.includes('saving')) {
    return 'To save more, try the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings. Track your expenses and look for subscriptions you can cancel.';
  }
  if (msg.includes('budget')) {
    return 'Setting a budget is key! I recommend using category-based budgets. Start with your top 3 expense categories and set realistic limits.';
  }
  if (msg.includes('invest')) {
    return 'Consider starting with low-cost index funds or ETFs. Aim to invest 15% of your income, but first build a 3-6 month emergency fund.';
  }
  if (msg.includes('debt')) {
    return 'Use the avalanche method: pay off highest interest debt first while making minimum payments on others. Or try the snowball method for psychological wins.';
  }
  return 'I can help with budgeting, saving, investing, and debt management. What financial question do you have?';
}
