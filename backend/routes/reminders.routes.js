const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/reminders.controller');

router.get('/',                  auth, ctrl.getAll);
router.get('/pending',           auth, ctrl.getPending);
router.get('/test-email',        auth, ctrl.testEmail);
router.post('/',                 auth, ctrl.create);
router.patch('/:id/trigger',     auth, ctrl.markTriggered);
router.delete('/:id',            auth, ctrl.remove);

module.exports = router;
