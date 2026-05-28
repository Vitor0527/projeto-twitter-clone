import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <Navigate
        to="/app"
        replace
        state={{
          adminDenied: true,
          message: 'Acesso reservado a administradores. Entra com a conta admin (admin / admin123).',
        }}
      />
    );
  }

  return children;
}
