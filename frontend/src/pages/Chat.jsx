import { MessageCircle, Send, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatRelativeTime } from '../utils/format.js';

export default function Chat() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(paramUserId ? String(paramUserId) : '');
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [draft, setDraft] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await api.getChatConversations();
      setConversations(list);
    } catch (err) {
      console.error(err);
      setError('Nao foi possivel carregar as conversas.');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const all = await api.getUsers();
      setUsers(all.filter((user) => user.id !== currentUser?.id));
    } catch (err) {
      console.error(err);
    }
  }, [currentUser?.id]);

  const loadMessages = useCallback(async (targetUserId) => {
    if (!targetUserId) return;
    try {
      setIsLoadingChat(true);
      const data = await api.getChatMessages(targetUserId);
      setMessages(data.messages);
      setOtherUser(data.otherUser);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Nao foi possivel carregar as mensagens.');
    } finally {
      setIsLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadUsers();
  }, [loadConversations, loadUsers]);

  useEffect(() => {
    if (paramUserId) {
      setActiveUserId(String(paramUserId));
    }
  }, [paramUserId]);

  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      setOtherUser(null);
      return undefined;
    }

    loadMessages(activeUserId);
    const interval = setInterval(() => loadMessages(activeUserId), 4000);
    return () => clearInterval(interval);
  }, [activeUserId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = (targetId) => {
    setShowNewChat(false);
    setActiveUserId(String(targetId));
    navigate(`/mensagens/${targetId}`);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeUserId) return;

    try {
      const sent = await api.sendChatMessage(activeUserId, text);
      setDraft('');
      setMessages((current) => [...current, sent]);
      await loadConversations();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Nao foi possivel enviar a mensagem.');
    }
  };

  const newChatCandidates = users.filter(
    (user) => !conversations.some((conv) => String(conv.otherUser.id) === String(user.id)),
  );

  return (
    <section className="chat-page">
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h1>Mensagens</h1>
          <button
            className="chat-new-btn"
            type="button"
            onClick={() => setShowNewChat((open) => !open)}
            aria-expanded={showNewChat}
          >
            <UserPlus size={18} />
            Nova mensagem
          </button>
        </div>

        {showNewChat && (
          <div className="chat-new-panel">
            <p className="muted">Escolhe com quem queres falar</p>
            {newChatCandidates.length ? (
              <ul className="chat-new-list">
                {newChatCandidates.map((user) => (
                  <li key={user.id}>
                    <button type="button" onClick={() => openChat(user.id)}>
                      <img src={user.avatar} alt="" />
                      <span>
                        <strong>{user.name}</strong>
                        <small>@{user.username}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Ja tens conversa com todos os utilizadores.</p>
            )}
          </div>
        )}

        {isLoadingList ? (
          <p className="loading-state">A carregar...</p>
        ) : conversations.length ? (
          <ul className="chat-conversation-list">
            {conversations.map((conversation) => {
              const { otherUser: partner, lastMessage } = conversation;
              const isActive = String(activeUserId) === String(partner.id);
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className={isActive ? 'chat-conversation-item active' : 'chat-conversation-item'}
                    onClick={() => openChat(partner.id)}
                  >
                    <img src={partner.avatar} alt="" />
                    <span className="chat-conversation-copy">
                      <strong>{partner.name}</strong>
                      <small>
                        {lastMessage
                          ? `${lastMessage.isMine ? 'Tu: ' : ''}${lastMessage.content}`
                          : 'Sem mensagens ainda'}
                      </small>
                    </span>
                    {lastMessage && (
                      <time>{formatRelativeTime(lastMessage.createdAt)}</time>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">Ainda nao tens conversas.</p>
        )}
      </aside>

      <main className="chat-main">
        {!activeUserId ? (
          <div className="chat-empty">
            <MessageCircle size={48} />
            <h3>Seleciona uma conversa</h3>
            <p>Escolhe alguem na lista ou inicia uma nova mensagem.</p>
          </div>
        ) : (
          <>
            <header className="chat-main-header">
              {otherUser ? (
                <Link to={`/perfil/${otherUser.username}`} className="chat-partner">
                  <img src={otherUser.avatar} alt="" />
                  <span>
                    <strong>{otherUser.name}</strong>
                    <small>@{otherUser.username}</small>
                  </span>
                </Link>
              ) : (
                <span>A carregar...</span>
              )}
            </header>

            <div className="chat-messages">
              {isLoadingChat && messages.length === 0 ? (
                <p className="loading-state">A carregar mensagens...</p>
              ) : messages.length ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.isMine ? 'chat-bubble mine' : 'chat-bubble theirs'}
                  >
                    <p>{message.content}</p>
                    <time>{formatRelativeTime(message.createdAt)}</time>
                  </div>
                ))
              ) : (
                <p className="muted chat-start-hint">Envia a primeira mensagem para comecar.</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && <p className="form-error chat-error">{error}</p>}

            <form className="chat-composer" onSubmit={sendMessage}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escreve uma mensagem..."
                rows={2}
                maxLength={2000}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(event);
                  }
                }}
              />
              <button className="chat-send-btn" type="submit" disabled={!draft.trim()} aria-label="Enviar">
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </main>
    </section>
  );
}
