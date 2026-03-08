const db = require('../config/db');

// ✅ Créer un objectif
exports.createGoal = (req, res) => {
  const { name, target_amount, deadline } = req.body;
  const userId = req.user.id;

  if (!name || !target_amount) {
    return res.status(400).json({ message: 'Nom et montant cible requis' });
  }

  const sql = `
    INSERT INTO goals (user_id, name, target_amount, current_amount, deadline)
    VALUES (?, ?, ?, 0, ?)
  `;

  db.query(sql, [userId, name, target_amount, deadline || null], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      message: 'Objectif créé',
      id: result.insertId,
      name,
      target_amount,
      current_amount: 0,
      deadline
    });
  });
};

// 📖 Récupérer tous les objectifs
exports.getAllGoals = (req, res) => {
  const userId = req.user.id;

  const sql = 'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC';

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Calculer le pourcentage de progression pour chaque objectif
    const goalsWithProgress = results.map(goal => ({
      ...goal,
      progress: goal.target_amount > 0 
        ? Math.round((goal.current_amount / goal.target_amount) * 100) 
        : 0
    }));

    res.json(goalsWithProgress);
  });
};

// 📖 Récupérer un objectif par ID
exports.getGoalById = (req, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;

  const sql = 'SELECT * FROM goals WHERE id = ? AND user_id = ?';

  db.query(sql, [goalId, userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }

    const goal = results[0];
    goal.progress = goal.target_amount > 0 
      ? Math.round((goal.current_amount / goal.target_amount) * 100) 
      : 0;

    res.json(goal);
  });
};

// ✏️ Mettre à jour un objectif
exports.updateGoal = (req, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  const { name, target_amount, current_amount, deadline, status, completed_at } = req.body;

  // Vérifier que l'objectif appartient à l'utilisateur
  const checkSql = 'SELECT id FROM goals WHERE id = ? AND user_id = ?';

  db.query(checkSql, [goalId, userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Objectif non trouvé ou accès refusé' });
    }

    const updateSql = `
      UPDATE goals
      SET name = ?, target_amount = ?, current_amount = ?, deadline = ?, status = ?, completed_at = ?
      WHERE id = ? AND user_id = ?
    `;

    db.query(updateSql, [name, target_amount, current_amount, deadline || null, status || 'active', completed_at || null, goalId, userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Objectif mis à jour avec succès' });
    });
  });
};

// 💰 Ajouter de l'argent à un objectif
exports.addToGoal = (req, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Montant invalide' });
  }

  const sql = `
    UPDATE goals 
    SET current_amount = current_amount + ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [amount, goalId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    res.json({ message: `${amount}€ ajouté à l'objectif` });
  });
};

// 🗑️ Supprimer un objectif
exports.deleteGoal = (req, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;

  const sql = 'DELETE FROM goals WHERE id = ? AND user_id = ?';

  db.query(sql, [goalId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Objectif non trouvé ou accès refusé' });
    }
    res.json({ message: 'Objectif supprimé avec succès' });
  });
};