const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/:id/follow', authMiddleware, followController.toggleFollow);
router.get('/:id/following', followController.getFollowing);

module.exports = router;
