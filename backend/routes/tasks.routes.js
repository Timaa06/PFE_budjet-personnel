const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/tasks.controller');

router.get('/',              auth, ctrl.getAll);
router.post('/',             auth, ctrl.create);
router.put('/:id',           auth, ctrl.update);
router.patch('/:id/status',  auth, ctrl.updateStatus);
router.delete('/:id',        auth, ctrl.remove);

module.exports = router;
