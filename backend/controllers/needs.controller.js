const db = require('../config/db');

exports.getAll = (req, res) => {
  db.query(
    `SELECT n.*, COUNT(t.id) AS task_count
     FROM needs n
     LEFT JOIN tasks t ON t.need_id = n.id
     WHERE n.user_id = ?
     GROUP BY n.id
     ORDER BY FIELD(n.priority,'high','medium','low'), n.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

exports.create = (req, res) => {
  const { title, description, priority, category } = req.body;
  if (!title) return res.status(400).json({ message: 'Titre requis' });
  db.query(
    'INSERT INTO needs (user_id, title, description, priority, category) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, description || null, priority || 'medium', category || 'other'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, title, description, priority: priority || 'medium', category: category || 'other', task_count: 0 });
    }
  );
};

exports.update = (req, res) => {
  const { title, description, priority, category } = req.body;
  db.query(
    'UPDATE needs SET title=?, description=?, priority=?, category=? WHERE id=? AND user_id=?',
    [title, description || null, priority || 'medium', category || 'other', req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Besoin mis à jour' });
    }
  );
};

exports.remove = (req, res) => {
  db.query(
    'DELETE FROM needs WHERE id=? AND user_id=?',
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Besoin supprimé' });
    }
  );
};
