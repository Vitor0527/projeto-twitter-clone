const User = require('./User');
const Profile = require('./Profile');
const Tweet = require('./Tweet');
const Comment = require('./Comment');
const Follow = require('./Follow');
const Like = require('./Like');
const Retweet = require('./Retweet');
const Conversation = require('./Conversation');
const Message = require('./Message');

const associationOptions = {
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
};

// User - Profile (1:1)
User.hasOne(Profile, { foreignKey: 'userId', ...associationOptions });
Profile.belongsTo(User, { foreignKey: 'userId', ...associationOptions });

// User - Tweet (1:N)
User.hasMany(Tweet, { foreignKey: 'userId', ...associationOptions });
Tweet.belongsTo(User, { foreignKey: 'userId', as: 'author', ...associationOptions });

// User - Comment (1:N)
User.hasMany(Comment, { foreignKey: 'userId', ...associationOptions });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author', ...associationOptions });

// Tweet - Comment (1:N)
Tweet.hasMany(Comment, { foreignKey: 'tweetId', ...associationOptions });
Comment.belongsTo(Tweet, { foreignKey: 'tweetId', ...associationOptions });

// Follow (N:N via tabela intermédia)
User.belongsToMany(User, {
  through: Follow,
  as: 'following',
  foreignKey: 'followerId',
  otherKey: 'followedId',
  ...associationOptions,
});
User.belongsToMany(User, {
  through: Follow,
  as: 'followers',
  foreignKey: 'followedId',
  otherKey: 'followerId',
  ...associationOptions,
});

// Likes (N:N User-Tweet)
User.belongsToMany(Tweet, {
  through: Like,
  as: 'likedTweets',
  foreignKey: 'userId',
  otherKey: 'tweetId',
  ...associationOptions,
});
Tweet.belongsToMany(User, {
  through: Like,
  as: 'likedByUsers',
  foreignKey: 'tweetId',
  otherKey: 'userId',
  ...associationOptions,
});

// Retweets (N:N User-Tweet)
User.belongsToMany(Tweet, {
  through: Retweet,
  as: 'retweetedTweets',
  foreignKey: 'userId',
  otherKey: 'tweetId',
  ...associationOptions,
});
Tweet.belongsToMany(User, {
  through: Retweet,
  as: 'retweetedByUsers',
  foreignKey: 'tweetId',
  otherKey: 'userId',
  ...associationOptions,
});
Retweet.belongsTo(Tweet, { foreignKey: 'tweetId', ...associationOptions });
Retweet.belongsTo(User, { foreignKey: 'userId', ...associationOptions });
Tweet.hasMany(Retweet, { foreignKey: 'tweetId', ...associationOptions });

Conversation.belongsTo(User, { foreignKey: 'userOneId', as: 'userOne', ...associationOptions });
Conversation.belongsTo(User, { foreignKey: 'userTwoId', as: 'userTwo', ...associationOptions });
User.hasMany(Conversation, { foreignKey: 'userOneId', ...associationOptions });
User.hasMany(Conversation, { foreignKey: 'userTwoId', ...associationOptions });

Conversation.hasMany(Message, { foreignKey: 'conversationId', ...associationOptions });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', ...associationOptions });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender', ...associationOptions });
User.hasMany(Message, { foreignKey: 'senderId', ...associationOptions });

module.exports = {
  User,
  Profile,
  Tweet,
  Comment,
  Follow,
  Like,
  Retweet,
  Conversation,
  Message,
};
