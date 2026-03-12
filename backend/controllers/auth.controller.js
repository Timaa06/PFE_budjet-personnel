const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const User = require('../models/user.model');
const emailService = require('../services/email.service');

// Helper : enregistrer une activite dans les logs
const logActivity = (userId, email, action, ip, details = null) => {
  db.query(
    'INSERT INTO activity_logs (user_id, email, action, ip_address, details) VALUES (?, ?, ?, ?, ?)',
    [userId || null, email, action, ip || 'unknown', details]
  );
};

// INSCRIPTION
exports.register = (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur base de données' });
        }

        if (user) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        User.create(
            { email, password: hashedPassword },
            function(err, result) {
                if (err) return res.status(500).json({ message: 'Erreur création utilisateur' });
                logActivity(result?.insertId || null, email, 'register', req.ip);
                res.status(201).json({ message: 'Utilisateur créé' });
            }
        );
    });
};

// CONNEXION
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Erreur SQL:', err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      logActivity(null, email, 'login_failed', ip, 'Email inconnu');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = results[0];

    if (user.is_active === 0) {
      logActivity(user.id, email, 'login_blocked', ip, 'Compte désactivé');
      return res.status(403).json({ message: 'Compte désactivé. Contactez un administrateur.' });
    }

    // Vérification du bannissement
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      const until = new Date(user.banned_until).toLocaleDateString('fr-FR');
      logActivity(user.id, email, 'login_blocked', ip, `Banni jusqu'au ${until}`);
      return res.status(403).json({
        message: `Compte banni jusqu'au ${until}. Raison : ${user.ban_reason || 'Non spécifiée'}`
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logActivity(user.id, email, 'login_failed', ip, 'Mot de passe incorrect');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    logActivity(user.id, email, 'login_success', ip);

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin === 1 },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, is_admin: user.is_admin === 1 }
    });
  });
};

// MOT DE PASSE OUBLIÉ
exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });

  const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';

  db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // Réponse identique même si email inconnu (sécurité)
    if (results.length === 0) {
      return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    const userId = results[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    logActivity(userId, email, 'password_reset_requested', ip);

    // Supprimer les anciens tokens pour cet email
    db.query('DELETE FROM password_resets WHERE email = ?', [email], async (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      db.query(
        'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
        [email, token, expiresAt],
        async (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });

          const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
          const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'ton@gmail.com';

          if (emailConfigured) {
            try {
              await emailService.sendResetEmail(email, resetLink);
            } catch (mailErr) {
              console.error('Erreur envoi email:', mailErr.message);
            }
          }

          // Toujours renvoyer le lien direct pour réinitialiser depuis le site
          console.log('Lien de reset:', resetLink);
          res.json({
            message: 'Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe.',
            reset_link: resetLink
          });
        }
      );
    });
  });
};

// RÉINITIALISATION DU MOT DE PASSE
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token et mot de passe requis' });
  if (password.length < 6) return res.status(400).json({ message: 'Le mot de passe doit faire au moins 6 caractères' });

  db.query(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
    [token],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(400).json({ message: 'Lien invalide ou expiré.' });

      const { email } = results[0];
      const hash = bcrypt.hashSync(password, 10);

      db.query('UPDATE users SET password = ? WHERE email = ?', [hash, email], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        db.query('SELECT id FROM users WHERE email = ?', [email], (_err, userRes) => {
          const userId = userRes?.[0]?.id || null;
          logActivity(userId, email, 'password_reset_done', req.headers['x-forwarded-for'] || req.ip || 'unknown');
        });
        db.query('DELETE FROM password_resets WHERE email = ?', [email]);
        res.json({ message: 'Mot de passe réinitialisé avec succès.' });
      });
    }
  );
};

// PROFIL UTILISATEUR – lecture
exports.getProfile = (req, res) => {
  db.query(
    'SELECT id, email, first_name, last_name, phone, birthday, is_admin, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
      res.json(results[0]);
    }
  );
};

// PROFIL UTILISATEUR – mise à jour
exports.updateProfile = (req, res) => {
  const { first_name, last_name, phone, birthday } = req.body;
  db.query(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, birthday = ? WHERE id = ?',
    [first_name || null, last_name || null, phone || null, birthday || null, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Profil mis à jour' });
    }
  );
};

// DÉMO – connexion automatique avec données d'exemple
exports.loginDemo = (_req, res) => {
  const DEMO_EMAIL = 'demo@budget-manager.com';
  const DEMO_PASSWORD = 'demo1234';

  const findOrCreate = (cb) => {
    db.query('SELECT * FROM users WHERE email = ?', [DEMO_EMAIL], (err, rows) => {
      if (err) return cb(err);
      if (rows.length > 0) return cb(null, rows[0]);
      const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
      db.query(
        'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
        [DEMO_EMAIL, hash, 'Utilisateur', 'Démo'],
        (err2, result) => {
          if (err2) return cb(err2);
          cb(null, { id: result.insertId, email: DEMO_EMAIL, is_admin: 0 });
        }
      );
    });
  };

  const seedIfEmpty = (userId, cb) => {
    db.query('SELECT COUNT(*) AS cnt FROM transactions WHERE user_id = ?', [userId], (err, rows) => {
      if (err) return cb(err);
      if (rows[0].cnt > 0) return cb(null); // déjà seedé

      // Récupérer les catégories disponibles
      db.query('SELECT id, type FROM categories ORDER BY id', (err2, cats) => {
        if (err2) return cb(err2);
        const incCat = cats.find(c => c.type === 'income');
        const expCat = cats.find(c => c.type === 'expense');
        if (!incCat || !expCat) return cb(null); // pas de catégories, on skip

        const today = new Date();
        const fmt = (d) => d.toISOString().slice(0, 10);
        const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

        const transactions = [
          [userId, 'income',  2500,  incCat.id, 'Salaire',        daysAgo(25)],
          [userId, 'income',   150,  incCat.id, 'Freelance',      daysAgo(18)],
          [userId, 'expense',  800,  expCat.id, 'Loyer',          daysAgo(20)],
          [userId, 'expense',  120,  expCat.id, 'Courses',        daysAgo(15)],
          [userId, 'expense',   45,  expCat.id, 'Restaurant',     daysAgo(12)],
          [userId, 'expense',   30,  expCat.id, 'Transport',      daysAgo(10)],
          [userId, 'expense',   60,  expCat.id, 'Abonnements',    daysAgo(8)],
          [userId, 'income',   200,  incCat.id, 'Vente occasion', daysAgo(5)],
          [userId, 'expense',   90,  expCat.id, 'Vêtements',      daysAgo(3)],
          [userId, 'expense',   25,  expCat.id, 'Café / snacks',  daysAgo(1)],
        ];

        db.query(
          'INSERT INTO transactions (user_id, type, amount, category_id, description, date) VALUES ?',
          [transactions],
          (err3) => {
            if (err3) return cb(err3);
            // Créer un objectif de démo
            db.query(
              'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
              [userId, 'Vacances été', 1500, 850, fmt(new Date(today.getFullYear(), today.getMonth() + 4, 1))],
              (err4) => cb(err4 || null)
            );
          }
        );
      });
    });
  };

  findOrCreate((err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    seedIfEmpty(user.id, (err2) => {
      if (err2) console.error('Seed demo error:', err2.message);

      const token = jwt.sign(
        { id: user.id, email: user.email, is_admin: false },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      res.json({ token, user: { id: user.id, email: user.email, is_admin: false } });
    });
  });
};
