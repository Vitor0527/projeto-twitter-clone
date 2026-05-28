import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="empty-state">
      <h2>Pagina nao encontrada</h2>
      <p>A rota pedida nao existe nesta SPA.</p>
      <Link className="primary-button" to="/app">
        Voltar ao feed
      </Link>
    </section>
  );
}
