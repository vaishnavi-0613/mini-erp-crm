import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

interface Stats {
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  draftChallans: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentChallans, setRecentChallans] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [customersRes, productsRes, lowStockRes, challansRes] = await Promise.all([
        api.get('/customers', { params: { limit: 1 } }),
        api.get('/products', { params: { limit: 1 } }),
        api.get('/products', { params: { limit: 100, lowStock: true } }),
        api.get('/challans', { params: { limit: 5 } }),
      ]);

      setStats({
        totalCustomers: customersRes.data.pagination.total,
        totalProducts: productsRes.data.pagination.total,
        lowStockCount: lowStockRes.data.data.length,
        draftChallans: 0,
      });
      setLowStockProducts(lowStockRes.data.data.slice(0, 5));
      setRecentChallans(challansRes.data.data);
    }
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Overview</div>
          <h2>Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p className="sub">Here's what's moving across the operation today.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Customers</div>
          <div className="value">{stats?.totalCustomers ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Products</div>
          <div className="value">{stats?.totalProducts ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low stock alerts</div>
          <div className="value" style={{ color: stats?.lowStockCount ? 'var(--rust)' : undefined }}>
            {stats?.lowStockCount ?? '—'}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <h3>Recent sales challans</h3>
            <Link to="/challans" className="btn btn-ghost btn-sm">
              View all
            </Link>
          </div>
          <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentChallans.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-empty">
                      No challans yet.
                    </td>
                  </tr>
                )}
                {recentChallans.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">
                      <Link to={`/challans/${c.id}`}>{c.challanNumber}</Link>
                    </td>
                    <td>{c.customer?.name}</td>
                    <td className="mono">{c.totalQuantity}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Low stock watchlist</h3>
          {lowStockProducts.length === 0 && <p className="muted">Nothing below the alert threshold.</p>}
          {lowStockProducts.map((p) => (
            <div key={p.id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                <div className="mono muted" style={{ fontSize: 11.5 }}>
                  {p.sku}
                </div>
              </div>
              <div className="mono" style={{ color: 'var(--rust)', fontWeight: 600 }}>
                {p.currentStock} / {p.minStockAlert}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
