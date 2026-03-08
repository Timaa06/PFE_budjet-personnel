const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/admin.middleware');
const adminController = require('../controllers/admin.controller');

router.use(adminAuth);

// Stats & monitoring
router.get('/stats', adminController.getStats);
router.get('/timeline', adminController.getTimeline);
router.get('/alerts', adminController.getAlerts);
router.get('/logs', adminController.getLogs);

// Gestion des utilisateurs
router.get('/users', adminController.getUsers);
router.put('/users/:id/toggle', adminController.toggleUser);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/unban', adminController.unbanUser);
router.post('/users/:id/reset-password', adminController.resetPassword);
router.delete('/users/:id', adminController.deleteUser);

// Gestion des catégories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

module.exports = router;
