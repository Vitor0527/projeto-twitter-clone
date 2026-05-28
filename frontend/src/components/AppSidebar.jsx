import {
  Bell,
  Bookmark,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  Sun,
  UserCog,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useDismissablePopover } from '../hooks/useDismissablePopover.js';

export default function AppSidebar({ onPost }) {
  const navigate = useNavigate();
  const { currentUser, isAdmin, logout, endActiveSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const accountMenu = useDismissablePopover(false);

  const navClass = ({ isActive }) =>
    `x-sidebar-link${isActive ? ' active' : ''}`;

  const openFollowing = () => {
    navigate('/app', { state: { feedTab: 'following' } });
  };

  const handleLogout = () => {
    accountMenu.close();
    logout();
    navigate('/');
  };

  return (
    <aside className="x-sidebar" aria-label="Menu principal">
      <NavLink to="/app" className="x-sidebar-logo" aria-label="VG inicio">
        <span className="x-logo-mark">VG</span>
      </NavLink>

      <nav className="x-sidebar-nav">
        <NavLink to="/app" className={navClass} end>
          <Home size={22} strokeWidth={2} />
          <span>Inicio</span>
        </NavLink>
        <NavLink to="/explorar" className={navClass}>
          <Search size={22} strokeWidth={2} />
          <span>Explorar</span>
        </NavLink>
        <NavLink to="/notificacoes" className={navClass}>
          <Bell size={22} strokeWidth={2} />
          <span>Notificacoes</span>
        </NavLink>
        <button className="x-sidebar-link" type="button" onClick={openFollowing}>
          <UserPlus size={22} strokeWidth={2} />
          <span>A seguir</span>
        </button>
        <NavLink to="/mensagens" className={navClass}>
          <MessageCircle size={22} strokeWidth={2} />
          <span>Mensagens</span>
        </NavLink>
        <NavLink to="/guardados" className={navClass}>
          <Bookmark size={22} strokeWidth={2} />
          <span>Guardados</span>
        </NavLink>
        <NavLink to={`/perfil/${currentUser.username}`} className={navClass}>
          <UserRound size={22} strokeWidth={2} />
          <span>Perfil</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={navClass}>
            <Shield size={22} strokeWidth={2} />
            <span>Backoffice</span>
          </NavLink>
        )}
        <div className="x-sidebar-more-wrap">
          <button
            ref={accountMenu.triggerRef}
            className={`x-sidebar-link${accountMenu.isOpen ? ' active' : ''}`}
            type="button"
            aria-expanded={accountMenu.isOpen}
            onClick={accountMenu.toggle}
          >
            <MoreHorizontal size={22} strokeWidth={2} />
            <span>Mais</span>
          </button>
          {accountMenu.isOpen && (
            <div className="x-sidebar-more-menu" ref={accountMenu.popoverRef} role="menu">
              <button type="button" role="menuitem" onClick={() => { accountMenu.close(); navigate('/definicoes'); }}>
                <UserCog size={18} />
                Definicoes
              </button>
              <button type="button" role="menuitem" onClick={() => { toggleTheme(); accountMenu.close(); }}>
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  accountMenu.close();
                  endActiveSession();
                  navigate('/login');
                }}
              >
                <LogIn size={18} />
                Trocar de conta
              </button>
              <button type="button" role="menuitem" onClick={handleLogout}>
                <LogOut size={18} />
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      <button className="x-sidebar-post" type="button" onClick={onPost}>
        Publicar
      </button>

      <div className="x-sidebar-account-wrap">
        <button
          className="x-sidebar-account"
          type="button"
          onClick={() => navigate(`/perfil/${currentUser.username}`)}
        >
          <img src={currentUser.avatar} alt="" />
          <span className="x-sidebar-account-text">
            <strong>{currentUser.name}</strong>
            <small>@{currentUser.username}</small>
          </span>
        </button>
        <button
          className="x-sidebar-account-menu"
          type="button"
          aria-label="Opcoes da conta"
          onClick={accountMenu.toggle}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
    </aside>
  );
}
