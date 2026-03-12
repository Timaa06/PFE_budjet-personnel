import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import GoalList from '../components/GoalList';
import Stats from '../components/Stats';
import AdminDashboard from './AdminDashboard';
import ProfileModal from '../components/ProfileModal';
import NeedsManager from '../components/NeedsManager';
import RemindersPanel from '../components/RemindersPanel';
import './Home.css';
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Target,
  Plus,
  User,
  LogOut,
  Shield,
  ListChecks
} from 'lucide-react';

function Home() {
  const { logout, user } = useContext(AuthContext);
  const isAdmin = user?.is_admin || false;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'dashboard');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTransactionAdded = () => {
    setRefreshKey(prev => prev + 1);
    setShowTransactionModal(false);
  };

  return (
    <div className="home-container">
      {/* NAVBAR */}
      
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <div className="logo-icon">B</div>
            <span className="logo-text">Budget Manager</span>
          </div>
        </div>

        <div className="navbar-right">
          {!isAdmin && (
            <button
              className="btn-new-transaction"
              onClick={() => setShowTransactionModal(true)}
            >
              <Plus size={18} />
              <span>Nouvelle transaction</span>
            </button>
          )}

          {!isAdmin && <RemindersPanel />}

          <button className="profile-btn" onClick={() => setShowProfile(true)}>
            <User size={20} />
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </nav>

      {/* TABS */}
      <div className="tabs">
        {!isAdmin && (
          <>
            <button
              className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Tableau de bord</span>
            </button>
            <button
              className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <CreditCard size={18} />
              <span>Transactions</span>
            </button>
            <button
              className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <TrendingUp size={18} />
              <span>Statistiques</span>
            </button>
            <button
              className={`tab ${activeTab === 'goals' ? 'active' : ''}`}
              onClick={() => setActiveTab('goals')}
            >
              <Target size={18} />
              <span>Objectifs</span>
            </button>
            <button
              className={`tab ${activeTab === 'needs' ? 'active' : ''}`}
              onClick={() => setActiveTab('needs')}
            >
              <ListChecks size={18} />
              <span>Besoins & Tâches</span>
            </button>
          </>
        )}
        {isAdmin && (
          <button
            className={`tab tab-admin active`}
            onClick={() => setActiveTab('admin')}
          >
            <Shield size={18} />
            <span>Administration</span>
          </button>
        )}
      </div>

      {/* CONTENU */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard key={refreshKey} />}
        {activeTab === 'transactions' && <TransactionList key={refreshKey} />}
        {activeTab === 'stats' && <Stats key={refreshKey} />}
        {activeTab === 'goals' && <GoalList key={refreshKey} />}
        {activeTab === 'needs' && <NeedsManager />}
        {activeTab === 'admin' && isAdmin && <AdminDashboard />}
      </main>

      {/* MODAL PROFIL */}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} isAdmin={isAdmin} />
      )}

      {/* MODAL TRANSACTION */}
      {showTransactionModal && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <TransactionForm onSuccess={handleTransactionAdded} />
            <button 
              className="modal-close"
              onClick={() => setShowTransactionModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;