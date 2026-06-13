const express = require('express');
const router  = express.Router();
const { perfil, atualizar, estatisticas, notificacoes, marcarNotifLida, trocarSenha } = require('../controllers/usuarios');
const auth = require('../middleware/auth');

router.get('/perfil',        auth, perfil);
router.put('/perfil',        auth, atualizar);
router.get('/estatisticas',  auth, estatisticas);
router.get('/notificacoes',  auth, notificacoes);
router.patch('/notificacoes/lidas', auth, marcarNotifLida);
router.patch('/trocar-senha',      auth, trocarSenha);

module.exports = router;
