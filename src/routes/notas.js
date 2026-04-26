const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarPerfil } = require('../middleware/auth');

// GET /api/notas?aluno_id=1&ano=2025
router.get('/', async (req, res) => {
  try {
    const { aluno_id, escola_id, ano = 2025, trimestre } = req.query;

    let query = supabase
      .from('notas')
      .select(`
        id, aluno_id, professor_id, disciplina, trimestre, ano_lectivo,
        nota_1, nota_2, nota_3, media_trimestral, media_final,
        faltas_justificadas, faltas_injustificadas,
        comportamento, situacao_social, observacoes, created_at
      `)
      .eq('ano_lectivo', ano)
      .order('created_at', { ascending: false });

    if (aluno_id)  query = query.eq('aluno_id', aluno_id);
    if (trimestre) query = query.eq('trimestre', trimestre);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ notas: data });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar notas' });
  }
});

// POST /api/notas — apenas Professor e Admin
router.post('/', verificarPerfil(['admin', 'professor']), async (req, res) => {
  try {
    const {
      aluno_id, disciplina, trimestre, ano_lectivo,
      nota_1, nota_2, nota_3,
      faltas_justificadas, faltas_injustificadas,
      comportamento, situacao_social, observacoes
    } = req.body;

    if (!aluno_id || !disciplina || !trimestre) {
      return res.status(400).json({ erro: 'Campos obrigatórios: aluno_id, disciplina, trimestre' });
    }

    // Calcula média trimestral
    const notas = [nota_1, nota_2, nota_3].filter(n => n !== null && n !== undefined);
    const media_trimestral = notas.length > 0
      ? (notas.reduce((s, n) => s + parseFloat(n), 0) / notas.length).toFixed(1)
      : null;

    const { data, error } = await supabase
      .from('notas')
      .insert([{
        aluno_id, disciplina, trimestre,
        ano_lectivo: ano_lectivo || 2025,
        nota_1, nota_2, nota_3,
        media_trimestral: parseFloat(media_trimestral),
        faltas_justificadas:   faltas_justificadas   || 0,
        faltas_injustificadas: faltas_injustificadas || 0,
        comportamento,
        situacao_social,
        observacoes
      }])
      .select()
      .single();

    if (error) throw error;

    // Actualiza média final do aluno (média das médias trimestrais)
    await actualizarMediaFinal(aluno_id, disciplina, ano_lectivo || 2025);

    res.status(201).json({ mensagem: 'Notas registadas com sucesso', nota: data });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registar notas' });
  }
});

// PUT /api/notas/:id — Professor actualiza as suas notas
router.put('/:id', verificarPerfil(['admin', 'professor']), async (req, res) => {
  try {
    const {
      nota_1, nota_2, nota_3,
      faltas_justificadas, faltas_injustificadas,
      comportamento, situacao_social, observacoes
    } = req.body;

    const notas = [nota_1, nota_2, nota_3].filter(n => n !== null && n !== undefined);
    const media_trimestral = notas.length > 0
      ? (notas.reduce((s, n) => s + parseFloat(n), 0) / notas.length).toFixed(1)
      : null;

    const { data, error } = await supabase
      .from('notas')
      .update({
        nota_1, nota_2, nota_3,
        media_trimestral: parseFloat(media_trimestral),
        faltas_justificadas, faltas_injustificadas,
        comportamento, situacao_social, observacoes
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ mensagem: 'Notas actualizadas', nota: data });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao actualizar notas' });
  }
});

// Função auxiliar: calcula e guarda média final
async function actualizarMediaFinal(aluno_id, disciplina, ano_lectivo) {
  try {
    const { data: todasNotas } = await supabase
      .from('notas')
      .select('media_trimestral')
      .eq('aluno_id', aluno_id)
      .eq('disciplina', disciplina)
      .eq('ano_lectivo', ano_lectivo)
      .not('media_trimestral', 'is', null);

    if (!todasNotas || todasNotas.length === 0) return;

    const mediaFinal = (
      todasNotas.reduce((s, n) => s + parseFloat(n.media_trimestral), 0) / todasNotas.length
    ).toFixed(1);

    await supabase
      .from('notas')
      .update({ media_final: parseFloat(mediaFinal) })
      .eq('aluno_id', aluno_id)
      .eq('disciplina', disciplina)
      .eq('ano_lectivo', ano_lectivo);

  } catch (err) {
    console.error('Erro ao calcular média final:', err);
  }
}

module.exports = router;
