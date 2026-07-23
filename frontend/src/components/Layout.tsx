import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', glyph: '01', exact: true },
  { to: '/customers', label: 'Customers', glyph: '02' },
  { to: '/products', label: 'Products & Stock', glyph: '03' },
  { to: '/challans', label: 'Sales Challans', glyph: '04' },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="mark">ERP</span>
          <h1>Ops Portal</h1>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-glyph">{item.glyph}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
          <span className={`role-badge`}>{user?.role}</span>
          <button className="logout-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
