const express = require('express');
const router  = express.Router();
const { listarPorItem, minhasCandidaturas, candidatar, selecionar } = require('../controllers/candidaturas');
const auth = require('../middleware/auth');

router.get('/minhas',          auth, minhasCandidaturas);
router.get('/item/:itemId',    auth, listarPorItem);
router.post('/',               auth, candidatar);
router.patch('/:id/selecionar', auth, selecionar);

module.exports = router;
