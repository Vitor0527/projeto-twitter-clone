const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// GET /api/comments
router.get('/', tweetController.getAllComments);

// GET /api/comments/tweet/:tweetId
router.get('/tweet/:tweetId', tweetController.getCommentsByTweet);

// GET /api/comments/:id
router.get('/:id', tweetController.getCommentById);

// POST /api/comments (protegido, com upload opcional)
router.post('/', authMiddleware, upload.single('image'), tweetController.createComment);

// PUT /api/comments/:id (protegido, com upload opcional)
router.put('/:id', authMiddleware, upload.single('image'), tweetController.updateComment);

// DELETE /api/comments/:id (protegido)
router.delete('/:id', authMiddleware, tweetController.deleteComment);

module.exports = router;
