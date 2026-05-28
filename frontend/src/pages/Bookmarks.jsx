import { Bookmark } from 'lucide-react';

export default function Bookmarks() {
  return (
    <section className="placeholder-page x-page-main">
      <header className="placeholder-page-header">
        <Bookmark size={28} />
        <h1>Guardados</h1>
      </header>
      <p className="muted">Os tweets que guardares vao aparecer nesta pagina.</p>
    </section>
  );
}
