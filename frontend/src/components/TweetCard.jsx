import { Heart, MessageCircle, Repeat2, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDismissablePopover } from '../hooks/useDismissablePopover.js';
import { compactNumber, formatRelativeTime, plural } from '../utils/format.js';

export default function TweetCard({
  tweet,
  currentUser,
  onLike,
  onDelete,
  onRepost,
  onAddComment,
  onDeleteComment,
  onCommentLike,
  compact = false,
  isProfileOwner = false,
}) {
  const commentsModal = useDismissablePopover(false);
  const [visibleComments, setVisibleComments] = useState(() => tweet.comments || []);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const liked = currentUser
    ? (tweet.likedBy || []).map(String).includes(String(currentUser.id))
    : false;
  const reposted = currentUser
    ? (tweet.repostedBy || []).map(String).includes(String(currentUser.id))
    : false;
  const canDelete = currentUser?.role === 'admin' || currentUser?.id === tweet.authorId;
  const remainingCharacters = 280 - commentText.length;
  const counterClass = remainingCharacters <= 20 ? 'danger' : remainingCharacters <= 40 ? 'warning' : '';

  useEffect(() => {
    setVisibleComments(tweet.comments || []);
  }, [tweet.comments]);

  const handleAddComment = (e) => {
    e.preventDefault();
    try {
      setStatus('');
      const updatedTweet = onAddComment(tweet.id, {
        body: commentText,
        authorId: currentUser.id,
      });
      if (updatedTweet?.comments) {
        setVisibleComments(updatedTweet.comments);
      }
      setCommentText('');
      setError('');
      setStatus('Resposta publicada.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCommentLike = (commentId) => {
    const updatedTweet = onCommentLike(tweet.id, commentId);
    if (updatedTweet?.comments) {
      setVisibleComments(updatedTweet.comments);
    }
  };

  const handleDeleteComment = (commentId) => {
    const updatedTweet = onDeleteComment(tweet.id, commentId);
    if (updatedTweet?.comments) {
      setVisibleComments(updatedTweet.comments);
    }
  };

  const retweetLabel = tweet.isRetweet
    ? isProfileOwner
      ? 'Repostaste'
      : tweet.retweetedBy?.username
        ? `@${tweet.retweetedBy.username} repostou`
        : 'Repostou'
    : null;

  return (
    <div className="tweet-card-popover-host">
      <article className={compact ? 'tweet-card compact' : 'tweet-card'}>
        {retweetLabel && (
          <p className="retweet-label">
            <Repeat2 size={14} />
            {retweetLabel}
          </p>
        )}
        <Link className="avatar-link" to={`/perfil/${tweet.author.username}`}>
          <img src={tweet.author.avatar} alt={tweet.author.name} />
        </Link>
        <div className="tweet-body">
          <div className="tweet-meta">
            <Link to={`/perfil/${tweet.author.username}`} className="tweet-name">
              {tweet.author.name}
            </Link>
            <span>@{tweet.author.username}</span>
            <span>{formatRelativeTime(tweet.createdAt)}</span>
          </div>
          <p>{tweet.body}</p>
          {tweet.image && <img className="tweet-image" src={tweet.image} alt="Imagem publicada" />}
          <div className="tweet-actions">
            <button
              ref={commentsModal.triggerRef}
              className={commentsModal.isOpen ? 'action-button active' : 'action-button'}
              onClick={commentsModal.open}
              disabled={!currentUser}
              type="button"
              title="Responder"
            >
              <MessageCircle size={17} />
              {compactNumber(tweet.comments?.length || 0)}
            </button>
            <button
              className={reposted ? 'action-button active' : 'action-button'}
              onClick={() => onRepost(tweet.id)}
              disabled={!currentUser}
              type="button"
              title="Repostar"
            >
              <Repeat2 size={17} fill={reposted ? 'currentColor' : 'none'} />
              {compactNumber(tweet.repostedBy?.length || 0)}
            </button>
            <button
              className={liked ? 'like-button active' : 'like-button'}
              onClick={() => onLike(tweet.id)}
              disabled={!currentUser}
              type="button"
              title="Gostar"
            >
              <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
              {compactNumber(tweet.likedBy.length)}
            </button>
            {canDelete && (
              <button className="icon-button danger" onClick={() => onDelete(tweet.id)} type="button" title="Apagar">
                <Trash2 size={17} />
              </button>
            )}
          </div>
        </div>
      </article>

      {commentsModal.isOpen && currentUser && (
        <div className="comment-reply-overlay">
          <section
            ref={commentsModal.popoverRef}
            className="comment-reply-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`reply-title-${tweet.id}`}
          >
            <header className="comment-reply-header">
              <button
                className="comment-reply-close"
                type="button"
                onClick={commentsModal.close}
                aria-label="Fechar resposta"
              >
                <X size={21} />
              </button>
              <h2 id={`reply-title-${tweet.id}`}>Responder</h2>
            </header>

            <div className="reply-thread">
              <Link className="reply-avatar original" to={`/perfil/${tweet.author.username}`}>
                <img src={tweet.author.avatar} alt={tweet.author.name} />
              </Link>
              <div className="reply-original">
                <div className="tweet-meta">
                  <Link to={`/perfil/${tweet.author.username}`} className="tweet-name">
                    {tweet.author.name}
                  </Link>
                  <span>@{tweet.author.username}</span>
                  <span>{formatRelativeTime(tweet.createdAt)}</span>
                </div>
                <p>{tweet.body}</p>
                <span className="replying-to">
                  A responder a <strong>@{tweet.author.username}</strong>
                </span>
              </div>

              <div className="reply-line" aria-hidden="true" />

              <img className="reply-avatar current" src={currentUser.avatar} alt={currentUser.name} />
              <form className="reply-composer" onSubmit={handleAddComment}>
                <textarea
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    setStatus('');
                    setError('');
                  }}
                  placeholder="Publica a tua resposta"
                  maxLength={280}
                  rows={4}
                  autoFocus
                />
                {error && <p className="form-error">{error}</p>}
                {status && <p className="reply-status">{status}</p>}
                <div className="reply-composer-footer">
                  <span className={counterClass}>{remainingCharacters}</span>
                  <button className="primary-button" type="submit" disabled={!commentText.trim()}>
                    Responder
                  </button>
                </div>
              </form>
            </div>

            <section className="reply-comments-section" aria-label="Respostas">
              <div className="reply-comments-heading">
                <h3>Respostas</h3>
                <span>{plural(visibleComments.length, 'comentario', 'comentarios')}</span>
              </div>
              {visibleComments.length ? (
                <div className="reply-comments-list">
                  {visibleComments.map((comment) => {
                    const commentAuthor = comment.author || {
                      name: 'Utilizador',
                      username: 'user',
                      avatar: '',
                    };
                    const commentLiked = currentUser ? comment.likedBy?.includes(currentUser.id) : false;
                    const canDeleteComment =
                      currentUser?.role === 'admin' || currentUser?.id === comment.authorId;
                    const likes = comment.likedBy?.length || 0;

                    return (
                      <article className="reply-comment" key={comment.id}>
                        <Link className="reply-comment-avatar" to={`/perfil/${commentAuthor.username}`}>
                          <img src={commentAuthor.avatar} alt={commentAuthor.name} />
                        </Link>
                        <div className="reply-comment-body">
                          <div className="tweet-meta">
                            <Link className="tweet-name" to={`/perfil/${commentAuthor.username}`}>
                              {commentAuthor.name}
                            </Link>
                            <span>@{commentAuthor.username}</span>
                            <span>{formatRelativeTime(comment.createdAt)}</span>
                            {comment.authorId === tweet.authorId && <span className="author-badge">Autor</span>}
                          </div>
                          <p>{comment.body}</p>
                          <div className="reply-comment-actions">
                            <button
                              className={commentLiked ? 'reply-comment-like active' : 'reply-comment-like'}
                              type="button"
                              onClick={() => handleCommentLike(comment.id)}
                              disabled={!currentUser}
                            >
                              <Heart size={16} fill={commentLiked ? 'currentColor' : 'none'} />
                              {compactNumber(likes)}
                            </button>
                            {canDeleteComment && (
                              <button
                                className="reply-comment-delete"
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 size={15} />
                                Apagar
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="reply-comments-empty">Ainda nao ha respostas. Seja o primeiro a comentar.</p>
              )}
            </section>
          </section>
        </div>
      )}
    </div>
  );
}
