const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { idParam } = require('../middleware/validation');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/preferences', notificationController.getNotificationPreferences);
router.put('/preferences', notificationController.updateNotificationPreferences);
router.patch('/:id/read', idParam, notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);
router.delete('/:id', idParam, notificationController.deleteNotification);

module.exports = router;
