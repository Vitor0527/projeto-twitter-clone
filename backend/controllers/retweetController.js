const { Retweet, Tweet } = require('../models');

const toggleRetweet = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tweetId = parseInt(req.params.id, 10);

    const tweet = await Tweet.findByPk(tweetId);
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    if (tweet.userId === userId) {
      return res.status(400).json({ error: 'Cannot retweet your own tweet' });
    }

    const existing = await Retweet.findOne({ where: { userId, tweetId } });
    if (existing) {
      await existing.destroy();
      tweet.retweets = Math.max(0, tweet.retweets - 1);
      await tweet.save();
      return res.json({
        message: 'Retweet removed',
        retweeted: false,
        retweets: tweet.retweets,
      });
    }

    await Retweet.create({ userId, tweetId });
    tweet.retweets += 1;
    await tweet.save();
    res.status(201).json({
      message: 'Retweeted',
      retweeted: true,
      retweets: tweet.retweets,
    });
  } catch (error) {
    console.error('Toggle retweet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { toggleRetweet };
