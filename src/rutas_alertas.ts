// Alta de alertas (datos personales): validación estricta, límite de uso propio y minimización en la respuesta.
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
    const { usuarioEmail, telefonoWhatsapp, criterioBusqueda, tipoCriterio } = check.value;
    // La inserción y el límite se resuelven juntos; reintentos de red recuperan la misma alerta.
    const resultado = ctx.suscripciones.suscribirUnaVez({ usuarioEmail, telefonoWhatsapp, criterioBusqueda, tipoCriterio: tipoCriterio || 'DUI' }, ctx.maxSuscripciones);
    if (resultado.estado === 'limite') {
      res.set('Cache-Control', 'no-store');
      res.status(503).json({ error: 'El servicio de alertas no admite más suscripciones por ahora.' });
      return;
    }
    const sub = resultado.suscripcion;
    if (!sub) {
      res.status(500).json({ error: 'No se pudo confirmar el registro de la alerta.' });
      return;
    }
    if (resultado.estado === 'creada') ctx.portada.invalidar();
    // Minimización: no se devuelven DUI, correo ni teléfono; solo el identificador de la alerta.
    res.status(resultado.estado === 'creada' ? 201 : 200).json({ success: true, id: sub.id });
  });

  return r;
}
