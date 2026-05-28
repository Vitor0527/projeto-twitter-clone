const { Op } = require('sequelize');
const { User, Conversation, Message } = require('../models');

const userPreview = ['id', 'name', 'username', 'avatar'];

function pairIds(userIdA, userIdB) {
  const a = parseInt(userIdA, 10);
  const b = parseInt(userIdB, 10);
  return a < b ? [a, b] : [b, a];
}

async function findOrCreateConversation(userId, targetUserId) {
  const [userOneId, userTwoId] = pairIds(userId, targetUserId);

  let conversation = await Conversation.findOne({
    where: { userOneId, userTwoId },
  });

  if (!conversation) {
    conversation = await Conversation.create({ userOneId, userTwoId });
  }

  return conversation;
}

function otherParticipant(conversation, currentUserId) {
  const otherId =
    conversation.userOneId === currentUserId
      ? conversation.userTwoId
      : conversation.userOneId;
  return conversation.userOne?.id === otherId ? conversation.userOne : conversation.userTwo;
}

// GET /api/chat/conversations
const listConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ userOneId: userId }, { userTwoId: userId }],
      },
      include: [
        { model: User, as: 'userOne', attributes: userPreview },
        { model: User, as: 'userTwo', attributes: userPreview },
        {
          model: Message,
          separate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [{ model: User, as: 'sender', attributes: userPreview }],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const payload = conversations.map((conversation) => {
      const other = otherParticipant(conversation, userId);
      const lastMessage = conversation.Messages?.[0] || null;
      return {
        id: conversation.id,
        otherUser: other,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              isMine: lastMessage.senderId === userId,
            }
          : null,
        updatedAt: conversation.updatedAt,
      };
    });

    res.json(payload);
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/chat/with/:userId/messages
const getMessagesWithUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetUserId = parseInt(req.params.userId, 10);

    if (!targetUserId || targetUserId === userId) {
      return res.status(400).json({ error: 'Invalid conversation partner' });
    }

    const targetUser = await User.findByPk(targetUserId, {
      attributes: userPreview,
    });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const conversation = await findOrCreateConversation(userId, targetUserId);

    const messages = await Message.findAll({
      where: { conversationId: conversation.id },
      include: [{ model: User, as: 'sender', attributes: userPreview }],
      order: [['createdAt', 'ASC']],
    });

    res.json({
      conversationId: conversation.id,
      otherUser: targetUser,
      messages: messages.map((message) => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: message.sender,
        createdAt: message.createdAt,
        isMine: message.senderId === userId,
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/chat/with/:userId/messages
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetUserId = parseInt(req.params.userId, 10);
    const content = (req.body.content || '').trim();

    if (!targetUserId || targetUserId === userId) {
      return res.status(400).json({ error: 'Invalid conversation partner' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const conversation = await findOrCreateConversation(userId, targetUserId);

    const message = await Message.create({
      conversationId: conversation.id,
      senderId: userId,
      content,
    });

    await conversation.update({ updatedAt: new Date() });

    const withSender = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: userPreview }],
    });

    res.status(201).json({
      id: withSender.id,
      content: withSender.content,
      senderId: withSender.senderId,
      sender: withSender.sender,
      createdAt: withSender.createdAt,
      isMine: true,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  listConversations,
  getMessagesWithUser,
  sendMessage,
};
