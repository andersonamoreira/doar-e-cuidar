const express = require('express');
const router  = express.Router();
const { listar, buscar, criar, atualizar, encerrar, meusPorDoador } = require('../controllers/itens');
const auth = require('../middleware/auth');

router.get('/',          listar);
router.get('/meus',      auth, meusPorDoador);
router.get('/:id',       buscar);
router.post('/',         auth, criar);
router.put('/:id',       auth, atualizar);
router.patch('/:id/encerrar', auth, encerrar);

module.exports = router;
