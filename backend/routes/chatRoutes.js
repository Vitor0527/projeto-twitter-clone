const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/conversations', chatController.listConversations);
router.get('/with/:userId/messages', chatController.getMessagesWithUser);
router.post('/with/:userId/messages', chatController.sendMessage);

module.exports = router;
