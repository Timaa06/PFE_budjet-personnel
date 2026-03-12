const db = require('../config/db');
const { sendReminderEmail } = require('../services/email.service');

exports.getAll = (req, res) => {
  db.query(
    `SELECT r.*, t.title AS task_title
     FROM reminders r
     LEFT JOIN tasks t ON t.id = r.task_id
     WHERE r.user_id = ?
     ORDER BY r.remind_at ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Rappels en attente (non déclenchés, dont l'heure est passée)
exports.getPending = (req, res) => {
  db.query(
    `SELECT r.*, t.title AS task_title
     FROM reminders r
     LEFT JOIN tasks t ON t.id = r.task_id
     WHERE r.user_id = ? AND r.triggered = 0 AND r.remind_at <= NOW()
     ORDER BY r.remind_at ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

exports.create = (req, res) => {
  const { title, remind_at, task_id, notification_type } = req.body;
  if (!title || !remind_at) return res.status(400).json({ message: 'Titre et date requis' });
  const type = notification_type || 'app';
  db.query(
    'INSERT INTO reminders (user_id, task_id, title, remind_at, notification_type) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, task_id || null, title, remind_at, type],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, title, remind_at, task_id: task_id || null, notification_type: type, triggered: false });
    }
  );
};

exports.markTriggered = (req, res) => {
  db.query(
    'UPDATE reminders SET triggered=1 WHERE id=? AND user_id=?',
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Rappel marqué comme lu' });
    }
  );
};

exports.remove = (req, res) => {
  db.query(
    'DELETE FROM reminders WHERE id=? AND user_id=?',
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Rappel supprimé' });
    }
  );
};

exports.testEmail = async (req, res) => {
  try {
    await sendReminderEmail(
      req.user.email,
      'Test de rappel Budget Manager',
      new Date(),
      null
    );
    res.json({ message: `Email de test envoyé à ${req.user.email}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
