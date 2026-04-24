// ── ALUNOS ────────────────────────────────────────
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/alunos?escola_id=1&ano=2025&pagina=1
router.get('/', async (req, res) => {
  try {
    const { escola_id, ano = 2025, status, pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = supabase
      .from('alunos')
      .select('id, nome_completo, genero, data_nascimento, serie, turma, escola_id, status, ano_lectivo', { count: 'exact' })
      .eq('ano_lectivo', ano)
      .order('nome_completo')
      .range(offset, offset + limite - 1);

    if (escola_id) query = query.eq('escola_id', escola_id);
    if (status)    query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ alunos: data, total: count, pagina: parseInt(pagina), total_paginas: Math.ceil(count / limite) });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar alunos' });
  }
});

// GET /api/alunos/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ erro: 'Aluno não encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar aluno' });
  }
});

// POST /api/alunos — Matricular aluno
router.post('/', async (req, res) => {
  try {
    const { nome_completo, genero, data_nascimento, serie, turma, escola_id, ano_lectivo } = req.body;

    if (!nome_completo || !escola_id || !serie) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome_completo, escola_id, serie' });
    }

    const { data, error } = await supabase
      .from('alunos')
      .insert([{ nome_completo, genero, data_nascimento, serie, turma, escola_id, ano_lectivo: ano_lectivo || 2025, status: 'ativo' }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ mensagem: 'Aluno matriculado com sucesso', aluno: data });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao matricular aluno' });
  }
});

module.exports = router;
