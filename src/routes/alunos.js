const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarPerfil } = require('../middleware/auth');

// GET /api/alunos — filtrado por perfil
router.get('/', async (req, res) => {
  try {
    const { escola_id, ano = 2025, status, serie, pagina = 1, limite = 50 } = req.query;
    const perfil   = req.headers['x-perfil'];
    const escolaId = req.headers['x-escola-id'] || escola_id;
    const offset   = (pagina - 1) * limite;

    let query = supabase
      .from('alunos')
      .select('id, nome_completo, genero, data_nascimento, serie, turma, escola_id, status, ano_lectivo', { count: 'exact' })
      .eq('ano_lectivo', ano)
      .order('nome_completo')
      .range(offset, offset + limite - 1);

    // Director e Professor vêem apenas alunos da sua escola
    if ((perfil === 'diretor' || perfil === 'professor') && escolaId) {
      query = query.eq('escola_id', escolaId);
    } else if (escola_id) {
      query = query.eq('escola_id', escola_id);
    }

    if (status) query = query.eq('status', status);
    if (serie)  query = query.eq('serie', serie);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      alunos: data,
      total: count,
      pagina: parseInt(pagina),
      total_paginas: Math.ceil(count / limite)
    });
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

// POST /api/alunos — apenas Director e Admin
router.post('/', verificarPerfil(['admin', 'diretor']), async (req, res) => {
  try {
    const { nome_completo, genero, data_nascimento, serie, turma, escola_id, ano_lectivo } = req.body;

    if (!nome_completo || !escola_id || !serie || !genero) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome_completo, escola_id, serie, genero' });
    }

    const { data, error } = await supabase
      .from('alunos')
      .insert([{
        nome_completo, genero, data_nascimento, serie, turma,
        escola_id, ano_lectivo: ano_lectivo || 2025, status: 'ativo'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ mensagem: 'Aluno matriculado com sucesso', aluno: data });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao matricular aluno' });
  }
});

// PUT /api/alunos/:id/status — transferência, evasão (Director e Admin)
router.put('/:id/status', verificarPerfil(['admin', 'diretor']), async (req, res) => {
  try {
    const { status, motivo } = req.body;
    const statusValidos = ['ativo', 'inativo', 'transferido', 'evadido', 'concluido'];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido. Use: ' + statusValidos.join(', ') });
    }

    const { data, error } = await supabase
      .from('alunos')
      .update({ status, motivo_saida: motivo })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ mensagem: 'Status do aluno actualizado', aluno: data });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao actualizar status' });
  }
});

// DELETE /api/alunos/:id — apenas Admin
router.delete('/:id', verificarPerfil(['admin']), async (req, res) => {
  try {
    const { error } = await supabase.from('alunos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ mensagem: 'Aluno removido do sistema' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover aluno' });
  }
});

module.exports = router;
