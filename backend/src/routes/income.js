const router = require('express').Router();
const incomeController = require('../controllers/incomeController');
const { authenticate } = require('../middleware/auth');
const { incomeValidation, idParam } = require('../middleware/validation');

router.use(authenticate);

router.get('/', incomeController.getIncomes);
router.get('/:id', idParam, incomeController.getIncome);
router.post('/', incomeValidation, incomeController.createIncome);
router.put('/:id', idParam, incomeController.updateIncome);
router.delete('/:id', idParam, incomeController.deleteIncome);

module.exports = router;
