const db = require('../config/db');

//  Créer une transaction 
exports.createTransaction = (req, res) => {
  const { type, amount, category_id, description, date } = req.body;
  const userId = req.user.id;

  const sql = `
    INSERT INTO transactions (user_id, type, amount, category_id, description, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [userId, type, amount, category_id, description, date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      message: 'Transaction ajoutée',
      id: result.insertId
    });
  });
};

// Récupérer toutes les transactions de l'utilisateur
exports.getAllTransactions = (req, res) => {
  const sql = `
    SELECT t.*, c.name as category_name, c.type as category_type 
    FROM transactions t 
    LEFT JOIN categories c ON t.category_id = c.id 
    WHERE t.user_id = ?
    ORDER BY t.date DESC, t.id DESC
  `;

  db.query(sql, [req.user.id], (err, transactions) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    res.json(transactions);
  });
};

// Récupérer une transaction spécifique
exports.getTransactionById = (req, res) => {
  const userId = req.user.id;
  const transactionId = req.params.id;

  const sql = `
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ? AND t.user_id = ?
  `;

  db.query(sql, [transactionId, userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }
    res.json(results[0]);
  });
};

// Modifier une transaction
exports.updateTransaction = (req, res) => {
  const userId = req.user.id;
  const transactionId = req.params.id;
  const { type, amount, category_id, description, date } = req.body;

  // Vérifier que la transaction appartient bien à l'utilisateur
  const checkSql = 'SELECT id FROM transactions WHERE id = ? AND user_id = ?';

  db.query(checkSql, [transactionId, userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Transaction non trouvée ou accès refusé' });
    }

    // Mettre à jour la transaction
    const updateSql = `
      UPDATE transactions 
      SET type = ?, amount = ?, category_id = ?, description = ?, date = ?
      WHERE id = ? AND user_id = ?
    `;

    db.query(updateSql, [type, amount, category_id, description, date, transactionId, userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Transaction modifiée avec succès' });
    });
  });
};

//  Supprimer une transaction
exports.deleteTransaction = (req, res) => {
  const userId = req.user.id;
  const transactionId = req.params.id;

  const sql = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';

  db.query(sql, [transactionId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaction non trouvée ou accès refusé' });
    }
    res.json({ message: 'Transaction supprimée avec succès' });
  });
};