import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/client';

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  unitPrice: '',
  currentStock: '0',
  minStockAlert: '0',
  location: '',
};

export function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then((res) => {
        const p = res.data.data;
        setForm({
          name: p.name || '',
          sku: p.sku || '',
          category: p.category || '',
          unitPrice: String(p.unitPrice ?? ''),
          currentStock: String(p.currentStock ?? 0),
          minStockAlert: String(p.minStockAlert ?? 0),
          location: p.location || '',
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
      const payload: any = {
        name: form.name,
        sku: form.sku,
        category: form.category || undefined,
        unitPrice: parseFloat(form.unitPrice),
        minStockAlert: parseInt(form.minStockAlert, 10) || 0,
        location: form.location || undefined,
      };
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        navigate(`/products/${id}`);
      } else {
        payload.currentStock = parseInt(form.currentStock, 10) || 0;
        const res = await api.post('/products', payload);
        navigate(`/products/${res.data.data.id}`);
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
          <div className="eyebrow">Inventory</div>
          <h2>{isEdit ? 'Edit product' : 'Add product'}</h2>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 620 }}>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Product name *</label>
              <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div className="field">
              <label>SKU / code *</label>
              <input className="input" value={form.sku} onChange={(e) => update('sku', e.target.value)} required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Category</label>
              <input className="input" value={form.category} onChange={(e) => update('category', e.target.value)} />
            </div>
            <div className="field">
              <label>Unit price (₹) *</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={form.unitPrice}
                onChange={(e) => update('unitPrice', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-row">
            {!isEdit && (
              <div className="field">
                <label>Opening stock</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.currentStock}
                  onChange={(e) => update('currentStock', e.target.value)}
                />
              </div>
            )}
            <div className="field">
              <label>Minimum stock alert quantity</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.minStockAlert}
                onChange={(e) => update('minStockAlert', e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Location / warehouse</label>
            <input className="input" value={form.location} onChange={(e) => update('location', e.target.value)} />
          </div>

          <div className="flex" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
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
