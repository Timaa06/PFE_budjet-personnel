import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Wallet, TrendingUp, TrendingDown, Target, PiggyBank, ShieldCheck } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, transactionsRes, goalsRes] = await Promise.all([
        api.get('/stats/summary'),
        api.get('/transactions'),
        api.get('/goals')
      ]);

      setSummary(summaryRes.data);
      
      const recent = transactionsRes.data
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setRecentTransactions(recent);

      const expenses = transactionsRes.data
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const existing = acc.find(item => item.category === t.category_name);
          if (existing) {
            existing.amount += parseFloat(t.amount);
          } else {
            acc.push({ category: t.category_name, amount: parseFloat(t.amount) });
          }
          return acc;
        }, [])
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      setTopExpenses(expenses);

      setGoals(goalsRes.data.filter(g => g.status !== 'deleted'));
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const balance = (summary?.total_income || 0) - (summary?.total_expense || 0);
  const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
  const totalSaved = goals.reduce((sum, goal) => sum + parseFloat(goal.current_amount || 0), 0);
  const availableBalance = balance - totalSaved;
  const goalsProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => {
        const p = parseFloat(g.target_amount) > 0
          ? (parseFloat(g.current_amount || 0) / parseFloat(g.target_amount)) * 100
          : 0;
        return sum + p;
      }, 0) / activeGoals.length)
    : 0;

  const totalIncome = summary?.total_income || 0;
  const totalExpense = summary?.total_expense || 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const scoreEpargne  = Math.min(Math.max((savingsRate / 30) * 40, 0), 40);
  const scoreObjectifs = activeGoals.length > 0 ? (goalsProgress / 100) * 30 : 15;
  const scoreBalance  = balance > 0 ? Math.min((balance / Math.max(totalIncome, 1)) * 30, 30) : 0;
  const healthScore = Math.round(scoreEpargne + scoreObjectifs + scoreBalance);

  const getHealthLabel = (s) => {
    if (s >= 80) return { label: 'Excellente', color: '#10b981' };
    if (s >= 60) return { label: 'Bonne',      color: '#3b82f6' };
    if (s >= 40) return { label: 'Passable',   color: '#f59e0b' };
    return           { label: 'Fragile',      color: '#ef4444' };
  };
  const health = getHealthLabel(healthScore);

  const RADIUS = 68;
  const CIRC = 2 * Math.PI * RADIUS;
  const offset = CIRC - (healthScore / 100) * CIRC;

  return (
    <div className="dashboard">
      {/* CARTES STATS */}
      <div className="dashboard-stats-grid">
        {/* SOLDE DISPONIBLE */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Solde disponible</span>
            <div className="stat-icon">
              <Wallet size={20} />
            </div>
          </div>
          <div className="stat-value">{availableBalance.toFixed(2)} €</div>
          <div className="stat-trend positive">Argent dépensable</div>
        </div>

        {/* TIRELIRE */}
        <div className="stat-card tirelire">
          <div className="stat-header">
            <span className="stat-label">Tirelire (Épargne)</span>
            <div className="stat-icon piggy">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="stat-value">{totalSaved.toFixed(2)} €</div>
          <div className="stat-trend success">Argent mis de côté</div>
        </div>

        {/* REVENUS */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Revenus</span>
            <div className="stat-icon success">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">{(summary?.total_income || 0).toFixed(2)} €</div>
          <div className="stat-count">+{summary?.income_count || 0} transactions</div>
        </div>

        {/* DÉPENSES */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Dépenses</span>
            <div className="stat-icon danger">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-value">{(summary?.total_expense || 0).toFixed(2)} €</div>
          <div className="stat-count danger">↘ {summary?.expense_count || 0} transactions</div>
        </div>

        {/* OBJECTIFS */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Objectifs</span>
            <div className="stat-icon info">
              <Target size={20} />
            </div>
          </div>
          <div className="stat-value">{goalsProgress}%</div>
          <div className="stat-count">
            Progression moyenne ({activeGoals.length} objectif{activeGoals.length > 1 ? 's' : ''})
          </div>
        </div>
      </div>

      {/* SECTIONS */}
      <div className="dashboard-sections">
        {/* TRANSACTIONS RÉCENTES */}
        <div className="section-card">
          <h2> Transactions récentes</h2>
          {recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map(t => (
                <div key={t.id} className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-category">{t.category_name}</span>
                    <span className="transaction-description">{t.description}</span>
                  </div>
                  <div className="transaction-right">
                    <span className={`transaction-amount ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'}{parseFloat(t.amount).toFixed(2)} €
                    </span>
                    <span className="transaction-date">
                      {new Date(t.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Aucune transaction récente</p>
          )}
        </div>

        {/* PRINCIPALES DÉPENSES */}
        <div className="section-card">
          <h2> Principales dépenses</h2>
          {topExpenses.length > 0 ? (
            <div className="expenses-list">
              {topExpenses.map((exp, idx) => (
                <div key={idx} className="expense-item">
                  <span className="expense-category">{exp.category}</span>
                  <span className="expense-amount">{exp.amount.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Aucune dépense enregistrée</p>
          )}
        </div>
      </div>

      {/* SCORE DE SANTÉ FINANCIÈRE */}
      <div className="health-card">
        <div className="health-header">
          <ShieldCheck size={20} />
          <h2>Santé financière</h2>
        </div>
        <div className="health-body">
          {/* CERCLE SVG */}
          <div className="health-circle-wrap">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle
                cx="80" cy="80" r={RADIUS}
                fill="none"
                stroke={health.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="health-circle-center">
              <span className="health-score-num" style={{ color: health.color }}>{healthScore}</span>
              <span className="health-score-max">/100</span>
              <span className="health-label" style={{ color: health.color }}>{health.label}</span>
            </div>
          </div>

          {/* CRITÈRES */}
          <div className="health-criteria">
            <div className="health-criterion">
              <div className="criterion-top">
                <span className="criterion-name">Taux d'épargne</span>
                <span className="criterion-val">{savingsRate.toFixed(1)}%</span>
              </div>
              <div className="criterion-track">
                <div className="criterion-fill" style={{ width: `${Math.min(scoreEpargne / 40 * 100, 100)}%`, background: '#10b981' }} />
              </div>
              <span className="criterion-sub">{scoreEpargne.toFixed(0)} / 40 pts</span>
            </div>

            <div className="health-criterion">
              <div className="criterion-top">
                <span className="criterion-name">Objectifs d'épargne</span>
                <span className="criterion-val">{goalsProgress}%</span>
              </div>
              <div className="criterion-track">
                <div className="criterion-fill" style={{ width: `${Math.min(scoreObjectifs / 30 * 100, 100)}%`, background: '#3b82f6' }} />
              </div>
              <span className="criterion-sub">{scoreObjectifs.toFixed(0)} / 30 pts</span>
            </div>

            <div className="health-criterion">
              <div className="criterion-top">
                <span className="criterion-name">Solde net</span>
                <span className="criterion-val">{balance.toFixed(0)} €</span>
              </div>
              <div className="criterion-track">
                <div className="criterion-fill" style={{ width: `${Math.min(scoreBalance / 30 * 100, 100)}%`, background: '#8b5cf6' }} />
              </div>
              <span className="criterion-sub">{scoreBalance.toFixed(0)} / 30 pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;