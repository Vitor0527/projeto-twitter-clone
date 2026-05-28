const { Op } = require('sequelize');
const { User, Profile } = require('../models');
const { hashPassword, verifyPassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/tokenUtils');

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
});

const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        error: 'Name, username, email and password are required',
      });
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: 'user',
    });

    await Profile.create({ userId: user.id, bio: 'Novo membro da comunidade VG.' });
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const where = identifier.includes('@')
      ? { email: identifier }
      : { [Op.or]: [{ email: identifier }, { username: identifier }] };

    const user = await User.findOne({ where });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [
        { model: Profile },
        {
          model: User,
          as: 'following',
          attributes: ['id'],
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'followers',
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { signup, login, logout, me };
