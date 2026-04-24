const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/professores?escola_id=1&disciplina=matematica
router.get('/', async (req, res) => {
  try {
    const { escola_id, disciplina, pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = supabase
      .from('professores')
      .select('id, nome_completo, genero, qualificacao, disciplinas, escola_id, provincia, status', { count: 'exact' })
      .order('nome_completo')
      .range(offset, offset + limite - 1);

    if (escola_id)   query = query.eq('escola_id', escola_id);
    if (disciplina)  query = query.contains('disciplinas', [disciplina]);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ professores: data, total: count, pagina: parseInt(pagina), total_paginas: Math.ceil(count / limite) });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar professores' });
  }
});

// POST /api/professores — Registar professor
router.post('/', async (req, res) => {
  try {
    const { nome_completo, genero, qualificacao, disciplinas, escola_id, provincia } = req.body;

    if (!nome_completo || !escola_id) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome_completo, escola_id' });
    }

    const { data, error } = await supabase
      .from('professores')
      .insert([{ nome_completo, genero, qualificacao, disciplinas, escola_id, provincia, status: 'ativo' }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ mensagem: 'Professor registado com sucesso', professor: data });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registar professor' });
  }
});

module.exports = router;
