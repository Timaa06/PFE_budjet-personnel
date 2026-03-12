import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, AlertCircle, Pencil, X, Check } from 'lucide-react';
import api from '../services/api';
import './NeedsManager.css';

const PRIORITY_LABEL = { high: 'Haute', medium: 'Moyenne', low: 'Basse' };
const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const CATEGORY_LABEL = { health: '❤️ Santé', finances: '💰 Finances', wellness: '🧘 Bien-être', studies: '📚 Études', other: '📌 Autre' };
const STATUS_LABEL = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé' };
const STATUS_ICON = { todo: Circle, in_progress: Clock, done: CheckCircle2 };
const STATUS_NEXT = { todo: 'in_progress', in_progress: 'done', done: 'todo' };

export default function NeedsManager() {
  const [needs, setNeeds]   = useState([]);
  const [tasks, setTasks]   = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading]   = useState(true);

  // Formulaire besoin
  const [showNeedForm, setShowNeedForm] = useState(false);
  const [needForm, setNeedForm] = useState({ title: '', description: '', priority: 'medium', category: 'other' });
  const [editNeed, setEditNeed] = useState(null);

  // Formulaire tâche
  const [showTaskForm, setShowTaskForm] = useState(null); // need_id ou 'free'
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', deadline: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [nr, tr] = await Promise.all([
      api.get('/needs').catch(() => ({ data: [] })),
      api.get('/tasks').catch(() => ({ data: [] })),
    ]);
    setNeeds(nr.data);
    setTasks(tr.data);
    setLoading(false);
  };

  const tasksFor = (needId) => tasks.filter(t => t.need_id === needId);
  const freeTasks = tasks.filter(t => !t.need_id);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  /* ── BESOINS ── */
  const submitNeed = async () => {
    if (!needForm.title.trim()) return;
    if (editNeed) {
      await api.put(`/needs/${editNeed.id}`, needForm);
      setNeeds(prev => prev.map(n => n.id === editNeed.id ? { ...n, ...needForm } : n));
      setEditNeed(null);
    } else {
      const res = await api.post('/needs', needForm);
      setNeeds(prev => [...prev, res.data]);
    }
    setNeedForm({ title: '', description: '', priority: 'medium', category: 'other' });
    setShowNeedForm(false);
  };

  const deleteNeed = async (id) => {
    await api.delete(`/needs/${id}`);
    setNeeds(prev => prev.filter(n => n.id !== id));
    setTasks(prev => prev.filter(t => t.need_id !== id));
  };

  const startEditNeed = (need) => {
    setEditNeed(need);
    setNeedForm({ title: need.title, description: need.description || '', priority: need.priority, category: need.category });
    setShowNeedForm(true);
  };

  /* ── TÂCHES ── */
  const submitTask = async (needId) => {
    if (!taskForm.title.trim()) return;
    const res = await api.post('/tasks', { ...taskForm, need_id: needId || null });
    setTasks(prev => [...prev, res.data]);
    setTaskForm({ title: '', description: '', priority: 'medium', deadline: '' });
    setShowTaskForm(null);
  };

  const cycleStatus = async (task) => {
    const next = STATUS_NEXT[task.status];
    await api.patch(`/tasks/${task.id}/status`, { status: next });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  /* ── RENDER ── */
  const TaskItem = ({ task }) => {
    const Icon = STATUS_ICON[task.status];
    const isOverdue = task.deadline && task.status !== 'done' && new Date(task.deadline) < new Date();
    return (
      <div className={`task-item task-${task.status}`}>
        <button className="task-status-btn" onClick={() => cycleStatus(task)} title={STATUS_LABEL[task.status]}>
          <Icon size={18} />
        </button>
        <div className="task-body">
          <span className="task-title">{task.title}</span>
          <div className="task-meta">
            <span className="task-priority" style={{ color: PRIORITY_COLOR[task.priority] }}>
              {PRIORITY_LABEL[task.priority]}
            </span>
            {task.deadline && (
              <span className={`task-deadline ${isOverdue ? 'overdue' : ''}`}>
                {isOverdue && <AlertCircle size={12} />}
                {new Date(task.deadline).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
        <button className="task-delete-btn" onClick={() => deleteTask(task.id)}><Trash2 size={14} /></button>
      </div>
    );
  };

  const TaskForm = ({ needId }) => (
    <div className="task-form">
      <input
        className="task-form-input"
        placeholder="Titre de la tâche"
        value={taskForm.title}
        onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
        onKeyDown={e => e.key === 'Enter' && submitTask(needId)}
        autoFocus
      />
      <div className="task-form-row">
        <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
          <option value="high">Haute priorité</option>
          <option value="medium">Moyenne priorité</option>
          <option value="low">Basse priorité</option>
        </select>
        <input type="date" value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))} />
      </div>
      <div className="task-form-actions">
        <button className="btn-task-cancel" onClick={() => { setShowTaskForm(null); setTaskForm({ title: '', description: '', priority: 'medium', deadline: '' }); }}><X size={14} /> Annuler</button>
        <button className="btn-task-save" onClick={() => submitTask(needId)}><Check size={14} /> Ajouter</button>
      </div>
    </div>
  );

  if (loading) return <div className="needs-loading">Chargement...</div>;

  return (
    <div className="needs-manager">
      {/* Header */}
      <div className="needs-header">
        <div>
          <h2 className="needs-title">Besoins & Tâches</h2>
          <p className="needs-subtitle">Planifiez vos besoins personnels et suivez vos tâches</p>
        </div>
        <button className="btn-add-need" onClick={() => { setShowNeedForm(true); setEditNeed(null); setNeedForm({ title: '', description: '', priority: 'medium', category: 'other' }); }}>
          <Plus size={18} /> Nouveau besoin
        </button>
      </div>

      {/* Formulaire besoin */}
      {showNeedForm && (
        <div className="need-form-card">
          <h3>{editNeed ? 'Modifier le besoin' : 'Nouveau besoin'}</h3>
          <input
            className="need-form-input"
            placeholder="Titre du besoin"
            value={needForm.title}
            onChange={e => setNeedForm(f => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="need-form-textarea"
            placeholder="Description (optionnel)"
            value={needForm.description}
            onChange={e => setNeedForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
          />
          <div className="need-form-row">
            <div>
              <label>Priorité</label>
              <select value={needForm.priority} onChange={e => setNeedForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="high">🔴 Haute</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="low">🟢 Basse</option>
              </select>
            </div>
            <div>
              <label>Catégorie</label>
              <select value={needForm.category} onChange={e => setNeedForm(f => ({ ...f, category: e.target.value }))}>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="need-form-actions">
            <button className="btn-need-cancel" onClick={() => { setShowNeedForm(false); setEditNeed(null); }}><X size={14} /> Annuler</button>
            <button className="btn-need-save" onClick={submitNeed}><Check size={14} /> {editNeed ? 'Modifier' : 'Créer'}</button>
          </div>
        </div>
      )}

      {/* Tâches libres (sans besoin) */}
      {(freeTasks.length > 0 || showTaskForm === 'free') && (
        <div className="need-card free-tasks-card">
          <div className="need-card-header" onClick={() => toggleExpand('free')}>
            <div className="need-card-left">
              <span className="need-category-badge">📋 Tâches générales</span>
              <span className="need-task-count">{freeTasks.length} tâche{freeTasks.length !== 1 ? 's' : ''}</span>
            </div>
            {expanded['free'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expanded['free'] && (
            <div className="need-tasks">
              {freeTasks.map(t => <TaskItem key={t.id} task={t} />)}
              {showTaskForm === 'free' ? <TaskForm needId={null} /> : (
                <button className="btn-add-task" onClick={() => setShowTaskForm('free')}><Plus size={14} /> Ajouter une tâche</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Besoins */}
      {needs.length === 0 && (
        <div className="needs-empty">
          <p>Aucun besoin pour l'instant.</p>
          <p>Créez votre premier besoin pour commencer à organiser vos objectifs !</p>
        </div>
      )}

      {needs.map(need => {
        const needTasks = tasksFor(need.id);
        const done = needTasks.filter(t => t.status === 'done').length;
        const pct = needTasks.length > 0 ? Math.round((done / needTasks.length) * 100) : 0;

        return (
          <div key={need.id} className="need-card">
            <div className="need-card-header" onClick={() => toggleExpand(need.id)}>
              <div className="need-card-left">
                <span className="need-category-badge">{CATEGORY_LABEL[need.category]}</span>
                <div>
                  <div className="need-card-title">{need.title}</div>
                  {need.description && <div className="need-card-desc">{need.description}</div>}
                </div>
              </div>
              <div className="need-card-right">
                <span className="need-priority-badge" style={{ background: PRIORITY_COLOR[need.priority] + '22', color: PRIORITY_COLOR[need.priority] }}>
                  {PRIORITY_LABEL[need.priority]}
                </span>
                {needTasks.length > 0 && (
                  <div className="need-progress">
                    <div className="need-progress-bar">
                      <div className="need-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="need-progress-label">{done}/{needTasks.length}</span>
                  </div>
                )}
                <button className="need-edit-btn" onClick={e => { e.stopPropagation(); startEditNeed(need); }}><Pencil size={14} /></button>
                <button className="need-delete-btn" onClick={e => { e.stopPropagation(); deleteNeed(need.id); }}><Trash2 size={14} /></button>
                {expanded[need.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {expanded[need.id] && (
              <div className="need-tasks">
                {needTasks.length === 0 && <p className="no-tasks">Aucune tâche — cliquez sur "Ajouter une tâche"</p>}
                {needTasks.map(t => <TaskItem key={t.id} task={t} />)}
                {showTaskForm === need.id ? <TaskForm needId={need.id} /> : (
                  <button className="btn-add-task" onClick={() => { setShowTaskForm(need.id); setTaskForm({ title: '', description: '', priority: 'medium', deadline: '' }); }}>
                    <Plus size={14} /> Ajouter une tâche
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Bouton "tâche libre" si pas de besoins */}
      {needs.length === 0 && showTaskForm !== 'free' && (
        <button className="btn-free-task" onClick={() => setShowTaskForm('free')}>
          <Plus size={16} /> Ajouter une tâche sans besoin
        </button>
      )}
    </div>
  );
}
