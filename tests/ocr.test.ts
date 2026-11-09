// Pruebas unitarias y de seguridad para el pipeline de OCR local y separación estricta de datos.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ETIQUETA_OCR,
  ORIGEN_OCR,
  esPaginaSinCapaDeTexto,
  validarArchivoOcr,
  renderVistaOcr,
  TesseractCliAdaptador,
  evaluarOcrDiario,
  type ArchivoOcr,
  type AdaptadorOcr
} from '../src/ocr.js';
import { DiarioIndex } from '../src/indexer.js';

describe('Detección de páginas sin capa de texto (escaneos)', () => {
  it('identifica páginas de escaneo puro (sin texto digital y con cobertura visual alta)', () => {
    // Caso típico de páginas 3 a 14 del Decreto 690: 0 caracteres en cuerpo, imagen cubriendo > 60%
    assert.equal(esPaginaSinCapaDeTexto(0, 0.67), true);
    assert.equal(esPaginaSinCapaDeTexto(18, 0.65), true);
  });

  it('no confunde páginas con texto digital oficial como escaneos', () => {
    // Páginas con capa de texto normal (2000+ caracteres)
    assert.equal(esPaginaSinCapaDeTexto(2500, 0.0), false);
    assert.equal(esPaginaSinCapaDeTexto(500, 0.05), false);
  });

  it('no marca como escaneo una página con poco texto pero sin imagen que la cubra', () => {
    // Espacio en blanco o pie suelto sin imagen de escaneo
    assert.equal(esPaginaSinCapaDeTexto(20, 0.1), false);
  });
});

describe('Validación estricta del archivo OCR (public/data/ocr-<id>.json)', () => {
  const shaValido = 'a'.repeat(64);
  const archivoValido: ArchivoOcr = {
    origen: ORIGEN_OCR,
    etiqueta: ETIQUETA_OCR,
    diarioId: '2026-10-23',
    pdfSha256: shaValido,
    motor: { nombre: 'tesseract', version: '5.3.0', idioma: 'spa' },
    generado: '2026-11-08T20:00:00.000Z',
    paginas: {
      '3': {
        texto: 'DECRETO No. 690',
        imagen: { ancho: 1200, alto: 1800, sha256: shaValido }
      }
    }
  };

  it('acepta un archivo OCR válido para páginas sin capa de texto', () => {
    const errs = validarArchivoOcr(archivoValido, {
      paginasSinTexto: [3, 4, 5],
      totalPaginas: 164,
      pdfSha256: shaValido,
      diarioId: '2026-10-23'
    });
    assert.deepEqual(errs, []);
  });

  it('rechaza si falta la etiqueta obligatoria de advertencia al usuario', () => {
    const sinEtiqueta = { ...archivoValido, etiqueta: 'Texto verificado' };
    const errs = validarArchivoOcr(sinEtiqueta, { paginasSinTexto: [3], totalPaginas: 164 });
    assert.ok(errs.some((e) => e.includes('falta la etiqueta obligatoria')));
  });

  it('rechaza si el origen no es «ocr»', () => {
    const origenMalo = { ...archivoValido, origen: 'oficial' };
    const errs = validarArchivoOcr(origenMalo, { paginasSinTexto: [3], totalPaginas: 164 });
    assert.ok(errs.some((e) => e.includes('origen debe ser «ocr»')));
  });

  it('rechaza terminantemente aplicar OCR sobre páginas que SÍ tienen texto digital oficial', () => {
    // Si la página 23 tiene texto oficial en el PDF, el validador RECHAZA que se incluya en OCR
    const mezclaIndebida: ArchivoOcr = {
      ...archivoValido,
      paginas: {
        '23': { texto: 'Texto duplicado', imagen: { ancho: 100, alto: 100, sha256: shaValido } }
      }
    };
    const errs = validarArchivoOcr(mezclaIndebida, {
      paginasSinTexto: [3, 4], // 23 NO está aquí
      totalPaginas: 164
    });
    assert.ok(errs.some((e) => e.includes('la página 23 tiene capa de texto en el PDF: no se admite OCR')));
  });

  it('rechaza archivo con páginas fuera de rango del diario', () => {
    const fueraDeRango: ArchivoOcr = {
      ...archivoValido,
      paginas: {
        '999': { texto: 'Out of bounds', imagen: { ancho: 100, alto: 100, sha256: shaValido } }
      }
    };
    const errs = validarArchivoOcr(fueraDeRango, { paginasSinTexto: [999], totalPaginas: 164 });
    assert.ok(errs.some((e) => e.includes('fuera del diario')));
  });
});

