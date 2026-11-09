import { validarAlerta } from './alert_validation.js';
import { resolverEnlaceVisor } from './visor.js';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DiarioIndex } from './indexer.js';
import { NotifierEngine } from './notifier.js';
import { renderPortal } from './views.js';
import { renderPrivacidad } from './privacidad.js';
import { validarParametrosBusqueda } from './busqueda_esquema.js';
import { LimitadorTasa } from './limitador.js';
import type { DiarioRecord } from './types.js';
import { cargarCatalogo, ID_DIARIO, type Diario } from './diarios.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
// El servicio corre detrás de un proxy inverso local o de la red privada del contenedor: solo de ellos se acepta X-Forwarded-For.
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// Cabeceras de endurecimiento (no restringen scripts en línea: la portada los usa).
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "base-uri 'self'; object-src 'none'; frame-ancestors 'self'");
  next();
});
const PORT = process.env.PORT || 4700;

app.use(express.json({ limit: '64kb' }));

// Servir archivos estáticos (PDFs originales de la gaceta) con caché inmutable de 30 días
const possiblePublicPaths = [
  path.join(__dirname, '../public'),
  path.join(process.cwd(), 'public'),
  path.join(__dirname, 'public')
];
for (const p of possiblePublicPaths) {
  if (fs.existsSync(p)) {
    app.use('/data', express.static(path.join(p, 'data'), { maxAge: 0, etag: true, setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache') }));
    app.use(express.static(p, { maxAge: '30d', immutable: true }));
    console.log(`[stu-diario-oficial] Sirviendo archivos estáticos desde: ${p}`);
    break;
  }
}

const index = new DiarioIndex();
const notifier = new NotifierEngine();

// ------------------------------------------------------------------------------
// CARGA DEL CORPUS: todo sale de los PDF (scripts/construir_corpus.ts). Nunca hay datos de ejemplo.
// ------------------------------------------------------------------------------
const catalogo: Diario[] = cargarCatalogo();
let allRealRecords: DiarioRecord[] = [];

const possibleRealPaths = [
  path.join(__dirname, 'data_diario_real.json'),
  path.join(__dirname, '../src/data_diario_real.json'),
  path.join(process.cwd(), 'src/data_diario_real.json'),
  path.join(process.cwd(), 'dist/data_diario_real.json')
];
const realDataPath = possibleRealPaths.find(p => fs.existsSync(p));
if (realDataPath) {
  try {
    allRealRecords = JSON.parse(fs.readFileSync(realDataPath, 'utf8'));
    index.addBatch(allRealRecords);
    console.log(`[stu-diario-oficial] ${allRealRecords.length} publicaciones indexadas desde ${realDataPath}.`);
  } catch (err) {
    console.error('[stu-diario-oficial] Error al leer data_diario_real.json:', err);
  }
}
// Las marcas solo existen si un diario cargado trae avisos de marcas (categoría REGISTRO_MARCA).
const marcasData = (): DiarioRecord[] => index.getAllRecords().filter((r) => r.categoria === 'REGISTRO_MARCA');

// ------------------------------------------------------------------------------
// ÍNDICES O(1) Y CACHÉ EN MEMORIA PARA ALTA CONCURRENCIA
// ------------------------------------------------------------------------------
const registrosPorDiario = new Map<string, DiarioRecord[]>();
for (const r of index.getAllRecords()) {
  const id = r.diarioId ?? r.fecha;
  const lista = registrosPorDiario.get(id);
  if (lista) lista.push(r);
  else registrosPorDiario.set(id, [r]);
}

const cachedEdictos = {
  total: index.getRecentByCategory('EDICTO_JUDICIAL', 20).length,
  edictos: index.getRecentByCategory('EDICTO_JUDICIAL', 20)
};

const leyesLista = index.getAllRecords().filter((r) => (r.categoria === 'DECRETO_LEGISLATIVO' || r.categoria === 'ACUERDO_EJECUTIVO') && /^(Decreto|Acuerdo) No\./.test(r.titular)).slice(0, 40);
const cachedLeyes = { total: leyesLista.length, leyes: leyesLista };

let cachedPortalKey = '';
let cachedPortalHtml = '';

export function invalidatePortalCache(): void {
  cachedPortalKey = '';
  cachedPortalHtml = '';
}

function getPortalHtml(): string {
  const docs = index.count();
  const alerts = notifier.getSubscriptionsCount();
  const key = `${docs}:${alerts}`;
  if (key !== cachedPortalKey || !cachedPortalHtml) {
    cachedPortalHtml = renderPortal({ totalDocumentos: docs, totalAlertas: alerts, diarios: catalogo });
    cachedPortalKey = key;
  }
  return cachedPortalHtml;
}
// Pre-calentar el HTML del portal en arranque
getPortalHtml();

const EDGE_HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  'Cloudflare-CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
};

const EDGE_API_HEADERS = {
  'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=3600',
  'CDN-Cache-Control': 'public, max-age=600, stale-while-revalidate=3600'
};

// ------------------------------------------------------------------------------
// RUTAS WEB Y API
// ------------------------------------------------------------------------------

app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    service: 'stu-diario-oficial',
    uptimeSeconds: Math.floor(process.uptime()),
    indexedRecords: index.count(),
    diarios: catalogo.length,
    marcasCatalogadas: marcasData().length,
    activeSubscriptions: notifier.getSubscriptionsCount()
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.set(EDGE_HTML_HEADERS);
  res.send(getPortalHtml());
});

