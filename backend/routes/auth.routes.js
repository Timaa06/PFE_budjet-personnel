const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// INSCRIPTION
router.post('/register', authController.register);

// CONNEXION
router.post('/login', authController.login);

// MOT DE PASSE OUBLIÉ
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// DÉMO
router.post('/demo', authController.loginDemo);

// PROFIL (protégé)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