describe('Vista HTML separada para OCR (renderVistaOcr)', () => {
  it('incluye cabecera noindex, advertencia visible y escapa contenido potencialmente malicioso', () => {
    const html = renderVistaOcr({
      diarioId: '2026-10-23',
      tomo: 453,
      numero: 198,
      fecha: '2026-10-23',
      pagina: 3,
      pdf: '/pdf/23-10-2026.pdf',
      sinCapaDeTexto: true,
      ocr: {
        pagina: {
          texto: 'DECRETO No. 690 <script>alert("xss")</script> & fin',
          imagen: { ancho: 100, alto: 100, sha256: 'a'.repeat(64) }
        },
        motor: { nombre: 'tesseract', version: '5.3.0', idioma: 'spa' },
        generado: '2026-11-08'
      }
    });

    // Seguridad y meta
    assert.ok(html.includes('<meta name="robots" content="noindex">'), 'debe tener noindex');
    assert.ok(html.includes(ETIQUETA_OCR), 'debe mostrar la etiqueta de advertencia');
    assert.ok(html.includes('Reconocido automáticamente, puede contener errores'), 'texto visible de advertencia');
    assert.ok(html.includes('/pdf/23-10-2026.pdf#page=3'), 'enlace al PDF original en página 3');

    // Escapado XSS
    assert.ok(!html.includes('<script>alert'), 'no debe contener tags sin escapar');
    assert.ok(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'debe escapar <script>');
    assert.ok(html.includes('&amp; fin'), 'debe escapar ampersand');
  });

  it('indica claramente cuando una página no tiene capa de texto y aún no tiene OCR', () => {
    const html = renderVistaOcr({
      diarioId: '2026-10-23',
      tomo: 453,
      numero: 198,
      fecha: '2026-10-23',
      pagina: 4,
      pdf: '/pdf/23-10-2026.pdf',
      sinCapaDeTexto: true,
      ocr: null
    });
    assert.ok(html.includes('Esta página es una imagen sin texto digital en el PDF y todavía no tiene texto reconocido'));
  });
});

describe('Adaptador Tesseract y bloqueo limpio cuando no está en PATH', () => {
  it('inspeccionar() documenta bloqueo sin arrojar excepciones si tesseract falta', async () => {
    const adaptador = new TesseractCliAdaptador('binario_inexistente_tesseract_test');
    const info = await adaptador.inspeccionar();
    assert.equal(info.disponible, false);
    assert.ok(info.detalle?.includes('no está disponible en PATH'));
  });

  it('reconocer() rechaza con error descriptivo y nunca produce texto simulado', async () => {
    const adaptador = new TesseractCliAdaptador('binario_inexistente_tesseract_test');
    await assert.rejects(
      () => adaptador.reconocer(Buffer.from('fake-png')),
      /Motor OCR no disponible/
    );
  });

  it('evaluarOcrDiario documenta bloqueo y no escribe datos ficticios cuando el motor no está', async () => {
    const adaptador = new TesseractCliAdaptador('binario_inexistente_tesseract_test');
    const res = await evaluarOcrDiario(
      { id: '2026-10-23', paginas: 164, pdf: '/pdf/23-10-2026.pdf' },
      [3, 4, 5],
      adaptador
    );
    assert.equal(res.bloqueado, true);
    assert.equal(res.archivoOcr, undefined, 'nunca emite archivo OCR simulado');
    assert.deepEqual(res.paginasSinCapaDeTexto, [3, 4, 5]);
  });

  it('evaluarOcrDiario con un adaptador funcional procesa y valida correctamente', async () => {
    const mockAdaptador: AdaptadorOcr = {
      async inspeccionar() {
        return { nombre: 'tesseract-mock', version: '5.0.0', idioma: 'spa', disponible: true };
      },
      async reconocer(_png) {
        return 'TEXTO EXTRAIDO FIEL';
      }
    };

    const res = await evaluarOcrDiario(
      { id: '2026-10-23', paginas: 10, pdf: '/pdf/23-10-2026.pdf', sha256: 'b'.repeat(64) },
      [3],
      mockAdaptador,
      async (_n) => ({ png: Buffer.from('png-data'), ancho: 800, alto: 1000 })
    );

    assert.equal(res.bloqueado, false);
    assert.ok(res.archivoOcr);
    assert.equal(res.archivoOcr.paginas['3']!.texto, 'TEXTO EXTRAIDO FIEL');
    assert.equal(res.archivoOcr.etiqueta, ETIQUETA_OCR);
  });
});

describe('Garantía de no mezcla: el buscador jamás indexa texto OCR', () => {
  it('DiarioIndex no contiene campos ni registros de OCR', () => {
    const idx = new DiarioIndex();
    const r = {
      id: 'do-1',
      tomo: 453,
      numero: 198,
      fecha: '2026-10-23',
      pagina: 1,
      categoria: 'GENERAL' as const,
      seccion: 's',
      titular: 'Acuerdo',
      contenido: 'Texto oficial del PDF',
      duisEncontrados: [],
      nitsEncontrados: [],
      nombresClave: [],
      pdfUrlOficial: '/pdf/23-10-2026.pdf#page=1'
    };
    idx.addRecord(r);

    // Buscar una palabra que solo existiría en OCR hipotético
    const res = idx.buscar({ q: 'facilidades tributarias' });
    assert.equal(res.total, 0, 'no indexa texto que no esté en el corpus oficial');
  });
});
