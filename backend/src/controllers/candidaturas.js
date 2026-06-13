const pool = require('../config/db');

const listarPorItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await pool.query('SELECT doador_id FROM itens WHERE id = $1', [itemId]);
    if (!item.rows.length) return res.status(404).json({ error: 'Item não encontrado' });
    if (item.rows[0].doador_id !== req.userId)
      return res.status(403).json({ error: 'Somente o doador pode ver as candidaturas' });

    const { rows } = await pool.query(`
      SELECT ca.id, ca.justificativa, ca.status, ca.created_at,
        u.id AS usuario_id, u.nome AS usuario_nome, u.avatar_sigla, u.cidade
      FROM candidaturas ca
      JOIN usuarios u ON u.id = ca.usuario_id
      WHERE ca.item_id = $1
      ORDER BY ca.created_at ASC
    `, [itemId]);

    res.json(rows);
  } catch (err) { next(err); }
};

const minhasCandidaturas = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT ca.id, ca.status, ca.justificativa, ca.created_at,
        i.id AS item_id, i.titulo, i.status AS item_status,
        c.emoji AS categoria_emoji,
        (SELECT url FROM imagens_item WHERE item_id = i.id ORDER BY ordem LIMIT 1) AS imagem_principal
      FROM candidaturas ca
      JOIN itens i ON i.id = ca.item_id
      LEFT JOIN categorias c ON c.id = i.categoria_id
      WHERE ca.usuario_id = $1
      ORDER BY ca.created_at DESC
    `, [req.userId]);
    res.json(rows);
  } catch (err) { next(err); }
};

const candidatar = async (req, res, next) => {
  try {
    const { item_id, justificativa } = req.body;
    if (!justificativa || justificativa.length < 20)
      return res.status(400).json({ error: 'A justificativa deve ter pelo menos 20 caracteres' });

    const item = await pool.query(
      `SELECT * FROM itens WHERE id = $1 AND status = 'disponivel'`, [item_id]
    );
    if (!item.rows.length)
      return res.status(404).json({ error: 'Item não disponível para candidatura' });
    if (item.rows[0].doador_id === req.userId)
      return res.status(400).json({ error: 'Você não pode se candidatar ao próprio item' });

    const { rows } = await pool.query(
      `INSERT INTO candidaturas (item_id, usuario_id, justificativa)
       VALUES ($1, $2, $3) RETURNING *`,
      [item_id, req.userId, justificativa]
    );

    await pool.query(
      `INSERT INTO notificacoes (usuario_id, tipo, mensagem, item_id)
       VALUES ($1, 'candidatura_recebida', $2, $3)`,
      [item.rows[0].doador_id, `Nova candidatura para "${item.rows[0].titulo}"`, item_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Você já se candidatou a este item' });
    next(err);
  }
};

const selecionar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: cands } = await pool.query(`
      SELECT ca.*, i.doador_id, i.titulo, i.id AS item_id
      FROM candidaturas ca
      JOIN itens i ON i.id = ca.item_id
      WHERE ca.id = $1
    `, [id]);

    if (!cands.length) return res.status(404).json({ error: 'Candidatura não encontrada' });
    if (cands[0].doador_id !== req.userId)
      return res.status(403).json({ error: 'Somente o doador pode selecionar o beneficiário' });

    const { item_id, usuario_id, titulo } = cands[0];

    await pool.query(
      `UPDATE itens SET status='concluido', beneficiario_id=$1, updated_at=NOW() WHERE id=$2`,
      [usuario_id, item_id]
    );
    await pool.query(
      `UPDATE candidaturas SET status='selecionado', updated_at=NOW() WHERE id=$1`, [id]
    );
    await pool.query(
      `UPDATE candidaturas SET status='rejeitado', updated_at=NOW()
       WHERE item_id=$1 AND id != $2`, [item_id, id]
    );
    await pool.query(
      `INSERT INTO notificacoes (usuario_id, tipo, mensagem, item_id)
       VALUES ($1, 'selecionado', $2, $3)`,
      [usuario_id, `Parabéns! Você foi selecionado para receber "${titulo}"`, item_id]
    );

    res.json({ message: 'Beneficiário selecionado com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { listarPorItem, minhasCandidaturas, candidatar, selecionar };
