const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const User = require('../models/user.model');

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
