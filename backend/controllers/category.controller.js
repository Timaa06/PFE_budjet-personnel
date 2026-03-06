const db = require('../config/db');

// 📖 Récupérer toutes les catégories
exports.getAllCategories = (req, res) => {
  const sql = 'SELECT * FROM categories ORDER BY type, name';

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// ✅ Créer une catégorie personnalisée (optionnel)
exports.createCategory = (req, res) => {
  const { name, type } = req.body;

  // Validation
  if (!name || !type) {
    return res.status(400).json({ message: 'Nom et type requis' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ message: 'Type doit être income ou expense' });
  }

  const sql = 'INSERT INTO categories (name, type) VALUES (?, ?)';

  db.query(sql, [name, type], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ 
      message: 'Catégorie créée',
      id: result.insertId,
      name,
      type
    });
  });
};