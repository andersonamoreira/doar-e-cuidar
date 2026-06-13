const pool = require('../config/db');
const fs   = require('fs');

const subirImagem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const { rows: item } = await pool.query(
      'SELECT id FROM itens WHERE id=$1 AND doador_id=$2',
      [id, req.userId]
    );
    if (!item.length) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Sem permissão ou item não encontrado' });
    }

    const { rows: count } = await pool.query(
      'SELECT COUNT(*)::int AS total FROM imagens_item WHERE item_id=$1', [id]
    );
    if (count[0].total >= 5) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Máximo de 5 imagens por item' });
    }

    const url = '/uploads/' + req.file.filename;
    const { rows } = await pool.query(
      'INSERT INTO imagens_item (item_id, url, ordem) VALUES ($1,$2,$3) RETURNING *',
      [id, url, count[0].total]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const removerImagem = async (req, res, next) => {
  try {
    const { id, imgId } = req.params;
    const { rows } = await pool.query(
      `DELETE FROM imagens_item
       WHERE id=$1 AND item_id=$2
         AND item_id IN (SELECT id FROM itens WHERE doador_id=$3)
       RETURNING url`,
      [imgId, id, req.userId]
    );
    if (!rows.length) return res.status(403).json({ error: 'Sem permissão ou imagem não encontrada' });

    const filePath = '/app/uploads/' + rows[0].url.replace('/uploads/', '');
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

module.exports = { subirImagem, removerImagem };
