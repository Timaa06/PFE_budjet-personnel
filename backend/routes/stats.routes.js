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

module.exports = router;