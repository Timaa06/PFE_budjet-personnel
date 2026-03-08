import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Target, Plus, CheckCircle, Calendar, TrendingUp, Trash2,
  Wallet, BarChart2, RotateCcw, BookOpen, Archive, Lightbulb,
  Check, AlertTriangle, PieChart, BadgeDollarSign, Trophy
} from 'lucide-react';
import './GoalList.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function GoalList() {
  const [goals, setGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [deletedGoals, setDeletedGoals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [fundsAmount, setFundsAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawFromGoal, setWithdrawFromGoal] = useState('');
  const [piggyAnimation, setPiggyAnimation] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [dailyTip, setDailyTip] = useState('');

  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    current_amount: 0,
    deadline: ''
  });

  useEffect(() => {
    fetchGoals();
    loadHistory();
  }, []);

  const generateTip = (monthly, category, activeGoals, completed, progress) => {
    const tips = [];
    const totalIncome = monthly.reduce((s, m) => s + (m.income || 0), 0);
    const totalExpense = monthly.reduce((s, m) => s + (m.expense || 0), 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : null;
    const topCat = category[0];
    const topCatPct = topCat && totalExpense > 0 ? (parseFloat(topCat.total) / totalExpense) * 100 : 0;
    const now = new Date();
    const nearDeadline = activeGoals.filter(g => {
      if (!g.deadline) return false;
      const days = (new Date(g.deadline) - now) / 86400000;
      return days > 0 && days <= 30;
    });

    if (savingsRate !== null && savingsRate < 0)
      tips.push(`⚠️ Vos dépenses dépassent vos revenus ce mois-ci. Identifiez les postes non essentiels à réduire en priorité.`);
    if (savingsRate !== null && savingsRate >= 0 && savingsRate < 10)
      tips.push(`📉 Votre taux d'épargne est de ${savingsRate.toFixed(0)}% — un peu faible. Visez 15-20% en réduisant vos dépenses variables.`);
    if (savingsRate !== null && savingsRate >= 20)
      tips.push(`🎉 Excellent ! Votre taux d'épargne de ${savingsRate.toFixed(0)}% est très sain. Pensez à investir une partie de cet excédent.`);
    if (topCat && topCatPct > 40)
      tips.push(`🔍 La catégorie "${topCat.category}" représente ${topCatPct.toFixed(0)}% de vos dépenses. Cherchez à diversifier ou réduire ce poste.`);
    if (progress < 20 && activeGoals.length > 0)
      tips.push(`🎯 Vous avez épargné ${progress}% de vos objectifs. Programmez un virement automatique mensuel pour progresser régulièrement.`);
    if (progress >= 50 && progress < 100)
      tips.push(`💪 Vous avez atteint ${progress}% de vos objectifs d'épargne — continuez sur cette lancée !`);
    if (progress === 100 && activeGoals.length > 0)
      tips.push(`🏆 Tous vos objectifs sont atteints ! C'est le bon moment pour définir de nouveaux défis financiers.`);
    if (nearDeadline.length > 0)
      tips.push(`⏰ L'objectif "${nearDeadline[0].name}" arrive à échéance dans moins de 30 jours. Pensez à abonder votre épargne avant la date limite.`);
    if (completed.length >= 3)
      tips.push(`🌟 Vous avez déjà complété ${completed.length} objectifs — vous êtes un épargnant discipliné !`);
    if (activeGoals.length === 0)
      tips.push(`💡 Vous n'avez aucun objectif actif. Définissez-en un dès aujourd'hui pour donner une direction à votre épargne.`);

    const fallbacks = [
      `💡 Automatisez votre épargne : programmez un virement le jour de votre salaire vers un compte dédié.`,
      `💡 La règle 50/30/20 : 50% pour les besoins, 30% pour les envies, 20% pour l'épargne.`,
      `💡 Révisez vos abonnements régulièrement — les petites dépenses récurrentes s'accumulent vite.`,
      `💡 Un fonds d'urgence de 3 à 6 mois de dépenses est indispensable avant tout investissement.`,
    ];

    const pool = tips.length > 0 ? tips : fallbacks;
    const sessionKey = 'tip_date_' + now.toDateString();
    const stored = sessionStorage.getItem('tip_text');
    const storedDate = sessionStorage.getItem('tip_date');
    if (stored && storedDate === sessionKey) return stored;
    const idx = Math.floor(Math.random() * pool.length);
    sessionStorage.setItem('tip_text', pool[idx]);
    sessionStorage.setItem('tip_date', sessionKey);
    return pool[idx];
  };

  const fetchGoals = async () => {
    try {
      const [goalsRes, monthlyRes, categoryRes] = await Promise.all([
        api.get('/goals'),
        api.get('/stats/monthly').catch(() => ({ data: [] })),
        api.get('/stats/by-category').catch(() => ({ data: [] })),
      ]);
      const allGoals = goalsRes.data;
      const active = allGoals.filter(g => g.status === 'active' || !g.status);
      const completed = allGoals.filter(g => g.status === 'completed');
      const deleted = allGoals.filter(g => g.status === 'deleted');
      setGoals(active);
      setCompletedGoals(completed);
      setDeletedGoals(deleted);
      const totalT = active.reduce((s, g) => s + parseFloat(g.target_amount || 0), 0);
      const totalS = active.reduce((s, g) => s + parseFloat(g.current_amount || 0), 0);
      const prog = totalT > 0 ? Math.round((totalS / totalT) * 100) : 0;
      setDailyTip(generateTip(monthlyRes.data || [], categoryRes.data || [], active, completed, prog));
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const loadHistory = () => {
    const saved = localStorage.getItem('tirelire_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  };

  const addToHistory = (action, amount, goalName, message) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      action,
      amount,
      goalName,
      message
    };
    const updated = [newEntry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('tirelire_history', JSON.stringify(updated));
  };

  const totalSaved = goals.reduce((sum, goal) => sum + parseFloat(goal.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + parseFloat(goal.target_amount || 0), 0);
  const globalProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const getEncouragementMessage = (amount) => {
    if (amount >= 1000) return { emoji: '🎉', text: 'INCROYABLE ! Champion de l\'épargne !' };
    if (amount >= 500) return { emoji: '🚀', text: 'Excellent ! Tu es sur la bonne voie !' };
    if (amount >= 200) return { emoji: '💪', text: 'Super ! Ta tirelire grossit !' };
    if (amount >= 100) return { emoji: '🌟', text: 'Bravo ! Continue comme ça !' };
    return { emoji: '👍', text: 'Bien joué ! Chaque euro compte !' };
  };

  const getWithdrawMessage = (amount) => {
    if (amount >= 1000) return { emoji: '🚨', text: 'ALERTE ! Le cochon pleure ! 😭' };
    if (amount >= 500) return { emoji: '😅', text: 'Oh oh... Attention à ta tirelire !' };
    if (amount >= 200) return { emoji: '🤔', text: 'Hmm... Tu es sûr(e) ?' };
    return { emoji: '💸', text: 'Ok ok, un petit retrait...' };
  };

  const getProgressMessage = (progress) => {
    if (progress >= 100) return { emoji: '🎊', text: 'OBJECTIF ATTEINT ! TU ES UN(E) CHAMPION(NE) !' };
    if (progress >= 90) return { emoji: '🎯', text: 'La ligne d\'arrivée est proche !' };
    if (progress >= 75) return { emoji: '⭐', text: 'Plus que 25% ! Tu y es presque !' };
    if (progress >= 50) return { emoji: '🔥', text: 'À mi-chemin ! Tu assures !' };
    if (progress >= 25) return { emoji: '🌱', text: 'Bon début ! Continue comme ça !' };
    return { emoji: '💪', text: 'C\'est parti ! Tu peux le faire !' };
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/goals', newGoal);
      setNewGoal({ name: '', target_amount: '', current_amount: 0, deadline: '' });
      setShowAddModal(false);
      fetchGoals();
      toast.success('🎯 Nouvel objectif créé !');
    } catch (error) {
      console.error('Erreur ajout objectif:', error);
      toast.error('❌ Erreur lors de l\'ajout');
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!fundsAmount || parseFloat(fundsAmount) <= 0) {
      toast.error('❌ Montant invalide');
      return;
    }

    try {
      setPiggyAnimation('happy');
      setTimeout(() => setPiggyAnimation('idle'), 2000);

      const categoriesRes = await api.get('/categories');
      const epargneCategory = categoriesRes.data.find(cat => cat.name === 'Épargne');
      
      if (!epargneCategory) {
        toast.error('❌ Catégorie Épargne introuvable');
        return;
      }

      await api.post('/transactions', {
        type: 'expense',
        amount: parseFloat(fundsAmount),
        category_id: epargneCategory.id,
        description: `Épargne pour ${selectedGoal.name}`,
        date: new Date().toISOString().split('T')[0]
      });

      await api.patch(`/goals/${selectedGoal.id}/add`, { amount: parseFloat(fundsAmount) });

      const encouragement = getEncouragementMessage(parseFloat(fundsAmount));
      const updatedGoal = await api.get(`/goals/${selectedGoal.id}`);
      const progressMsg = getProgressMessage(updatedGoal.data.progress);

      addToHistory('add', parseFloat(fundsAmount), selectedGoal.name, encouragement.text);

      toast.success(`${encouragement.emoji} ${encouragement.text}`);
      
      if (updatedGoal.data.progress >= 100) {
        setTimeout(() => {
          setPiggyAnimation('party');
          toast.success(`${progressMsg.emoji} ${progressMsg.text}`, { autoClose: 5000 });
        }, 1000);
      } else {
        setTimeout(() => {
          toast.info(`${progressMsg.emoji} ${progressMsg.text}`);
        }, 1000);
      }

      setShowAddFundsModal(false);
      setFundsAmount('');
      setSelectedGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Erreur ajout fonds:', error);
      toast.error('❌ Erreur lors de l\'ajout des fonds');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error('❌ Montant invalide');
      return;
    }

    const goalToWithdraw = goals.find(g => g.id === parseInt(withdrawFromGoal));
    if (!goalToWithdraw) {
      toast.error('❌ Objectif introuvable');
      return;
    }

    if (amount > parseFloat(goalToWithdraw.current_amount)) {
      toast.error('❌ Montant supérieur à l\'épargne disponible');
      return;
    }

    try {
      setPiggyAnimation('crying');
      setTimeout(() => setPiggyAnimation('idle'), 2000);

      const categoriesRes = await api.get('/categories');
      let retraitCategory = categoriesRes.data.find(cat => cat.name === 'Retrait épargne');
      
      if (!retraitCategory) {
        const newCat = await api.post('/categories', { name: 'Retrait épargne', type: 'income' });
        retraitCategory = newCat.data;
      }

      await api.post('/transactions', {
        type: 'income',
        amount: amount,
        category_id: retraitCategory.id,
        description: `Retrait épargne - ${goalToWithdraw.name}`,
        date: new Date().toISOString().split('T')[0]
      });

      const newAmount = parseFloat(goalToWithdraw.current_amount) - amount;
      await api.put(`/goals/${goalToWithdraw.id}`, {
        ...goalToWithdraw,
        current_amount: newAmount
      });

      const withdrawMsg = getWithdrawMessage(amount);
      addToHistory('withdraw', amount, goalToWithdraw.name, withdrawMsg.text);

      toast.warning(`${withdrawMsg.emoji} ${withdrawMsg.text}`);

      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawFromGoal('');
      fetchGoals();
    } catch (error) {
      console.error('Erreur retrait:', error);
      toast.error('❌ Erreur lors du retrait');
    }
  };

  const handleMarkCompleted = async (goal) => {
    try {
      await api.put(`/goals/${goal.id}`, { 
        ...goal, 
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      toast.success('✅ Objectif marqué comme complété !');
      fetchGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur');
    }
  };

  const handleUseGoal = async (goal) => {
    if (!window.confirm(`Utiliser les ${parseFloat(goal.current_amount).toFixed(2)}€ de "${goal.name}" ?`)) {
      return;
    }

    try {
      setPiggyAnimation('party');
      setTimeout(() => setPiggyAnimation('idle'), 3000);

      const categoriesRes = await api.get('/categories');
      let retraitCategory = categoriesRes.data.find(cat => cat.name === 'Retrait épargne');
      
      if (!retraitCategory) {
        const newCat = await api.post('/categories', { name: 'Retrait épargne', type: 'income' });
        retraitCategory = newCat.data;
      }

      await api.post('/transactions', {
        type: 'income',
        amount: parseFloat(goal.current_amount),
        category_id: retraitCategory.id,
        description: `Utilisation épargne - ${goal.name}`,
        date: new Date().toISOString().split('T')[0]
      });

      await api.put(`/goals/${goal.id}`, { 
        ...goal, 
        status: 'completed', 
        current_amount: 0,
        completed_at: new Date().toISOString()
      });

      addToHistory('use', parseFloat(goal.current_amount), goal.name, 'Objectif utilisé !');

      toast.success('🎉 Épargne utilisée ! Profite bien !');
      fetchGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur');
    }
  };

  const handleDeleteGoal = async (goal) => {
    if (!window.confirm(`Archiver l'objectif "${goal.name}" ?`)) {
      return;
    }

    try {
      await api.put(`/goals/${goal.id}`, { ...goal, status: 'deleted' });
      toast.info('📦 Objectif archivé');
      fetchGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur');
    }
  };

  const handleRestoreGoal = async (goal) => {
    try {
      await api.put(`/goals/${goal.id}`, { ...goal, status: 'active' });
      toast.success('♻️ Objectif restauré !');
      fetchGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur');
    }
  };

  const chartData = {
    labels: goals.map(g => g.name),
    datasets: [{
      data: goals.map(g => parseFloat(g.current_amount || 0)),
      backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${value.toFixed(2)}€ (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return <div className="loading">Chargement des objectifs...</div>;
  }

  return (
    <div className="goals-page">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* SECTION TIRELIRE */}
      <div className="tirelire-section">
        <div className="tirelire-header">
          <h2> MA TIRELIRE VIRTUELLE</h2>
        </div>

        <div className="tirelire-content">
          <div className={`piggy-animation ${piggyAnimation}`}>
            <div className="piggy">
              {piggyAnimation === 'idle' && '🐷'}
              {piggyAnimation === 'happy' && '😊🐷'}
              {piggyAnimation === 'crying' && '😭🐷'}
              {piggyAnimation === 'party' && '🎉🐷🎊'}
            </div>
          </div>

          <div className="tirelire-amount">
            <div className="amount-big">{totalSaved.toFixed(2)} €</div>
            <div className="amount-label"><BadgeDollarSign size={14} /> Épargné au total</div>
          </div>

          {goals.length > 0 ? (
            <div className="tirelire-chart">
              <h3><PieChart size={16} /> Répartition de ton épargne</h3>
              <div className="chart-container">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </div>
          ) : (
            <div className="no-chart">
              <p>Crée ton premier objectif pour voir la répartition !</p>
            </div>
          )}

          <div className="tirelire-actions">
            <button 
              className="btn-action secondary"
              onClick={() => setShowWithdrawModal(true)}
              disabled={totalSaved === 0}
            >
              <Wallet size={15} /> Retirer de l'épargne
            </button>
            <button
              className="btn-action secondary"
              onClick={() => setShowHistoryModal(true)}
            >
              <BarChart2 size={15} /> Historique
            </button>
          </div>
        </div>
      </div>

      {/* CARTES RÉCAP */}
      <div className="goals-summary">
        <div className="summary-card">
          <span className="summary-label">Total économisé</span>
          <span className="summary-value">{totalSaved.toFixed(2)} €</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Objectif total</span>
          <span className="summary-value">{totalTarget.toFixed(2)} €</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Progression globale</span>
          <span className="summary-value">{globalProgress}%</span>
        </div>
      </div>

      {/* OBJECTIFS EN COURS */}
      <div className="goals-header">
        <div>
          <h1><Target size={22} /> Mes objectifs en cours</h1>
          <p className="subtitle">{goals.length} objectifs actifs</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={15} /> Nouvel objectif
        </button>
      </div>

      <div className="goals-grid">
        {goals.map(goal => {
          const progress = goal.progress || 0;
          const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
          const isCompleted = progress >= 100;

          return (
            <div key={goal.id} className={`goal-card ${isCompleted ? 'completed' : ''}`}>
              <div className="goal-header">
                <h3>{goal.name}</h3>
                <span className="goal-icon">{isCompleted ? <CheckCircle size={20} color="#10b981" /> : <Target size={20} />}</span>
              </div>

              <div className="goal-progress-section">
                <div className="progress-label">
                  <span>Progression</span>
                  <span className="progress-percent">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <div className="goal-amounts">
                <div className="amount-item">
                  <span className="amount-label">Actuel</span>
                  <span className="amount-value">{parseFloat(goal.current_amount).toFixed(2)} €</span>
                </div>
                <div className="amount-item">
                  <span className="amount-label">Objectif</span>
                  <span className="amount-value">{parseFloat(goal.target_amount).toFixed(2)} €</span>
                </div>
                <div className="amount-item">
                  <span className="amount-label">Restant</span>
                  <span className="amount-value">{remaining.toFixed(2)} €</span>
                </div>
              </div>

              {goal.deadline && (
                <div className="goal-deadline">
                  <div className="deadline-item">
                    <Calendar size={14} />
                    <span>Échéance</span>
                    <span className="deadline-date">
                      {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              )}

              <div className="goal-actions">
                {!isCompleted ? (
                  <>
                    <button 
                      className="btn-add-funds"
                      onClick={() => { setSelectedGoal(goal); setShowAddFundsModal(true); }}
                    >
                      <TrendingUp size={15} /> Ajouter des fonds
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteGoal(goal)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn-completed"
                      onClick={() => handleMarkCompleted(goal)}
                    >
                      <CheckCircle size={15} /> Marquer complété
                    </button>
                    <button 
                      className="btn-use"
                      onClick={() => handleUseGoal(goal)}
                    >
                      <Wallet size={15} /> Utiliser l'épargne
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="no-goals">
            <p><Target size={18} /> Aucun objectif financier pour le moment</p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Créer mon premier objectif
            </button>
          </div>
        )}
      </div>

      {/* PALMARÈS — OBJECTIFS ATTEINTS */}
      {completedGoals.length > 0 && (
        <>
          {/* BANNIÈRE STATS */}
          <div className="palmares-banner">
            <div className="palmares-stat">
              <span className="palmares-num">{completedGoals.length}</span>
              <span className="palmares-label">Objectif{completedGoals.length > 1 ? 's' : ''} atteint{completedGoals.length > 1 ? 's' : ''}</span>
            </div>
            <div className="palmares-divider" />
            <div className="palmares-stat">
              <span className="palmares-num">
                {completedGoals.reduce((s, g) => s + parseFloat(g.target_amount || 0), 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </span>
              <span className="palmares-label">Total économisé</span>
            </div>
            <div className="palmares-divider" />
            <div className="palmares-stat">
              <span className="palmares-num">
                {completedGoals.reduce((s, g) => s + parseFloat(g.target_amount || 0), 0) > 0
                  ? Math.round(completedGoals.reduce((s, g) => s + parseFloat(g.target_amount || 0), 0) / completedGoals.length).toLocaleString('fr-FR')
                  : 0} €
              </span>
              <span className="palmares-label">Moyenne par objectif</span>
            </div>
          </div>

          {/* HEADER */}
          <div className="section-header palmares">
            <h2><Trophy size={18} /> PALMARÈS — OBJECTIFS ATTEINTS ({completedGoals.length})</h2>
          </div>

          {/* GRILLE TROPHÉES */}
          <div className="palmares-grid">
            {completedGoals.map(goal => {
              const amount = parseFloat(goal.target_amount || 0);
              const medal = amount >= 1000
                ? { color: '#d97706', border: '#fbbf24', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', label: 'Or' }
                : amount >= 500
                ? { color: '#64748b', border: '#cbd5e1', bg: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', label: 'Argent' }
                : { color: '#92400e', border: '#fde68a', bg: 'linear-gradient(135deg, #fefce8, #fef9c3)', label: 'Bronze' };
              return (
                <div key={goal.id} className="trophy-card" style={{ background: medal.bg, borderColor: medal.border }}>
                  <div className="trophy-top">
                    <div className="trophy-icon" style={{ color: medal.color }}>
                      <Trophy size={32} />
                    </div>
                    <span className="medal-label" style={{ background: medal.border, color: medal.color }}>{medal.label}</span>
                  </div>
                  <h3 className="trophy-name">{goal.name}</h3>
                  <div className="trophy-amount" style={{ color: medal.color }}>{amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                  <div className="trophy-date">
                    <Calendar size={12} />
                    {goal.completed_at
                      ? new Date(goal.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Date inconnue'}
                  </div>
                  <div className="trophy-actions">
                    {parseFloat(goal.current_amount || 0) > 0 && (
                      <button className="btn-use-small" onClick={() => handleUseGoal(goal)}>
                        <Wallet size={12} /> Utiliser
                      </button>
                    )}
                    <button className="btn-restore-small" onClick={() => handleRestoreGoal(goal)}>
                      <RotateCcw size={12} /> Réactiver
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* BOUTON HISTORIQUE */}
      {deletedGoals.length > 0 && (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <button 
            className="btn-show-history"
            onClick={() => setShowHistory(!showHistory)}
          >
            <BookOpen size={15} /> {showHistory ? 'Masquer' : 'Voir'} l'historique ({deletedGoals.length} objectifs archivés)
          </button>
        </div>
      )}

      {/* OBJECTIFS ARCHIVÉS */}
      {showHistory && deletedGoals.length > 0 && (
        <>
          <div className="section-header deleted">
            <h2><Archive size={18} /> HISTORIQUE DES OBJECTIFS ARCHIVÉS</h2>
          </div>
          <div className="archived-list">
            {deletedGoals.map(goal => (
              <div key={goal.id} className="archived-item deleted">
                <div className="archived-info">
                  <span className="archived-badge"><Archive size={13} /> ARCHIVÉ</span>
                  <h4>{goal.name}</h4>
                  <div className="archived-details">
                    <p>💰 {parseFloat(goal.current_amount).toFixed(2)} € épargné sur {parseFloat(goal.target_amount).toFixed(2)} €</p>
                    <p>📊 Progression : {goal.progress || 0}%</p>
                  </div>
                </div>
                <div className="archived-actions">
                  <button className="btn-restore" onClick={() => handleRestoreGoal(goal)}>
                    <RotateCcw size={14} /> Réactiver
                  </button>
                  <button
                    className="btn-delete-permanent" 
                    onClick={async () => {
                      if (window.confirm(`Supprimer définitivement "${goal.name}" ? Cette action est irréversible.`)) {
                        try {
                          await api.delete(`/goals/${goal.id}`);
                          toast.success('🗑️ Objectif supprimé définitivement');
                          fetchGoals();
                        } catch (error) {
                          toast.error('❌ Erreur');
                        }
                      }
                    }}
                  >
                    <Trash2 size={14} /> Supprimer définitivement
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CONSEIL DU JOUR */}
      <div className="tip-box">
        <div className="tip-header">
          <span className="tip-icon"><Lightbulb size={18} /></span>
          <span className="tip-title">Conseil du jour</span>
        </div>
        <p className="tip-content">{dailyTip}</p>
      </div>

      {/* MODALS */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2><Target size={20} /> Nouvel objectif</h2>
            <form onSubmit={handleAddGoal}>
              <div className="form-group">
                <label>Nom de l'objectif</label>
                <input
                  type="text"
                  placeholder="Ex: Vacances d'été 2026"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Montant cible (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2000"
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date limite (optionnelle)</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                />
              </div>
              <button type="submit" className="btn-primary">
                <Check size={15} /> Créer l'objectif
              </button>
            </form>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
          </div>
        </div>
      )}

      {showAddFundsModal && selectedGoal && (
        <div className="modal-overlay" onClick={() => setShowAddFundsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2><TrendingUp size={20} /> Ajouter des fonds</h2>
            <p className="modal-subtitle">Objectif : {selectedGoal.name}</p>
            <form onSubmit={handleAddFunds}>
              <div className="form-group">
                <label>Montant à ajouter (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="100"
                  value={fundsAmount}
                  onChange={(e) => setFundsAmount(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                <Check size={15} /> Ajouter {fundsAmount ? parseFloat(fundsAmount).toFixed(2) : '0'} €
              </button>
            </form>
            <button className="modal-close" onClick={() => setShowAddFundsModal(false)}>✕</button>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2><Wallet size={20} /> Retirer de l'épargne</h2>
            <p className="modal-subtitle">Montant disponible : {totalSaved.toFixed(2)} €</p>
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label>Montant à retirer (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="100"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Depuis quel objectif ?</label>
                <select
                  value={withdrawFromGoal}
                  onChange={(e) => setWithdrawFromGoal(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un objectif --</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name} ({parseFloat(goal.current_amount).toFixed(2)} €)
                    </option>
                  ))}
                </select>
              </div>
              <div className="warning-box">
                <AlertTriangle size={14} /> Cet argent retournera dans ton solde disponible
              </div>
              <button type="submit" className="btn-primary">
                <Check size={15} /> Retirer {withdrawAmount ? parseFloat(withdrawAmount).toFixed(2) : '0'} €
              </button>
            </form>
            <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>✕</button>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>📊 Historique de la tirelire</h2>
            <div className="history-list">
              {history.length > 0 ? (
                history.map(entry => (
                  <div key={entry.id} className={`history-item ${entry.action}`}>
                    <div className="history-date">
                      📅 {new Date(entry.date).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="history-details">
                      {entry.action === 'add' && (
                        <span className="history-amount positive">+{entry.amount.toFixed(2)} €</span>
                      )}
                      {(entry.action === 'withdraw' || entry.action === 'use') && (
                        <span className="history-amount negative">-{entry.amount.toFixed(2)} €</span>
                      )}
                      <span className="history-goal">→ {entry.goalName}</span>
                    </div>
                    <div className="history-message">{entry.message}</div>
                  </div>
                ))
              ) : (
                <div className="no-history">
                  <p>📭 Aucun historique pour le moment</p>
                </div>
              )}
            </div>
            <button className="modal-close" onClick={() => setShowHistoryModal(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalList;
