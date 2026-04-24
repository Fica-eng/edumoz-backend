const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/provincias?ano=2025
// Lista todas as províncias com estatísticas
router.get('/', async (req, res) => {
  try {
    const ano = parseInt(req.query.ano) || 2025;

    const { data, error } = await supabase
      .from('estatisticas_provinciais')
      .select(`
        id, nome, codigo,
        total_alunos, total_escolas, total_professores,
        taxa_aprovacao, taxa_evasao, taxa_reprovacao,
        ratio_professor_aluno
      `)
      .eq('ano_lectivo', ano)
      .order('nome');

    if (error) throw error;

    // Adiciona status automático baseado na taxa de aprovação
    const comStatus = data.map(p => ({
      ...p,
      estado: p.taxa_aprovacao >= 80 ? 'bom'
            : p.taxa_aprovacao >= 70 ? 'medio'
            : 'critico'
    }));

    res.json({ ano_lectivo: ano, provincias: comStatus });

  } catch (err) {
    console.error('Erro províncias:', err);
    res.status(500).json({ erro: 'Erro ao carregar províncias' });
  }
});

// GET /api/provincias/:id?ano=2025
// Detalhe de uma província específica
router.get('/:id', async (req, res) => {
  try {
    const ano = parseInt(req.query.ano) || 2025;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('estatisticas_provinciais')
      .select('*')
      .eq('id', id)
      .eq('ano_lectivo', ano)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ erro: 'Província não encontrada' });

    res.json(data);

  } catch (err) {
    console.error('Erro província:', err);
    res.status(500).json({ erro: 'Erro ao carregar província' });
  }
});

module.exports = router;
