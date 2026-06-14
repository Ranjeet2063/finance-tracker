const router = require('express').Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');
const { expenseValidation, idParam } = require('../middleware/validation');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', expenseController.getExpenses);
router.get('/:id', idParam, expenseController.getExpense);
router.post('/', upload.single('receipt'), expenseValidation, expenseController.createExpense);
router.put('/:id', idParam, expenseController.updateExpense);
router.delete('/:id', idParam, expenseController.deleteExpense);
router.post('/scan-receipt', upload.single('receipt'), expenseController.scanReceipt);

module.exports = router;