// Mapa del sitio y robots para buscadores (la portada es la única página pública indexable).
app.get('/privacidad', (_req: Request, res: Response) => {
  res.set(EDGE_HTML_HEADERS);
  res.send(renderPrivacidad());
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://diariosoficiales.grupostu.com/sitemap.xml\n');
});
app.get('/sitemap.xml', (_req: Request, res: Response) => {
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://diariosoficiales.grupostu.com/</loc><changefreq>weekly</changefreq></url><url><loc>https://diariosoficiales.grupostu.com/privacidad</loc></url></urlset>\n');
});

// Búsqueda por campo y párrafo. Todos los parámetros se validan con un esquema estricto (src/busqueda_esquema.ts):
// consulta <= 200 caracteres, sección conocida, página y tamaño de página acotados. Nunca se compila una RegExp con la entrada.
// Limitación por IP con penalización exponencial (ver src/limitador.ts). Configurable por entorno.
const limiteBusqueda = new LimitadorTasa(Number(process.env.RATE_LIMIT_SEARCH_MAX) || 90, 60_000);
function limitarTasa(limitador: LimitadorTasa) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const d = limitador.consumir(req.ip || 'desconocida');
    if (d.permitido) return next();
    res.set({ 'Cache-Control': 'no-store', 'Retry-After': String(d.reintentarEnSeg) });
    res.status(429).json({ error: 'Demasiadas solicitudes', aviso: `Hiciste demasiadas consultas seguidas. Espera ${d.reintentarEnSeg} segundos y vuelve a intentar.`, reintentarEnSeg: d.reintentarEnSeg });
  };
}

app.get('/api/v1/search', limitarTasa(limiteBusqueda), (req: Request, res: Response) => {
  const v = validarParametrosBusqueda(req.query as Record<string, unknown>);
  if (!v.ok) {
    res.set('Cache-Control', 'no-store');
    const aviso = v.errores.map((e) => e.mensaje).join(' ');
    return res.status(400).json({ error: 'Parámetros de búsqueda inválidos', errores: v.errores, aviso, entradaInvalida: true });
  }
  const { q, categoria, soloDui, pagina, porPagina } = v.valor;
  const result = index.buscar({ q, categoria, soloDui, pagina, porPagina });
  res.set(EDGE_API_HEADERS);
  res.json(result);
});

// Enlace directo desde cada resultado al folio del PDF en el Visor Ebook: /visor?id=...
app.get('/visor', (req: Request, res: Response) => {
  const destino = resolverEnlaceVisor(index, req.query.id);
  if (!destino) return res.status(404).json({ error: 'Publicación no encontrada' });
  res.redirect(302, destino);
});

// Catálogo de diarios disponibles (lo que el visor puede abrir).
app.get('/api/v1/diarios', (_req: Request, res: Response) => {
  res.set('Cache-Control', 'no-cache');
  res.json({ diarios: catalogo });
});

// Publicaciones de un diario con su texto y los rangos exactos que ocupan en el PDF (el visor las resalta).
app.get('/api/v1/diarios/:id/registros', (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!ID_DIARIO.test(id) || !catalogo.some((d) => d.id === id)) return res.status(404).json({ error: 'Diario no encontrado' });
  const lista = registrosPorDiario.get(id) ?? [];
  res.set('Cache-Control', 'no-cache');
  res.json({
    diario: id,
    registros: lista.map((r) => ({
      id: r.id,
      pagina: r.pagina,
      paginaFin: r.paginaFin ?? r.pagina,
      titular: r.titular,
      clasificacionJuridica: r.clasificacionJuridica,
      contenido: r.contenido,
      duisEncontrados: r.duisEncontrados,
      rangos: r.rangos ?? []
    }))
  });
});

