import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/client';

const emptyForm = {
  name: '',
  mobile: '',
  email: '',
  businessName: '',
  gstNumber: '',
  customerType: 'RETAIL',
  address: '',
  status: 'LEAD',
  followUpDate: '',
};

export function CustomerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      api.get(`/customers/${id}`).then((res) => {
        const c = res.data.data;
        setForm({
          name: c.name || '',
          mobile: c.mobile || '',
          email: c.email || '',
          businessName: c.businessName || '',
          gstNumber: c.gstNumber || '',
          customerType: c.customerType || 'RETAIL',
          address: c.address || '',
          status: c.status || 'LEAD',
          followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
        });
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : '',
      };
      if (isEdit) {
        await api.put(`/customers/${id}`, payload);
        navigate(`/customers/${id}`);
      } else {
        const res = await api.post('/customers', payload);
        navigate(`/customers/${res.data.data.id}`);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">CRM</div>
          <h2>{isEdit ? 'Edit customer' : 'Add customer'}</h2>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Customer name *</label>
              <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div className="field">
              <label>Mobile number *</label>
              <input
                className="input"
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Business name</label>
              <input
                className="input"
                value={form.businessName}
                onChange={(e) => update('businessName', e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>GST number</label>
              <input className="input" value={form.gstNumber} onChange={(e) => update('gstNumber', e.target.value)} />
            </div>
            <div className="field">
              <label>Customer type</label>
              <select value={form.customerType} onChange={(e) => update('customerType', e.target.value)}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="field">
              <label>Follow-up date</label>
              <input
                className="input"
                type="date"
                value={form.followUpDate}
                onChange={(e) => update('followUpDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add customer'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
