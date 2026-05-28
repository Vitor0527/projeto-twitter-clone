const { Op } = require('sequelize');
const { User, Profile, Tweet, Comment, Retweet } = require('../models');
const { hashPassword } = require('../utils/passwordUtils');

const tweetTimelineIncludes = [
  {
    model: User,
    as: 'author',
    attributes: ['id', 'name', 'email', 'avatar', 'username'],
  },
  {
    model: User,
    as: 'likedByUsers',
    attributes: ['id'],
    through: { attributes: [] },
  },
  {
    model: User,
    as: 'retweetedByUsers',
    attributes: ['id'],
    through: { attributes: [] },
  },
  {
    model: Comment,
    include: {
      model: User,
      as: 'author',
      attributes: ['id', 'name', 'email', 'avatar', 'username'],
    },
  },
];

// GET todos os utilizadores
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Profile,
        },
        {
          model: User,
          as: 'following',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'followers',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET feed "A seguir" (tweets + reposts de quem o utilizador segue)
const getFollowingFeed = async (req, res) => {
  try {
    const userId = req.user.userId;

    const currentUser = await User.findByPk(userId, {
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'username', 'name'],
          through: { attributes: [] },
        },
      ],
    });

    const followingIds = (currentUser?.following || []).map((u) => u.id);
    if (!followingIds.length) {
      return res.json([]);
    }

    const followingById = Object.fromEntries(
      (currentUser.following || []).map((u) => [u.id, u]),
    );

    const authored = await Tweet.findAll({
      where: { userId: { [Op.in]: followingIds } },
      include: tweetTimelineIncludes,
    });

    const retweetRows = await Retweet.findAll({
      where: { userId: { [Op.in]: followingIds } },
      include: [
        {
          model: Tweet,
          include: tweetTimelineIncludes,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const authoredItems = authored.map((tweet) => ({
      ...tweet.toJSON(),
      timelineType: 'tweet',
      sortAt: tweet.createdAt,
    }));

    const retweetItems = retweetRows
      .filter((row) => row.Tweet)
      .map((row) => {
        const actor = followingById[row.userId];
        return {
          ...row.Tweet.toJSON(),
          timelineType: 'retweet',
          sortAt: row.createdAt,
          retweetedBy: actor
            ? { id: actor.id, username: actor.username, name: actor.name }
            : null,
        };
      });

    const timeline = [...authoredItems, ...retweetItems].sort(
      (a, b) => new Date(b.sortAt) - new Date(a.sortAt),
    );

    res.json(timeline);
  } catch (error) {
    console.error('Get following feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET timeline do perfil (tweets + retweets)
const getUserTimeline = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      where: { username },
      attributes: ['id', 'username', 'name'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const authored = await Tweet.findAll({
      where: { userId: user.id },
      include: tweetTimelineIncludes,
    });

    const retweetRows = await Retweet.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Tweet,
          include: tweetTimelineIncludes,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const authoredItems = authored.map((tweet) => ({
      ...tweet.toJSON(),
      timelineType: 'tweet',
      sortAt: tweet.createdAt,
    }));

    const retweetItems = retweetRows
      .filter((row) => row.Tweet)
      .map((row) => ({
        ...row.Tweet.toJSON(),
        timelineType: 'retweet',
        sortAt: row.createdAt,
        retweetedBy: {
          id: user.id,
          username: user.username,
          name: user.name,
        },
      }));

    const timeline = [...authoredItems, ...retweetItems].sort(
      (a, b) => new Date(b.sortAt) - new Date(a.sortAt),
    );

    res.json(timeline);
  } catch (error) {
    console.error('Get user timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET utilizador por username
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: Profile,
        },
        {
          model: User,
          as: 'following',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'followers',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET utilizador por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Profile,
        },
        {
          model: User,
          as: 'following',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'followers',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST criar utilizador (Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, username, password, role } = req.body;

    if (!name || !email || !username) {
      return res.status(400).json({ 
        error: 'Name, email and username are required' 
      });
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email or username already registered',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Password is required (min. 6 characters)',
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      role: role || 'user',
    });

    await Profile.create({ userId: user.id });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT atualizar utilizador
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, avatar, role, bio, pronouns, banner, coverImage } = req.body;
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    // Só o próprio utilizador pode editar seu perfil (ou admin)
    if (id != currentUserId && currentUserRole !== 'admin') {
      return res.status(403).json({ 
        error: 'You can only update your own profile or be an admin' 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const rejectBase64 = (value, field) => {
      if (typeof value === 'string' && value.startsWith('data:')) {
        const err = new Error(
          `O campo ${field} deve ser enviado como ficheiro (upload), nao como imagem embutida.`,
        );
        err.status = 400;
        throw err;
      }
    };

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (avatar !== undefined) {
      rejectBase64(avatar, 'avatar');
      user.avatar = avatar;
    }
    if (role !== undefined && currentUserRole === 'admin') user.role = role;

    await user.save();

    let profile = await Profile.findOne({ where: { userId: id } });
    if (!profile) {
      profile = await Profile.create({ userId: id });
    }

    if (bio !== undefined) profile.bio = bio;
    if (pronouns !== undefined) profile.pronouns = pronouns;

    const bannerUrl = banner !== undefined ? banner : coverImage;
    if (bannerUrl !== undefined) {
      rejectBase64(bannerUrl, 'banner');
      profile.coverImage = bannerUrl;
    }

    await profile.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    const status = error.status || 500;
    const message =
      error.status === 400
        ? error.message
        : error.name === 'SequelizeDatabaseError'
          ? 'Dados invalidos para a base de dados. Use ficheiro de imagem ou URL mais curta.'
          : 'Internal server error';
    res.status(status).json({ error: message });
  }
};

// DELETE eliminar utilizador
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    if (id != currentUserId && currentUserRole !== 'admin') {
      return res.status(403).json({ 
        error: 'You can only delete your own account or be an admin' 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    await user.destroy();

    res.json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllUsers,
  getFollowingFeed,
  getUserTimeline,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
