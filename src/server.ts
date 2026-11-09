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
import { cargarOcr, renderVistaOcr, ETIQUETA_OCR } from './ocr.js';
import { CacheTTL, enviarPrecomprimida, precomprimir, type Precomprimida } from './respuesta_cache.js';

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
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
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
let cachedPortalPre: Precomprimida | null = null;
let portalRenderizadoEn = 0;
// El contador de alertas cambia con cada suscripción: la portada se vuelve a renderizar como máximo una vez cada 5 s.
const PORTAL_REFRESCO_MS = 5_000;

export function invalidatePortalCache(): void {
  cachedPortalKey = '';
  cachedPortalHtml = '';
  cachedPortalPre = null;
}

function getPortalHtml(): string {
  const docs = index.count();
  const alerts = notifier.getSubscriptionsCount();
  const key = `${docs}:${alerts}`;
  if (key !== cachedPortalKey || !cachedPortalHtml) {
    cachedPortalHtml = renderPortal({ totalDocumentos: docs, totalAlertas: alerts, diarios: catalogo });
    cachedPortalKey = key;
    cachedPortalPre = null;
  }
  return cachedPortalHtml;
}

/** Portada ya renderizada y comprimida (gzip/br) con ETag: se recalcula solo si cambian los contadores (máx. cada 5 s). */
function getPortalPre(): Precomprimida {
  const ahora = Date.now();
  if (!cachedPortalPre || (ahora - portalRenderizadoEn > PORTAL_REFRESCO_MS && cachedPortalKey !== `${index.count()}:${notifier.getSubscriptionsCount()}`)) {
    cachedPortalPre = precomprimir(getPortalHtml(), 'text/html; charset=utf-8', 5);
    portalRenderizadoEn = ahora;
  }
  return cachedPortalPre;
}
// Pre-calentar el HTML del portal en arranque
getPortalPre();

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
    marcasCatalogadas: marcasData().length
  });
});

app.get('/', (req: Request, res: Response) => {
  enviarPrecomprimida(req, res, getPortalPre(), EDGE_HTML_HEADERS);
});

