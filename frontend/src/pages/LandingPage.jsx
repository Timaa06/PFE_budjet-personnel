import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Target, TrendingUp, PieChart, ArrowRight, LogIn } from 'lucide-react';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Wallet size={32} />,
      title: "Suivi en temps réel",
      description: "Visualisez votre solde et vos dépenses instantanément"
    },
    {
      icon: <Target size={32} />,
      title: "Objectifs d'épargne",
      description: "Définissez et atteignez vos objectifs financiers avec la tirelire virtuelle"
    },
    {
      icon: <TrendingUp size={32} />,
      title: "Analyse des dépenses",
      description: "Comprenez où va votre argent avec des graphiques détaillés"
    },
    {
      icon: <PieChart size={32} />,
      title: "Catégorisation",
      description: "Organisez vos transactions par catégories personnalisées"
    }
  ];

  return (
    <div className="landing-page">
      {/* HEADER */}
      <header className="landing-header">
        <div className="logo-landing">
          <div className="logo-icon-landing">B</div>
          <span className="logo-text-landing">Budget Manager</span>
        </div>
        <button className="btn-login" onClick={() => navigate('/login')}>
          <LogIn size={18} />
          Se connecter
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Gérez votre argent <span className="highlight">simplement</span>
          </h1>
          <p className="hero-subtitle">
            Suivez vos dépenses, atteignez vos objectifs d'épargne et prenez le contrôle de vos finances en toute simplicité.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary-large" onClick={() => navigate('/register')}>
              <span>Commencer gratuitement</span>
              <ArrowRight size={20} />
            </button>
            <button className="btn-secondary-large" onClick={() => navigate('/login')}>
              Déjà un compte ?
            </button>
          </div>
        </div>

        {/* PREVIEW IMAGE / MOCKUP */}
        <div className="hero-image">
          <div className="mockup">
            <div className="mockup-header">
              <div className="mockup-dot"></div>
              <div className="mockup-dot"></div>
              <div className="mockup-dot"></div>
            </div>
            <div className="mockup-content">
              <div className="mockup-card">
                <div className="mockup-label">Solde disponible</div>
                <div className="mockup-value">1 250,00 €</div>
              </div>
              <div className="mockup-card piggy">
                <div className="mockup-label">🐷 Tirelire</div>
                <div className="mockup-value">850,00 €</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <h2 className="section-title">Tout ce dont vous avez besoin</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta">
        <h2 className="cta-title">Prêt à prendre le contrôle ?</h2>
        <p className="cta-subtitle">Rejoignez des milliers d'utilisateurs qui gèrent leur budget intelligemment</p>
        <button className="btn-cta" onClick={() => navigate('/register')}>
          Créer mon compte gratuitement
        </button>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <p>&copy; 2026 Budget Manager. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

export default LandingPage;