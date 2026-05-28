import {
  CalendarDays,
  Camera,
  ImagePlus,
  LogIn,
  MessageCircle,
  Save,
  UserPlus,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TweetCard from '../components/TweetCard.jsx';
import UserCard from '../components/UserCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDismissablePopover } from '../hooks/useDismissablePopover.js';
import { api } from '../services/api.js';
import { formatDateTime, plural } from '../utils/format.js';
import {
  toggleLikeInList,
  toggleRepostInList,
  tweetListKey,
} from '../utils/tweetList.js';

export default function Profile() {
  const { username } = useParams();
  const { currentUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [users, setUsers] = useState([]);
  const [profileTab, setProfileTab] = useState('posts');
  const [activeConnections, setActiveConnections] = useState(null);
  const connectionsPopover = useDismissablePopover(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    pronouns: '',
    bio: '',
    avatar: '',
    banner: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const matchedUser = await api.getUser(username);
      if (matchedUser) {
        setProfile(matchedUser);
        const [userTweets, allUsers] = await Promise.all([
          api.getProfileTimeline(username),
          api.getUsers(),
        ]);
        setTweets(userTweets);
        setUsers(allUsers);
      } else {
        setProfile(null);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar os dados do perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const reload = async () => {
    try {
      await refreshUser();
      const matchedUser = await api.getUser(username);
      if (matchedUser) {
        setProfile(matchedUser);
        const [userTweets, allUsers] = await Promise.all([
          api.getProfileTimeline(username),
          api.getUsers(),
        ]);
        setTweets(userTweets);
        setUsers(allUsers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setActiveConnections(null);
    connectionsPopover.close();
    setIsEditing(false);
    setProfileTab('posts');
    loadData();
  }, [username]);

  useEffect(() => {
    if (!connectionsPopover.isOpen) {
      setActiveConnections(null);
    }
  }, [connectionsPopover.isOpen]);

  if (isLoading) {
    return <section className="loading-state"><p>A carregar perfil...</p></section>;
  }

  if (!profile) {
    return (
      <section className="empty-state">
        <h2>Perfil nao encontrado</h2>
        <Link className="primary-button" to="/explorar">
          Voltar a explorar
        </Link>
      </section>
    );
  }

  const isSelf = currentUser && String(currentUser.id) === String(profile.id);
  const isLoggedIn = Boolean(currentUser);
  const followingIds = (currentUser?.following || []).map(String);
  const profileFollowingIds = (profile.following || []).map(String);
  const following = followingIds.includes(String(profile.id));
  const followingUsers = users.filter((user) => profileFollowingIds.includes(String(user.id)));
  const followerUsers = users.filter((user) =>
    (user.following || []).map(String).includes(String(profile.id)),
  );
  const visibleConnections = activeConnections === 'following' ? followingUsers : followerUsers;

  const visibleTweets =
    profileTab === 'reposts'
      ? tweets.filter((tweet) => tweet.isRetweet)
      : tweets.filter((tweet) => !tweet.isRetweet);

  const tweetCount = tweets.filter((tweet) => !tweet.isRetweet).length;
  const repostCount = tweets.filter((tweet) => tweet.isRetweet).length;

  const toggleConnections = (type) => {
    if (connectionsPopover.isOpen && activeConnections === type) {
      connectionsPopover.close();
      setActiveConnections(null);
      return;
    }

    setActiveConnections(type);
    connectionsPopover.open();
  };

  const follow = async () => {
    try {
      await api.toggleFollow(currentUser.id, profile.id);
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  const beginEdit = () => {
    setEditForm({
      name: profile.name,
      pronouns: profile.pronouns || '',
      bio: profile.bio,
      avatar: profile.avatar,
      banner: profile.banner,
    });
    setIsEditing(true);
  };

  const updateEditForm = (event) => {
    setEditForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const readImageFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((current) => ({ ...current, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await api.updateUser(profile.id, {
        name: editForm.name.trim() || profile.name,
        pronouns: editForm.pronouns.trim(),
        bio: editForm.bio.trim(),
        avatar: editForm.avatar || profile.avatar,
        banner: editForm.banner || profile.banner,
        coverImage: editForm.banner || profile.banner,
      });
      setIsEditing(false);
      await reload();
    } catch (err) {
      console.error(err);
      const message =
        err.message ||
        err.response?.data?.error ||
        (err.message === 'Network Error'
          ? 'Servidor indisponivel. Confirme que o backend esta a correr na porta 3001.'
          : 'Nao foi possivel guardar o perfil.');
      setError(message);
    }
  };

  const toggleConnectionFollow = async (userId) => {
    try {
      await api.toggleFollow(currentUser.id, userId);
      await reload();
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

  const toggleLike = async (tweetId) => {
    if (!currentUser) return;
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
    if (!currentUser) return;
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
      const updatedTweet = await api.toggleCommentLike(tweetId, commentId, currentUser?.id);
      patchTweetInList(updatedTweet);
      return updatedTweet;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const viewedName = isEditing ? editForm.name || profile.name : profile.name;
  const viewedBio = isEditing ? editForm.bio || profile.bio : profile.bio;
  const viewedPronouns = isEditing ? editForm.pronouns : profile.pronouns;
  const viewedAvatar = isEditing ? editForm.avatar || profile.avatar : profile.avatar;
  const viewedBanner = isEditing ? editForm.banner || profile.banner : profile.banner;
  const bioRemaining = 190 - editForm.bio.length;

  return (
    <section className="profile-page x-page-main">
      <div
        className="profile-cover"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.14), rgba(15, 23, 42, 0.14)), url("${viewedBanner}")`,
        }}
      />
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <img src={viewedAvatar} alt={profile.name} />
        </div>
        <div>
          <h2>{viewedName}</h2>
          <p>
            @{profile.username}
            {viewedPronouns && <span className="profile-pronouns"> {viewedPronouns}</span>}
          </p>
          <p>{viewedBio}</p>
          <span className="joined">
            <CalendarDays size={16} />
            Desde {formatDateTime(profile.createdAt)}
          </span>
        </div>
        {isSelf && isEditing ? (
          <div className="profile-edit-actions">
            <button className="ghost-button" onClick={() => setIsEditing(false)} type="button">
              <X size={17} />
              Cancelar
            </button>
            <button className="primary-button" form="profile-editor" type="submit">
              <Save size={17} />
              Guardar
            </button>
          </div>
        ) : isSelf ? (
          <button className="ghost-button edit-profile-button" onClick={beginEdit} type="button">
            <Camera size={18} />
            Editar perfil
          </button>
        ) : isLoggedIn ? (
          <div className="profile-header-actions">
            <Link className="ghost-button" to={`/mensagens/${profile.id}`}>
              <MessageCircle size={18} />
              Mensagem
            </Link>
            <button className="primary-button" onClick={follow} type="button">
              {following ? <UserRoundCheck size={18} /> : <UserPlus size={18} />}
              {following ? 'A seguir' : 'Seguir'}
            </button>
          </div>
        ) : (
          <Link className="primary-button" to="/login" state={{ from: `/perfil/${username}` }}>
            <LogIn size={18} />
            Entrar para seguir
          </Link>
        )}
      </div>

      <div className="stats-row stats-popover-wrap" ref={connectionsPopover.triggerRef}>
        <span>{plural(tweetCount, 'tweet', 'tweets')}</span>
        <button
          className={activeConnections === 'following' ? 'active' : ''}
          onClick={() => toggleConnections('following')}
          type="button"
        >
          {plural(followingUsers.length, 'a seguir', 'a seguir')}
        </button>
        <button
          className={activeConnections === 'followers' ? 'active' : ''}
          onClick={() => toggleConnections('followers')}
          type="button"
        >
          {plural(followerUsers.length, 'seguidor', 'seguidores')}
        </button>
        {activeConnections && connectionsPopover.isOpen && (
          <section
            className={`connections-popover ${activeConnections}`}
            ref={connectionsPopover.popoverRef}
          >
            <div className="connections-popover-header">
              <span className="eyebrow">{activeConnections === 'following' ? 'A seguir' : 'Seguidores'}</span>
              <h3>{activeConnections === 'following' ? 'Contas que segue' : 'Quem segue este perfil'}</h3>
            </div>
            <div className="connections-popover-list">
              {visibleConnections.length ? (
                visibleConnections.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    currentUser={currentUser}
                    onFollow={toggleConnectionFollow}
                  />
                ))
              ) : (
                <p className="muted">
                  {activeConnections === 'following'
                    ? 'Este perfil ainda nao segue ninguem.'
                    : 'Este perfil ainda nao tem seguidores.'}
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="profile-tabs feed-tabs" role="tablist" aria-label="Conteudo do perfil">
        <button
          className={profileTab === 'posts' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={profileTab === 'posts'}
          onClick={() => setProfileTab('posts')}
        >
          Posts
          {tweetCount > 0 && <span className="tab-count">{tweetCount}</span>}
        </button>
        <button
          className={profileTab === 'reposts' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={profileTab === 'reposts'}
          onClick={() => setProfileTab('reposts')}
        >
          Reposts
          {repostCount > 0 && <span className="tab-count">{repostCount}</span>}
        </button>
      </div>

      <div className="tweet-list">
        {visibleTweets.map((tweet) => (
          <TweetCard
            key={tweetListKey(tweet)}
            tweet={tweet}
            currentUser={currentUser}
            isProfileOwner={isSelf}
            onLike={toggleLike}
            onRepost={toggleRepost}
            onDelete={deleteTweet}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onCommentLike={toggleCommentLike}
          />
        ))}
        {visibleTweets.length === 0 && (
          <p className="empty-state">
            {profileTab === 'reposts'
              ? 'Ainda nao ha reposts nesta conta.'
              : 'Este perfil ainda nao publicou tweets.'}
          </p>
        )}
      </div>

      {isSelf && isEditing && (
        <div className="profile-popover-backdrop" role="presentation" onMouseDown={() => setIsEditing(false)}>
          <form
            className="profile-studio"
            id="profile-editor"
            onSubmit={saveProfile}
            role="dialog"
            aria-modal="true"
            aria-label="Editar perfil"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="studio-header">
              <div>
                <span className="eyebrow">Perfil</span>
                <h2>Editar perfil</h2>
              </div>
              <div className="studio-header-actions">
                <button className="ghost-button" onClick={() => setIsEditing(false)} type="button">
                  <X size={17} />
                  Cancelar
                </button>
                <button className="primary-button" type="submit">
                  <Save size={17} />
                  Guardar
                </button>
              </div>
            </header>

            <div className="studio-body">
              <div className="studio-controls">
                <section className="studio-section">
                  <label>
                    Nome exibido
                    <input name="name" value={editForm.name} onChange={updateEditForm} maxLength={60} />
                  </label>
                </section>

                <section className="studio-section">
                  <label>
                    Pronomes
                    <input
                      name="pronouns"
                      value={editForm.pronouns}
                      onChange={updateEditForm}
                      maxLength={30}
                      placeholder="Adicione os seus pronomes"
                    />
                  </label>
                </section>

                <section className="studio-section">
                  <div className="studio-label-row">
                    <span>Bio</span>
                    <small>{bioRemaining}</small>
                  </div>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={updateEditForm}
                    maxLength={190}
                    placeholder="Escreva uma bio curta para o perfil"
                  />
                </section>

                <section className="studio-section">
                  <h3>Imagens do perfil</h3>
                  <div className="studio-actions-row">
                    <label className="primary-button">
                      <Camera size={17} />
                      Mudar avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => readImageFile(event.target.files?.[0], 'avatar')}
                      />
                    </label>
                    <label className="ghost-button">
                      <ImagePlus size={17} />
                      Mudar banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => readImageFile(event.target.files?.[0], 'banner')}
                      />
                    </label>
                  </div>
                  <div className="studio-image-fields">
                    <input
                      name="avatar"
                      value={editForm.avatar}
                      onChange={updateEditForm}
                      placeholder="URL do avatar"
                    />
                    <input
                      name="banner"
                      value={editForm.banner}
                      onChange={updateEditForm}
                      placeholder="URL do banner"
                    />
                  </div>
                </section>
              </div>

              <aside className="studio-preview" aria-label="Previa do perfil">
                <h3>Previa</h3>
                <div className="preview-card">
                  <div
                    className="preview-banner"
                    style={{
                      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.08)), url("${viewedBanner}")`,
                    }}
                  />
                  <img className="preview-avatar" src={viewedAvatar} alt="" />
                  <div className="preview-copy">
                    <strong>{viewedName}</strong>
                    <span>@{profile.username}</span>
                    {viewedPronouns && <em>{viewedPronouns}</em>}
                    <p>{viewedBio}</p>
                  </div>
                </div>
                <div className="preview-badge">
                  <img src={viewedAvatar} alt="" />
                  <strong>{viewedName}</strong>
                  {viewedPronouns && <span>{viewedPronouns}</span>}
                </div>
              </aside>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
