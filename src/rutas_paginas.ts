// Rutas de páginas y metadatos: portada, privacidad, robots, mapa del sitio, salud y enlace al visor.
import { Router, type Request, type Response } from 'express';
import type { ContextoRutas } from './contexto.js';
import { CABECERAS_BORDE_HTML, TIPO_HTML } from './contexto.js';
import { renderError } from './pagina_base.js';
import { renderPrivacidad } from './privacidad.js';
import { enviarPrecomprimida, precomprimir } from './respuesta_cache.js';
import { limitarTasa } from './seguridad_http.js';
import { resolverEnlaceVisor } from './visor.js';

const ROBOTS = 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://diariosoficiales.grupostu.com/sitemap.xml\n';
const SITEMAP =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://diariosoficiales.grupostu.com/</loc><changefreq>weekly</changefreq></url><url><loc>https://diariosoficiales.grupostu.com/privacidad</loc></url></urlset>\n';

export function rutasPaginas(ctx: ContextoRutas): Router {
  const r = Router();

  // Salud: nunca expone suscripciones ni datos personales.
  r.get(['/health', '/api/health'], (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      status: 'ok',
      service: 'stu-diario-oficial',
      uptimeSeconds: Math.floor(process.uptime()),
      indexedRecords: ctx.publicaciones.contar(),
      diarios: ctx.catalogo.length,
      marcasCatalogadas: ctx.publicaciones.marcas().length
    });
  });

  r.get('/', (req: Request, res: Response) => {
    enviarPrecomprimida(req, res, ctx.portada.obtener(), CABECERAS_BORDE_HTML);
  });

  const privacidad = precomprimir(renderPrivacidad(), TIPO_HTML, 9);
  r.get('/privacidad', (req: Request, res: Response) => {
    enviarPrecomprimida(req, res, privacidad, CABECERAS_BORDE_HTML);
  });

  // Mapa del sitio y robots para buscadores (la portada es la única página pública indexable).
  r.get('/robots.txt', (_req: Request, res: Response) => {
    res.type('text/plain').send(ROBOTS);
  });
  r.get('/sitemap.xml', (_req: Request, res: Response) => {
    res.type('application/xml').send(SITEMAP);
  });

  // Enlace directo desde cada resultado al folio del PDF en el Visor Ebook: /visor?id=...
  r.get('/visor', limitarTasa(ctx.limites.lecturas), (req: Request, res: Response) => {
    const destino = resolverEnlaceVisor(ctx.publicaciones, req.query.id);
    if (!destino) {
      res.status(404).type('html').send(renderError(404, 'Publicación no encontrada', 'El enlace no corresponde a ninguna publicación del archivo. Puede que haya cambiado o que el identificador sea incorrecto.'));
      return;
    }
    res.redirect(302, destino);
  });

  return r;
}
