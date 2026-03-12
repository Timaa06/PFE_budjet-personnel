const db = require('../config/db');

exports.getAll = (req, res) => {
  const { need_id } = req.query;
  let sql = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.user.id];
  if (need_id) { sql += ' AND need_id = ?'; params.push(need_id); }
  sql += ' ORDER BY FIELD(status,"in_progress","todo","done"), FIELD(priority,"high","medium","low"), deadline ASC';
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.create = (req, res) => {
  const { title, description, priority, deadline, status, need_id } = req.body;
  if (!title) return res.status(400).json({ message: 'Titre requis' });
  db.query(
    'INSERT INTO tasks (user_id, need_id, title, description, priority, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, need_id || null, title, description || null, priority || 'medium', deadline || null, status || 'todo'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, title, description, priority: priority || 'medium', deadline, status: status || 'todo', need_id: need_id || null });
    }
  );
};

exports.update = (req, res) => {
  const { title, description, priority, deadline, status, need_id } = req.body;
  db.query(
    'UPDATE tasks SET title=?, description=?, priority=?, deadline=?, status=?, need_id=? WHERE id=? AND user_id=?',
    [title, description || null, priority || 'medium', deadline || null, status || 'todo', need_id || null, req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Tâche mise à jour' });
    }
  );
};

exports.updateStatus = (req, res) => {
  const { status } = req.body;
  if (!['todo', 'in_progress', 'done'].includes(status)) return res.status(400).json({ message: 'Statut invalide' });
  db.query(
    'UPDATE tasks SET status=? WHERE id=? AND user_id=?',
    [status, req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Statut mis à jour' });
    }
  );
};

exports.remove = (req, res) => {
  db.query(
    'DELETE FROM tasks WHERE id=? AND user_id=?',
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Tâche supprimée' });
    }
  );
};
