import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, LogOut, Home, CreditCard, BarChart3, Target, Search, Bell } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="nav-logo">
          <div className="logo-b">B</div>
          <span>Budget Manager</span>
        </div>
        
        <div className="nav-links">
          <a 
            href="/dashboard" 
            className={`nav-link ${currentPath === '/dashboard' ? 'active' : ''}`}
          >
            <Home size={18} />
            Tableau de bord
          </a>
          <a 
            href="/transactions" 
            className={`nav-link ${currentPath === '/transactions' ? 'active' : ''}`}
          >
            <CreditCard size={18} />
            Transactions
          </a>
          <a 
            href="/stats" 
            className={`nav-link ${currentPath === '/stats' ? 'active' : ''}`}
          >
            <BarChart3 size={18} />
            Statistiques
          </a>
          <a 
            href="/goals" 
            className={`nav-link ${currentPath === '/goals' ? 'active' : ''}`}
          >
            <Target size={18} />
            Objectifs
          </a>
        </div>
      </div>

      <div className="nav-right">
        <div className="nav-search">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Rechercher..." />
        </div>
        
        <button className="nav-btn primary" onClick={() => navigate('/add-transaction')}>
          <Plus size={18} />
          Nouvelle transaction
        </button>
        
        <button className="nav-btn icon-btn">
          <Bell size={18} />
        </button>
        
        <div className="nav-user">
          <User size={18} />
        </div>
        
        <button className="nav-btn logout" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;