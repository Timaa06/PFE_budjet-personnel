const db = require('../config/db');

const getPeriodSQL = (period) => {
  switch (period) {
    case '7d':  return `date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    case '30d': return `date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    case '1y':  return `date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`;
    default:    return `date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)`;
  }
};

const getPrevPeriodSQL = (period) => {
  switch (period) {
    case '7d':  return `date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    case '30d': return `date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    case '1y':  return `date >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH) AND date < DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`;
    default:    return `date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) AND date < DATE_SUB(CURDATE(), INTERVAL 6 MONTH)`;
  }
};

// Résumé de la période (avec comparaison période précédente)
exports.getPeriodSummary = (req, res) => {
  const userId = req.user.id;
  const period = req.query.period || '6m';

  const currSQL = `
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions WHERE user_id = ? AND ${getPeriodSQL(period)}
  `;
  const prevSQL = `
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions WHERE user_id = ? AND ${getPrevPeriodSQL(period)}
  `;

  db.query(currSQL, [userId], (err, currResults) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(prevSQL, [userId], (err2, prevResults) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const curr = currResults[0];
      const prev = prevResults[0];
      const currIncome  = parseFloat(curr.income)  || 0;
      const currExpense = parseFloat(curr.expense) || 0;
      const prevIncome  = parseFloat(prev.income)  || 0;
      const prevExpense = parseFloat(prev.expense) || 0;

      const pct = (curr, prev) => prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : null;

      res.json({
        current:  { income: currIncome, expense: currExpense },
        previous: { income: prevIncome, expense: prevExpense },
        trends: {
          income:   pct(currIncome,  prevIncome),
          expense:  pct(currExpense, prevExpense),
          savings:  pct(currIncome - currExpense, prevIncome - prevExpense),
          rate:     pct(
            currIncome > 0 ? ((currIncome - currExpense) / currIncome) * 100 : 0,
            prevIncome > 0 ? ((prevIncome - prevExpense) / prevIncome) * 100 : 0
          )
        }
      });
    });
  });
};

// Dépenses par catégorie pour la période
exports.getExpensesByCategory = (req, res) => {
  const userId = req.user.id;
  const period = req.query.period || '6m';

  const sql = `
    SELECT c.name as category, SUM(t.amount) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense' AND ${getPeriodSQL(period)}
    GROUP BY c.name
    ORDER BY total DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results.map(r => ({ category: r.category, total: parseFloat(r.total) })));
  });
};

// Stats mensuelles pour la période
exports.getMonthlyStats = (req, res) => {
  const userId = req.user.id;
  const period = req.query.period || '6m';

  const sql = `
    SELECT
      DATE_FORMAT(date, '%Y-%m') as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
    WHERE user_id = ? AND ${getPeriodSQL(period)}
    GROUP BY month
    ORDER BY month ASC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results.map(r => ({
      month: r.month,
      income: parseFloat(r.income),
      expense: parseFloat(r.expense)
    })));
  });
};

// Plus grosses dépenses de la période
exports.getTopExpenses = (req, res) => {
  const userId = req.user.id;
  const period = req.query.period || '6m';

  const sql = `
    SELECT t.description, t.amount, t.date, c.name as category
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense' AND ${getPeriodSQL(period)}
    ORDER BY t.amount DESC
    LIMIT 5
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results.map(r => ({
      description: r.description,
      amount: parseFloat(r.amount),
      date: r.date,
      category: r.category
    })));
  });
};

// Solde global (inchangé)
exports.getBalance = (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
    FROM transactions WHERE user_id = ?
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const totalIncome  = parseFloat(results[0].total_income)  || 0;
    const totalExpense = parseFloat(results[0].total_expense) || 0;
    res.json({ total_income: totalIncome, total_expense: totalExpense, balance: totalIncome - totalExpense });
  });
};

// Résumé global (dashboard)
exports.getSummary = (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT
      COUNT(*) as total_transactions,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
      SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) as income_count,
      SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) as expense_count
    FROM transactions WHERE user_id = ?
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const data = results[0];
    const totalIncome  = parseFloat(data.total_income)  || 0;
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
