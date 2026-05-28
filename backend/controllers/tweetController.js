const { Tweet, User, Comment } = require('../models');

// GET todos os tweets
const getAllTweets = async (req, res) => {
  try {
    const { userId, username } = req.query;
    const where = {};
    
    if (userId) {
      where.userId = userId;
    }

    const include = [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'avatar', 'username']
      },
      {
        model: User,
        as: 'likedByUsers',
        attributes: ['id'],
        through: { attributes: [] }
      },
      {
        model: User,
        as: 'retweetedByUsers',
        attributes: ['id'],
        through: { attributes: [] }
      },
      {
        model: Comment,
        include: {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar', 'username']
        }
      }
    ];

    if (username) {
      include[0].where = { username };
    }

    const tweets = await Tweet.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']]
    });

    res.json(tweets);
  } catch (error) {
    console.error('Get tweets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET tweet por ID
const getTweetById = async (req, res) => {
  try {
    const { id } = req.params;

    const tweet = await Tweet.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar', 'username']
        },
        {
          model: User,
          as: 'likedByUsers',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'retweetedByUsers',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          include: {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar', 'username']
          }
        }
      ]
    });

    if (!tweet) {
      return res.status(404).json({ 
        error: 'Tweet not found' 
      });
    }

    res.json(tweet);
  } catch (error) {
    console.error('Get tweet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST criar tweet
const createTweet = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ 
        error: 'Content is required' 
      });
    }

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || null;

    const tweet = await Tweet.create({
      content,
      image,
      userId
    });

    const tweetWithAuthor = await Tweet.findByPk(tweet.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar', 'username']
        },
        {
          model: User,
          as: 'likedByUsers',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'retweetedByUsers',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          include: {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar', 'username']
          }
        }
      ]
    });

    res.status(201).json({
      message: 'Tweet created successfully',
      tweet: tweetWithAuthor
    });
  } catch (error) {
    console.error('Create tweet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT atualizar tweet
const updateTweet = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const tweet = await Tweet.findByPk(id);
    if (!tweet) {
      return res.status(404).json({ 
        error: 'Tweet not found' 
      });
    }

    if (tweet.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'You can only update your own tweets' 
      });
    }

    if (content) tweet.content = content;
    if (req.file) {
      tweet.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      tweet.image = req.body.image || null;
    }

    await tweet.save();

    const updatedTweet = await Tweet.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar', 'username']
        },
        {
          model: User,
          as: 'likedByUsers',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'retweetedByUsers',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          include: {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar', 'username']
          }
        }
      ]
    });

    res.json({
      message: 'Tweet updated successfully',
      tweet: updatedTweet
    });
  } catch (error) {
    console.error('Update tweet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE eliminar tweet
const deleteTweet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const tweet = await Tweet.findByPk(id);
    if (!tweet) {
      return res.status(404).json({ 
        error: 'Tweet not found' 
      });
    }

    if (tweet.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own tweets' 
      });
    }

    await tweet.destroy();

    res.json({ 
      message: 'Tweet deleted successfully' 
    });
  } catch (error) {
    console.error('Delete tweet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== COMENTÁRIOS =====

const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email', 'avatar', 'username']
        },
        {
          model: Tweet,
          attributes: ['id', 'content']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCommentsByTweet = async (req, res) => {
  try {
    const { tweetId } = req.params;

    const comments = await Comment.findAll({
      where: { tweetId },
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'avatar', 'username']
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id, {
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'avatar', 'username']
      }
    });

    if (!comment) {
      return res.status(404).json({ 
        error: 'Comment not found' 
      });
    }

    res.json(comment);
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createComment = async (req, res) => {
  try {
    const { content, tweetId } = req.body;
    const userId = req.user.userId;

    if (!content || !tweetId) {
      return res.status(400).json({ 
        error: 'Content and tweetId are required' 
      });
    }

    const tweet = await Tweet.findByPk(tweetId);
    if (!tweet) {
      return res.status(404).json({ 
        error: 'Tweet not found' 
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const comment = await Comment.create({
      content,
      image,
      userId,
      tweetId
    });

    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'avatar', 'username']
      }
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment: commentWithAuthor
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ 
        error: 'Comment not found' 
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only update your own comments' 
      });
    }

    if (content) comment.content = content;
    if (req.file) comment.image = `/uploads/${req.file.filename}`;

    await comment.save();

    const updatedComment = await Comment.findByPk(id, {
      include: {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'avatar', 'username']
      }
    });

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ 
        error: 'Comment not found' 
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own comments' 
      });
    }

    await comment.destroy();

    res.json({ 
      message: 'Comment deleted successfully' 
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllTweets,
  getTweetById,
  createTweet,
  updateTweet,
  deleteTweet,
  getAllComments,
  getCommentsByTweet,
  getCommentById,
  createComment,
  updateComment,
  deleteComment
};
