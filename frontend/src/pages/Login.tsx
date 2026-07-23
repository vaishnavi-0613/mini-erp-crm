import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../api/client';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <div className="ledger-lines" />
        <div className="content">
          <span className="mark">Mini ERP + CRM</span>
          <h1>The stock register, digitized.</h1>
          <p>
            Track customers, products, and sales challans in one operations portal built for sales,
            warehouse, and accounts teams working from the same source of truth.
          </p>
          <div className="ledger-sample">
            <span>CH-2026-000118 &nbsp; Ramesh Traders &nbsp; CONFIRMED</span>
            <span>SKU-002 &nbsp; Ballpoint Pen (Box of 50) &nbsp; -12 OUT</span>
            <span>Follow-up due &nbsp; Anita Distributors &nbsp; Jul 24</span>
          </div>
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <h2>Sign in</h2>
          <p className="sub">Use your work email and password to access the portal.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="hint-creds">
            Test credentials (after running the seed script):
            <span className="mono">admin@erp.test / Admin@123</span>
            <span className="mono">sales@erp.test / Sales@123</span>
            <span className="mono">warehouse@erp.test / Warehouse@123</span>
            <span className="mono">accounts@erp.test / Accounts@123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
