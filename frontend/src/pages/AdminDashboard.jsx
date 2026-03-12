import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Users, Tag, BarChart2, Trash2, Power, Plus, Pencil, X, Check,
  AlertTriangle, Clock, KeyRound, Ban, ShieldOff, ScrollText, TrendingUp
} from 'lucide-react';
import './AdminDashboard.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
const isBanned = (u) => u.banned_until && new Date(u.banned_until) > new Date();

const actionLabel = {
  login_success:            { label: 'Connexion',         color: '#16a34a' },
  login_failed:             { label: 'Échec connexion',   color: '#dc2626' },
  login_blocked:            { label: 'Accès bloqué',      color: '#ea580c' },
  register:                 { label: 'Inscription',        color: '#2563eb' },
  password_reset_requested: { label: 'Demande reset MDP', color: '#7c3aed' },
  password_reset_done:      { label: 'MDP réinitialisé',  color: '#0891b2' },
};

const MONTH_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const toMonthName = (str) => MONTH_FR[parseInt(str?.slice(5)) - 1] || str?.slice(5);

// ─── Graphique en colonnes ───────────────────────────────────────────────────
function BarChart({ data, color, label }) {
  if (!data || data.length === 0) return <p className="no-data-small">Aucune donnée</p>;
  const BAR_MAX_H = 110;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="bar-chart">
      <div className="bar-chart-title">{label}</div>
      <div className="bar-chart-bars">
        {data.map((d, i) => {
          const h = Math.max(Math.round((d.count / max) * BAR_MAX_H), 10);
          return (
            <div key={i} className="bar-col">
              <span className="bar-val">{d.count}</span>
              <div
                className="bar-fill"
                style={{
                  height: `${h}px`,
                  background: `linear-gradient(to top, ${color}, ${color}99)`
                }}
              />
              <span className="bar-month">{toMonthName(d.month)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats]         = useState(null);
  const [timeline, setTimeline]   = useState({ users: [], transactions: [] });
  const [alerts, setAlerts]       = useState([]);
  const [users, setUsers]         = useState([]);
  const [logs, setLogs]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Recherche & filtres utilisateurs
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');

  // Modals
  const [banModal, setBanModal]   = useState(null); // { user }
  const [banDays, setBanDays]     = useState(7);
  const [banReason, setBanReason] = useState('');
  const [resetModal, setResetModal] = useState(null); // { user, tempPassword }

  // Filtre journal
  const [logFilter, setLogFilter] = useState('all');

  // Catégories
  const [catForm, setCatForm]     = useState({ name: '', type: 'expense' });
  const [editingCat, setEditingCat] = useState(null);
  const [catError, setCatError]   = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, timelineRes, alertsRes, usersRes, logsRes, catsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/timeline'),
        api.get('/admin/alerts'),
        api.get('/admin/users'),
        api.get('/admin/logs'),
        api.get('/admin/categories'),
      ]);
      setStats(statsRes.data);
      setTimeline(timelineRes.data);
      setAlerts(alertsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setCategories(catsRes.data);
    } catch {
      setError('Erreur de chargement');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtrage utilisateurs ─────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'active')   return u.is_active && !isBanned(u);
    if (filter === 'inactive') return !u.is_active;
    if (filter === 'banned')   return isBanned(u);
    if (filter === 'admin')    return u.is_admin;
    return true;
  });

  // ── Actions utilisateurs ──────────────────────────────────────────────────
  const handleToggle = async (u) => {
    try {
      await api.put(`/admin/users/${u.id}/toggle`);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x));
    } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleBan = async () => {
    try {
      const res = await api.put(`/admin/users/${banModal.id}/ban`, { duration_days: banDays, reason: banReason });
      setUsers(prev => prev.map(u => u.id === banModal.id
        ? { ...u, banned_until: res.data.banned_until, ban_reason: banReason } : u));
      setBanModal(null); setBanDays(7); setBanReason('');
    } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleUnban = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/unban`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned_until: null, ban_reason: null } : u));
    } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleResetPassword = async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/reset-password`);
      setResetModal({ userId, tempPassword: res.data.temp_password });
    } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Supprimer définitivement ${u.email} et toutes ses données ?`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setStats(prev => ({ ...prev, users: prev.users - 1 }));
    } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  // ── Actions catégories ────────────────────────────────────────────────────
  const handleCreateCat = async (e) => {
    e.preventDefault(); setCatError('');
    try {
      const res = await api.post('/admin/categories', catForm);
      setCategories(prev => [...prev, res.data]);
      setCatForm({ name: '', type: 'expense' });
    } catch (e) { setCatError(e.response?.data?.message || 'Erreur'); }
  };

  const handleUpdateCat = async (cat) => {
    try {
      await api.put(`/admin/categories/${cat.id}`, { name: cat.name, type: cat.type });
      setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
      setEditingCat(null);
    } catch (e) { setCatError(e.response?.data?.message || 'Erreur'); }
  };

  const handleDeleteCat = async (catId) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/admin/categories/${catId}`);
      setCategories(prev => prev.filter(c => c.id !== catId));
    } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  if (loading) return <div className="admin-loading">Chargement du back office...</div>;
  if (error)   return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Back Office</h1>
        <p className="admin-subtitle">Administration de Budget Manager</p>
      </div>

      {/* ONGLETS */}
      <div className="admin-tabs">
        {[
          { key: 'stats',      icon: <BarChart2 size={15}/>,   label: 'Vue globale' },
          { key: 'users',      icon: <Users size={15}/>,       label: `Utilisateurs (${users.length})` },
          { key: 'categories', icon: <Tag size={15}/>,         label: `Catégories (${categories.length})` },
          { key: 'logs',       icon: <ScrollText size={15}/>,  label: `Journal (${logs.length})` },
        ].map(t => (
          <button key={t.key} className={`admin-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══ VUE GLOBALE ═══════════════════════════════════════════════════════ */}
      {activeTab === 'stats' && (
        <div>
          {/* Alertes */}
          {alerts.length > 0 && (
            <div className="alerts-box">
              <div className="alerts-title"><AlertTriangle size={16}/> Alertes de sécurité</div>
              {alerts.map((a, i) => (
                <div key={i} className={`alert-item alert-${a.type}`}>{a.message}</div>
              ))}
            </div>
          )}

          {/* Stats cards */}
          <div className="admin-stats-grid">
            {[
              { label: 'Utilisateurs',   value: stats.users,        sub: `${stats.activeUsers} actifs`,       color: '#7c3aed', bg: '#ede9fe' },
              { label: 'Transactions',   value: stats.transactions,  sub: 'toutes confondues',                color: '#2563eb', bg: '#dbeafe' },
              { label: 'Objectifs',      value: stats.goals,         sub: 'créés par les users',              color: '#16a34a', bg: '#dcfce7' },
              { label: 'Catégories',     value: stats.categories,    sub: 'disponibles',                      color: '#ca8a04', bg: '#fef9c3' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}><BarChart2 size={20}/></div>
                <div className="admin-stat-value">{s.value}</div>
                <div className="admin-stat-label">{s.label}</div>
                <div className="admin-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="timeline-grid">
            <div className="section-card-admin">
              <BarChart data={timeline.users} color="#7c3aed" label="Inscriptions par mois" />
            </div>
            <div className="section-card-admin">
              <BarChart data={timeline.transactions} color="#2563eb" label="Transactions par mois" />
            </div>
          </div>
        </div>
      )}

      {/* ═══ UTILISATEURS ══════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="admin-section">
          {/* Barre de recherche + filtres */}
          <div className="users-toolbar">
            <input
              className="users-search"
              type="text"
              placeholder="Rechercher par email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="filter-btns">
              {[
                { key: 'all',      label: 'Tous' },
                { key: 'active',   label: 'Actifs' },
                { key: 'inactive', label: 'Inactifs' },
                { key: 'banned',   label: 'Bannis' },
                { key: 'admin',    label: 'Admins' },
              ].map(f => (
                <button key={f.key} className={`filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-notice">Les données financières privées des utilisateurs ne sont pas accessibles.</div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th><th>Inscription</th><th>Trans.</th><th>Obj.</th>
                <th>Statut</th><th>Rôle</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className={!u.is_active ? 'row-inactive' : isBanned(u) ? 'row-banned' : ''}>
                  <td className="user-email">
                    {u.email}
                    {isBanned(u) && (
                      <span className="ban-info">
                        Banni jusqu'au {new Date(u.banned_until).toLocaleDateString('fr-FR')}
                        {u.ban_reason && ` — ${u.ban_reason}`}
                      </span>
                    )}
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="text-center">{u.transaction_count}</td>
                  <td className="text-center">{u.goal_count}</td>
                  <td>
                    <span className={`badge ${isBanned(u) ? 'badge-banned' : u.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {isBanned(u) ? 'Banni' : u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_admin ? 'badge-admin' : 'badge-user'}`}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="action-cell">
                    {!u.is_admin && (
                      <>
                        <button className={`action-btn ${u.is_active ? 'btn-warn' : 'btn-success'}`} onClick={() => handleToggle(u)} title={u.is_active ? 'Désactiver' : 'Activer'}>
                          <Power size={13}/>
                        </button>
                        {isBanned(u) ? (
                          <button className="action-btn btn-success" onClick={() => handleUnban(u.id)} title="Lever le ban">
                            <ShieldOff size={13}/>
                          </button>
                        ) : (
                          <button className="action-btn btn-orange" onClick={() => setBanModal(u)} title="Bannir temporairement">
                            <Ban size={13}/>
                          </button>
                        )}
                        <button className="action-btn btn-edit" onClick={() => handleResetPassword(u.id)} title="Réinitialiser le mot de passe">
                          <KeyRound size={13}/>
                        </button>
                        <button className="action-btn btn-danger" onClick={() => handleDeleteUser(u)} title="Supprimer">
                          <Trash2 size={13}/>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan="7" className="text-center" style={{padding:'20px',color:'#94a3b8'}}>Aucun utilisateur trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ CATÉGORIES ════════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <div className="admin-section">
          <form className="cat-form" onSubmit={handleCreateCat}>
            <h3 className="cat-form-title"><Plus size={15}/> Nouvelle catégorie</h3>
            {catError && <div className="cat-error">{catError}</div>}
            <div className="cat-form-row">
              <input className="cat-input" type="text" placeholder="Nom" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required />
              <select className="cat-select" value={catForm.type} onChange={e => setCatForm(f => ({ ...f, type: e.target.value }))}>
                <option value="expense">Dépense</option>
                <option value="income">Revenu</option>
              </select>
              <button className="cat-btn-add" type="submit">Ajouter</button>
            </div>
          </form>
          <table className="admin-table">
            <thead><tr><th>Nom</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>{editingCat?.id === cat.id ? <input className="cat-input-inline" value={editingCat.name} onChange={e => setEditingCat(c => ({ ...c, name: e.target.value }))}/> : cat.name}</td>
                  <td>{editingCat?.id === cat.id
                    ? <select className="cat-select-inline" value={editingCat.type} onChange={e => setEditingCat(c => ({ ...c, type: e.target.value }))}><option value="expense">Dépense</option><option value="income">Revenu</option></select>
                    : <span className={`badge ${cat.type === 'income' ? 'badge-income' : 'badge-expense'}`}>{cat.type === 'income' ? 'Revenu' : 'Dépense'}</span>
                  }</td>
                  <td className="action-cell">
                    {editingCat?.id === cat.id
                      ? <><button className="action-btn btn-success" onClick={() => handleUpdateCat(editingCat)}><Check size={13}/></button><button className="action-btn btn-neutral" onClick={() => setEditingCat(null)}><X size={13}/></button></>
                      : <><button className="action-btn btn-edit" onClick={() => setEditingCat({ ...cat })}><Pencil size={13}/></button><button className="action-btn btn-danger" onClick={() => handleDeleteCat(cat.id)}><Trash2 size={13}/></button></>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ JOURNAL D'ACTIVITÉ ════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="admin-section">
          <div className="filter-btns" style={{ marginBottom: 16 }}>
            {[
              { key: 'all',      label: `Tous (${logs.length})` },
              { key: 'reset',    label: `Réinitialisations MDP (${logs.filter(l => l.action.startsWith('password_reset')).length})` },
              { key: 'login',    label: 'Connexions' },
              { key: 'register', label: 'Inscriptions' },
            ].map(f => (
              <button key={f.key} className={`filter-btn ${logFilter === f.key ? 'active' : ''}`} onClick={() => setLogFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Email</th><th>Action</th><th>IP</th><th>Détails</th></tr></thead>
            <tbody>
              {logs
                .filter(log => {
                  if (logFilter === 'all') return true;
                  if (logFilter === 'reset') return log.action.startsWith('password_reset');
                  if (logFilter === 'login') return log.action.startsWith('login');
                  if (logFilter === 'register') return log.action === 'register';
                  return true;
                })
                .map(log => {
                  const info = actionLabel[log.action] || { label: log.action, color: '#64748b' };
                  return (
                    <tr key={log.id}>
                      <td className="log-date">{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                      <td className="user-email">{log.email}</td>
                      <td><span className="log-action" style={{ color: info.color }}>{info.label}</span></td>
                      <td className="log-ip">{log.ip_address}</td>
                      <td className="log-details">{log.details || '—'}</td>
                    </tr>
                  );
                })}
              {logs.filter(log => {
                if (logFilter === 'all') return true;
                if (logFilter === 'reset') return log.action.startsWith('password_reset');
                if (logFilter === 'login') return log.action.startsWith('login');
                if (logFilter === 'register') return log.action === 'register';
                return true;
              }).length === 0 && (
                <tr><td colSpan="5" style={{padding:'20px',color:'#94a3b8',textAlign:'center'}}>Aucune activité enregistrée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ MODAL BAN ═════════════════════════════════════════════════════════ */}
      {banModal && (
        <div className="modal-overlay-admin" onClick={() => setBanModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title"><Ban size={18}/> Bannir temporairement</h3>
            <p className="modal-user">{banModal.email}</p>
            <div className="modal-field">
              <label>Durée (jours)</label>
              <input type="number" min="1" max="365" value={banDays} onChange={e => setBanDays(e.target.value)} className="modal-input"/>
            </div>
            <div className="modal-field">
              <label>Raison (optionnel)</label>
              <input type="text" placeholder="Ex: comportement suspect" value={banReason} onChange={e => setBanReason(e.target.value)} className="modal-input"/>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setBanModal(null)}>Annuler</button>
              <button className="modal-btn-confirm danger" onClick={handleBan}>Confirmer le ban</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL RESET MDP ═══════════════════════════════════════════════════ */}
      {resetModal && (
        <div className="modal-overlay-admin" onClick={() => setResetModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title"><KeyRound size={18}/> Mot de passe réinitialisé</h3>
            <p className="modal-notice">Communiquez ce mot de passe temporaire à l'utilisateur. Il ne sera plus accessible ensuite.</p>
            <div className="temp-password-box">
              {resetModal.tempPassword}
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(resetModal.tempPassword)}>Copier</button>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-confirm" onClick={() => setResetModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
