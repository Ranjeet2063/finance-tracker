const { body, param, query, validationResult } = require('express-validator');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCIES } = require('../config/constants');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
  handleValidation
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation
];

const expenseValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category').isIn(EXPENSE_CATEGORIES).withMessage(`Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`),
  body('description').optional().trim().isLength({ max: 500 }),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  handleValidation
];

const incomeValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category').isIn(INCOME_CATEGORIES).withMessage(`Category must be one of: ${INCOME_CATEGORIES.join(', ')}`),
  body('description').optional().trim().isLength({ max: 500 }),
  handleValidation
];

const budgetValidation = [
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('period').optional().isIn(['weekly', 'monthly', 'yearly']),
  handleValidation
];

const idParam = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidation
];

module.exports = {
  registerValidation, loginValidation, expenseValidation,
  incomeValidation, budgetValidation, idParam, handleValidation
};
