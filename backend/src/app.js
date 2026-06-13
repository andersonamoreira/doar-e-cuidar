require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes         = require('./routes/auth');
const itensRoutes        = require('./routes/itens');
const candidaturasRoutes = require('./routes/candidaturas');
const usuariosRoutes     = require('./routes/usuarios');
const categoriasRoutes   = require('./routes/categorias');
const statsRoutes        = require('./routes/stats');
const errorMiddleware    = require('./middleware/error');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',         authRoutes);
app.use('/api/itens',        itensRoutes);
app.use('/api/candidaturas', candidaturasRoutes);
app.use('/api/usuarios',     usuariosRoutes);
app.use('/api/categorias',   categoriasRoutes);
app.use('/api/stats',        statsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
