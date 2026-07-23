import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export function CustomerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customer, setCustomer] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  async function load() {
    const res = await api.get(`/customers/${id}`);
    setCustomer(res.data.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    setError('');
    try {
      await api.post(`/customers/${id}/notes`, { note: noteText });
      setNoteText('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmittingNote(false);
    }
  }

  if (!customer) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">CRM · Customer</div>
          <h2>{customer.name}</h2>
          <p className="sub">
            {customer.businessName || 'Individual customer'} · {customer.mobile}
          </p>
        </div>
        {canEdit && (
          <Link to={`/customers/${id}/edit`} className="btn btn-ghost">
            Edit customer
          </Link>
        )}
      </div>

      <div className="detail-grid">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 14 }}>Details</h3>
            <div className="field-row">
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Status</div>
                <StatusBadge status={customer.status} />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Customer type</div>
                <div>{customer.customerType}</div>
              </div>
            </div>
            <div className="field-row" style={{ marginTop: 14 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Email</div>
                <div>{customer.email || '—'}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>GST number</div>
                <div className="mono">{customer.gstNumber || '—'}</div>
              </div>
            </div>
            <div className="field-row" style={{ marginTop: 14 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Address</div>
                <div>{customer.address || '—'}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Follow-up date</div>
                <div>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Sales challans</h3>
            <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.challans.length === 0 && (
                    <tr>
                      <td colSpan={4} className="table-empty">
                        No challans yet for this customer.
                      </td>
                    </tr>
                  )}
                  {customer.challans.map((c: any) => (
                    <tr key={c.id}>
                      <td className="mono">
                        <Link to={`/challans/${c.id}`}>{c.challanNumber}</Link>
                      </td>
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
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Follow-up notes</h3>
          {canEdit && (
            <form onSubmit={handleAddNote} style={{ marginBottom: 16 }}>
              {error && <div className="error-banner">{error}</div>}
              <div className="field">
                <textarea
                  rows={3}
                  placeholder="Log a call, visit, or follow-up..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-sm" type="submit" disabled={submittingNote}>
                {submittingNote ? 'Saving...' : 'Add note'}
              </button>
            </form>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {customer.notes.length === 0 && <p className="muted">No notes yet.</p>}
            {customer.notes.map((n: any) => (
              <div key={n.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                <div style={{ fontSize: 13 }}>{n.note}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                  {n.createdBy?.name || 'Unknown'} · {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
