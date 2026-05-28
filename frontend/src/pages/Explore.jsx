import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import TweetCard from '../components/TweetCard.jsx';
import UserCard from '../components/UserCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function Explore() {
  const { currentUser, refreshUser } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedTweets, fetchedUsers] = await Promise.all([
        api.getTweets(),
        api.getUsers()
      ]);
      setTweets(fetchedTweets);
      setUsers(fetchedUsers);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados do servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.name} ${user.username} ${user.bio}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, users],
  );

  const filteredTweets = useMemo(
    () => tweets.filter((tweet) => tweet.body.toLowerCase().includes(query.toLowerCase())),
    [query, tweets],
  );

  const reload = async () => {
    try {
      await refreshUser();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const follow = async (userId) => {
    try {
      await api.toggleFollow(currentUser.id, userId);
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLike = async (tweetId) => {
    try {
      await api.toggleLike(tweetId, currentUser.id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRepost = async (tweetId) => {
    try {
      await api.toggleRepost(tweetId, currentUser.id);
      await loadData();
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

  const addComment = async (tweetId, commentPayload) => {
    try {
      const updatedTweet = await api.addComment(tweetId, commentPayload);
      await loadData();
      return updatedTweet;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteComment = async (tweetId, commentId) => {
    try {
      const updatedTweet = await api.deleteComment(tweetId, commentId);
      await loadData();
      return updatedTweet;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const toggleCommentLike = async (tweetId, commentId) => {
    try {
      const updatedTweet = await api.toggleCommentLike(tweetId, commentId, currentUser.id);
      await loadData();
      return updatedTweet;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <section className="x-page-main">
      <div className="section-heading">
        <span className="eyebrow">Explorar</span>
        <h2>Descobrir pessoas e tweets</h2>
      </div>

      <label className="search-box">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar por utilizador, bio ou conteudo"
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      {isLoading ? (
        <p className="loading-state">A carregar dados...</p>
      ) : (
        <div className="explore-grid">
          <div>
            <h3>Utilizadores</h3>
            <div className="user-list">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} currentUser={currentUser} onFollow={follow} />
              ))}
              {filteredUsers.length === 0 && <p className="muted">Nenhum utilizador encontrado.</p>}
            </div>
          </div>
          <div>
            <h3>Tweets</h3>
            <div className="tweet-list">
              {filteredTweets.map((tweet) => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  currentUser={currentUser}
                  onLike={toggleLike}
                  onRepost={toggleRepost}
                  onDelete={deleteTweet}
                  onAddComment={addComment}
                  onDeleteComment={deleteComment}
                  onCommentLike={toggleCommentLike}
                  compact
                />
              ))}
              {filteredTweets.length === 0 && <p className="muted">Nenhum tweet encontrado.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
