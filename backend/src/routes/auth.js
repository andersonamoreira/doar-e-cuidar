const express = require('express');
const router  = express.Router();
const { register, login, me }                          = require('../controllers/auth');
const { esqueceuSenha, redefinirSenha, verificarEmail } = require('../controllers/resetSenha');
const auth = require('../middleware/auth');

router.post('/register',        register);
router.post('/login',           login);
router.get('/me',               auth, me);
router.post('/esqueci-senha',   esqueceuSenha);
router.post('/redefinir-senha', redefinirSenha);
router.post('/verificar-email', verificarEmail);

module.exports = router;
