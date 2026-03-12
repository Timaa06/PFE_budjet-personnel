import { useState } from 'react';
import { ArrowLeft, Mail, Link, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'user';
  const isAdmin = role === 'admin';

  const [email, setEmail]         = useState('');
  const [status, setStatus]       = useState(null);
  const [message, setMessage]     = useState('');
  const [resetLink, setResetLink] = useState(null);
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setResetLink(null);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage(res.data.message);
      if (res.data.reset_link) {
        setResetLink(res.data.reset_link);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Une erreur est survenue.');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className={`login-card ${isAdmin ? 'login-card-admin' : ''}`}>
        <div className="login-logo">
          <div className={`login-logo-icon ${isAdmin ? 'logo-admin' : ''}`}>
            {isAdmin ? <Shield size={28} /> : 'B'}
          </div>
        </div>
        <h1>Budget Manager</h1>
        <p className="login-subtitle">
          {isAdmin ? 'Réinitialisation — Compte administrateur' : 'Réinitialiser mon mot de passe'}
        </p>

        {status === 'success' ? (
          <div className="reset-success">
            {resetLink ? <Link size={32} color={isAdmin ? '#7c3aed' : '#6366f1'} /> : <Mail size={32} color={isAdmin ? '#7c3aed' : '#10b981'} />}
            <p>{message}</p>

            {resetLink ? (
              <a
                href={resetLink}
                className={`reset-direct-link ${isAdmin ? 'reset-direct-link-admin' : ''}`}
              >
                Réinitialiser mon mot de passe →
              </a>
            ) : (
              <p className="reset-hint">Vérifiez votre boîte mail et vos spams.</p>
            )}

            <button className="back-role-btn" style={{ margin: '16px auto 0' }} onClick={() => navigate('/login')}>
              <ArrowLeft size={14} /> Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            {status === 'error' && <div className="error-message">{message}</div>}
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group">
                <label>Adresse email de votre compte</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className={isAdmin ? 'btn-admin-login' : ''}>
                {loading ? 'Chargement...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>
            <button className="back-role-btn" onClick={() => navigate('/login')}>
              <ArrowLeft size={14} /> Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
