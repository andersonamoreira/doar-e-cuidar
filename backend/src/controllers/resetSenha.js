const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');
const { enviarEmailReset, enviarEmailVerificacao } = require('../config/email');

const esqueceuSenha = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

    const { rows } = await pool.query('SELECT id, nome FROM usuarios WHERE email = $1', [email]);
    // Sempre retorna sucesso para não revelar quais e-mails existem
    if (!rows.length) return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' });

    const { id: userId, nome } = rows[0];
    const token  = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Invalida tokens anteriores do mesmo usuário
    await pool.query(
      `UPDATE tokens_redefinicao SET usado = TRUE WHERE usuario_id = $1 AND tipo = 'reset' AND usado = FALSE`,
      [userId]
    );
    await pool.query(
      `INSERT INTO tokens_redefinicao (usuario_id, token, tipo, expira_em) VALUES ($1, $2, 'reset', $3)`,
      [userId, token, expira]
    );

    await enviarEmailReset(email, nome, token);
    res.json({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' });
  } catch (err) { next(err); }
};

const redefinirSenha = async (req, res, next) => {
  try {
    const { token, nova_senha } = req.body;
    if (!token || !nova_senha) return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    if (nova_senha.length < 8) return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres' });

    const { rows } = await pool.query(
      `SELECT id, usuario_id FROM tokens_redefinicao
       WHERE token = $1 AND tipo = 'reset' AND usado = FALSE AND expira_em > NOW()`,
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo.' });

    const { id: tokenId, usuario_id } = rows[0];
    const hash = await bcrypt.hash(nova_senha, 10);

    await pool.query('UPDATE usuarios SET senha_hash = $1, updated_at = NOW() WHERE id = $2', [hash, usuario_id]);
    await pool.query('UPDATE tokens_redefinicao SET usado = TRUE WHERE id = $1', [tokenId]);

    res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
  } catch (err) { next(err); }
};

const verificarEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token é obrigatório' });

    const { rows } = await pool.query(
      `SELECT id, usuario_id FROM tokens_redefinicao
       WHERE token = $1 AND tipo = 'verificacao' AND usado = FALSE AND expira_em > NOW()`,
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Link inválido ou expirado.' });

    const { id: tokenId, usuario_id } = rows[0];
    await pool.query('UPDATE usuarios SET email_verificado = TRUE, updated_at = NOW() WHERE id = $1', [usuario_id]);
    await pool.query('UPDATE tokens_redefinicao SET usado = TRUE WHERE id = $1', [tokenId]);

    res.json({ message: 'E-mail confirmado com sucesso!' });
  } catch (err) { next(err); }
};

module.exports = { esqueceuSenha, redefinirSenha, verificarEmail };
