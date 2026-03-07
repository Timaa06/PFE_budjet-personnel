import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './Stats.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const fmtShort = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n ?? 0) + ' €';

const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const formatMonth = (ym) => {
  const [, m] = ym.split('-');
  return MONTH_NAMES[parseInt(m, 10) - 1];
};

const CAT_COLORS = ['#1e293b','#334155','#475569','#64748b','#94a3b8','#cbd5e1','#3b82f6','#6366f1'];

const PERIODS = [
  { key: '7d',  label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '6m',  label: '6 mois' },
  { key: '1y',  label: '1 an' },
];

function TrendBadge({ value }) {
  if (value === null || value === undefined) return null;
  const n = parseFloat(value);
  const positive = n >= 0;
  return (
    <span className={`trend-badge ${positive ? 'up' : 'down'}`}>
      {positive ? '↗' : '↘'} {positive ? '+' : ''}{n}% vs période précédente
    </span>
  );
}

function Stats() {
  const [period, setPeriod] = useState('6m');
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const donutRef = useRef(null);

  useEffect(() => {
    fetchAll(period);
  }, [period]);

  const fetchAll = async (p) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, monthlyRes, catRes, topRes] = await Promise.all([
        api.get(`/stats/period-summary?period=${p}`),
        api.get(`/stats/monthly?period=${p}`),
        api.get(`/stats/by-category?period=${p}`),
        api.get(`/stats/top-expenses?period=${p}`),
      ]);
      setSummary(summaryRes.data);
      setMonthlyData(monthlyRes.data || []);
      setCategoryData(catRes.data || []);
      setTopExpenses(topRes.data || []);
    } catch (err) {
      console.error('Erreur stats:', err);
      setError('Impossible de charger les statistiques. Vérifie que le backend est bien démarré.');
    } finally {
      setLoading(false);
    }
  };

  const income   = summary?.current?.income  ?? 0;
  const expense  = summary?.current?.expense ?? 0;
  const savings  = income - expense;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
  const totalCat = categoryData.reduce((s, c) => s + c.total, 0);

  const barData = {
    labels: monthlyData.map(d => formatMonth(d.month)),
    datasets: [
      {
        label: 'Dépenses',
        data: monthlyData.map(d => d.expense),
        backgroundColor: '#ef4444',
        stack: 'stack',
        borderSkipped: false,
      },
      {
        label: 'Revenus',
        data: monthlyData.map(d => d.income),
        backgroundColor: '#22c55e',
        stack: 'stack',
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, font: { size: 13 }, usePointStyle: true, pointStyleWidth: 10 }
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)', padding: 12, borderRadius: 8,
        callbacks: { label: (c) => `${c.dataset.label} : ${fmt(c.parsed.y)}` }
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 12 } } },
      y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => fmtShort(v), font: { size: 11 } } },
    },
  };

  const donutData = {
    labels: categoryData.map(c => c.category),
    datasets: [{
      data: categoryData.map(c => c.total),
      backgroundColor: CAT_COLORS.slice(0, categoryData.length),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)', padding: 12, borderRadius: 8,
        callbacks: {
          label: (c) => {
            const pct = totalCat > 0 ? ((c.parsed / totalCat) * 100).toFixed(0) : 0;
            return `${c.label} : ${fmt(c.parsed)} (${pct}%)`;
          }
        }
      },
    },
  };

  const maxBar = Math.max(income, expense, 1);

  if (loading) return <div className="stats-loading">Chargement des statistiques...</div>;
  if (error) return (
    <div className="stats-error">
      <span>⚠️</span>
      <p>{error}</p>
      <button onClick={() => fetchAll(period)}>Réessayer</button>
    </div>
  );

  return (
    <div className="stats-page">

      {/* HEADER */}
      <div className="stats-header">
        <div>
          <h1>Statistiques</h1>
          <p className="stats-subtitle">Analyse détaillée de vos finances</p>
        </div>
      </div>

      {/* PERIOD SELECTOR */}
      <div className="period-selector-row">
        <span className="period-label">Période :</span>
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            className={`period-btn ${period === key ? 'active' : ''}`}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SUMMARY CARDS */}
      <div className="stats-summary-grid">
        <div className="summary-card">
          <div className="summary-label">Revenus totaux</div>
          <div className="summary-value income">{fmt(income)}</div>
          <TrendBadge value={summary?.trends?.income} />
        </div>
        <div className="summary-card">
          <div className="summary-label">Dépenses totales</div>
          <div className="summary-value expense">{fmt(expense)}</div>
          <TrendBadge value={summary?.trends?.expense} />
        </div>
        <div className="summary-card">
          <div className="summary-label">Taux d'épargne</div>
          <div className="summary-value">{savingsRate}%</div>
          <TrendBadge value={summary?.trends?.rate} />
        </div>
        <div className="summary-card">
          <div className="summary-label">Solde net</div>
          <div className={`summary-value ${savings >= 0 ? 'income' : 'expense'}`}>{fmt(savings)}</div>
          <TrendBadge value={summary?.trends?.savings} />
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="stats-charts-row">
        <div className="stats-card chart-bar-card">
          <h3 className="card-title">Revenus vs Dépenses</h3>
          <div className="chart-area">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="stats-card chart-donut-card">
          <h3 className="card-title">Dépenses par catégorie</h3>
          <div className="donut-wrap">
            <div className="donut-area">
              {categoryData.length > 0 ? (
                <>
                  <Doughnut ref={donutRef} data={donutData} options={donutOptions} />
                  <div className="donut-center">
                    <div className="donut-center-value">{fmtShort(totalCat)}</div>
                    <div className="donut-center-label">Total</div>
                  </div>
                </>
              ) : (
                <p className="no-data-msg">Aucune dépense</p>
              )}
            </div>
          </div>
          <div className="cat-legend">
            {categoryData.map((cat, i) => {
              const pct = totalCat > 0 ? ((cat.total / totalCat) * 100).toFixed(0) : 0;
              return (
                <div key={i} className="cat-legend-row">
                  <span className="cat-dot" style={{ background: CAT_COLORS[i] || '#ccc' }} />
                  <span className="cat-name">{cat.category}</span>
                  <span className="cat-pct">{pct}%</span>
                  <span className="cat-amt">{fmtShort(cat.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="stats-bottom-row">
        <div className="stats-card">
          <h3 className="card-title">Revenus vs Dépenses</h3>
          <div className="progress-section">
            <div className="progress-row">
              <span className="progress-label">Revenus</span>
              <span className="progress-amount income">{fmt(income)}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill income-fill" style={{ width: '100%' }} />
            </div>

            <div className="progress-row">
              <span className="progress-label">Dépenses</span>
              <span className="progress-amount expense">{fmt(expense)}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill expense-fill" style={{ width: `${Math.min((expense / maxBar) * 100, 100)}%` }} />
            </div>

            <div className="progress-row">
              <span className="progress-label">Épargne</span>
              <span className="progress-amount">{fmt(savings)}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill savings-fill" style={{ width: `${Math.max(Math.min((savings / maxBar) * 100, 100), 0)}%` }} />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <h3 className="card-title">Plus grosses dépenses</h3>
          <div className="top-expenses-list">
            {topExpenses.length === 0 ? (
              <p className="no-data-msg">Aucune dépense sur cette période</p>
            ) : (
              topExpenses.map((t, i) => {
                const d = new Date(t.date);
                const dayStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                return (
                  <div key={i} className="top-expense-row">
                    <div className="top-expense-info">
                      <span className="top-expense-desc">{t.description || t.category}</span>
                      <span className="top-expense-date">{dayStr}</span>
                    </div>
                    <span className="top-expense-amount">-{fmt(t.amount)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Stats;
