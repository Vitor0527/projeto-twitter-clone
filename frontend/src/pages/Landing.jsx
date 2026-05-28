import { Apple } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <section className="landing">
      <div className="landing-mark" aria-hidden="true">
        VG
      </div>

      <div className="landing-auth">
        <h1>Acontecendo agora</h1>
        <h2>Inscreva-se hoje</h2>

        <div className="signup-stack">
          <Link className="social-signup" to="/login?mode=register">
            <span className="google-g">G</span>
            Inscrever-se com Google
          </Link>
          <Link className="social-signup" to="/login?mode=register">
            <Apple size={20} fill="currentColor" />
            Inscrever-se com Apple
          </Link>
          <div className="or-divider">
            <span />
            ou
            <span />
          </div>
          <Link className="create-account-button" to="/login?mode=register">
            Criar conta
          </Link>
        </div>

        <p className="terms-note">
          Ao se inscrever, voce concorda com os Termos de Servico e a Politica de
          Privacidade. Esta versao usa dados locais para demonstracao.
        </p>

        <div className="login-callout">
          <strong>Ja tem uma conta?</strong>
          <Link className="signin-button" to="/login">
            Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
