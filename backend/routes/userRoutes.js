const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/users
router.get('/', userController.getAllUsers);

// GET /api/users/feed/following (autenticado)
router.get('/feed/following', authMiddleware, userController.getFollowingFeed);

// GET /api/users/username/:username/timeline
router.get('/username/:username/timeline', userController.getUserTimeline);

// GET /api/users/username/:username
router.get('/username/:username', userController.getUserByUsername);

// GET /api/users/:id
router.get('/:id', userController.getUserById);

// POST /api/users (protegido)
router.post('/', authMiddleware, userController.createUser);

// PUT /api/users/:id (protegido)
router.put('/:id', authMiddleware, userController.updateUser);

// DELETE /api/users/:id (protegido)
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
