import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useMatchMedia from '../../hooks/useMatchMedia';
import Button from '../../components/Button';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="header header--with-nav">
        <div className="header__nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link')}>
            Kanban
          </NavLink>
          {user?.role === 'gestor' && (
            <>
              <NavLink to="/gestor" className={({ isActive }) => (isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link')}>
                Gestor
              </NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link')}>
                Dashboard
              </NavLink>
            </>
          )}
        </div>
        <div className="header__user">
          <span className="header__user-name">{user?.name}</span>
          <Button type="button" variant="secondary" size="s" onPointerDown={() => logout()}>
            Sair
          </Button>
        </div>
      </header>
      {useMatchMedia({
        mobileContent: null,
        desktopContent: (
          <aside className="sidebar sidebar--nav">
            <div className="sidebar__container">
              <NavLink to="/" className={({ isActive }) => (isActive ? 'sidebar__nav-link sidebar__nav-link--active' : 'sidebar__nav-link')}>
                Kanban
              </NavLink>
              {user?.role === 'gestor' && (
                <>
                  <NavLink to="/gestor" className={({ isActive }) => (isActive ? 'sidebar__nav-link sidebar__nav-link--active' : 'sidebar__nav-link')}>
                    Gestor
                  </NavLink>
                  <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'sidebar__nav-link sidebar__nav-link--active' : 'sidebar__nav-link')}>
                    Dashboard
                  </NavLink>
                </>
              )}
            </div>
          </aside>
        ),
        mediaQuery: '(min-width: 690px)',
      })}
      <Outlet />
    </>
  );
}
