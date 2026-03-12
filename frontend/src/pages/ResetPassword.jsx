import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import './Login.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [status, setStatus]       = useState(null);
  const [message, setMessage]     = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('error');
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setStatus('error');
      setMessage('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setStatus('success');
      setMessage(res.data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Lien invalide ou expiré.');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <p className="error-message">Lien invalide. Veuillez faire une nouvelle demande.</p>
          <button className="back-role-btn" onClick={() => navigate('/forgot-password')}>
            <ArrowLeft size={14} /> Demander un nouveau lien
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">B</div>
        </div>
        <h1>Budget Manager</h1>
        <p className="login-subtitle">Nouveau mot de passe</p>

        {status === 'success' ? (
          <div className="reset-success">
            <CheckCircle size={32} color="#10b981" />
            <p>{message}</p>
            <button className="back-role-btn" style={{margin:'16px auto 0'}} onClick={() => navigate('/login')}>
              <ArrowLeft size={14} /> Se connecter
            </button>
          </div>
        ) : (
          <>
            {status === 'error' && <div className="error-message">{message}</div>}
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
