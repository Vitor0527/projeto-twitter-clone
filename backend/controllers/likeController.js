const { Like, Tweet } = require('../models');

const toggleLike = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tweetId = parseInt(req.params.id, 10);

    const tweet = await Tweet.findByPk(tweetId);
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    const existing = await Like.findOne({ where: { userId, tweetId } });
    if (existing) {
      await existing.destroy();
      tweet.likes = Math.max(0, tweet.likes - 1);
      await tweet.save();
      return res.json({ message: 'Like removed', liked: false, likes: tweet.likes });
    }

    await Like.create({ userId, tweetId });
    tweet.likes += 1;
    await tweet.save();
    res.status(201).json({ message: 'Liked', liked: true, likes: tweet.likes });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { toggleLike };
