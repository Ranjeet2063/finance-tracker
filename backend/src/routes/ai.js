const router = require('express').Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/predict', aiController.getPredictions);
router.get('/saving-advice', aiController.getSavingAdvice);
router.get('/financial-health', aiController.getFinancialHealth);
router.post('/chat', aiController.chatbot);
router.post('/voice-expense', aiController.voiceExpense);

module.exports = router;
