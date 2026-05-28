import { RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TweetCard from '../components/TweetCard.jsx';
import TweetComposer from '../components/TweetComposer.jsx';
import UserCard from '../components/UserCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import {
  toggleLikeInList,
  toggleRepostInList,
  tweetListKey,
} from '../utils/tweetList.js';

export default function Feed() {
  const { currentUser, refreshUser } = useAuth();
  const location = useLocation();
  const [tweets, setTweets] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedTab, setFeedTab] = useState('for-you');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');

  const loadTweets = useCallback(async () => {
    if (feedTab === 'following') {
      return api.getFollowingFeed();
    }
    return api.getTweets();
  }, [feedTab]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedTweets, fetchedUsers] = await Promise.all([
        loadTweets(),
        api.getUsers(),
      ]);
      setTweets(fetchedTweets);
      setUsers(fetchedUsers);
      setError('');
    } catch (err) {
      console.error(err);
      setError(
        feedTab === 'following'
          ? 'Erro ao carregar o feed "A seguir".'
          : 'Erro ao carregar dados do servidor.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [feedTab, loadTweets]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (location.state?.feedTab === 'following' || location.state?.feedTab === 'for-you') {
      setFeedTab(location.state.feedTab);
    }
  }, [location.state?.feedTab]);

  useEffect(() => {
    if (location.state?.refreshFeed) {
      loadData();
    }
    if (location.state?.adminDenied) {
      setAdminNotice(
        location.state.message ||
          'Acesso reservado a administradores. Usa admin / admin123 e volta a entrar.',
      );
    }
  }, [location.state?.refreshFeed, location.state?.adminDenied, location.state?.message, loadData]);

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener('pulse:feed-refresh', onRefresh);
    return () => window.removeEventListener('pulse:feed-refresh', onRefresh);
  }, [loadData]);

  const suggestions = useMemo(
    () =>
      users
        .filter(
          (user) =>
            user.id !== currentUser?.id &&
            !(currentUser?.following || []).includes(user.id),
        )
        .slice(0, 3),
    [currentUser, users],
  );

  const reload = async () => {
    try {
      await refreshUser();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const createTweet = async (payload) => {
    try {
      const created = await api.createTweet(payload);
      setError('');
      setTweets((current) => [created, ...current]);
    } catch (caught) {
      setError(caught.response?.data?.error || caught.message);
    }
  };

  const toggleLike = async (tweetId) => {
    const previous = tweets;
    setTweets((current) => toggleLikeInList(current, tweetId, currentUser.id));
    try {
      await api.toggleLike(tweetId, currentUser.id);
    } catch (err) {
      console.error(err);
      setTweets(previous);
    }
  };

  const toggleRepost = async (tweetId) => {
    const previous = tweets;
    setTweets((current) => toggleRepostInList(current, tweetId, currentUser.id));
    try {
      await api.toggleRepost(tweetId);
    } catch (err) {
      console.error(err);
      setTweets(previous);
    }
  };

  const deleteTweet = async (tweetId) => {
    try {
      await api.deleteTweet(tweetId);
      setTweets((current) => current.filter((tweet) => tweet.id !== tweetId));
    } catch (err) {
      console.error(err);
    }
  };

  const patchTweetInList = (updatedTweet) => {
    if (!updatedTweet) return;
    setTweets((current) =>
      current.map((tweet) => (tweet.id === updatedTweet.id ? updatedTweet : tweet)),
    );
  };

  const addComment = async (tweetId, commentPayload) => {
    try {
      const updatedTweet = await api.addComment(tweetId, commentPayload);
      patchTweetInList(updatedTweet);
      return updatedTweet;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteComment = async (tweetId, commentId) => {
    try {
      const updatedTweet = await api.deleteComment(tweetId, commentId);
      patchTweetInList(updatedTweet);
      return updatedTweet;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const toggleCommentLike = async (tweetId, commentId) => {
    try {
      const updatedTweet = await api.toggleCommentLike(tweetId, commentId, currentUser.id);
      patchTweetInList(updatedTweet);
      return updatedTweet;
    } catch (err) {
      console.error(err);
      throw err;
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

  return (
    <>
      <main className="x-feed-column">
        <div className="section-heading inline">
          <span>
            <span className="eyebrow">Feed</span>
            <h2>{feedTab === 'following' ? 'A seguir' : 'Para si'}</h2>
          </span>
          <button className="icon-button" onClick={reload} title="Atualizar feed" type="button" disabled={isLoading}>
            <RefreshCcw size={18} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
        <div className="feed-tabs" role="tablist" aria-label="Filtro do feed">
          <button
            className={feedTab === 'for-you' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={feedTab === 'for-you'}
            onClick={() => setFeedTab('for-you')}
          >
            Para si
          </button>
          <button
            className={feedTab === 'following' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={feedTab === 'following'}
            onClick={() => setFeedTab('following')}
          >
            A seguir
          </button>
        </div>
        <TweetComposer onCreate={createTweet} />
        {adminNotice && <p className="form-error admin-notice">{adminNotice}</p>}
        {error && <p className="form-error">{error}</p>}

        {isLoading ? (
          <p className="loading-state">A carregar tweets...</p>
        ) : (
          <div className="tweet-list">
            {tweets.map((tweet) => (
              <TweetCard
                key={tweetListKey(tweet)}
                tweet={tweet}
                currentUser={currentUser}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onDelete={deleteTweet}
                onAddComment={addComment}
                onDeleteComment={deleteComment}
                onCommentLike={toggleCommentLike}
              />
            ))}
            {tweets.length === 0 && (
              <p className="empty-state">
                {feedTab === 'following'
                  ? 'Segue utilizadores para ver os tweets deles aqui.'
                  : 'Sem tweets para exibir.'}
              </p>
            )}
          </div>
        )}
      </main>

      <aside className="x-right-rail">
        <h3>Sugestoes</h3>
        {isLoading ? (
          <p className="loading-state">A carregar sugestões...</p>
        ) : suggestions.length ? (
          suggestions.map((user) => (
            <UserCard key={user.id} user={user} currentUser={currentUser} onFollow={follow} />
          ))
        ) : (
          <p className="muted">Ja segue todos os utilizadores disponiveis.</p>
        )}
      </aside>
    </>
  );
}
