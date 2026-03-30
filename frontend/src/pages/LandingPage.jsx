import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Target, TrendingUp, PieChart, ArrowRight, LogIn, UserPlus, ListChecks, BarChart2, CheckCircle, ShieldCheck, Zap, Play, Globe, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import translations from '../i18n/landing';
import './LandingPage.css';

const LANGS = Object.keys(translations);

function LandingPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);
  const [demoLoading, setDemoLoading] = useState(false);
  const [lang, setLang] = useState('fr');
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem('landing_lang');
    if (saved && translations[saved]) setLang(saved);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectLang = (code) => {
    setLang(code);
    localStorage.setItem('landing_lang', code);
    setLangOpen(false);
  };

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

  return (
    <div className="landing-page" dir={t.dir}>
      {/* HEADER */}
      <header className="landing-header">
        <div className="logo-landing">
          <div className="logo-icon-landing">B</div>
          <span className="logo-text-landing">Budget Manager</span>
        </div>

        <div className="header-right">
          {/* Sélecteur de langue */}
          <div className="lang-selector" ref={langRef}>
            <button className="lang-btn" onClick={() => setLangOpen(!langOpen)}>
              <Globe size={16} />
              <img
                src={`https://flagcdn.com/20x15/${t.code}.png`}
                alt={t.label}
                className="lang-flag-img"
              />
              <span>{t.label}</span>
              <ChevronDown size={14} className={langOpen ? 'chevron-open' : ''} />
            </button>
            {langOpen && (
              <div className="lang-dropdown">
                {LANGS.map((code) => (
                  <button
                    key={code}
                    className={`lang-option${lang === code ? ' active' : ''}`}
                    onClick={() => selectLang(code)}
                  >
                    <img
                      src={`https://flagcdn.com/20x15/${translations[code].code}.png`}
                      alt={translations[code].label}
                      className="lang-flag-img"
                    />
                    <span>{translations[code].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="btn-login" onClick={() => navigate('/login')}>
            <LogIn size={18} />
            {t.nav.login}
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            {t.hero.title1} <span className="highlight">{t.hero.title2}</span>
          </h1>
          <p className="hero-subtitle">{t.hero.subtitle}</p>
          <div className="hero-buttons">
            <button className="btn-primary-large" onClick={() => navigate('/register')}>
              <span>{t.hero.start}</span>
              <ArrowRight size={20} />
            </button>
            <button className="btn-demo" onClick={handleDemo} disabled={demoLoading}>
              <Play size={18} />
              {demoLoading ? t.hero.demoLoading : t.hero.demo}
            </button>
            <button className="btn-secondary-large" onClick={() => navigate('/login')}>
              {t.hero.account}
            </button>
          </div>
        </div>

        {/* MOCKUP */}
        <div className="hero-image">
          <div className="mockup">
            <div className="mockup-header">
              <div className="mockup-dot"></div>
              <div className="mockup-dot"></div>
              <div className="mockup-dot"></div>
            </div>
            <div className="mockup-content">
              <div className="mockup-card">
                <div className="mockup-label">{t.mockup.balance}</div>
                <div className="mockup-value">1 250,00 €</div>
              </div>
              <div className="mockup-card piggy">
                <div className="mockup-label">{t.mockup.piggy}</div>
                <div className="mockup-value">850,00 €</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <h2 className="section-title">{t.features.title}</h2>
        <div className="features-grid">
          {[<Wallet size={32} />, <Target size={32} />, <TrendingUp size={32} />, <PieChart size={32} />].map((icon, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{icon}</div>
              <h3 className="feature-title">{t.features.items[i].title}</h3>
              <p className="feature-description">{t.features.items[i].description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="how-it-works">
        <h2 className="section-title">{t.how.title}</h2>
        <div className="steps-grid">
          {[<UserPlus size={28} />, <ListChecks size={28} />, <BarChart2 size={28} />].map((icon, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{i + 1}</div>
              <div className="step-icon">{icon}</div>
              <h3>{t.how.steps[i].title}</h3>
              <p>{t.how.steps[i].desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POURQUOI NOUS CHOISIR */}
      <section className="why-us">
        <div className="why-us-inner">
          <div className="why-us-left">
            <h2 className="why-title">
              {t.why.title1}<br /><span>{t.why.title2}</span>
            </h2>
            <div className="why-list">
              {[<CheckCircle size={20} className="why-icon" />, <ShieldCheck size={20} className="why-icon" />, <Zap size={20} className="why-icon" />].map((icon, i) => (
                <div key={i} className="why-item">
                  {icon}
                  <div>
                    <strong>{t.why.items[i].strong}</strong>
                    <p>{t.why.items[i].p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="why-us-right">
            <div className="stat-box">
              <div className="stat-number">100%</div>
              <div className="stat-label">{t.why.stat1}</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">∞</div>
              <div className="stat-label">{t.why.stat2}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta">
        <h2 className="cta-title">{t.cta.title}</h2>
        <p className="cta-subtitle">{t.cta.subtitle}</p>
        <button className="btn-cta" onClick={() => navigate('/register')}>
          {t.cta.btn}
        </button>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}

export default LandingPage;
