import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Target, TrendingUp, PieChart, ArrowRight, LogIn, UserPlus, ListChecks, BarChart2, CheckCircle, ShieldCheck, Zap, Play } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await api.post('/auth/demo');
      loginWithToken(res.data.token);
      navigate('/app');
    } catch {
      alert('Impossible de lancer la démo, réessayez.');
    }
    setDemoLoading(false);
  };

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
            <button className="btn-demo" onClick={handleDemo} disabled={demoLoading}>
              <Play size={18} />
              {demoLoading ? 'Chargement...' : 'Voir une démo'}
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

      {/* COMMENT ÇA MARCHE */}
      <section className="how-it-works">
        <h2 className="section-title">Comment ça marche ?</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon"><UserPlus size={28} /></div>
            <h3>Créez votre compte</h3>
            <p>Inscrivez-vous en moins de 2 minutes avec juste votre email.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon"><ListChecks size={28} /></div>
            <h3>Ajoutez vos transactions</h3>
            <p>Enregistrez vos revenus et dépenses, catégorisez-les facilement.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon"><BarChart2 size={28} /></div>
            <h3>Suivez votre progression</h3>
            <p>Visualisez vos finances grâce à des graphiques clairs et intuitifs.</p>
          </div>
        </div>
      </section>

      {/* POURQUOI NOUS CHOISIR */}
      <section className="why-us">
        <div className="why-us-inner">
          <div className="why-us-left">
            <h2 className="why-title">Pourquoi choisir<br /><span>Budget Manager ?</span></h2>
            <div className="why-list">
              <div className="why-item">
                <CheckCircle size={20} className="why-icon" />
                <div>
                  <strong>Simple et intuitif</strong>
                  <p>Interface pensée pour être accessible à tous, sans formation.</p>
                </div>
              </div>
              <div className="why-item">
                <ShieldCheck size={20} className="why-icon" />
                <div>
                  <strong>Sécurisé</strong>
                  <p>Vos données sont protégées et ne sont jamais partagées.</p>
                </div>
              </div>
              <div className="why-item">
                <Zap size={20} className="why-icon" />
                <div>
                  <strong>Gratuit</strong>
                  <p>Toutes les fonctionnalités sont disponibles sans abonnement.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="why-us-right">
            <div className="stat-box">
              <div className="stat-number">100%</div>
              <div className="stat-label">gratuit et sans publicité</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">∞</div>
              <div className="stat-label">transactions et objectifs</div>
            </div>
          </div>
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