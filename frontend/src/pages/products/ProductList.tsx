import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function ProductList() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStockOnly, page]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: { search: search || undefined, lowStock: lowStockOnly || undefined, page, limit: 15 },
      });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Inventory</div>
          <h2>Products & Stock</h2>
          <p className="sub">Current stock levels and alert thresholds across all warehouses.</p>
        </div>
        {canEdit && (
          <Link to="/products/new" className="btn btn-primary">
            + Add product
          </Link>
        )}
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search name or SKU..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          style={{ minWidth: 260 }}
        />
        <label className="flex" style={{ fontSize: 13.5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setPage(1);
              setLowStockOnly(e.target.checked);
            }}
          />
          Low stock only
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit price</th>
              <th>Stock</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const low = p.currentStock <= p.minStockAlert;
              return (
                <tr key={p.id} className={low ? 'low-stock-row' : ''}>
                  <td>
                    <Link to={`/products/${p.id}`} style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {p.name}
                    </Link>
                  </td>
                  <td className="mono">{p.sku}</td>
                  <td>{p.category || '—'}</td>
                  <td className="mono">₹{Number(p.unitPrice).toFixed(2)}</td>
                  <td className="mono" style={{ color: low ? 'var(--rust)' : undefined, fontWeight: low ? 600 : 400 }}>
                    {p.currentStock} <span className="muted">/ min {p.minStockAlert}</span>
                  </td>
                  <td>{p.location || '—'}</td>
                </tr>
              );
            })}
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
