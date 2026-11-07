import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractDuis, extractNits, detectCategory, parseRawEntry } from '../src/parser.js';
import { DiarioIndex } from '../src/indexer.js';
import { NotifierEngine } from '../src/notifier.js';

describe('Stu Diario Oficial — Motor de Búsqueda y Alertas Ciudadanas SV', () => {
  describe('Parser y Extractor de Identificadores', () => {
    it('extrae DUIs correctamente con formato 8-1', () => {
      const text = 'Sentencia contra David Saúl Acosta Martínez, DUI 02444983-6 y otro sujeto con DUI 01234567-8.';
      const duis = extractDuis(text);
      assert.deepEqual(duis, ['02444983-6', '01234567-8']);
    });

    it('extrae NITs de 14 dígitos', () => {
      const text = 'Sociedad mercantil con NIT 0614-120598-101-2 registrada.';
      const nits = extractNits(text);
      assert.deepEqual(nits, ['0614-120598-101-2']);
    });

    it('clasifica categorías jurídicas con precisión', () => {
      assert.equal(detectCategory('Juzgado emite edicto de emplazamiento'), 'EDICTO_JUDICIAL');
      assert.equal(detectCategory('Solicitud de registro de marca de fábrica'), 'REGISTRO_MARCA');
      assert.equal(detectCategory('Decreto No 45 de la Asamblea Legislativa'), 'DECRETO_LEGISLATIVO');
      assert.equal(detectCategory('Acuerdo No 12 del Ramo de Hacienda'), 'ACUERDO_EJECUTIVO');
      assert.equal(detectCategory('Subasta y embargo de bienes inmuebles'), 'SUBASTA_EMBARGO');
    });
  });

  describe('Índice Invertido y Búsqueda Full-Text', () => {
    const index = new DiarioIndex();
    const entry = parseRawEntry(
      'TRIBUNAL SEGUNDO DE SENTENCIA DE SANTA ANA. Causa Penal No. 120-2024 contra David Saúl Acosta Martínez, DUI 02444983-6 en rebeldía.',
      { tomo: 441, numero: 204, fecha: '2024-10-28', pagina: 45, pdfUrl: 'https://test.pdf' }
    );
    index.addRecord(entry);

    it('encuentra el registro inmediatamente por número de DUI', () => {
      const res = index.search('02444983-6');
      assert.equal(res.total, 1);
      assert.equal(res.results[0]!.coincidenciaExacta, true);
      assert.match(res.results[0]!.snippet, /02444983-6/);
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
