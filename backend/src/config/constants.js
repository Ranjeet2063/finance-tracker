const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment',
  'Bills', 'Education', 'Health', 'Other'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investment', 'Other'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'SGD'];

const BUDGET_PERIODS = ['weekly', 'monthly', 'yearly'];

const FINANCIAL_HEALTH_WEIGHTS = {
  savingsRate: 0.35,
  spendingBehavior: 0.25,
  budgetDiscipline: 0.25,
  financialConsistency: 0.15
};

const RECEIPT_UPLOAD_PATH = 'uploads/receipts';

module.exports = {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CURRENCIES,
  BUDGET_PERIODS,
  FINANCIAL_HEALTH_WEIGHTS,
  RECEIPT_UPLOAD_PATH
};
