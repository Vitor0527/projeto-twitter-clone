import { MessageCircle, UserPlus, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserCard({ user, currentUser, onFollow }) {
  const isSelf = currentUser?.id === user.id;
  const following = currentUser?.following?.includes(user.id);

  return (
    <article className="user-card">
      <Link to={`/perfil/${user.username}`} className="user-card-main">
        <img src={user.avatar} alt={user.name} />
        <span>
          <strong>{user.name}</strong>
          <small>@{user.username}</small>
        </span>
      </Link>
      <p>{user.bio}</p>
      {!isSelf && currentUser && (
        <div className="user-card-actions">
          <Link className="ghost-button" to={`/mensagens/${user.id}`} title="Enviar mensagem">
            <MessageCircle size={17} />
          </Link>
          <button
            className={following ? 'follow-button following' : 'follow-button'}
            onClick={() => onFollow(user.id)}
            type="button"
          >
            {following ? <UserRoundCheck size={17} /> : <UserPlus size={17} />}
            {following ? 'A seguir' : 'Seguir'}
          </button>
        </div>
      )}
    </article>
  );
}
