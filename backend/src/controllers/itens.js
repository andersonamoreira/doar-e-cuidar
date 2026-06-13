const pool = require('../config/db');

const listar = async (req, res, next) => {
  try {
    const { cat, estado, cidade, q, sort = 'recentes' } = req.query;

    let where  = `WHERE i.status = 'disponivel'`;
    const params = [];
    let p = 1;

    if (cat)    { where += ` AND c.slug = $${p++}`;                        params.push(cat); }
    if (estado) { where += ` AND i.estado_conservacao = $${p++}`;          params.push(estado); }
    if (cidade) { where += ` AND i.cidade ILIKE $${p++}`;                  params.push(cidade); }
    if (q)      { where += ` AND (i.titulo ILIKE $${p} OR i.descricao ILIKE $${p++})`; params.push(`%${q}%`); }

    const orderMap = {
      candidatos: 'total_candidatos DESC',
      az:         'i.titulo ASC',
      recentes:   'i.created_at DESC',
    };
    const order = orderMap[sort] || 'i.created_at DESC';

    const sql = `
      SELECT
        i.id, i.titulo, i.descricao, i.estado_conservacao, i.cidade, i.status,
        i.created_at,
        c.nome  AS categoria_nome,
        c.emoji AS categoria_emoji,
        c.slug  AS categoria_slug,
        u.nome         AS doador_nome,
        u.avatar_sigla AS doador_sigla,
        COUNT(DISTINCT ca.id)::int AS total_candidatos,
        (SELECT url FROM imagens_item WHERE item_id = i.id ORDER BY ordem LIMIT 1) AS imagem_principal
      FROM itens i
      LEFT JOIN categorias c  ON c.id = i.categoria_id
      LEFT JOIN usuarios u    ON u.id = i.doador_id
      LEFT JOIN candidaturas ca ON ca.item_id = i.id
      ${where}
      GROUP BY i.id, c.id, u.id
      ORDER BY ${order}
    `;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

const buscar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(`
      SELECT
        i.*,
        c.nome  AS categoria_nome,
        c.emoji AS categoria_emoji,
        c.slug  AS categoria_slug,
        u.nome         AS doador_nome,
        u.avatar_sigla AS doador_sigla,
        u.cidade       AS doador_cidade,
        COUNT(DISTINCT ca.id)::int AS total_candidatos
      FROM itens i
      LEFT JOIN categorias c  ON c.id = i.categoria_id
      LEFT JOIN usuarios u    ON u.id = i.doador_id
      LEFT JOIN candidaturas ca ON ca.item_id = i.id
      WHERE i.id = $1
      GROUP BY i.id, c.id, u.id
    `, [id]);

    if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });

    const imgs = await pool.query(
      'SELECT id, url, ordem FROM imagens_item WHERE item_id = $1 ORDER BY ordem', [id]
    );

    res.json({ ...rows[0], imagens: imgs.rows });
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const { titulo, descricao, categoria_id, estado_conservacao, cidade, cep } = req.body;
    if (!titulo || !categoria_id || !estado_conservacao)
      return res.status(400).json({ error: 'Título, categoria e estado são obrigatórios' });

    const { rows } = await pool.query(
      `INSERT INTO itens (titulo, descricao, categoria_id, estado_conservacao, cidade, cep, doador_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [titulo, descricao, categoria_id, estado_conservacao, cidade, cep, req.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, estado_conservacao, cidade, cep } = req.body;

    const { rows } = await pool.query(
      `UPDATE itens
       SET titulo=$1, descricao=$2, estado_conservacao=$3, cidade=$4, cep=$5, updated_at=NOW()
       WHERE id=$6 AND doador_id=$7
       RETURNING *`,
      [titulo, descricao, estado_conservacao, cidade, cep, id, req.userId]
    );
    if (!rows.length) return res.status(403).json({ error: 'Sem permissão ou item não encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const encerrar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE itens SET status='cancelado', updated_at=NOW()
       WHERE id=$1 AND doador_id=$2 RETURNING *`,
      [id, req.userId]
    );
    if (!rows.length) return res.status(403).json({ error: 'Sem permissão ou item não encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const meusPorDoador = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.*, c.nome AS categoria_nome, c.emoji AS categoria_emoji,
        COUNT(DISTINCT ca.id)::int AS total_candidatos,
        (SELECT url FROM imagens_item WHERE item_id = i.id ORDER BY ordem LIMIT 1) AS imagem_principal
      FROM itens i
      LEFT JOIN categorias c ON c.id = i.categoria_id
      LEFT JOIN candidaturas ca ON ca.item_id = i.id
      WHERE i.doador_id = $1
      GROUP BY i.id, c.id
      ORDER BY i.created_at DESC
    `, [req.userId]);
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { listar, buscar, criar, atualizar, encerrar, meusPorDoador };
