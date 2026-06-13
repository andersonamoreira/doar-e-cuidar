const express = require('express');
const router  = express.Router();
const { listar, buscar, criar, atualizar, encerrar, meusPorDoador } = require('../controllers/itens');
const { subirImagem, removerImagem } = require('../controllers/uploads');
const auth   = require('../middleware/auth');
const upload = require('../config/upload');

router.get('/',          listar);
router.get('/meus',      auth, meusPorDoador);
router.get('/:id',       buscar);
router.post('/',         auth, criar);
router.put('/:id',       auth, atualizar);
router.patch('/:id/encerrar', auth, encerrar);
router.post('/:id/imagens',        auth, upload.single('foto'), subirImagem);
router.delete('/:id/imagens/:imgId', auth, removerImagem);

module.exports = router;
