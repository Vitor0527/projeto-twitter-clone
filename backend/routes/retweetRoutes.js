const express = require('express');
const router = express.Router();
const retweetController = require('../controllers/retweetController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/:id/retweet', authMiddleware, retweetController.toggleRetweet);

module.exports = router;
