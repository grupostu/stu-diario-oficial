// Rutas de OCR por página. El OCR es texto reconocido automáticamente: NUNCA se indexa en el buscador principal ni se
// mezcla con el texto oficial. La vista HTML marca siempre robots: noindex y la etiqueta visible obligatoria.
import { Router, type Request, type Response } from 'express';
import type { ContextoRutas } from './contexto.js';
import { ETIQUETA_OCR, MAX_CARACTERES_CUERPO_SIN_TEXTO, renderVistaOcr } from './ocr.js';
import { limitarTasa, parsearNumeroPagina } from './seguridad_http.js';

/** Una página «sin capa de texto» es la que, quitados encabezado y folio, casi no tiene texto oficial. */
function sinCapaDeTexto(textoPagina: string | null): boolean {
  const cuerpo = (textoPagina ?? '').replace(/DIARIO OFICIAL.*|Tomo Nº \d+|^\d+\s*$/g, '').trim();
  return cuerpo.length < MAX_CARACTERES_CUERPO_SIN_TEXTO;
}

export function rutasOcr(ctx: ContextoRutas): Router {
  const r = Router();
  const { catalogo, ocr } = ctx;

  r.get('/diarios/:id/paginas/:pagina/ocr', limitarTasa(ctx.limites.lecturas), (req: Request, res: Response) => {
    const id = String(req.params.id);
    const pagina = parsearNumeroPagina(req.params.pagina);
    const diario = catalogo.find((d) => d.id === id);
    if (!diario) {
      res.status(404).send('Diario Oficial no encontrado');
      return;
    }
    if (isNaN(pagina) || pagina < 1 || pagina > diario.paginas) {
      res.status(400).send('Número de página inválido');
      return;
    }
    const datos = ocr.cargar(id);
    const pagOcr = datos?.paginas[String(pagina)];
    const html = renderVistaOcr({
      diarioId: id,
      tomo: diario.tomo,
      numero: diario.numero,
      fecha: diario.fecha,
      pagina,
      pdf: diario.pdf,
      sinCapaDeTexto: sinCapaDeTexto(ocr.textoPagina(id, pagina)),
      ocr: datos && pagOcr ? { pagina: pagOcr, motor: datos.motor, generado: datos.generado } : null
    });
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-store');
    res.send(html);
  });

  // API de consulta para OCR separado por diario y página.
  r.get('/api/v1/diarios/:id/paginas/:pagina/ocr', limitarTasa(ctx.limites.lecturas), (req: Request, res: Response) => {
    const id = String(req.params.id);
    const pagina = parsearNumeroPagina(req.params.pagina);
    const diario = catalogo.find((d) => d.id === id);
    if (!diario) {
      res.status(404).json({ error: 'Diario no encontrado' });
      return;
    }
    if (isNaN(pagina) || pagina < 1 || pagina > diario.paginas) {
      res.status(400).json({ error: 'Número de página fuera de rango' });
      return;
    }
    const datos = ocr.cargar(id);
    const pagOcr = datos?.paginas[String(pagina)];
    res.set('Cache-Control', 'no-store');
    res.json({
      origen: 'ocr',
      etiqueta: ETIQUETA_OCR,
      diarioId: id,
      pagina,
      sinCapaDeTexto: sinCapaDeTexto(ocr.textoPagina(id, pagina)),
      disponible: !!pagOcr,
      ocr: datos && pagOcr ? { ...pagOcr, motor: datos.motor, generado: datos.generado } : null
    });
  });

  return r;
}
