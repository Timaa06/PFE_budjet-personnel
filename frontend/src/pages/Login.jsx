import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, User, Shield, ArrowLeft } from 'lucide-react';
import './Login.css';

const SAVED_EMAIL_KEY = (role) => `bm_saved_email_${role}`;

function Login() {
  const [role, setRole]         = useState(null);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Pré-remplir l'email sauvegardé quand le rôle est choisi
  useEffect(() => {
    if (role) {
      const saved = localStorage.getItem(SAVED_EMAIL_KEY(role)) || '';
      setEmail(saved);
      setPassword('');
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (role === 'admin' && !result.is_admin) {
      setError("Ce compte n'est pas un compte administrateur.");
      return;
    }
    if (role === 'user' && result.is_admin) {
      setError("Ce compte est un compte administrateur. Utilisez l'accès Administrateur.");
      return;
    }

    // Mémoriser l'email pour la prochaine fois
    localStorage.setItem(SAVED_EMAIL_KEY(role), email);

    navigate('/app');
  };

  // ── Étape 1 : Sélection du rôle ───────────────────────────────────────────
  if (!role) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">B</div>
          </div>
          <h1>Budget Manager</h1>
          <p className="login-subtitle">Vous êtes...</p>

          <div className="role-cards">
            <button className="role-card role-user" onClick={() => setRole('user')}>
              <div className="role-icon user-icon"><User size={26} /></div>
              <span className="role-label">Particulier</span>
              <span className="role-desc">Accéder à mon espace budget</span>
            </button>
            <button className="role-card role-admin" onClick={() => setRole('admin')}>
              <div className="role-icon admin-icon"><Shield size={26} /></div>
              <span className="role-label">Administrateur</span>
              <span className="role-desc">Accéder au back office</span>
            </button>
          </div>

          <p className="login-footer">
            Pas encore de compte ? <a href="/register">S'inscrire</a>
          </p>
        </div>
      </div>
    );
  }

  // ── Étape 2 : Formulaire de connexion ─────────────────────────────────────
  const isAdminRole = role === 'admin';

  return (
    <div className="login-container">
      <div className={`login-card ${isAdminRole ? 'login-card-admin' : ''}`}>
        <div className="login-logo">
          <div className={`login-logo-icon ${isAdminRole ? 'logo-admin' : ''}`}>
            {isAdminRole ? <Shield size={28} /> : 'B'}
          </div>
        </div>

        <h1>Budget Manager</h1>
        <p className="login-subtitle">
          {isAdminRole ? 'Connexion Administrateur' : 'Connexion à votre espace'}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className={isAdminRole ? 'btn-admin-login' : ''}>
            <LogIn size={18} />
            Se connecter
          </button>
          <div className="forgot-link-wrap">
            <a href={`/forgot-password?role=${role}`} className="forgot-link">Mot de passe oublié ?</a>
          </div>
        </form>

        <button className="back-role-btn" onClick={() => { setRole(null); setError(''); setEmail(''); setPassword(''); }}>
          <ArrowLeft size={14} /> Changer de profil
        </button>

        {!isAdminRole && (
          <p className="login-footer">
            Pas encore de compte ? <a href="/register">S'inscrire</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
