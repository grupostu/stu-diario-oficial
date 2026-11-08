import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  extractDuis,
  extractNits,
  detectCategory,
  classifyLegalRecord,
  duiToWords,
  normalizeDuiInput,
  parseRawEntry
} from '../src/parser.js';
import { DiarioIndex } from '../src/indexer.js';
import { NotifierEngine } from '../src/notifier.js';
import { renderPortal } from '../src/views.js';

describe('Stu Diario Oficial — Motor de Búsqueda, Clasificación Jurídica, PDF.js Sync y Alertas Ciudadanas SV', () => {
  describe('Parser, Extractor de Identificadores y Normalización Bipartita (Números ↔ Letras)', () => {
    it('extrae DUIs correctamente con formato 8-1 y escritos en palabras notariales', () => {
      const text =
        'Sentencia contra David Saúl Acosta Martínez, DUI 02444983-6 y heredero con Documento Único de Identidad número CERO CERO TRES CINCO SEIS DOS SIETE CUATRO - DOS.';
      const duis = extractDuis(text);
      assert.deepEqual(duis, ['02444983-6', '00356274-2']);
    });

    it('convierte DUI numérico a su representación notarial en palabras', () => {
      assert.equal(
        duiToWords('00356274-2'),
        'CERO CERO TRES CINCO SEIS DOS SIETE CUATRO - DOS'
      );
    });

    it('normaliza entradas de DUI con 8 dígitos, sin guion o en letras', () => {
      assert.equal(normalizeDuiInput('356274-2').canonical, '00356274-2');
      assert.equal(normalizeDuiInput('003562742').canonical, '00356274-2');
      assert.equal(
        normalizeDuiInput('cero cero tres cinco seis dos siete cuatro - dos').canonical,
        '00356274-2'
      );
    });

    it('extrae NITs de 14 dígitos', () => {
      const text = 'Sociedad mercantil con NIT 0614-120598-101-2 registrada.';
      const nits = extractNits(text);
      assert.deepEqual(nits, ['0614-120598-101-2']);
    });

    it('clasifica categorías jurídicas y las 7 clasificaciones canónicas con precisión', () => {
      assert.equal(detectCategory('Juzgado emite edicto de emplazamiento'), 'EDICTO_JUDICIAL');
      assert.equal(detectCategory('Solicitud de registro de marca de fábrica'), 'REGISTRO_MARCA');
      assert.equal(detectCategory('Decreto No 45 de la Asamblea Legislativa'), 'DECRETO_LEGISLATIVO');
      assert.equal(detectCategory('Acuerdo No 12 del Ramo de Hacienda'), 'ACUERDO_EJECUTIVO');
      assert.equal(detectCategory('Subasta y embargo de bienes inmuebles'), 'SUBASTA_EMBARGO');

      assert.equal(classifyLegalRecord('diligencias de Aceptación de Herencia Intestada'), 'Aceptación de Herencia');
      assert.equal(classifyLegalRecord('declarado en calidad de rebeldía y orden de captura'), 'Declaratoria de Rebeldía');
      assert.equal(classifyLegalRecord('solicitud de Título Supletorio de inmueble rústico'), 'Título Supletorio');
      assert.equal(classifyLegalRecord('venta en pública subasta y remate'), 'Subasta Pública');
      assert.equal(classifyLegalRecord('Balance General de INVERSIONES S.A. DE C.V.'), 'Aviso de Sociedad');
      assert.equal(classifyLegalRecord('Órgano Legislativo Decreto No. 690'), 'Decreto/Acuerdo');
      assert.equal(classifyLegalRecord('Juzgado de lo Civil emplaza al demandado'), 'Edicto Judicial');
    });
  });

  describe('Índice Invertido O(1), Remarcado Interactivo y Búsqueda Full-Text', () => {
    const index = new DiarioIndex();
    const entry = parseRawEntry(
      'TRIBUNAL SEGUNDO DE SENTENCIA DE SANTA ANA. Causa Penal No. 120-2024 contra David Saúl Acosta Martínez, DUI 02444983-6 en rebeldía.',
      { tomo: 453, numero: 198, fecha: '2026-10-23', pagina: 45, pdfUrl: '/pdf/23-10-2026.pdf#page=45' }
    );
    index.addRecord(entry);

    it('encuentra el registro inmediatamente por número de DUI y genera mark interactivo', () => {
      const res = index.search('02444983-6');
      assert.equal(res.total, 1);
      assert.equal(res.results[0]!.coincidenciaExacta, true);
      assert.equal(res.results[0]!.diario.clasificacionJuridica, 'Declaratoria de Rebeldía');
      assert.match(res.results[0]!.snippet, /highlight-clickable/);
      assert.match(res.results[0]!.snippet, /openEbookViewer\(45/);
    });

    it('encuentra el registro por nombre parcial de persona', () => {
      const res = index.search('David Saúl');
      assert.equal(res.total, 1);
      assert.match(res.results[0]!.snippet, /David Saúl/);
    });

    it('retorna 0 resultados si el término no existe', () => {
      const res = index.search('PersonaInexistente999');
      assert.equal(res.total, 0);
    });
  });

  describe('Visor Ebook Hiper-Interactivo PDF.js y Activos Gráficos (40+ SVG/WEBP)', () => {
    it('renderiza el portal con PDF.js, sincronización bidireccional y controles avanzados', () => {
      const html = renderPortal({ totalDocumentos: 542, totalAlertas: 12 });
      assert.match(html, /cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\/3\.11\.174\/pdf\.min\.js/);
      assert.match(html, /pdf-highlight-box/);
      assert.match(html, /focusTermInPdfFromTranscription/);
      assert.match(html, /syncPdfClickToTranscription/);
      assert.match(html, /openCertifiedCitationModal/);
    });

    it('cuenta con al menos 40 activos gráficos reales (.svg y .webp) en public/assets/graphics', () => {
      const graphicsDir = path.join(process.cwd(), 'public', 'assets', 'graphics');
      const files = fs.readdirSync(graphicsDir).filter(f => f.endsWith('.svg') || f.endsWith('.webp'));
      assert.ok(files.length >= 40, `Se esperaban >= 40 activos gráficos y se encontraron ${files.length}`);
    });
  });

  describe('Motor de Notificaciones Preventivas', () => {
    const notifier = new NotifierEngine();
    notifier.subscribe({
      usuarioEmail: 'abogado@cliente.com',
      telefonoWhatsapp: '+50370001122',
      criterioBusqueda: '02444983-6',
      tipoCriterio: 'DUI'
    });

    it('dispara alerta cuando una publicación oficial coincide con el DUI vigilado', () => {
      const record = parseRawEntry(
        'Edicto de rebeldía sobre imputado con DUI 02444983-6.',
        { tomo: 441, numero: 204, fecha: '2024-10-28', pagina: 10, pdfUrl: 'https://test.pdf' }
      );
      const matches = notifier.checkMatches(record);
      assert.equal(matches.length, 1);
      assert.equal(matches[0]!.sub.usuarioEmail, 'abogado@cliente.com');
    });
  });
});
