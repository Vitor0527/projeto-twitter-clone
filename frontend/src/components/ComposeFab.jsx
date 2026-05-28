import { PenLine, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import TweetComposer from './TweetComposer.jsx';

export default function ComposeFab({ showFab = true }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('pulse:open-compose', onOpen);
    return () => window.removeEventListener('pulse:open-compose', onOpen);
  }, []);

  const createTweet = async (payload) => {
    try {
      setError('');
      await api.createTweet(payload);
      setOpen(false);
      if (location.pathname !== '/app') {
        navigate('/app', { state: { refreshFeed: Date.now() } });
      } else {
        window.dispatchEvent(new CustomEvent('pulse:feed-refresh'));
      }
    } catch (caught) {
      setError(caught.response?.data?.error || caught.message || 'Nao foi possivel publicar.');
    }
  };

  return (
    <>
      {showFab && (
        <button
          className="compose-fab"
          type="button"
          title="Publicar"
          aria-label="Publicar tweet"
          onClick={() => setOpen(true)}
        >
          <PenLine size={22} />
        </button>
      )}

      {open && (
        <div className="compose-fab-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="compose-fab-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Novo tweet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="compose-fab-header">
              <h2>Novo tweet</h2>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </header>
            {error && <p className="form-error">{error}</p>}
            <TweetComposer onCreate={createTweet} />
          </section>
        </div>
      )}
    </>
  );
}
