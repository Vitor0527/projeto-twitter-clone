import axios from 'axios';
import {
  clearActiveSession as clearVgActiveSession,
  getActiveToken,
  getActiveUser,
  getActiveUsername,
  migrateLegacyStorage,
  removeAccount,
  saveAccountSession,
  switchActiveAccount,
} from './vgStorage.js';

migrateLegacyStorage();

const baseURL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL,
});

/** Caminho relativo para guardar na BD (ex: /uploads/foto.png) */
function toStoragePath(url) {
  if (!url) return '';
  if (url.startsWith('/uploads')) return url;
  const match = url.match(/\/uploads\/[^?#]+/);
  return match ? match[0] : url;
}

/** URL para mostrar no <img> (usa proxy Vite em dev) */
function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('http')) {
    const path = toStoragePath(url);
    return path.startsWith('/uploads') ? path : url;
  }
  if (url.startsWith('/uploads')) return url;
  return url;
}

// Anexar token JWT se existir
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getActiveToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Mapeadores para traduzir o modelo da base de dados para o modelo do frontend
function mapUser(dbUser) {
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    username: dbUser.username,
    name: dbUser.name,
    email: dbUser.email,
    avatar: resolveMediaUrl(
      dbUser.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(dbUser.username)}`,
    ),
    role: dbUser.role || 'user',
    bio: dbUser.Profile?.bio || '',
    banner: resolveMediaUrl(
      dbUser.Profile?.coverImage ||
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    ),
    pronouns: dbUser.Profile?.pronouns || '',
    following: Array.isArray(dbUser.following) ? dbUser.following.map((u) => u.id) : [],
    followers: Array.isArray(dbUser.followers) ? dbUser.followers.map((u) => u.id) : [],
    createdAt: dbUser.createdAt,
  };
}

function mapComment(dbComment) {
  if (!dbComment) return null;
  return {
    id: dbComment.id,
    authorId: dbComment.userId,
    author: mapUser(dbComment.author),
    body: dbComment.content,
    createdAt: dbComment.createdAt,
    likedBy: [], // Simulado no lado do cliente
  };
}

function mapTweet(dbTweet) {
  if (!dbTweet) return null;
  return {
    id: dbTweet.id,
    authorId: dbTweet.userId,
    author: mapUser(dbTweet.author),
    body: dbTweet.content,
    image: resolveMediaUrl(dbTweet.image || ''),
    likedBy: dbTweet.likedByUsers ? dbTweet.likedByUsers.map((u) => u.id) : [],
    repostedBy: dbTweet.retweetedByUsers
      ? dbTweet.retweetedByUsers.map((u) => u.id)
      : [],
    comments: (dbTweet.Comments || dbTweet.comments || []).map(mapComment),
    createdAt: dbTweet.createdAt,
    timelineType: dbTweet.timelineType || 'tweet',
    sortAt: dbTweet.sortAt || dbTweet.createdAt,
    isRetweet: dbTweet.timelineType === 'retweet',
    retweetedBy: dbTweet.retweetedBy || null,
  };
}

// Helper para converter base64 em Blob/Ficheiro para upload
function base64ToBlob(base64Data, contentType = '') {
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteArrays = [];
  const sliceSize = 1024;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

async function handleBase64Upload(apiInstance, imageString) {
  if (imageString && imageString.startsWith('data:')) {
    const mime = imageString.split(';')[0].split(':')[1];
    const blob = base64ToBlob(imageString, mime);
    const extension = mime.split('/')[1] || 'png';
    const file = new File([blob], `upload-${Date.now()}.${extension}`, { type: mime });
    return await apiInstance.uploadFile(file);
  }
  return imageString;
}

export const api = {
  // Obter sessão síncrona a partir do localStorage
  getSession() {
    return getActiveUser();
  },

  async login(username, password) {
    const response = await axiosInstance.post('/auth/login', { username, password });
    const { token } = response.data;

    const meResponse = await axiosInstance.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fullUser = mapUser(meResponse.data);
    saveAccountSession(fullUser, token);

    return fullUser;
  },

  async register(payload) {
    const response = await axiosInstance.post('/auth/signup', {
      name: payload.name,
      username: payload.username,
      email: payload.email,
      password: payload.password,
    });
    const { token } = response.data;

    const meResponse = await axiosInstance.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fullUser = mapUser(meResponse.data);
    saveAccountSession(fullUser, token);

    return fullUser;
  },

  logout({ removeStoredAccount = false } = {}) {
    const active = getActiveUsername();
    if (removeStoredAccount && active) {
      removeAccount(active);
    } else {
      clearVgActiveSession();
    }
  },

  endActiveSession() {
    clearVgActiveSession();
  },

  switchAccount(username) {
    return switchActiveAccount(username);
  },

  async getMe() {
    const response = await axiosInstance.get('/auth/me');
    const fullUser = mapUser(response.data);
    const token = getActiveToken();
    if (token) {
      saveAccountSession(fullUser, token);
    }
    return fullUser;
  },

  async getUsers() {
    const response = await axiosInstance.get('/users');
    return response.data.map(mapUser);
  },

  async getUser(username) {
    const response = await axiosInstance.get(`/users/username/${username}`);
    return mapUser(response.data);
  },

  async updateUser(userId, patch) {
    const updatedPatch = { ...patch };

    try {
      if (updatedPatch.avatar?.startsWith('data:')) {
        updatedPatch.avatar = toStoragePath(await handleBase64Upload(this, updatedPatch.avatar));
      } else if (updatedPatch.avatar) {
        updatedPatch.avatar = toStoragePath(updatedPatch.avatar);
      }

      const bannerValue = updatedPatch.banner ?? updatedPatch.coverImage;
      if (bannerValue?.startsWith('data:')) {
        const uploaded = toStoragePath(await handleBase64Upload(this, bannerValue));
        updatedPatch.banner = uploaded;
        updatedPatch.coverImage = uploaded;
      } else if (bannerValue) {
        const stored = toStoragePath(bannerValue);
        updatedPatch.banner = stored;
        updatedPatch.coverImage = stored;
      }
    } catch (uploadErr) {
      const msg =
        uploadErr.response?.data?.error ||
        'Falha ao enviar a imagem. Use JPG, PNG, GIF ou WebP (max. 5MB).';
      throw new Error(msg);
    }

    const response = await axiosInstance.put(`/users/${userId}`, updatedPatch);
    
    // Recarregar dados próprios se for o utilizador ativo
    const session = this.getSession();
    if (session && session.id === userId) {
      await this.getMe();
    }
    
    return response.data;
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return toStoragePath(response.data.file.path);
  },

  async deleteUser(userId) {
    await axiosInstance.delete(`/users/${userId}`);
    const session = this.getSession();
    if (session && session.id === userId) {
      this.logout();
    }
  },

  async toggleFollow(userId, targetId) {
    const response = await axiosInstance.post(`/users/${targetId}/follow`);
    // Recarregar os dados do utilizador logado para atualizar lista de following
    await this.getMe();
    return response.data;
  },

  async getTweets() {
    const response = await axiosInstance.get('/tweets');
    return response.data.map(mapTweet);
  },

  async getFollowingFeed() {
    const response = await axiosInstance.get('/users/feed/following');
    return response.data.map(mapTweet);
  },

  async getUserTweets(username) {
    const response = await axiosInstance.get(`/tweets?username=${username}`);
    return response.data.map(mapTweet);
  },

  async getProfileTimeline(username) {
    const response = await axiosInstance.get(`/users/username/${username}/timeline`);
    return response.data.map(mapTweet);
  },

  async createTweet(payload) {
    if (payload.image?.startsWith('data:')) {
      const formData = new FormData();
      formData.append('content', payload.body);
      const mime = payload.image.split(';')[0].split(':')[1];
      const blob = base64ToBlob(payload.image, mime);
      const extension = mime.split('/')[1] || 'png';
      formData.append(
        'image',
        new File([blob], `tweet-${Date.now()}.${extension}`, { type: mime }),
      );
      const response = await axiosInstance.post('/tweets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return mapTweet(response.data.tweet);
    }

    const response = await axiosInstance.post('/tweets', {
      content: payload.body,
      image: payload.image || null,
    });
    return mapTweet(response.data.tweet);
  },

  async updateTweet(tweetId, patch) {
    let imageUrl = patch.image || '';
    if (imageUrl && imageUrl.startsWith('data:')) {
      imageUrl = await handleBase64Upload(this, imageUrl);
    }

    const response = await axiosInstance.put(`/tweets/${tweetId}`, {
      content: patch.body,
      image: imageUrl,
    });
    return mapTweet(response.data.tweet);
  },

  async deleteTweet(tweetId) {
    await axiosInstance.delete(`/tweets/${tweetId}`);
  },

  async toggleLike(tweetId, userId) {
    const response = await axiosInstance.post(`/tweets/${tweetId}/like`);
    return response.data;
  },

  async toggleRepost(tweetId) {
    const response = await axiosInstance.post(`/tweets/${tweetId}/retweet`);
    return response.data;
  },

  async addComment(tweetId, { body }) {
    const response = await axiosInstance.post('/comments', {
      content: body,
      tweetId,
    });
    
    // Obter o tweet atualizado com comentários
    const tweetResponse = await axiosInstance.get(`/tweets/${tweetId}`);
    return mapTweet(tweetResponse.data);
  },

  async deleteComment(tweetId, commentId) {
    await axiosInstance.delete(`/comments/${commentId}`);
    
    // Obter o tweet atualizado
    const tweetResponse = await axiosInstance.get(`/tweets/${tweetId}`);
    return mapTweet(tweetResponse.data);
  },

  async toggleCommentLike(tweetId, commentId, userId) {
    // Simulado
    return Promise.resolve(true);
  },

  async getChatConversations() {
    const response = await axiosInstance.get('/chat/conversations');
    return response.data.map((item) => ({
      id: item.id,
      otherUser: mapUser(item.otherUser),
      lastMessage: item.lastMessage,
      updatedAt: item.updatedAt,
    }));
  },

  async getChatMessages(userId) {
    const response = await axiosInstance.get(`/chat/with/${userId}/messages`);
    return {
      conversationId: response.data.conversationId,
      otherUser: mapUser(response.data.otherUser),
      messages: response.data.messages,
    };
  },

  async sendChatMessage(userId, content) {
    const response = await axiosInstance.post(`/chat/with/${userId}/messages`, { content });
    return response.data;
  },
};
