import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function StockLog() {
  const { id } = useParams();
  const { user } = useAuth();
  const canAdjust = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await api.get(`/products/${id}`);
    setProduct(res.data.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError('Enter a quantity greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/stock-movements`, { quantity: qty, movementType, reason: reason || undefined });
      setQuantity('');
      setReason('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!product) return <div>Loading...</div>;

  const low = product.currentStock <= product.minStockAlert;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Inventory · Product</div>
          <h2>{product.name}</h2>
          <p className="sub mono">{product.sku}</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
          <Link to={`/products/${id}/edit`} className="btn btn-ghost">
            Edit product
          </Link>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Current stock</div>
          <div className="value" style={{ color: low ? 'var(--rust)' : undefined }}>
            {product.currentStock}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Alert threshold</div>
          <div className="value">{product.minStockAlert}</div>
        </div>
        <div className="stat-card">
          <div className="label">Unit price</div>
          <div className="value">₹{Number(product.unitPrice).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Location</div>
          <div className="value" style={{ fontSize: 16 }}>
            {product.location || '—'}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Stock movement log</h3>
          <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Reason</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {product.stockMovements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                )}
                {product.stockMovements.map((m: any) => (
                  <tr key={m.id}>
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${m.movementType.toLowerCase()}`}>{m.movementType}</span>
                    </td>
                    <td className="mono">{m.quantity}</td>
                    <td>{m.reason || '—'}</td>
                    <td>{m.createdBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {canAdjust && (
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Record stock movement</h3>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Movement type</label>
                <select value={movementType} onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT')}>
                  <option value="IN">IN (stock received)</option>
                  <option value="OUT">OUT (stock removed)</option>
                </select>
              </div>
              <div className="field">
                <label>Quantity</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Reason</label>
                <input
                  className="input"
                  placeholder="e.g. Purchase order receipt, damage write-off"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Record movement'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
