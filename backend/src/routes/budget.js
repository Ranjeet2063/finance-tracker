const router = require('express').Router();
const budgetController = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');
const { budgetValidation, idParam } = require('../middleware/validation');

router.use(authenticate);

router.get('/', budgetController.getBudgets);
router.post('/', budgetValidation, budgetController.createBudget);
router.put('/:id', idParam, budgetController.updateBudget);
router.delete('/:id', idParam, budgetController.deleteBudget);
router.get('/report', budgetController.getBudgetReport);

module.exports = router;
