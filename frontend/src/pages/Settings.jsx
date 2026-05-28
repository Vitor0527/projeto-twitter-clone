import { Save, UserCog } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../services/api.js';

export default function Settings() {
  const { currentUser, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    pronouns: currentUser?.pronouns || '',
    avatar: currentUser?.avatar || '',
    banner: currentUser?.banner || '',
  });

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setStatus('');
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setStatus('');
      await api.updateUser(currentUser.id, {
        name: form.name.trim() || currentUser.name,
        email: form.email.trim() || currentUser.email,
        bio: form.bio.trim(),
        pronouns: form.pronouns.trim(),
        avatar: form.avatar.trim() || currentUser.avatar,
        banner: form.banner.trim() || currentUser.banner,
      });
      await refreshUser();
      setStatus('Definicoes guardadas.');
    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.error || 'Erro ao guardar as definições.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="settings-page x-page-main">
      <div className="section-heading">
        <span className="eyebrow">
          <UserCog size={16} />
          Definicoes
        </span>
        <h2>Conta e perfil</h2>
        <p>Atualize os dados principais da conta e personalize a experiencia.</p>
      </div>

      <form className="settings-card" onSubmit={saveSettings}>
        <div className="settings-grid">
          <label>
            Nome exibido
            <input name="name" value={form.name} onChange={update} maxLength={60} />
          </label>
          <label>
            E-mail
            <input type="email" name="email" value={form.email} onChange={update} />
          </label>
          <label>
            Pronomes
            <input name="pronouns" value={form.pronouns} onChange={update} maxLength={30} />
          </label>
          <label>
            Avatar
            <input name="avatar" value={form.avatar} onChange={update} />
          </label>
          <label className="settings-wide">
            Banner
            <input name="banner" value={form.banner} onChange={update} />
          </label>
          <label className="settings-wide">
            Bio
            <textarea name="bio" value={form.bio} onChange={update} maxLength={190} />
          </label>
        </div>

        <div className="settings-preferences">
          <div>
            <strong>Tema da interface</strong>
            <span>{theme === 'light' ? 'Claro' : 'Escuro'}</span>
          </div>
          <button className="ghost-button" type="button" onClick={toggleTheme}>
            Alternar tema
          </button>
        </div>

        {status && <p className="settings-status">{status}</p>}
        <div className="settings-actions">
          <button className="primary-button" type="submit" disabled={isSaving}>
            <Save size={17} />
            {isSaving ? 'A guardar...' : 'Guardar definicoes'}
          </button>
        </div>
      </form>
    </section>
  );
}
