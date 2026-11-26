// Las alertas están deshabilitadas hasta que exista un ciclo completo de confirmación, entrega y baja.
import { Router, type Request, type Response } from 'express';
import { validarAlerta } from './alert_validation.js';
import type { ContextoRutas } from './contexto.js';
import { limitarTasa } from './seguridad_http.js';

export function rutasAlertas(ctx: ContextoRutas): Router {
  const r = Router();

  r.post('/api/v1/alerts', limitarTasa(ctx.limites.alertas), (req: Request, res: Response) => {
    const check = validarAlerta(req.body);
    if (!check.ok) {
      res.status(400).json({ error: check.error });
      return;
    }
    // No se almacena ni reenvía ningún dato hasta implementar y verificar el ciclo completo.
    res.set('Cache-Control', 'no-store');
    res.status(503).json({ error: 'Las alertas por correo están temporalmente deshabilitadas.' });
  });

  return r;
}