// Dónde más aparece lo buscado: coincidencias por diario (para saltar de un diario a otro).
app.get('/api/v1/coincidencias', limitarTasa(limiteBusqueda), (req: Request, res: Response) => {
  const v = validarParametrosBusqueda({ q: req.query.q } as Record<string, unknown>);
  if (!v.ok) return res.status(400).json({ error: 'Parámetros de búsqueda inválidos', diarios: [] });
  const r = index.buscar({ q: v.valor.q, pagina: 1, porPagina: 5000 });
  const por = new Map<string, { total: number; primeraPagina: number }>();
  for (const x of r.resultados) {
    const id = x.diario.diarioId ?? x.diario.fecha;
    const u = por.get(id);
    if (!u) por.set(id, { total: 1, primeraPagina: x.diario.pagina });
    else {
      u.total++;
      if (x.diario.pagina < u.primeraPagina) u.primeraPagina = x.diario.pagina;
    }
  }
  res.set('Cache-Control', 'no-cache');
  res.json({
    diarios: catalogo.map((d) => ({ id: d.id, tomo: d.tomo, numero: d.numero, fecha: d.fecha, total: por.get(d.id)?.total ?? 0, primeraPagina: por.get(d.id)?.primeraPagina ?? 1 }))
  });
});

// Compatibilidad: publicaciones que ocupan una página (de todos los diarios, normalmente uno).
app.get('/api/v1/page-data/:page', (req: Request, res: Response) => {
  const pageNum = parseInt(String(req.params.page), 10);
  if (isNaN(pageNum)) return res.status(400).json({ error: 'Número de página inválido' });
  const pageRecords = index.getAllRecords().filter((r) => r.pagina <= pageNum && (r.paginaFin ?? r.pagina) >= pageNum);
  res.set(EDGE_API_HEADERS);
  res.json({ pagina: pageNum, totalRegistros: pageRecords.length, records: pageRecords });
});

// Marcas: solo avisos de marcas que existan en los diarios cargados.
app.get('/api/v1/marcas', limitarTasa(limiteBusqueda), (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase().slice(0, 100);
  let filtered = marcasData();
  if (query) filtered = filtered.filter((m) => `${m.titular} ${m.contenido}`.toLowerCase().includes(query));
  res.set(EDGE_API_HEADERS);
  res.json({
    total: filtered.length,
    marcas: filtered.map((m) => ({ id: m.id, diarioId: m.diarioId ?? m.fecha, tomo: m.tomo, numero: m.numero, fecha: m.fecha, pagina: m.pagina, titular: m.titular, contenido: m.contenido })),
    aviso: filtered.length === 0 ? 'Los diarios cargados no contienen avisos de marcas para este criterio.' : undefined
  });
});

// Endpoint para los últimos edictos judiciales
app.get('/api/v1/edictos-recientes', (_req: Request, res: Response) => {
  res.set(EDGE_API_HEADERS);
  res.json(cachedEdictos);
});

// Endpoint para decretos y resoluciones oficiales
app.get('/api/v1/leyes-recientes', (_req: Request, res: Response) => {
  res.set(EDGE_API_HEADERS);
  res.json(cachedLeyes);
});

app.post('/api/v1/alerts', (req: Request, res: Response) => {
  const check = validarAlerta(req.body);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }
  const { usuarioEmail, telefonoWhatsapp, criterioBusqueda, tipoCriterio } = check.value;

  const sub = notifier.subscribe({
    usuarioEmail,
    telefonoWhatsapp,
    criterioBusqueda,
    tipoCriterio: tipoCriterio || 'DUI'
  });

  invalidatePortalCache();
  // Minimización: no se devuelven DUI, correo ni teléfono; solo el identificador de la alerta.
  res.status(201).json({ success: true, id: sub.id });
});

// Manejador final de errores: respuesta genérica, sin trazas ni rutas internas.
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.set('Cache-Control', 'no-store');
  res.status(status).json({ error: status >= 500 ? 'Error interno del servidor' : 'Solicitud inválida' });
});

app.listen(PORT, () => {
  console.log(`[stu-diario-oficial] Servidor escuchando en puerto ${PORT}`);
  console.log(`[stu-diario-oficial] ${index.count()} publicaciones indexadas en ${catalogo.length} diario(s).`);
});
