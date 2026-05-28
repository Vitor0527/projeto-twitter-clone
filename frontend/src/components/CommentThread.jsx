import { Heart, Trash2, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime, plural } from '../utils/format.js';

export default function CommentThread({
  tweet,
  currentUser,
  onAddComment,
  onDeleteComment,
  onCommentLike,
  onClose,
}) {
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      onAddComment(tweet.id, {
        body: commentText,
        authorId: currentUser.id,
      });
      setCommentText('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="comment-thread-overlay" onClick={onClose}>
      <div className="comment-thread-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} type="button">
          <X size={20} />
        </button>

        <article className="tweet-card">
          <Link className="avatar-link" to={`/perfil/${tweet.author.username}`}>
            <img src={tweet.author.avatar} alt={tweet.author.name} />
          </Link>
          <div className="tweet-body">
            <div className="tweet-meta">
              <Link to={`/perfil/${tweet.author.username}`} className="tweet-name">
                {tweet.author.name}
              </Link>
              <span>@{tweet.author.username}</span>
              <span>{formatDateTime(tweet.createdAt)}</span>
            </div>
            <p>{tweet.body}</p>
            {tweet.image && <img className="tweet-image" src={tweet.image} alt="Imagem" />}
            <div className="tweet-actions">
              <button className="action-button" type="button" disabled>
                <MessageCircle size={17} />
                {plural(tweet.comments?.length || 0, 'comentario', 'comentarios')}
              </button>
              <button className="action-button" type="button" disabled>
                <span>↻</span>
                {plural(tweet.repostedBy?.length || 0, 'repost', 'reposts')}
              </button>
              <button className="action-button" type="button" disabled>
                <Heart size={17} />
                {plural(tweet.likedBy.length, 'gosto', 'gostos')}
              </button>
            </div>
          </div>
        </article>

        <form onSubmit={handleSubmit} className="comment-composer">
          <img src={currentUser.avatar} alt={currentUser.name} className="avatar-small" />
          <div className="composer-input">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Partilhe seus pensamentos..."
              maxLength={280}
              required
            />
            <div className="char-count">
              {commentText.length}/280
            </div>
            {error && <p className="form-error">{error}</p>}
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="btn btn-primary"
            >
              Responder
            </button>
          </div>
        </form>

        <div className="comments-list">
          {tweet.comments && tweet.comments.length > 0 ? (
            tweet.comments.map((comment) => {
              const commentAuthor = comment.author || { name: 'Utilizador', username: 'user', avatar: '' };
              const commentLiked = currentUser ? comment.likedBy?.includes(currentUser.id) : false;
              const canDeleteComment =
                currentUser?.role === 'admin' || currentUser?.id === comment.authorId;

              return (
                <article key={comment.id} className="tweet-card compact">
                  <Link className="avatar-link" to={`/perfil/${commentAuthor.username}`}>
                    <img src={commentAuthor.avatar} alt={commentAuthor.name} />
                  </Link>
                  <div className="tweet-body">
                    <div className="tweet-meta">
                      <Link to={`/perfil/${commentAuthor.username}`} className="tweet-name">
                        {commentAuthor.name}
                      </Link>
                      <span>@{commentAuthor.username}</span>
                      <span>{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p>{comment.body}</p>
                    <div className="tweet-actions">
                      <button
                        className={commentLiked ? 'like-button active' : 'like-button'}
                        onClick={() => onCommentLike(tweet.id, comment.id)}
                        disabled={!currentUser}
                        type="button"
                      >
                        <Heart size={17} fill={commentLiked ? 'currentColor' : 'none'} />
                        {plural(comment.likedBy?.length || 0, 'gosto', 'gostos')}
                      </button>
                      {canDeleteComment && (
                        <button
                          className="icon-button danger"
                          onClick={() => onDeleteComment(tweet.id, comment.id)}
                          type="button"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="muted">Nenhum comentario ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
