require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Segurança ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting: máximo 100 pedidos por 15 min por IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ── Rotas ──────────────────────────────────────────
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/provincias',  require('./routes/provincias'));
app.use('/api/escolas',     require('./routes/escolas'));
app.use('/api/alunos',      require('./routes/alunos'));
app.use('/api/professores', require('./routes/professores'));

// ── Health check ───────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    sistema: 'EduMoz API',
    versao: '1.0.0',
    mec: 'República de Moçambique',
    docs: '/api/docs'
  });
});

// ── Erros ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// ── Iniciar ────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ EduMoz API a correr na porta ${PORT}`);
  console.log(`📊 MEC Moçambique — Sistema de Administração Educacional`);
});
