const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

const perfil = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome, email, tipo, avatar_sigla, cidade, cep, email_verificado, created_at
       FROM usuarios WHERE id = $1`,
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const { nome, cidade, cep } = req.body;
    const { rows } = await pool.query(
      `UPDATE usuarios SET nome=$1, cidade=$2, cep=$3, updated_at=NOW()
       WHERE id=$4 RETURNING id, nome, email, tipo, avatar_sigla, cidade, cep`,
      [nome, cidade, cep, req.userId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const estatisticas = async (req, res, next) => {
  try {
    const [doadas, recebidas, candidaturas] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM itens WHERE doador_id=$1 AND status='concluido'`, [req.userId]),
      pool.query(`SELECT COUNT(*) FROM itens WHERE beneficiario_id=$1`, [req.userId]),
      pool.query(`SELECT COUNT(*) FROM candidaturas WHERE usuario_id=$1`, [req.userId]),
    ]);
    res.json({
      doacoes_realizadas:   parseInt(doadas.rows[0].count),
      itens_recebidos:      parseInt(recebidas.rows[0].count),
      candidaturas_enviadas: parseInt(candidaturas.rows[0].count),
    });
  } catch (err) { next(err); }
};

const notificacoes = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notificacoes WHERE usuario_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const marcarNotifLida = async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notificacoes SET lida=true WHERE usuario_id=$1`, [req.userId]
    );
    res.json({ message: 'Notificações marcadas como lidas' });
  } catch (err) { next(err); }
};

const trocarSenha = async (req, res, next) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    if (!senha_atual || !nova_senha) return res.status(400).json({ error: 'Preencha todos os campos' });
    if (nova_senha.length < 8) return res.status(400).json({ error: 'A nova senha deve ter ao menos 8 caracteres' });

    const { rows } = await pool.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.userId]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });

    const valida = await bcrypt.compare(senha_atual, rows[0].senha_hash);
    if (!valida) return res.status(400).json({ error: 'Senha atual incorreta' });

    const hash = await bcrypt.hash(nova_senha, 10);
    await pool.query('UPDATE usuarios SET senha_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.userId]);
    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (err) { next(err); }
};

module.exports = { perfil, atualizar, estatisticas, notificacoes, marcarNotifLida, trocarSenha };
