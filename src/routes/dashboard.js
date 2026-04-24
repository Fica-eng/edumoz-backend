const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/dashboard?ano=2025
// Retorna todos os KPIs principais para o dashboard
router.get('/', async (req, res) => {
  try {
    const ano = parseInt(req.query.ano) || 2025;

    // Total de alunos
    const { count: totalAlunos } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('ano_lectivo', ano);

    // Total de escolas
    const { count: totalEscolas } = await supabase
      .from('escolas')
      .select('*', { count: 'exact', head: true });

    // Total de professores
    const { count: totalProfessores } = await supabase
      .from('professores')
      .select('*', { count: 'exact', head: true });

    // Taxa de aprovação (média nacional)
    const { data: aprovacao } = await supabase
      .from('resultados_anuais')
      .select('taxa_aprovacao')
      .eq('ano_lectivo', ano);

    const mediaAprovacao = aprovacao && aprovacao.length > 0
      ? (aprovacao.reduce((s, r) => s + r.taxa_aprovacao, 0) / aprovacao.length).toFixed(1)
      : 0;

    // Taxa de evasão (média nacional)
    const { data: evasao } = await supabase
      .from('resultados_anuais')
      .select('taxa_evasao')
      .eq('ano_lectivo', ano);

    const mediaEvasao = evasao && evasao.length > 0
      ? (evasao.reduce((s, r) => s + r.taxa_evasao, 0) / evasao.length).toFixed(1)
      : 0;

    // Matrículas por género
    const { data: generos } = await supabase
      .from('alunos')
      .select('genero')
      .eq('ano_lectivo', ano);

    const masculino = generos ? generos.filter(a => a.genero === 'M').length : 0;
    const feminino  = generos ? generos.filter(a => a.genero === 'F').length : 0;

    res.json({
      ano_lectivo: ano,
      kpis: {
        total_alunos: totalAlunos || 0,
        total_escolas: totalEscolas || 0,
        total_professores: totalProfessores || 0,
        taxa_aprovacao: parseFloat(mediaAprovacao),
        taxa_evasao: parseFloat(mediaEvasao)
      },
      genero: { masculino, feminino },
      actualizado_em: new Date().toISOString()
    });

  } catch (err) {
    console.error('Erro dashboard:', err);
    res.status(500).json({ erro: 'Erro ao carregar dados do dashboard' });
  }
});

// GET /api/dashboard/evolucao
// Evolução de matrículas por ano (para gráfico de linha)
router.get('/evolucao', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('matriculas_anuais')
      .select('ano_lectivo, total_masculino, total_feminino, total_geral')
      .order('ano_lectivo', { ascending: true });

    if (error) throw error;
    res.json({ evolucao: data });

  } catch (err) {
    console.error('Erro evolução:', err);
    res.status(500).json({ erro: 'Erro ao carregar evolução de matrículas' });
  }
});

module.exports = router;
