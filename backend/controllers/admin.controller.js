const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ─── STATS GLOBALES ───────────────────────────────────────────────────────────
exports.getStats = (req, res) => {
  const queries = {
    users:        'SELECT COUNT(*) AS count FROM users',
    activeUsers:  'SELECT COUNT(*) AS count FROM users WHERE is_active = 1',
    transactions: 'SELECT COUNT(*) AS count FROM transactions',
    goals:        'SELECT COUNT(*) AS count FROM goals',
    categories:   'SELECT COUNT(*) AS count FROM categories'
  };

  const keys = Object.keys(queries);
  const results = {};
  let done = 0;

  keys.forEach((key) => {
    db.query(queries[key], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      results[key] = rows[0].count;
      done++;
      if (done === keys.length) res.json(results);
    });
  });
};

// ─── TIMELINE (inscriptions + transactions par mois) ─────────────────────────
exports.getTimeline = (req, res) => {
  let pending = 2;
  const data = {};

  db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM users
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month`,
    (err, rows) => {
      data.users = err ? [] : rows;
      if (--pending === 0) res.json(data);
    }
  );

  db.query(
    `SELECT DATE_FORMAT(date, '%Y-%m') AS month, COUNT(*) AS count
     FROM transactions
     WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month`,
    (err, rows) => {
      data.transactions = err ? [] : rows;
      if (--pending === 0) res.json(data);
    }
  );
};

// ─── ALERTES AUTOMATIQUES ────────────────────────────────────────────────────
exports.getAlerts = (req, res) => {
  let pending = 2;
  const alerts = [];

  // Comptes avec 3+ tentatives échouées en 24h
  db.query(
    `SELECT email, COUNT(*) AS count FROM activity_logs
     WHERE action = 'login_failed' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
     GROUP BY email HAVING count >= 3`,
    (err, rows) => {
      if (!err) rows.forEach(r =>
        alerts.push({ type: 'danger', message: `${r.email} — ${r.count} tentatives de connexion échouées en 24h` })
      );
      if (--pending === 0) res.json(alerts);
    }
  );

  // Comptes avec 20+ transactions en 24h
  db.query(
    `SELECT u.email, COUNT(*) AS count
     FROM transactions t JOIN users u ON u.id = t.user_id
     WHERE t.date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
     GROUP BY t.user_id HAVING count >= 20`,
    (err, rows) => {
      if (!err) rows.forEach(r =>
        alerts.push({ type: 'warning', message: `${r.email} — ${r.count} transactions en 24h` })
      );
      if (--pending === 0) res.json(alerts);
    }
  );
};

// ─── LISTE UTILISATEURS ───────────────────────────────────────────────────────
exports.getUsers = (req, res) => {
  const sql = `
    SELECT
      u.id, u.email, u.is_admin, u.is_active,
      u.created_at, u.banned_until, u.ban_reason,
      (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) AS transaction_count,
      (SELECT COUNT(*) FROM goals WHERE user_id = u.id) AS goal_count
    FROM users u
    ORDER BY u.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// ─── ACTIVER / DÉSACTIVER ─────────────────────────────────────────────────────
exports.toggleUser = (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId) === req.user.id) return res.status(400).json({ message: 'Impossible de modifier votre propre compte' });

  db.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ message: 'Statut mis à jour' });
  });
};

// ─── BANNISSEMENT TEMPORAIRE ──────────────────────────────────────────────────
exports.banUser = (req, res) => {
  const userId = req.params.id;
  const { duration_days, reason } = req.body;

  if (parseInt(userId) === req.user.id) return res.status(400).json({ message: 'Impossible de bannir votre propre compte' });
  if (!duration_days || duration_days < 1) return res.status(400).json({ message: 'Durée invalide' });

  const bannedUntil = new Date();
  bannedUntil.setDate(bannedUntil.getDate() + parseInt(duration_days));

  db.query('UPDATE users SET banned_until = ?, ban_reason = ? WHERE id = ?',
    [bannedUntil, reason || null, userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
      res.json({ message: 'Utilisateur banni', banned_until: bannedUntil });
    });
};

exports.unbanUser = (req, res) => {
  db.query('UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Bannissement levé' });
  });
};

// ─── RÉINITIALISATION DE MOT DE PASSE ────────────────────────────────────────
exports.resetPassword = (req, res) => {
  const userId = req.params.id;
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  let newPassword = '';
  for (let i = 0; i < 10; i++) newPassword += chars[Math.floor(Math.random() * chars.length)];

  const hash = bcrypt.hashSync(newPassword, 10);

  db.query('UPDATE users SET password = ? WHERE id = ? AND is_admin = 0', [hash, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilisateur non trouvé ou admin' });
    res.json({ temp_password: newPassword });
  });
};

// ─── SUPPRIMER UN UTILISATEUR ─────────────────────────────────────────────────
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId) === req.user.id) return res.status(400).json({ message: 'Impossible de supprimer votre propre compte' });

  const steps = [
    'DELETE FROM activity_logs WHERE user_id = ?',
    'DELETE FROM transactions WHERE user_id = ?',
    'DELETE FROM goals WHERE user_id = ?',
    'DELETE FROM users WHERE id = ?'
  ];

  let i = 0;
  const next = () => {
    if (i >= steps.length) return res.json({ message: 'Utilisateur et toutes ses données supprimés' });
    db.query(steps[i++], [userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      next();
    });
  };
  next();
};

// ─── JOURNAL D'ACTIVITÉ ───────────────────────────────────────────────────────
exports.getLogs = (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const sql = `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?`;
  db.query(sql, [limit], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// ─── CATÉGORIES ───────────────────────────────────────────────────────────────
exports.getCategories = (req, res) => {
  db.query('SELECT * FROM categories ORDER BY type, name', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.createCategory = (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Nom et type requis' });
  if (type !== 'income' && type !== 'expense') return res.status(400).json({ message: 'Type invalide' });

  db.query('INSERT INTO categories (name, type) VALUES (?, ?)', [name, type], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, name, type });
  });
};

exports.updateCategory = (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Nom et type requis' });

  db.query('UPDATE categories SET name = ?, type = ? WHERE id = ?', [name, type, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json({ message: 'Catégorie mise à jour' });
  });
};

exports.deleteCategory = (req, res) => {
  db.query('SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows[0].count > 0) return res.status(400).json({ message: `Catégorie utilisée par ${rows[0].count} transaction(s)` });

    db.query('DELETE FROM categories WHERE id = ?', [req.params.id], (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Catégorie non trouvée' });
      res.json({ message: 'Catégorie supprimée' });
    });
  });
};
