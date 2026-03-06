const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const goalController = require('../controllers/goal.controller');

// Créer un objectif
router.post('/', auth, goalController.createGoal);

// Récupérer tous les objectifs
router.get('/', auth, goalController.getAllGoals);

// Récupérer un objectif par ID
router.get('/:id', auth, goalController.getGoalById);

// Mettre à jour un objectif
router.put('/:id', auth, goalController.updateGoal);

// Ajouter de l'argent à un objectif
router.patch('/:id/add', auth, goalController.addToGoal);

// Supprimer un objectif
router.delete('/:id', auth, goalController.deleteGoal);

module.exports = router;