import { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, X, Trash2, Plus, Check, Clock, History, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import './RemindersPanel.css';

export default function RemindersPanel() {
  const [open, setOpen]             = useState(false);
  const [reminders, setReminders]   = useState([]);
  const [pending, setPending]       = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm]             = useState({ title: '', remind_at: '', notification_type: 'app' });
  const [tasks, setTasks]           = useState([]);

  const loadAll = useCallback(async () => {
    const [rr, pr, tr] = await Promise.all([
      api.get('/reminders').catch(() => ({ data: [] })),
      api.get('/reminders/pending').catch(() => ({ data: [] })),
      api.get('/tasks').catch(() => ({ data: [] })),
    ]);
    setReminders(rr.data);
    setPending(pr.data);
    setTasks(tr.data);
  }, []);

  useEffect(() => {
    loadAll();
    // Vérification toutes les 60 secondes
    const interval = setInterval(() => {
      api.get('/reminders/pending').then(r => setPending(r.data)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const dismiss = async (id) => {
    await api.patch(`/reminders/${id}/trigger`);
    setPending(prev => prev.filter(r => r.id !== id));
    setReminders(prev => prev.map(r => r.id === id ? { ...r, triggered: true } : r));
  };

  const deleteReminder = async (id) => {
    await api.delete(`/reminders/${id}`);
    setReminders(prev => prev.filter(r => r.id !== id));
    setPending(prev => prev.filter(r => r.id !== id));
  };

  const addReminder = async () => {
    if (!form.title.trim() || !form.remind_at) return;
    const res = await api.post('/reminders', form);
    setReminders(prev => [...prev, res.data]);
    setForm({ title: '', remind_at: '', notification_type: 'app' });
    setShowForm(false);
  };

  const upcoming = reminders.filter(r => !r.triggered && new Date(r.remind_at) > new Date());
  const history  = reminders.filter(r => r.triggered);
  const hasPending = pending.length > 0;

  // Formatage datetime-local minimum (maintenant)
  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="reminders-wrapper">
      {/* Bouton cloche */}
      <button className={`bell-btn ${hasPending ? 'bell-active' : ''}`} onClick={() => setOpen(o => !o)}>
        {hasPending ? <BellRing size={20} /> : <Bell size={20} />}
        {hasPending && <span className="bell-badge">{pending.length}</span>}
      </button>

      {/* Panneau */}
      {open && (
        <>
        <div className="reminders-overlay" onClick={() => setOpen(false)} />
          <div className="reminders-panel" onClick={e => e.stopPropagation()}>
            <div className="reminders-panel-header">
              <h3>Rappels</h3>
              <button className="reminders-close" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            {/* Rappels en attente */}
            {pending.length > 0 && (
              <div className="reminders-section">
                <div className="reminders-section-title pending-title">
                  <BellRing size={14} /> À lire ({pending.length})
                </div>
                {pending.map(r => (
                  <div key={r.id} className="reminder-item reminder-pending">
                    <div className="reminder-item-body">
                      <div className="reminder-item-title">{r.title}</div>
                      {r.task_title && <div className="reminder-item-sub">Tâche : {r.task_title}</div>}
                      <div className="reminder-item-date">{new Date(r.remind_at).toLocaleString('fr-FR')}</div>
                    </div>
                    <div className="reminder-item-actions">
                      <button className="reminder-dismiss" onClick={() => dismiss(r.id)} title="Marquer comme lu"><Check size={14} /></button>
                      <button className="reminder-delete" onClick={() => deleteReminder(r.id)} title="Supprimer"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rappels à venir */}
            {upcoming.length > 0 && (
              <div className="reminders-section">
                <div className="reminders-section-title">
                  <Clock size={14} /> À venir ({upcoming.length})
                </div>
                {upcoming.map(r => (
                  <div key={r.id} className="reminder-item">
                    <div className="reminder-item-body">
                      <div className="reminder-item-title">{r.title}</div>
                      {r.task_title && <div className="reminder-item-sub">Tâche : {r.task_title}</div>}
                      <div className="reminder-item-date">{new Date(r.remind_at).toLocaleString('fr-FR')}</div>
                    </div>
                    <button className="reminder-delete" onClick={() => deleteReminder(r.id)} title="Supprimer"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            {pending.length === 0 && upcoming.length === 0 && history.length === 0 && !showForm && (
              <div className="reminders-empty">Aucun rappel configuré.</div>
            )}

            {/* Historique */}
            {history.length > 0 && (
              <div className="reminders-section">
                <button className="reminders-history-toggle" onClick={() => setShowHistory(h => !h)}>
                  <History size={14} /> Historique ({history.length})
                  {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showHistory && history.map(r => (
                  <div key={r.id} className="reminder-item reminder-history">
                    <div className="reminder-item-body">
                      <div className="reminder-item-title">{r.title}</div>
                      {r.task_title && <div className="reminder-item-sub">Tâche : {r.task_title}</div>}
                      <div className="reminder-item-date">{new Date(r.remind_at).toLocaleString('fr-FR')}</div>
                    </div>
                    <button className="reminder-delete" onClick={() => deleteReminder(r.id)} title="Supprimer"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire nouveau rappel */}
            {showForm ? (
              <div className="reminder-form">
                <input
                  className="reminder-form-input"
                  placeholder="Titre du rappel"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus
                />
                <div className="reminder-form-row">
                  <label>Date et heure</label>
                  <input
                    type="datetime-local"
                    min={nowLocal()}
                    value={form.remind_at}
                    onChange={e => setForm(f => ({ ...f, remind_at: e.target.value }))}
                    className="reminder-form-input"
                  />
                </div>
                <div className="reminder-form-row">
                  <label>Tâche liée (optionnel)</label>
                  <select
                    className="reminder-form-input"
                    value={form.task_id || ''}
                    onChange={e => setForm(f => ({ ...f, task_id: e.target.value || null }))}
                  >
                    <option value="">— Aucune —</option>
                    {tasks.filter(t => t.status !== 'done').map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div className="reminder-form-row">
                  <label>Notification</label>
                  <select
                    className="reminder-form-input"
                    value={form.notification_type}
                    onChange={e => setForm(f => ({ ...f, notification_type: e.target.value }))}
                  >
                    <option value="app">📱 Dans l'application</option>
                    <option value="email">📧 Par email</option>
                    <option value="both">📱 + 📧 Les deux</option>
                  </select>
                </div>
                <div className="reminder-form-actions">
                  <button className="reminder-cancel-btn" onClick={() => { setShowForm(false); setForm({ title: '', remind_at: '', notification_type: 'app' }); }}>Annuler</button>
                  <button className="reminder-save-btn" onClick={addReminder}>Créer</button>
                </div>
              </div>
            ) : (
              <button className="reminder-add-btn" onClick={() => setShowForm(true)}>
                <Plus size={15} /> Nouveau rappel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
