import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export function ChallanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const canTransition = user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'WAREHOUSE';

  const [challan, setChallan] = useState<any>(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  async function load() {
    const res = await api.get(`/challans/${id}`);
    setChallan(res.data.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function transition(status: 'CONFIRMED' | 'CANCELLED') {
    setError('');
    setUpdating(true);
    try {
      await api.patch(`/challans/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  if (!challan) return <div>Loading...</div>;

  const total = challan.items.reduce((sum: number, it: any) => sum + Number(it.unitPrice) * it.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Sales · Challan</div>
          <h2 className="mono">{challan.challanNumber}</h2>
          <p className="sub">
            <Link to={`/customers/${challan.customer.id}`}>{challan.customer.name}</Link>
            {challan.customer.businessName ? ` — ${challan.customer.businessName}` : ''}
          </p>
        </div>
        <StatusBadge status={challan.status} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Product (snapshot)</th>
                <th>SKU</th>
                <th>Unit price</th>
                <th>Qty</th>
                <th>Line total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((it: any) => (
                <tr key={it.id}>
                  <td>{it.productName}</td>
                  <td className="mono">{it.productSku}</td>
                  <td className="mono">₹{Number(it.unitPrice).toFixed(2)}</td>
                  <td className="mono">{it.quantity}</td>
                  <td className="mono">₹{(Number(it.unitPrice) * it.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex-between" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <div className="muted">
            Created by {challan.createdBy?.name || 'Unknown'} on {new Date(challan.createdAt).toLocaleString()}
          </div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Total: ₹{total.toFixed(2)}</div>
        </div>
      </div>

      {canTransition && challan.status !== 'CANCELLED' && (
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Update status</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
            {challan.status === 'DRAFT'
              ? 'Confirming will reduce stock for each line item. This cannot be undone by reverting to draft.'
              : 'Cancelling a confirmed challan will restore the stock it originally deducted.'}
          </p>
          <div className="flex">
            {challan.status === 'DRAFT' && (
              <button className="btn btn-primary" disabled={updating} onClick={() => transition('CONFIRMED')}>
                {updating ? 'Updating...' : 'Confirm & dispatch stock'}
              </button>
            )}
            <button className="btn btn-danger" disabled={updating} onClick={() => transition('CANCELLED')}>
              {updating ? 'Updating...' : 'Cancel challan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
