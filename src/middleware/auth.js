// ── MIDDLEWARE DE PERMISSÕES ───────────────────────
// Uso: router.get('/', verificarPerfil(['admin','coordenador']), handler)

function verificarPerfil(perfisPermitidos) {
  return function(req, res, next) {
    var perfil = req.headers['x-perfil'] || req.query._perfil;
    if (!perfil) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: 'Perfil não identificado. Faça login novamente.',
        perfis_permitidos: perfisPermitidos
      });
    }
    if (perfisPermitidos.indexOf(perfil) === -1) {
      return res.status(403).json({
        erro: 'Acesso negado',
        mensagem: 'O seu perfil ("' + perfil + '") não tem permissão para esta acção. Permitido apenas para: ' + perfisPermitidos.join(', ') + '.',
        perfis_permitidos: perfisPermitidos
      });
    }
    req.perfil = perfil;
    next();
  };
}

module.exports = { verificarPerfil };
