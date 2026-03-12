import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, Pencil, Check, Shield } from 'lucide-react';
import api from '../services/api';
import './ProfileModal.css';

function ProfileModal({ onClose, isAdmin }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing]  = useState(false);
  const [form, setForm]        = useState({});
  const [saving, setSaving]    = useState(false);
  const [success, setSuccess]  = useState(false);
  const [error, setError]      = useState('');

  useEffect(() => {
    api.get('/auth/profile').then(res => {
      setProfile(res.data);
      setForm({
        first_name: res.data.first_name || '',
        last_name:  res.data.last_name  || '',
        phone:      res.data.phone      || '',
        birthday:   res.data.birthday   ? res.data.birthday.slice(0, 10) : '',
      });
    }).catch(() => setError('Impossible de charger le profil.'));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/auth/profile', form);
      setProfile(prev => ({ ...prev, ...form }));
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch {
      setError('Erreur lors de la sauvegarde.');
    }
    setSaving(false);
  };

  const accentColor = isAdmin ? '#7c3aed' : '#10b981';

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="profile-header" style={{ borderTopColor: accentColor }}>
          <div className="profile-avatar" style={{ background: isAdmin ? '#ede9fe' : '#dcfce7', color: accentColor }}>
            {isAdmin ? <Shield size={28} /> : <User size={28} />}
          </div>
          <div>
            <div className="profile-header-name">
              {profile?.first_name || profile?.last_name
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                : 'Mon profil'}
            </div>
            <div className="profile-header-role" style={{ color: accentColor }}>
              {isAdmin ? 'Administrateur' : 'Utilisateur'}
            </div>
          </div>
          <button className="profile-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="profile-body">
          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">Profil mis à jour !</div>}

          {!profile ? (
            <div className="profile-loading">Chargement...</div>
          ) : editing ? (
            /* ── Mode édition ── */
            <div className="profile-form">
              <div className="profile-field-group">
                <label>Prénom</label>
                <input
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder="Votre prénom"
                />
              </div>
              <div className="profile-field-group">
                <label>Nom</label>
                <input
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder="Votre nom"
                />
              </div>
              <div className="profile-field-group">
                <label>Numéro de téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+33 6 00 00 00 00"
                />
              </div>
              <div className="profile-field-group">
                <label>Date de naissance</label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                />
              </div>
              <div className="profile-edit-actions">
                <button className="profile-btn-cancel" onClick={() => setEditing(false)}>Annuler</button>
                <button
                  className="profile-btn-save"
                  style={{ background: accentColor }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Check size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : (
            /* ── Mode lecture ── */
            <div className="profile-view">
              <div className="profile-info-row">
                <Mail size={16} className="profile-info-icon" />
                <div>
                  <div className="profile-info-label">Email</div>
                  <div className="profile-info-value">{profile.email}</div>
                </div>
              </div>
              <div className="profile-info-row">
                <User size={16} className="profile-info-icon" />
                <div>
                  <div className="profile-info-label">Prénom</div>
                  <div className="profile-info-value">{profile.first_name || <span className="profile-empty">Non renseigné</span>}</div>
                </div>
              </div>
              <div className="profile-info-row">
                <User size={16} className="profile-info-icon" />
                <div>
                  <div className="profile-info-label">Nom</div>
                  <div className="profile-info-value">{profile.last_name || <span className="profile-empty">Non renseigné</span>}</div>
                </div>
              </div>
              <div className="profile-info-row">
                <Phone size={16} className="profile-info-icon" />
                <div>
                  <div className="profile-info-label">Téléphone</div>
                  <div className="profile-info-value">{profile.phone || <span className="profile-empty">Non renseigné</span>}</div>
                </div>
              </div>
              <div className="profile-info-row">
                <Calendar size={16} className="profile-info-icon" />
                <div>
                  <div className="profile-info-label">Date de naissance</div>
                  <div className="profile-info-value">
                    {profile.birthday
                      ? new Date(profile.birthday).toLocaleDateString('fr-FR')
                      : <span className="profile-empty">Non renseignée</span>}
                  </div>
                </div>
              </div>
              <div className="profile-info-row">
                <Calendar size={16} className="profile-info-icon" />
                <div>
                  <div className="profile-info-label">Membre depuis</div>
                  <div className="profile-info-value">{new Date(profile.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              <button
                className="profile-btn-edit"
                style={{ borderColor: accentColor, color: accentColor }}
                onClick={() => setEditing(true)}
              >
                <Pencil size={15} /> Modifier mes informations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
