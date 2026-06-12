const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
