const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// GET /api/tweets
router.get('/', tweetController.getAllTweets);

// GET /api/tweets/:id
router.get('/:id', tweetController.getTweetById);

// POST /api/tweets (protegido, com upload opcional)
router.post('/', authMiddleware, upload.single('image'), tweetController.createTweet);

// PUT /api/tweets/:id (protegido, com upload opcional)
router.put('/:id', authMiddleware, upload.single('image'), tweetController.updateTweet);

// DELETE /api/tweets/:id (protegido)
router.delete('/:id', authMiddleware, tweetController.deleteTweet);

module.exports = router;
