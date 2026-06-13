const pool = require('../config/db');

const getStats = async (req, res, next) => {
  try {
    const [kpiRes, mesesRes, catsRes, topItensRes, atividadeRes] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM usuarios)::int                              AS total_usuarios,
          (SELECT COUNT(*) FROM itens WHERE status = 'disponivel')::int    AS itens_disponiveis,
          (SELECT COUNT(*) FROM itens WHERE status = 'concluido')::int     AS itens_concluidos,
          (SELECT COUNT(*) FROM itens)::int                                AS itens_total,
          (SELECT COUNT(*) FROM candidaturas)::int                         AS total_candidaturas
      `),
      pool.query(`
        SELECT
          EXTRACT(YEAR  FROM created_at)::int AS ano,
          EXTRACT(MONTH FROM created_at)::int AS mes,
          COUNT(*)::int                       AS total
        FROM itens
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY ano, mes
        ORDER BY ano, mes
      `),
      pool.query(`
        SELECT c.nome, c.emoji, COUNT(i.id)::int AS total
        FROM categorias c
        JOIN itens i ON i.categoria_id = c.id
        GROUP BY c.id, c.nome, c.emoji
        ORDER BY total DESC
        LIMIT 6
      `),
      pool.query(`
        SELECT i.titulo,
               c.nome  AS categoria_nome,
               c.emoji AS categoria_emoji,
               COUNT(ca.id)::int AS total_candidatos
        FROM itens i
        LEFT JOIN categorias c   ON c.id = i.categoria_id
        LEFT JOIN candidaturas ca ON ca.item_id = i.id
        GROUP BY i.id, c.nome, c.emoji
        HAVING COUNT(ca.id) > 0
        ORDER BY total_candidatos DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT tipo, autor, objeto, quando FROM (
          SELECT 'item'        AS tipo,
                 u.nome        AS autor,
                 i.titulo      AS objeto,
                 i.created_at  AS quando
          FROM itens i
          JOIN usuarios u ON u.id = i.doador_id
          UNION ALL
          SELECT 'candidatura',
                 u.nome,
                 i.titulo,
                 ca.created_at
          FROM candidaturas ca
          JOIN usuarios u ON u.id = ca.candidato_id
          JOIN itens i    ON i.id = ca.item_id
        ) t
        ORDER BY quando DESC
        LIMIT 8
      `),
    ]);

    const kpi = kpiRes.rows[0];
    const taxa = kpi.itens_total > 0
      ? Math.round((kpi.itens_concluidos / kpi.itens_total) * 100)
      : 0;

    res.json({
      kpi:        { ...kpi, taxa_conversao: taxa },
      por_mes:    mesesRes.rows,
      categorias: catsRes.rows,
      top_itens:  topItensRes.rows,
      atividade:  atividadeRes.rows,
    });
  } catch (err) { next(err); }
};

module.exports = { getStats };