// Mapa del sitio y robots para buscadores (la portada es la única página pública indexable).
const PRIVACIDAD_PRE = precomprimir(renderPrivacidad(), 'text/html; charset=utf-8', 9);
app.get('/privacidad', (req: Request, res: Response) => {
  enviarPrecomprimida(req, res, PRIVACIDAD_PRE, EDGE_HTML_HEADERS);
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

// Límite aparte, más estricto, para escritura de alertas (datos personales) y para lecturas de archivos en disco.
const MAX_SUSCRIPCIONES = Number(process.env.MAX_SUSCRIPCIONES) || 50_000;
const limiteAlertas = new LimitadorTasa(Number(process.env.RATE_LIMIT_ALERTS_MAX) || 5, 10 * 60_000);
const limiteLecturas = new LimitadorTasa(Number(process.env.RATE_LIMIT_READS_MAX) || 120, 60_000);

const cacheBusqueda = new CacheTTL<Precomprimida>(1000, 60_000);
app.get('/api/v1/search', limitarTasa(limiteBusqueda), (req: Request, res: Response) => {
  const v = validarParametrosBusqueda(req.query as Record<string, unknown>);
  if (!v.ok) {
    res.set('Cache-Control', 'no-store');
    const aviso = v.errores.map((e) => e.mensaje).join(' ');
    return res.status(400).json({ error: 'Parámetros de búsqueda inválidos', errores: v.errores, aviso, entradaInvalida: true });
  }
  const { q, categoria, soloDui, pagina, porPagina } = v.valor;
  // El índice es de solo lectura tras el arranque: el resultado de una consulta validada se reutiliza 60 s (tope 1.000 consultas).
  const clave = JSON.stringify([q, categoria, soloDui, pagina, porPagina]);
  let pre = cacheBusqueda.get(clave);
  if (!pre) pre = cacheBusqueda.set(clave, precomprimir(JSON.stringify(index.buscar({ q, categoria, soloDui, pagina, porPagina })), 'application/json; charset=utf-8', 4));
  enviarPrecomprimida(req, res, pre, EDGE_API_HEADERS);
});

// Enlace directo desde cada resultado al folio del PDF en el Visor Ebook: /visor?id=...
app.get('/visor', limitarTasa(limiteLecturas), (req: Request, res: Response) => {
  const destino = resolverEnlaceVisor(index, req.query.id);
  if (!destino) return res.status(404).json({ error: 'Publicación no encontrada' });
  res.redirect(302, destino);
});

// Catálogo de diarios disponibles (lo que el visor puede abrir).
const DIARIOS_PRE = precomprimir(JSON.stringify({ diarios: catalogo }), 'application/json; charset=utf-8', 9);
app.get('/api/v1/diarios', (req: Request, res: Response) => {
  enviarPrecomprimida(req, res, DIARIOS_PRE, { 'Cache-Control': 'no-cache' });
});

// Publicaciones de un diario con su texto y los rangos exactos que ocupan en el PDF (el visor las resalta).
const registrosPre = new Map<string, Precomprimida>();
app.get('/api/v1/diarios/:id/registros', (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!ID_DIARIO.test(id) || !catalogo.some((d) => d.id === id)) return res.status(404).json({ error: 'Diario no encontrado' });
  const cacheado = registrosPre.get(id);
  if (cacheado) return enviarPrecomprimida(req, res, cacheado, { 'Cache-Control': 'no-cache' });
  const lista = registrosPorDiario.get(id) ?? [];
  const cuerpo = {
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
  };
  // Los registros de un diario no cambian tras el arranque: se serializan y comprimen una sola vez.
  const pre = precomprimir(JSON.stringify(cuerpo), 'application/json; charset=utf-8', 6);
  registrosPre.set(id, pre);
  enviarPrecomprimida(req, res, pre, { 'Cache-Control': 'no-cache' });
});

// Dónde más aparece lo buscado: coincidencias por diario (para saltar de un diario a otro).
const cacheCoincidencias = new CacheTTL<Precomprimida>(500, 60_000);
app.get('/api/v1/coincidencias', limitarTasa(limiteBusqueda), (req: Request, res: Response) => {
  const v = validarParametrosBusqueda({ q: req.query.q } as Record<string, unknown>);
  if (!v.ok) return res.status(400).json({ error: 'Parámetros de búsqueda inválidos', diarios: [] });
  const cacheada = cacheCoincidencias.get(v.valor.q);
  if (cacheada) return enviarPrecomprimida(req, res, cacheada, { 'Cache-Control': 'no-cache' });
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
  const pre = cacheCoincidencias.set(
    v.valor.q,
    precomprimir(
      JSON.stringify({ diarios: catalogo.map((d) => ({ id: d.id, tomo: d.tomo, numero: d.numero, fecha: d.fecha, total: por.get(d.id)?.total ?? 0, primeraPagina: por.get(d.id)?.primeraPagina ?? 1 })) }),
      'application/json; charset=utf-8',
      4
    )
  );
  enviarPrecomprimida(req, res, pre, { 'Cache-Control': 'no-cache' });
});

// El JSON de páginas (varios MB) se leía y parseaba de forma síncrona en CADA petición: se conserva 10 min en memoria.
const cachePaginasTexto = new CacheTTL<string[] | null>(16, 10 * 60_000);
function obtenerPaginaTexto(diarioId: string, pagina: number): string | null {
  let paginas = cachePaginasTexto.get(diarioId);
  if (paginas === undefined) {
    paginas = null;
    for (const p of possiblePublicPaths) {
      const arch = path.join(p, 'data', `paginas-${diarioId}.json`);
      if (fs.existsSync(arch)) {
        try {
          const j = JSON.parse(fs.readFileSync(arch, 'utf8'));
          if (Array.isArray(j.paginas)) {
            paginas = j.paginas.map((x: unknown) => String(x));
            break;
          }
        } catch {}
      }
    }
    cachePaginasTexto.set(diarioId, paginas ?? null);
  }
  return paginas && paginas[pagina - 1] !== undefined ? paginas[pagina - 1] : null;
}
const cacheOcr = new CacheTTL<ReturnType<typeof cargarOcr>>(16, 10 * 60_000);
function cargarOcrCacheado(id: string): ReturnType<typeof cargarOcr> {
  const c = cacheOcr.get(id);
  if (c !== undefined) return c;
  return cacheOcr.set(id, cargarOcr(id));
}

// Vista aparte de OCR (reconocido automáticamente, puede contener errores).
// NUNCA se indexa en el buscador principal ni se mezcla con el texto oficial.
// Marca siempre: robots: noindex y etiqueta visible obligatoria.
app.get('/diarios/:id/paginas/:pagina/ocr', limitarTasa(limiteLecturas), (req: Request, res: Response) => {
  const id = String(req.params.id);
  const pagina = /^\d{1,5}$/.test(String(req.params.pagina)) ? parseInt(String(req.params.pagina), 10) : NaN;
  const diario = catalogo.find((d) => d.id === id);
  if (!diario) return res.status(404).send('Diario Oficial no encontrado');
  if (isNaN(pagina) || pagina < 1 || pagina > diario.paginas) {
    return res.status(400).send('Número de página inválido');
  }

  const ocrData = cargarOcrCacheado(id);
  const pagOcr = ocrData?.paginas[String(pagina)];
  const textoPagina = obtenerPaginaTexto(id, pagina);
  const charsCuerpo = (textoPagina ?? '').replace(/DIARIO OFICIAL.*|Tomo Nº \d+|^\d+\s*$/g, '').trim().length;
  const sinCapaDeTexto = charsCuerpo < 80;

  const html = renderVistaOcr({
    diarioId: id,
    tomo: diario.tomo,
    numero: diario.numero,
    fecha: diario.fecha,
    pagina,
    pdf: diario.pdf,
    sinCapaDeTexto,
    ocr: pagOcr ? { pagina: pagOcr, motor: ocrData!.motor, generado: ocrData!.generado } : null
  });

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(html);
});

// API de consulta para OCR separado por diario y página
app.get('/api/v1/diarios/:id/paginas/:pagina/ocr', limitarTasa(limiteLecturas), (req: Request, res: Response) => {
  const id = String(req.params.id);
  const pagina = /^\d{1,5}$/.test(String(req.params.pagina)) ? parseInt(String(req.params.pagina), 10) : NaN;
  const diario = catalogo.find((d) => d.id === id);
  if (!diario) return res.status(404).json({ error: 'Diario no encontrado' });
  if (isNaN(pagina) || pagina < 1 || pagina > diario.paginas) {
    return res.status(400).json({ error: 'Número de página fuera de rango' });
  }

  const ocrData = cargarOcrCacheado(id);
  const pagOcr = ocrData?.paginas[String(pagina)];
  const textoPagina = obtenerPaginaTexto(id, pagina);
  const charsCuerpo = (textoPagina ?? '').replace(/DIARIO OFICIAL.*|Tomo Nº \d+|^\d+\s*$/g, '').trim().length;
  const sinCapaDeTexto = charsCuerpo < 80;

  res.set('Cache-Control', 'no-store');
  res.json({
    origen: 'ocr',
    etiqueta: ETIQUETA_OCR,
    diarioId: id,
    pagina,
    sinCapaDeTexto,
    disponible: !!pagOcr,
    ocr: pagOcr ? { ...pagOcr, motor: ocrData!.motor, generado: ocrData!.generado } : null
  });
});

// Compatibilidad: publicaciones que ocupan una página (de todos los diarios, normalmente uno).
app.get('/api/v1/page-data/:page', limitarTasa(limiteLecturas), (req: Request, res: Response) => {
  const pageNum = /^\d{1,5}$/.test(String(req.params.page)) ? parseInt(String(req.params.page), 10) : NaN;
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
const EDICTOS_PRE = precomprimir(JSON.stringify(cachedEdictos), 'application/json; charset=utf-8', 9);
app.get('/api/v1/edictos-recientes', (req: Request, res: Response) => {
  enviarPrecomprimida(req, res, EDICTOS_PRE, EDGE_API_HEADERS);
});

// Endpoint para decretos y resoluciones oficiales
const LEYES_PRE = precomprimir(JSON.stringify(cachedLeyes), 'application/json; charset=utf-8', 9);
app.get('/api/v1/leyes-recientes', (req: Request, res: Response) => {
  enviarPrecomprimida(req, res, LEYES_PRE, EDGE_API_HEADERS);
});

app.post('/api/v1/alerts', limitarTasa(limiteAlertas), (req: Request, res: Response) => {
  const check = validarAlerta(req.body);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }
  const { usuarioEmail, telefonoWhatsapp, criterioBusqueda, tipoCriterio } = check.value;
  // Tope de memoria: evita agotar el proceso con suscripciones masivas.
  if (notifier.getSubscriptionsCount() >= MAX_SUSCRIPCIONES) {
    res.set('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'El servicio de alertas no admite más suscripciones por ahora.' });
  }

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

const servidor = app.listen(PORT, () => {
  console.log(`[stu-diario-oficial] Servidor escuchando en puerto ${PORT}`);
  console.log(`[stu-diario-oficial] ${index.count()} publicaciones indexadas en ${catalogo.length} diario(s).`);
});
// Detrás de Caddy/Cloudflare: el keep-alive del origen debe ser MAYOR que el del proxy (evita 502 por conexiones reutilizadas ya cerradas).
servidor.keepAliveTimeout = 65_000;
servidor.headersTimeout = 66_000;
servidor.requestTimeout = 30_000;
