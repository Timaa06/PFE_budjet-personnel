const db = require('../config/db');

// 💰 Calculer le solde global (revenus - dépenses)
exports.getBalance = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
    FROM transactions
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const totalIncome = parseFloat(results[0].total_income) || 0;
    const totalExpense = parseFloat(results[0].total_expense) || 0;
    const balance = totalIncome - totalExpense;

    res.json({
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: balance
    });
  });
};

// 📊 Dépenses par catégorie
exports.getExpensesByCategory = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT 
      c.name as category,
      SUM(t.amount) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense'
    GROUP BY c.name
    ORDER BY total DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const formatted = results.map(row => ({
      category: row.category,
      total: parseFloat(row.total)
    }));

    res.json(formatted);
  });
};

// 📅 Dépenses et revenus par mois
exports.getMonthlyStats = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT 
      DATE_FORMAT(date, '%Y-%m') as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
    WHERE user_id = ?
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const formatted = results.map(row => ({
      month: row.month,
      income: parseFloat(row.income),
      expense: parseFloat(row.expense)
    }));

    res.json(formatted);
  });
};

// 📈 Résumé global (pour le dashboard)
exports.getSummary = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
      SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) as income_count,
      SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) as expense_count
    FROM transactions
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const data = results[0];
    const totalIncome = parseFloat(data.total_income) || 0;
    const totalExpense = parseFloat(data.total_expense) || 0;

    res.json({
      total_transactions: data.total_transactions,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
      income_count: data.income_count,
      expense_count: data.expense_count
    });
  });
};