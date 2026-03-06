const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');

// Récupérer toutes les catégories (pas besoin d'auth si catégories globales)
router.get('/', categoryController.getAllCategories);

// Créer une catégorie (optionnel, avec auth si tu veux)
router.post('/', auth, categoryController.createCategory);

module.exports = router;