import express from 'express';
import { DiarioIndex } from './indexer.js';
import { NotifierEngine } from './notifier.js';
import { parseRawEntry } from './parser.js';
import { renderPortal } from './views.js';
const app = express();
const PORT = process.env.PORT || 4700;
app.use(express.json());
const index = new DiarioIndex();
const notifier = new NotifierEngine();
// Sembrar datos iniciales de muestra basados en publicaciones reales de El Salvador
const sampleEntries = [
    parseRawEntry(`TRIBUNAL SEGUNDO DE SENTENCIA DE SANTA ANA. Causa Penal No. 120-2024.
Se hace saber al señor DAVID SAUL ACOSTA MARTINEZ, con Documento Único de Identidad número 02444983-6, que mediante auto de fecha 15 de octubre de 2024 se ha dictado sentencia condenatoria en su contra en calidad de REBELDÍA por el delito de Estafa Informática en perjuicio de la Iglesia de Chalchuapa, condenándole a cuatro años de prisión y al pago de diecinueve mil quinientos dólares de los Estados Unidos de América en concepto de responsabilidad civil. Se libran las correspondientes órdenes de captura.`, { tomo: 441, numero: 204, fecha: '2024-10-28', pagina: 45, pdfUrl: 'https://www.diariooficial.gob.sv/diarios/2024/do-441-204.pdf' }),
    parseRawEntry(`JUZGADO TERCERO DE LO CIVIL Y MERCANTIL DE SAN SALVADOR.
Emplazamiento por edicto a la sociedad INVERSIONES SANTA ELENA, S.A. DE C.V., con NIT 0614-120598-101-2, en juicio ejecutivo mercantil promovido por Banco Agrícola para que en el plazo de diez días hábiles conteste la demanda bajo apercibimiento de ley.`, { tomo: 442, numero: 210, fecha: '2024-11-04', pagina: 78, pdfUrl: 'https://www.diariooficial.gob.sv/diarios/2024/do-442-210.pdf' }),
    parseRawEntry(`REGISTRO DE LA PROPIEDAD INTELECTUAL. CENTRO NACIONAL DE REGISTROS (CNR).
Solicitud de registro de la marca de producto "GRUPO STU CLOUD GATWEAY", amparando servicios tecnológicos de alojamiento web y software en la clase 42 internacional. Solicitante: GRUPO STU, S.A.S. Representante legal debidamente acreditado. Se publica para efectos de oposición de terceros conforme a la Ley de Marcas y Otros Signos Distintivos.`, { tomo: 442, numero: 212, fecha: '2024-11-06', pagina: 112, pdfUrl: 'https://www.diariooficial.gob.sv/diarios/2024/do-442-212.pdf' })
];
index.addBatch(sampleEntries);
// ------------------------------------------------------------------------------
// RUTAS WEB Y API
// ------------------------------------------------------------------------------
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'stu-diario-oficial',
        uptimeSeconds: Math.floor(process.uptime()),
        indexedRecords: index.count(),
        activeSubscriptions: notifier.getSubscriptionsCount()
    });
});
app.get('/', (_req, res) => {
    res.send(renderPortal({
        totalDocumentos: index.count(),
        totalAlertas: notifier.getSubscriptionsCount()
    }));
});
app.get('/api/v1/search', (req, res) => {
    const query = String(req.query.q || '');
    const categoria = req.query.categoria ? String(req.query.categoria) : undefined;
    const result = index.search(query, categoria);
    res.json(result);
});
app.post('/api/v1/alerts', (req, res) => {
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
    console.log(`[stu-diario-oficial] Base de datos indexada con ${index.count()} publicaciones oficiales.`);
});
