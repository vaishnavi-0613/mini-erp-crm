import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/client';

interface LineItem {
  productId: string;
  quantity: string;
}

export function ChallanForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: '1' }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/customers', { params: { limit: 100 } }).then((res) => setCustomers(res.data.data));
    api.get('/products', { params: { limit: 200 } }).then((res) => setProducts(res.data.data));
  }, []);

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: '', quantity: '1' }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function productStock(productId: string) {
    return products.find((p) => p.id === productId)?.currentStock;
  }

  async function submit(status: 'DRAFT' | 'CONFIRMED') {
    setError('');
    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    const cleanItems = items
      .filter((it) => it.productId && parseInt(it.quantity, 10) > 0)
      .map((it) => ({ productId: it.productId, quantity: parseInt(it.quantity, 10) }));

    if (cleanItems.length === 0) {
      setError('Add at least one product line with a quantity');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/challans', { customerId, status, items: cleanItems });
      navigate(`/challans/${res.data.data.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit('DRAFT');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Sales</div>
          <h2>New sales challan</h2>
          <p className="sub">Select a customer, add products, then save as draft or confirm to dispatch stock.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 780 }}>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.businessName ? `— ${c.businessName}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Products</label>
            <table className="line-items-table">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>Product</th>
                  <th>Quantity</th>
                  <th>Available stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <select value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)}>
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        style={{ width: 90 }}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="mono muted">
                      {item.productId ? productStock(item.productId) ?? '—' : '—'}
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button type="button" className="remove-line" onClick={() => removeItem(index)}>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={addItem}>
              + Add product line
            </button>
          </div>

          <div className="flex" style={{ marginTop: 18 }}>
            <button className="btn btn-ghost" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save as draft'}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={submitting}
              onClick={() => submit('CONFIRMED')}
            >
              {submitting ? 'Saving...' : 'Confirm & dispatch stock'}
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
