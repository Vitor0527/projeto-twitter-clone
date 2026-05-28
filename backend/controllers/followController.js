const { Follow, User } = require('../models');

const toggleFollow = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followedId = parseInt(req.params.id, 10);

    if (followerId === followedId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const target = await User.findByPk(followedId);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await Follow.findOne({ where: { followerId, followedId } });
    if (existing) {
      await existing.destroy();
      return res.json({ message: 'Unfollowed', following: false });
    }

    await Follow.create({ followerId, followedId });
    res.status(201).json({ message: 'Following', following: true });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFollowing = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const follows = await Follow.findAll({ where: { followerId: userId } });
    res.json(follows.map((f) => f.followedId));
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { toggleFollow, getFollowing };
