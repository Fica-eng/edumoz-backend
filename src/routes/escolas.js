const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarPerfil } = require('../middleware/auth');

// GET /api/escolas — qualquer perfil autenticado pode ver
router.get('/', async (req, res) => {
  try {
    const { provincia, tipo, pagina = 1, limite = 50 } = req.query;
    const perfil   = req.headers['x-perfil'];
    const provinciaPerfil = req.headers['x-provincia'];
    const offset   = (pagina - 1) * limite;

    let query = supabase
      .from('escolas')
      .select('id, nome, tipo, provincia, distrito, total_alunos, total_professores, telefone, email, status', { count: 'exact' })
      .order('nome')
      .range(offset, offset + limite - 1);

    // Coordenador vê apenas a sua província
    if (perfil === 'coordenador' && provinciaPerfil) {
      query = query.eq('provincia', provinciaPerfil);
    } else if (perfil === 'diretor') {
      // Director vê apenas a sua escola (filtrado pelo escola_id no header)
      const escolaId = req.headers['x-escola-id'];
      if (escolaId) query = query.eq('id', escolaId);
    }

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

// POST /api/escolas — apenas Admin MEC e Coordenador Regional
router.post('/', verificarPerfil(['admin', 'coordenador']), async (req, res) => {
  try {
    const { nome, tipo, provincia, distrito, telefone, email, latitude, longitude } = req.body;

    if (!nome || !tipo || !provincia) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, tipo, provincia' });
    }

    const { data, error } = await supabase
      .from('escolas')
      .insert([{ nome, tipo, provincia, distrito, telefone, email, latitude, longitude, status: 'ativa' }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ mensagem: 'Escola registada com sucesso', escola: data });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registar escola' });
  }
});

// PUT /api/escolas/:id — apenas Admin e Coordenador
router.put('/:id', verificarPerfil(['admin', 'coordenador']), async (req, res) => {
  try {
    const { nome, tipo, provincia, distrito, telefone, email } = req.body;
    const { data, error } = await supabase
      .from('escolas')
      .update({ nome, tipo, provincia, distrito, telefone, email })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ mensagem: 'Escola actualizada', escola: data });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao actualizar escola' });
  }
});

// DELETE /api/escolas/:id — apenas Admin MEC
router.delete('/:id', verificarPerfil(['admin']), async (req, res) => {
  try {
    const { error } = await supabase.from('escolas').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ mensagem: 'Escola eliminada' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao eliminar escola' });
  }
});

module.exports = router;
