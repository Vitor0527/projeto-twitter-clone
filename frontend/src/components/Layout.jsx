import { LogIn, Moon, Sun } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import AppSidebar from './AppSidebar.jsx';
import ComposeFab from './ComposeFab.jsx';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isLanding = location.pathname === '/';
  const isAuthPage = location.pathname === '/login';
  const showXSidebar = isAuthenticated && !isLanding && !isAuthPage;

  const openCompose = () => {
    window.dispatchEvent(new CustomEvent('pulse:open-compose'));
  };

  return (
    <div
      className={
        isLanding
          ? 'app-shell landing-shell'
          : isAuthPage
            ? 'app-shell auth-shell'
            : showXSidebar
              ? 'app-shell x-app-shell'
              : 'app-shell'
      }
    >
      {isAuthPage && (
        <header className="auth-header">
          <button className="icon-button" onClick={toggleTheme} title="Alterar tema" type="button">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>
      )}

      {!isLanding && !isAuthPage && !showXSidebar && (
        <header className="site-header site-header--guest">
          <NavLink to="/" className="brand" aria-label="VG inicio">
            <span className="brand-mark">VG</span>
          </NavLink>
          <div className="header-actions">
            <button className="icon-button" onClick={toggleTheme} title="Alterar tema" type="button">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <NavLink className="primary-button" to="/login">
              <LogIn size={18} />
              Entrar
            </NavLink>
          </div>
        </header>
      )}

      <div
        className={
          isLanding
            ? 'landing-grid'
            : isAuthPage
              ? 'auth-grid'
              : showXSidebar
                ? 'x-app-layout'
                : 'main-grid main-grid--guest'
        }
      >
        {showXSidebar ? (
          <>
            <AppSidebar onPost={openCompose} />
            <div className="x-main-slot">
              <Outlet />
            </div>
          </>
        ) : (
          <main className="content-panel">
            <Outlet />
          </main>
        )}
      </div>

      {isAuthenticated && !isLanding && !isAuthPage && (
        <ComposeFab showFab={!showXSidebar} />
      )}
    </div>
  );
}
