const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');
const { enviarEmailVerificacao } = require('../config/email');

const register = async (req, res, next) => {
  try {
    const { nome, email, senha, tipo = 'ambos', cidade, cep } = req.body;
    if (!nome || !email || !senha)
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });

    const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length)
      return res.status(409).json({ error: 'E-mail já cadastrado' });

    const senha_hash   = await bcrypt.hash(senha, 10);
    const avatar_sigla = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo, avatar_sigla, cidade, cep)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nome, email, tipo, avatar_sigla, cidade, cep, created_at`,
      [nome, email, senha_hash, tipo, avatar_sigla, cidade || null, cep || null]
    );

    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: rows[0], token });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true', [email]
    );
    if (!rows.length)
      return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!valid)
      return res.status(401).json({ error: 'Credenciais inválidas' });

    const { senha_hash, ...user } = rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, tipo, avatar_sigla, cidade, cep, email_verificado, created_at FROM usuarios WHERE id = $1',
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

module.exports = { register, login, me };
