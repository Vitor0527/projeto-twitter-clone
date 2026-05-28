import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, register, switchAccount, savedAccounts, currentUser } = useAuth();
  const [mode, setMode] = useState(() => (searchParams.get('mode') === 'register' ? 'register' : 'login'));
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const pickSavedAccount = async (username) => {
    setError('');
    try {
      const user = await switchAccount(username);
      const target =
        user?.role === 'admin' && location.state?.from === '/admin'
          ? '/admin'
          : location.state?.from || '/app';
      navigate(target);
    } catch (caught) {
      setError(caught.response?.data?.error || caught.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const user =
        mode === 'login'
          ? await login(form.username, form.password)
          : await register(form);
      const target =
        user?.role === 'admin' && location.state?.from === '/admin'
          ? '/admin'
          : location.state?.from || '/app';
      navigate(target);
    } catch (caught) {
      setError(caught.response?.data?.error || caught.message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-identity">
        <div className="auth-logo-large">VG</div>
        <h1>{mode === 'login' ? 'Bem-vindo de volta' : 'Junta-te ao VG'}</h1>
        <p>Publica ideias, segue utilizadores, personaliza o perfil e gere a tua comunidade numa plataforma social em React.</p>
      </div>

      <div className="auth-card-wrap">
        <div className="section-heading">
          <span className="eyebrow">Conta</span>
          <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
          <p>Use admin / admin123 para testar tambem o backoffice.</p>
        </div>

        {mode === 'login' && savedAccounts.length > 0 && (
          <div className="auth-saved-accounts">
            <p className="auth-saved-label">Contas neste dispositivo (VG)</p>
            <ul>
              {savedAccounts.map((account) => (
                <li key={account.username}>
                  <button
                    type="button"
                    className="auth-saved-account"
                    disabled={currentUser?.username === account.username}
                    onClick={() => pickSavedAccount(account.username)}
                  >
                    <img src={account.user.avatar} alt="" />
                    <span>
                      <strong>{account.user.name}</strong>
                      <small>@{account.username}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          <div className="segmented">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Login
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              Registo
            </button>
          </div>

          {mode === 'register' && (
            <>
              <label>
                Nome
                <input name="name" value={form.name} onChange={update} required />
              </label>
              <label>
                E-mail
                <input type="email" name="email" value={form.email} onChange={update} required />
              </label>
            </>
          )}

          <label>
            Utilizador ou e-mail
            <input name="username" value={form.username} onChange={update} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={update} minLength={6} required />
          </label>

          {error && <p className="form-error">{error}</p>}
          <button className="primary-button full" type="submit">
            {mode === 'login' ? 'Entrar' : 'Registar'}
          </button>
        </form>
      </div>
    </section>
  );
}
