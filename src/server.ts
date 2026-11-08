import { validarAlerta } from './alert_validation.js';
import { resolverEnlaceVisor } from './visor.js';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DiarioIndex } from './indexer.js';
import { NotifierEngine } from './notifier.js';
import { parseRawEntry } from './parser.js';
import { renderPortal } from './views.js';
import { renderPrivacidad } from './privacidad.js';
import type { DiarioRecord } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
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
    app.use(express.static(p, { maxAge: '30d', immutable: true }));
    console.log(`[stu-diario-oficial] Sirviendo archivos estáticos desde: ${p}`);
    break;
  }
}

const index = new DiarioIndex();
const notifier = new NotifierEngine();

// ------------------------------------------------------------------------------
// CARGA DE DATOS OFICIALES REALES Y MARCAS
// ------------------------------------------------------------------------------
let marcasData: any[] = [];
let allRealRecords: DiarioRecord[] = [];

// 1. Cargar registros extraídos del Diario Oficial real
const possibleRealPaths = [
  path.join(__dirname, 'data_diario_real.json'),
  path.join(__dirname, '../src/data_diario_real.json'),
  path.join(process.cwd(), 'src/data_diario_real.json'),
  path.join(process.cwd(), 'dist/data_diario_real.json')
];
const realDataPath = possibleRealPaths.find(p => fs.existsSync(p));
if (realDataPath) {
  try {
    const raw = fs.readFileSync(realDataPath, 'utf8');
    allRealRecords = JSON.parse(raw);
    index.addBatch(allRealRecords);
    console.log(`[stu-diario-oficial] Base de datos enriquecida con ${allRealRecords.length} publicaciones oficiales reales desde ${realDataPath}.`);
  } catch (err) {
    console.error('[stu-diario-oficial] Error al leer data_diario_real.json:', err);
  }
}

// 2. Cargar catálogo de marcas registradas del CNR
const possibleMarcasPaths = [
  path.join(__dirname, 'data_marcas.json'),
  path.join(__dirname, '../src/data_marcas.json'),
  path.join(process.cwd(), 'src/data_marcas.json'),
  path.join(process.cwd(), 'dist/data_marcas.json')
];
const marcasPath = possibleMarcasPaths.find(p => fs.existsSync(p));
if (marcasPath) {
  try {
    const rawMarcas = fs.readFileSync(marcasPath, 'utf8');
    marcasData = JSON.parse(rawMarcas);

    // Convertir marcas a registros indexables de DiarioRecord
    const marcasDiario: DiarioRecord[] = marcasData.map((m: any) => ({
      id: m.id,
      tomo: m.tomo,
      numero: 198,
      fecha: m.fechaPublicacion,
      pagina: m.pagina,
      categoria: 'REGISTRO_MARCA',
      seccion: 'Registro de la Propiedad Intelectual (CNR)',
      titular: `SOLICITUD DE MARCA: ${m.denominacion} (Clase ${m.claseNiza})`,
      contenido: `REGISTRO DE LA PROPIEDAD INTELECTUAL. Solicitud de registro de signo distintivo. Denominación: "${m.denominacion}". Tipo: ${m.tipoSigno}. Clase Internacional de Niza: ${m.claseNiza}. Cobertura: ${m.claseDescripcion}. Solicitante / Titular: ${m.titular}. Número de Expediente: ${m.expediente}. Tomo ${m.tomo}, Página ${m.pagina}. Publicación oficial para efectos de oposición de terceros conforme a la Ley de Marcas.`,
      duisEncontrados: [],
      nitsEncontrados: [],
      nombresClave: [m.denominacion, m.titular],
      pdfUrlOficial: `/pdf/23-10-2026.pdf#page=${m.pagina}`
    }));

    index.addBatch(marcasDiario);
    console.log(`[stu-diario-oficial] Registradas ${marcasData.length} publicaciones de marcas de propiedad intelectual.`);
  } catch (err) {
    console.error('[stu-diario-oficial] Error al leer data_marcas.json:', err);
  }
}

