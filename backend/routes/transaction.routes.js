const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

// Créer une transaction
router.post('/', auth, transactionController.createTransaction);

// Récupérer toutes les transactions
router.get('/', auth, transactionController.getAllTransactions);

// Récupérer une transaction par ID
router.get('/:id', auth, transactionController.getTransactionById);

// Modifier une transaction
router.put('/:id', auth, transactionController.updateTransaction);

// Supprimer une transaction
router.delete('/:id', auth, transactionController.deleteTransaction);

module.exports = router;