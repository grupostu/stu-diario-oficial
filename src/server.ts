import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DiarioIndex } from './indexer.js';
import { NotifierEngine } from './notifier.js';
import { parseRawEntry } from './parser.js';
import { renderPortal } from './views.js';
import type { DiarioRecord } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4700;

app.use(express.json());

const index = new DiarioIndex();
const notifier = new NotifierEngine();

// ------------------------------------------------------------------------------
// CARGA DE DATOS OFICIALES REALES Y MARCAS
// ------------------------------------------------------------------------------
let marcasData: any[] = [];

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
    const realRecords: DiarioRecord[] = JSON.parse(raw);
    index.addBatch(realRecords);
    console.log(`[stu-diario-oficial] Base de datos enriquecida con ${realRecords.length} publicaciones oficiales reales desde ${realDataPath}.`);
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
      contenido: `REGISTRO DE LA PROPIEDAD INTELECTUAL. Solicitud de registro de signo distintivo. Denominación: "${m.denominacion}". Tipo: ${m.tipoSigno}. Clase Internacional de Niza: ${m.claseNiza}. Cobertura: ${m.claseDescripcion}. Solicitante / Titular: ${m.titular}. Número de Expediente: ${m.expediente}. Tomo ${m.tomo}, Página ${m.pagina}. Publicación oficial para efectos de oposición de terceros.`,
      duisEncontrados: [],
      nitsEncontrados: [],
      nombresClave: [m.denominacion, m.titular],
      pdfUrlOficial: m.pdfUrlOficial
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
      { tomo: 441, numero: 204, fecha: '2024-10-28', pagina: 45, pdfUrl: 'https://www.diariooficial.gob.sv/diarios/2024/do-441-204.pdf' }
    ),
    parseRawEntry(
      `JUZGADO TERCERO DE LO CIVIL Y MERCANTIL DE SAN SALVADOR.
Emplazamiento por edicto a la sociedad INVERSIONES SANTA ELENA, S.A. DE C.V., con NIT 0614-120598-101-2, en juicio ejecutivo mercantil promovido por Banco Agrícola para que en el plazo de diez días hábiles conteste la demanda bajo apercibimiento de ley.`,
      { tomo: 442, numero: 210, fecha: '2024-11-04', pagina: 78, pdfUrl: 'https://www.diariooficial.gob.sv/diarios/2024/do-442-210.pdf' }
    )
  ];
  index.addBatch(sampleEntries);
}

// ------------------------------------------------------------------------------
// RUTAS WEB Y API
// ------------------------------------------------------------------------------

app.get('/health', (_req: Request, res: Response) => {
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
  res.send(renderPortal({
    totalDocumentos: index.count(),
    totalAlertas: notifier.getSubscriptionsCount()
  }));
});

app.get('/api/v1/search', (req: Request, res: Response) => {
  const query = String(req.query.q || '');
  const categoria = req.query.categoria ? String(req.query.categoria) : undefined;
  const forceDui = req.query.forceDui === 'true' || req.query.forceDui === '1';
  const result = index.search(query, categoria, forceDui);
  res.json(result);
});

// Endpoint especializado para el buscador de marcas
app.get('/api/v1/marcas', (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase();
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

  res.json({
    total: filtered.length,
    marcas: filtered
  });
});

// Endpoint para los últimos edictos judiciales
app.get('/api/v1/edictos-recientes', (_req: Request, res: Response) => {
  const edictos = index.getRecentByCategory('EDICTO_JUDICIAL', 20);
  res.json({
    total: edictos.length,
    edictos
  });
});

// Endpoint para decretos y resoluciones oficiales
app.get('/api/v1/leyes-recientes', (_req: Request, res: Response) => {
  const leyes = index.getRecentByCategory('DECRETO_LEGISLATIVO', 15);
  res.json({
    total: leyes.length,
    leyes
  });
});

app.post('/api/v1/alerts', (req: Request, res: Response) => {
  const { usuarioEmail, telefonoWhatsapp, criterioBusqueda, tipoCriterio } = req.body;
  if (!usuarioEmail || !criterioBusqueda) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const sub = notifier.subscribe({
    usuarioEmail,
    telefonoWhatsapp,
    criterioBusqueda,
    tipoCriterio: tipoCriterio || 'DUI'
  });

  res.status(201).json({ success: true, subscription: sub });
});

app.listen(PORT, () => {
  console.log(`[stu-diario-oficial] Servidor escuchando en puerto ${PORT}`);
  console.log(`[stu-diario-oficial] Base de datos indexada con ${index.count()} publicaciones oficiales y ${marcasData.length} marcas.`);
});