// 3. Fallback de muestras si no hubiera datos
if (index.count() === 0) {
  const sampleEntries = [
    parseRawEntry(
      `TRIBUNAL SEGUNDO DE SENTENCIA DE SANTA ANA. Causa Penal No. 120-2024.
Se hace saber al señor DAVID SAUL ACOSTA MARTINEZ, con Documento Único de Identidad número 02444983-6, que mediante auto de fecha 15 de octubre de 2024 se ha dictado sentencia condenatoria en su contra en calidad de REBELDÍA por el delito de Estafa Informática en perjuicio de la Iglesia de Chalchuapa, condenándole a cuatro años de prisión y al pago de diecinueve mil quinientos dólares de los Estados Unidos de América en concepto de responsabilidad civil. Se libran las correspondientes órdenes de captura.`,
      { tomo: 441, numero: 204, fecha: '2024-10-28', pagina: 45, pdfUrl: '/pdf/23-10-2026.pdf#page=45' }
    ),
    parseRawEntry(
      `JUZGADO TERCERO DE LO CIVIL Y MERCANTIL DE SAN SALVADOR.
Emplazamiento por edicto a la sociedad INVERSIONES SANTA ELENA, S.A. DE C.V., con NIT 0614-120598-101-2, en juicio ejecutivo mercantil promovido por Banco Agrícola para que en el plazo de diez días hábiles conteste la demanda bajo apercibimiento de ley.`,
      { tomo: 442, numero: 210, fecha: '2024-11-04', pagina: 78, pdfUrl: '/pdf/23-10-2026.pdf#page=78' }
    )
  ];
  index.addBatch(sampleEntries);
}

// ------------------------------------------------------------------------------
// ÍNDICES O(1) Y CACHÉ EN MEMORIA PARA ALTA CONCURRENCIA
// ------------------------------------------------------------------------------
const recordsByPage = new Map<number, DiarioRecord[]>();
for (const r of index.getAllRecords()) {
  const list = recordsByPage.get(r.pagina);
  if (list) list.push(r);
  else recordsByPage.set(r.pagina, [r]);
}

const cachedEdictos = {
  total: index.getRecentByCategory('EDICTO_JUDICIAL', 20).length,
  edictos: index.getRecentByCategory('EDICTO_JUDICIAL', 20)
};

const cachedLeyes = {
  total: index.getRecentByCategory('DECRETO_LEGISLATIVO', 15).length,
  leyes: index.getRecentByCategory('DECRETO_LEGISLATIVO', 15)
};

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
    cachedPortalHtml = renderPortal({ totalDocumentos: docs, totalAlertas: alerts });
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
    marcasCatalogadas: marcasData.length,
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

app.get('/api/v1/search', (req: Request, res: Response) => {
  const query = String(req.query.q || '').slice(0, 120);
  const categoria = req.query.categoria ? String(req.query.categoria) : undefined;
  const forceDui = req.query.forceDui === 'true' || req.query.forceDui === '1';
  const result = index.search(query, categoria, forceDui);
  res.set(EDGE_API_HEADERS);
  res.json(result);
});

// Enlace directo desde cada resultado al folio del PDF en el Visor Ebook: /visor?id=...
app.get('/visor', (req: Request, res: Response) => {
  const destino = resolverEnlaceVisor(index, req.query.id);
  if (!destino) return res.status(404).json({ error: 'Publicación no encontrada' });
  res.redirect(302, destino);
});

// Endpoint O(1) para obtener todos los registros transcritos de una página específica para el visor Ebook
app.get('/api/v1/page-data/:page', (req: Request, res: Response) => {
  const pageNum = parseInt(String(req.params.page), 10);
  if (isNaN(pageNum)) {
    return res.status(400).json({ error: 'Número de página inválido' });
  }

  const pageRecords = recordsByPage.get(pageNum) ?? [];
  res.set(EDGE_API_HEADERS);
  res.json({
    pagina: pageNum,
    totalRegistros: pageRecords.length,
    records: pageRecords
  });
});

// Endpoint especializado para el buscador de marcas
app.get('/api/v1/marcas', (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase().slice(0, 100);
  const clase = req.query.clase ? String(req.query.clase).trim() : '';

  let filtered = marcasData;

  if (clase) {
    filtered = filtered.filter(m => String(m.claseNiza) === clase);
  }

  if (query) {
    filtered = filtered.filter(m =>
      m.denominacion.toLowerCase().includes(query) ||
      m.titular.toLowerCase().includes(query) ||
      m.claseDescripcion.toLowerCase().includes(query) ||
      m.expediente.toLowerCase().includes(query)
    );
  }

  res.set(EDGE_API_HEADERS);
  res.json({
    total: filtered.length,
    marcas: filtered
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

app.listen(PORT, () => {
  console.log(`[stu-diario-oficial] Servidor escuchando en puerto ${PORT}`);
  console.log(`[stu-diario-oficial] Base de datos indexada con ${index.count()} publicaciones oficiales y ${marcasData.length} marcas.`);
});
