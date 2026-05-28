import { currentSchemaVersion, seedTweets, seedUsers } from '../data/seed.js';

const storageKey = 'vg-twitter-clone-state';
const defaultBanner =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialState() {
  return {
    schemaVersion: currentSchemaVersion,
    sessionUserId: null,
    users: seedUsers,
    tweets: seedTweets,
  };
}

function readState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    const fresh = initialState();
    writeState(fresh);
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== currentSchemaVersion) {
      const migrated = migrateState(parsed);
      writeState(migrated);
      return migrated;
    }
    return parsed;
  } catch {
    const fresh = initialState();
    writeState(fresh);
    return fresh;
  }
}

function writeState(state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function migrateState(state) {
  const seed = initialState();
  const users = Array.isArray(state.users) && state.users.length ? state.users : seed.users;
  const tweets = Array.isArray(state.tweets) ? state.tweets : seed.tweets;

  return {
    schemaVersion: currentSchemaVersion,
    sessionUserId: null,
    users: users.map((user) => ({
      ...user,
      banner: user.banner || defaultBanner,
      pronouns: user.pronouns || '',
      following: Array.isArray(user.following) ? user.following : [],
    })),
    tweets: tweets.map((tweet) => ({
      ...tweet,
      repostedBy: Array.isArray(tweet.repostedBy) ? tweet.repostedBy : [],
      comments: Array.isArray(tweet.comments) ? tweet.comments : [],
    })),
  };
}

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function hydrateTweet(tweet, users) {
  return {
    ...tweet,
    author: publicUser(users.find((user) => user.id === tweet.authorId)),
    comments: (tweet.comments || []).map((comment) => ({
      ...comment,
      author: publicUser(users.find((user) => user.id === comment.authorId) || { 
        id: comment.authorId, 
        name: 'Utilizador', 
        username: 'user', 
        avatar: '',
        email: '',
        role: 'user',
        bio: '',
        pronouns: '',
        banner: '',
        following: [],
        createdAt: new Date().toISOString(),
        password: '',
      }),
    })),
  };
}

function sortedTweets(tweets) {
  return [...tweets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export const api = {
  getSession() {
    const state = readState();
    const user = state.users.find((item) => item.id === state.sessionUserId);
    return user ? publicUser(user) : null;
  },

  login(username, password) {
    const state = readState();
    const user = state.users.find(
      (item) =>
        (item.username.toLowerCase() === username.toLowerCase() ||
          item.email.toLowerCase() === username.toLowerCase()) &&
        item.password === password,
    );

    if (!user) {
      throw new Error('Credenciais invalidas. Experimente admin / admin123.');
    }

    state.sessionUserId = user.id;
    writeState(state);
    return publicUser(user);
  },

  register(payload) {
    const state = readState();
    const exists = state.users.some(
      (user) =>
        user.username.toLowerCase() === payload.username.toLowerCase() ||
        user.email.toLowerCase() === payload.email.toLowerCase(),
    );

    if (exists) {
      throw new Error('Ja existe uma conta com esse utilizador ou e-mail.');
    }

    const user = {
      id: crypto.randomUUID(),
      username: payload.username,
      name: payload.name || payload.username,
      email: payload.email,
      password: payload.password,
      role: 'user',
      bio: 'Novo membro da comunidade VG.',
      pronouns: '',
      avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(payload.username)}`,
      banner: defaultBanner,
      following: ['u-admin'],
      createdAt: new Date().toISOString(),
    };

    state.users.push(user);
    state.sessionUserId = user.id;
    writeState(state);
    return publicUser(user);
  },

  logout() {
    const state = readState();
    state.sessionUserId = null;
    writeState(state);
  },

  getUsers() {
    return readState().users.map(publicUser);
  },

  getUser(username) {
    const user = readState().users.find((item) => item.username === username);
    return user ? publicUser(user) : null;
  },

  updateUser(userId, patch) {
    const state = readState();
    const index = state.users.findIndex((user) => user.id === userId);
    if (index < 0) throw new Error('Utilizador nao encontrado.');
    state.users[index] = { ...state.users[index], ...patch };
    writeState(state);
    return publicUser(state.users[index]);
  },

  deleteUser(userId) {
    const state = readState();
    state.users = state.users.filter((user) => user.id !== userId);
    state.tweets = state.tweets.filter((tweet) => tweet.authorId !== userId);
    state.users = state.users.map((user) => ({
      ...user,
      following: user.following.filter((id) => id !== userId),
    }));
    if (state.sessionUserId === userId) state.sessionUserId = null;
    writeState(state);
  },

  toggleFollow(userId, targetId) {
    const state = readState();
    const user = state.users.find((item) => item.id === userId);
    if (!user || userId === targetId) return null;
    user.following = user.following.includes(targetId)
      ? user.following.filter((id) => id !== targetId)
      : [...user.following, targetId];
    writeState(state);
    return publicUser(user);
  },

  getTweets({ feedForUserId } = {}) {
    const state = readState();
    const viewer = state.users.find((user) => user.id === feedForUserId);
    const allowedAuthors = viewer ? [viewer.id, ...viewer.following] : null;
    const tweets = allowedAuthors
      ? state.tweets.filter((tweet) => allowedAuthors.includes(tweet.authorId))
      : state.tweets;
    return sortedTweets(tweets).map((tweet) => hydrateTweet(tweet, state.users));
  },

  getUserTweets(username) {
    const state = readState();
    const user = state.users.find((item) => item.username === username);
    if (!user) return [];
    return sortedTweets(state.tweets.filter((tweet) => tweet.authorId === user.id)).map((tweet) =>
      hydrateTweet(tweet, state.users),
    );
  },

  createTweet(payload) {
    if (!payload.body.trim()) throw new Error('O tweet nao pode estar vazio.');
    if (payload.body.length > 280) throw new Error('O limite e de 280 caracteres.');
    const state = readState();
    const tweet = {
      id: crypto.randomUUID(),
      authorId: payload.authorId,
      body: payload.body.trim(),
      image: payload.image || '',
      likedBy: [],
      repostedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    state.tweets.push(tweet);
    writeState(state);
    return hydrateTweet(tweet, state.users);
  },

  updateTweet(tweetId, patch) {
    const state = readState();
    const index = state.tweets.findIndex((tweet) => tweet.id === tweetId);
    if (index < 0) throw new Error('Tweet nao encontrado.');
    state.tweets[index] = { ...state.tweets[index], ...patch };
    writeState(state);
    return hydrateTweet(state.tweets[index], state.users);
  },

  deleteTweet(tweetId) {
    const state = readState();
    state.tweets = state.tweets.filter((tweet) => tweet.id !== tweetId);
    writeState(state);
  },

  toggleLike(tweetId, userId) {
    const state = readState();
    const tweet = state.tweets.find((item) => item.id === tweetId);
    if (!tweet) throw new Error('Tweet nao encontrado.');
    tweet.likedBy = tweet.likedBy.includes(userId)
      ? tweet.likedBy.filter((id) => id !== userId)
      : [...tweet.likedBy, userId];
    writeState(state);
    return hydrateTweet(tweet, state.users);
  },

  toggleRepost(tweetId, userId) {
    const state = readState();
    const tweet = state.tweets.find((item) => item.id === tweetId);
    if (!tweet) throw new Error('Tweet nao encontrado.');
    tweet.repostedBy = tweet.repostedBy?.includes(userId)
      ? tweet.repostedBy.filter((id) => id !== userId)
      : [...(tweet.repostedBy || []), userId];
    writeState(state);
    return hydrateTweet(tweet, state.users);
  },

  addComment(tweetId, { authorId, body }) {
    if (!body.trim()) throw new Error('O comentario nao pode estar vazio.');
    if (body.length > 280) throw new Error('O limite e de 280 caracteres.');
    const state = readState();
    const tweet = state.tweets.find((item) => item.id === tweetId);
    if (!tweet) throw new Error('Tweet nao encontrado.');
    
    if (!tweet.comments) tweet.comments = [];
    
    const comment = {
      id: crypto.randomUUID(),
      authorId,
      body: body.trim(),
      createdAt: new Date().toISOString(),
      likedBy: [],
    };
    tweet.comments.push(comment);
    writeState(state);
    return hydrateTweet(tweet, state.users);
  },

  deleteComment(tweetId, commentId) {
    const state = readState();
    const tweet = state.tweets.find((item) => item.id === tweetId);
    if (!tweet) throw new Error('Tweet nao encontrado.');
    if (!tweet.comments) tweet.comments = [];
    tweet.comments = tweet.comments.filter((comment) => comment.id !== commentId);
    writeState(state);
    return hydrateTweet(tweet, state.users);
  },

  toggleCommentLike(tweetId, commentId, userId) {
    const state = readState();
    const tweet = state.tweets.find((item) => item.id === tweetId);
    if (!tweet) throw new Error('Tweet nao encontrado.');
    if (!tweet.comments) tweet.comments = [];
    const comment = tweet.comments.find((item) => item.id === commentId);
    if (!comment) throw new Error('Comentario nao encontrado.');
    comment.likedBy = comment.likedBy?.includes(userId)
      ? comment.likedBy.filter((id) => id !== userId)
      : [...(comment.likedBy || []), userId];
    writeState(state);
    return hydrateTweet(tweet, state.users);
  },

  resetDemo() {
    const fresh = initialState();
    writeState(fresh);
    return clone(fresh);
  },
};
