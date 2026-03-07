const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const statsController = require('../controllers/stats.controller');

// Solde global
router.get('/balance', auth, statsController.getBalance);

// Dépenses par catégorie
router.get('/by-category', auth, statsController.getExpensesByCategory);

// Statistiques mensuelles
router.get('/monthly', auth, statsController.getMonthlyStats);

// Résumé global
router.get('/summary', auth, statsController.getSummary);

// Résumé par période (avec comparaison)
router.get('/period-summary', auth, statsController.getPeriodSummary);

// Plus grosses dépenses de la période
router.get('/top-expenses', auth, statsController.getTopExpenses);

module.exports = router;