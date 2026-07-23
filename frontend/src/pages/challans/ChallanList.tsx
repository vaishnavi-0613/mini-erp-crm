import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export function ChallanList() {
  const { user } = useAuth();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [challans, setChallans] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, page]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/challans', {
        params: { status: status || undefined, search: search || undefined, page, limit: 15 },
      });
      setChallans(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Sales</div>
          <h2>Sales Challans</h2>
          <p className="sub">Draft, confirm, and track outbound stock against customer orders.</p>
        </div>
        {canCreate && (
          <Link to="/challans/new" className="btn btn-primary">
            + New challan
          </Link>
        )}
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search challan number..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          style={{ minWidth: 240 }}
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Customer</th>
              <th>Line items</th>
              <th>Total qty</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {!loading && challans.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No challans found.
                </td>
              </tr>
            )}
            {challans.map((c) => (
              <tr key={c.id}>
                <td className="mono">
                  <Link to={`/challans/${c.id}`} style={{ fontWeight: 600 }}>
                    {c.challanNumber}
                  </Link>
                </td>
                <td>{c.customer?.name}</td>
                <td>{c.items.length}</td>
                <td className="mono">{c.totalQuantity}</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
