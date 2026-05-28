import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatRelativeTime } from '../utils/format.js';

export default function Admin() {
  const { currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [editingUsers, setEditingUsers] = useState({});
  const [editingTweets, setEditingTweets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedTweets, fetchedUsers] = await Promise.all([
        api.getTweets(),
        api.getUsers(),
      ]);
      setTweets(fetchedTweets);
      setUsers(fetchedUsers);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erro ao obter utilizadores e tweets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reload = async () => {
    try {
      await refreshUser();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateUserDraft = (userId, field, value) => {
    setEditingUsers((current) => ({
      ...current,
      [userId]: { ...(current[userId] || users.find((user) => user.id === userId)), [field]: value },
    }));
  };

  const saveUser = async (userId) => {
    try {
      await api.updateUser(userId, editingUsers[userId]);
      setEditingUsers((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
      await reload();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    }
  };

  const removeUser = async (userId) => {
    if (userId === currentUser.id) return;
    try {
      await api.deleteUser(userId);
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  const updateTweetDraft = (tweetId, body) => {
    setEditingTweets((current) => ({ ...current, [tweetId]: body }));
  };

  const saveTweet = async (tweetId) => {
    try {
      await api.updateTweet(tweetId, { body: editingTweets[tweetId] });
      setEditingTweets((current) => {
        const next = { ...current };
        delete next[tweetId];
        return next;
      });
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTweet = async (tweetId) => {
    try {
      await api.deleteTweet(tweetId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">Backoffice</span>
          <h1>Gestao</h1>
        </div>
        <p className="muted">Utilizadores e publicacoes da plataforma.</p>
      </header>

      {error && <p className="form-error">{error}</p>}

      {isLoading ? (
        <p className="loading-state">A carregar...</p>
      ) : (
        <div className="admin-grid">
          <section className="admin-panel">
            <div className="admin-panel-title">
              <h2>Utilizadores</h2>
              <span className="admin-count">{users.length}</span>
            </div>

            <div className="admin-users-table" role="table">
              <div className="admin-users-head" role="row">
                <span role="columnheader">Conta</span>
                <span role="columnheader">Nome</span>
                <span role="columnheader">Email</span>
                <span role="columnheader">Papel</span>
                <span role="columnheader" className="sr-only">
                  Acoes
                </span>
              </div>

              {users.map((user) => {
                const draft = editingUsers[user.id] || user;
                const dirty = Boolean(editingUsers[user.id]);
                return (
                  <article className="admin-user-row" key={user.id} role="row">
                    <div className="admin-user-identity" role="cell">
                      <img src={user.avatar} alt="" />
                      <span>@{user.username}</span>
                    </div>
                    <label className="admin-field" role="cell">
                      <span className="sr-only">Nome</span>
                      <input
                        value={draft.name}
                        onChange={(event) => updateUserDraft(user.id, 'name', event.target.value)}
                        placeholder="Nome"
                      />
                    </label>
                    <label className="admin-field" role="cell">
                      <span className="sr-only">Email</span>
                      <input
                        type="email"
                        value={draft.email}
                        onChange={(event) => updateUserDraft(user.id, 'email', event.target.value)}
                        placeholder="Email"
                      />
                    </label>
                    <label className="admin-field admin-field--role" role="cell">
                      <span className="sr-only">Papel</span>
                      <select
                        value={draft.role}
                        onChange={(event) => updateUserDraft(user.id, 'role', event.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </label>
                    <div className="admin-row-actions" role="cell">
                      <button
                        className="admin-icon-btn"
                        onClick={() => saveUser(user.id)}
                        disabled={!dirty}
                        title="Guardar"
                        type="button"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        className="admin-icon-btn danger"
                        onClick={() => removeUser(user.id)}
                        disabled={user.id === currentUser.id}
                        title="Eliminar"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-title">
              <h2>Tweets</h2>
              <span className="admin-count">{tweets.length}</span>
            </div>

            <div className="admin-tweets-list">
              {tweets.map((tweet) => (
                <article className="admin-tweet-row" key={tweet.id}>
                  <div className="admin-tweet-top">
                    <img src={tweet.author.avatar} alt="" />
                    <div className="admin-tweet-meta">
                      <strong>{tweet.author.name}</strong>
                      <span>@{tweet.author.username}</span>
                      <span>{formatRelativeTime(tweet.createdAt)}</span>
                    </div>
                    <button
                      className="admin-icon-btn danger"
                      onClick={() => deleteTweet(tweet.id)}
                      title="Eliminar tweet"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {tweet.body && <p className="admin-tweet-body">{tweet.body}</p>}
                  {tweet.image && (
                    <img className="admin-tweet-thumb" src={tweet.image} alt="" />
                  )}
                  <div className="admin-tweet-edit">
                    <textarea
                      rows={2}
                      value={editingTweets[tweet.id] ?? tweet.body}
                      maxLength={280}
                      onChange={(event) => updateTweetDraft(tweet.id, event.target.value)}
                      placeholder="Editar texto do tweet"
                    />
                    <button
                      className="admin-icon-btn"
                      onClick={() => saveTweet(tweet.id)}
                      title="Guardar tweet"
                      type="button"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                </article>
              ))}
              {tweets.length === 0 && <p className="muted admin-empty">Sem tweets.</p>}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
