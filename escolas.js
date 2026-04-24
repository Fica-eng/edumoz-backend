// ── ESCOLAS ───────────────────────────────────────
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/escolas?provincia=Maputo&tipo=primaria&pagina=1
router.get('/', async (req, res) => {
  try {
    const { provincia, tipo, pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = supabase
      .from('escolas')
      .select('id, nome, tipo, provincia, distrito, total_alunos, total_professores, telefone, email', { count: 'exact' })
      .order('nome')
      .range(offset, offset + limite - 1);

    if (provincia) query = query.eq('provincia', provincia);
    if (tipo)      query = query.eq('tipo', tipo);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      escolas: data,
      total: count,
      pagina: parseInt(pagina),
      total_paginas: Math.ceil(count / limite)
    });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar escolas' });
  }
});

// GET /api/escolas/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('escolas')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ erro: 'Escola não encontrada' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar escola' });
  }
});

// POST /api/escolas — Registar nova escola
router.post('/', async (req, res) => {
  try {
    const { nome, tipo, provincia, distrito, telefone, email, latitude, longitude } = req.body;

    if (!nome || !tipo || !provincia) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, tipo, provincia' });
    }

    const { data, error } = await supabase
      .from('escolas')
      .insert([{ nome, tipo, provincia, distrito, telefone, email, latitude, longitude }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ mensagem: 'Escola registada com sucesso', escola: data });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registar escola' });
  }
});

module.exports = router;
