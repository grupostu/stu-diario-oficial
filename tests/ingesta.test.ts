// Pruebas unitarias de la ingesta de diarios y validación documental contra el PDF.
// Verifica que cada dato del corpus salga del PDF y que la ingesta multi-diario funcione.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { DiarioRecord } from '../src/types.js';
import type { Diario } from '../src/diarios.js';
import {
  validarRegistroContraPdf,
  validarRegistros,
  validarFichaDiario,
  fusionarCorpus,
  fusionarCatalogo,
  verificarCorpus,
  plegarComparacion
} from '../src/validacion_ingesta.js';

const corpus: DiarioRecord[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data_diario_real.json'), 'utf8'));
const catalogo: Diario[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/diarios.json'), 'utf8'));
const paginas20261023: { id: string; paginas: string[] } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/paginas-2026-10-23.json'), 'utf8')
);

describe('Validación de la ingesta contra el PDF original', () => {
  const diarioReal = catalogo.find((d) => d.id === '2026-10-23')!;

  it('los registros del corpus real pasan la validación contra su propio PDF', () => {
    assert.ok(diarioReal, 'debe existir el diario 2026-10-23 en el catálogo');
    const muestra = corpus.slice(0, 50); // Primeros 50 registros representativos
    const res = validarRegistros(muestra, paginas20261023.paginas, diarioReal);
    assert.equal(res.rechazados.length, 0, `registros rechazados: ${JSON.stringify(res.rechazados)}`);
    assert.equal(res.aceptados.length, muestra.length);
  });

  it('rechaza registros con texto alterado o inventado que no coincide con las páginas del PDF', () => {
    const original = corpus[5]!;
    assert.ok(original);
    const falsificado: DiarioRecord = {
      ...original,
      contenido: original.contenido + '\nTexto inventado que no existe en el Diario Oficial.'
    };
    const errores = validarRegistroContraPdf(falsificado, paginas20261023.paginas, diarioReal);
    assert.ok(errores.some((e) => e.includes('el contenido no coincide')), `debe rechazar texto adulterado: ${errores.join('; ')}`);
  });

  it('rechaza registros con rangos fuera del documento o fuera de la página', () => {
    const original = corpus[10]!;
    const rangoInvalido: DiarioRecord = {
      ...original,
      rangos: [[999, 0, 100]] // Página 999 no existe
    };
    const errores = validarRegistroContraPdf(rangoInvalido, paginas20261023.paginas, diarioReal);
    assert.ok(errores.some((e) => e.includes('página 999 fuera del diario')));
  });

  it('rechaza registros cuya URL de visor no apunte al PDF y página correspondientes', () => {
    const original = corpus[10]!;
    const urlMala: DiarioRecord = {
      ...original,
      pdfUrlOficial: '/pdf/otro-diario.pdf#page=1'
    };
    const errores = validarRegistroContraPdf(urlMala, paginas20261023.paginas, diarioReal);
    assert.ok(errores.some((e) => e.includes('pdfUrlOficial no apunta')));
  });

  it('rechaza identidades o entidades clave que no figuren en el texto del PDF', () => {
    const original = corpus[10]!;
    const entidadInventada: DiarioRecord = {
      ...original,
      nombresClave: ['Sociedad Fantasma Inexistente S.A.']
    };
    const errores = validarRegistroContraPdf(entidadInventada, paginas20261023.paginas, diarioReal);
    assert.ok(errores.some((e) => e.includes('Sociedad Fantasma')));
  });

  it('rechaza registros con duisEncontrados falsos que no están en el texto', () => {
    const original = corpus[10]!;
    const duiInventado: DiarioRecord = {
      ...original,
      duisEncontrados: ['00000000-0']
    };
    const errores = validarRegistroContraPdf(duiInventado, paginas20261023.paginas, diarioReal);
    assert.ok(errores.some((e) => e.includes('duisEncontrados')));
  });
});

describe('Validación de la ficha de catálogo del diario', () => {
  it('valida ficha correcta con sha256 y páginas coincidentes', () => {
    const ficha: Diario = {
      id: '2026-10-23',
      tomo: 453,
      numero: 198,
      fecha: '2026-10-23',
      paginas: 164,
      pdf: '/pdf/23-10-2026.pdf',
      sha256: '7af9272041950fd219277d32c53a65529f7f45c928b9bc88a44b1c8369324e93'
    };
    const errs = validarFichaDiario(ficha, { paginas: 164, sha256: ficha.sha256! });
    assert.deepEqual(errs, []);
  });

  it('rechaza ficha con número de páginas o sha256 discrepante frente al PDF real', () => {
    const ficha: Diario = {
      id: '2026-10-23',
      tomo: 453,
      numero: 198,
      fecha: '2026-10-23',
      paginas: 100, // Discrepante
      pdf: '/pdf/23-10-2026.pdf',
      sha256: 'a'.repeat(64)
    };
    const errs = validarFichaDiario(ficha, { paginas: 164, sha256: 'b'.repeat(64) });
    assert.ok(errs.some((e) => e.includes('dice 100 páginas')));
    assert.ok(errs.some((e) => e.includes('sha256')));
  });

  it('rechaza rutas de PDF externas o inseguras', () => {
    const ficha: Diario = {
      id: '2026-10-23',
      tomo: 453,
      numero: 198,
      fecha: '2026-10-23',
      paginas: 164,
      pdf: 'http://externo.com/archivo.pdf'
    };
    const errs = validarFichaDiario(ficha, { paginas: 164, sha256: 'a'.repeat(64) });
    assert.ok(errs.length > 0);
  });
});

describe('Ingesta multi-diario: combinación y preservación de registros existentes', () => {
  const d1: Diario = { id: '2026-10-20', tomo: 453, numero: 195, fecha: '2026-10-20', paginas: 80, pdf: '/pdf/20-10-2026.pdf', sha256: '1'.repeat(64) };
  const d2: Diario = { id: '2026-10-23', tomo: 453, numero: 198, fecha: '2026-10-23', paginas: 164, pdf: '/pdf/23-10-2026.pdf', sha256: '2'.repeat(64) };

  const r1: DiarioRecord = {
    id: 'do-453-20261020-p1-r1',
    tomo: 453, numero: 195, fecha: '2026-10-20', diarioId: '2026-10-20',
    pagina: 1, categoria: 'GENERAL', seccion: 'Portada', titular: 'Sumario',
    contenido: 'Texto 1', duisEncontrados: [], nitsEncontrados: [], nombresClave: [],
    rangos: [[1, 0, 7]], pdfUrlOficial: '/pdf/20-10-2026.pdf#page=1'
  };
  const r2: DiarioRecord = {
    id: 'do-453-20261023-p1-r1',
    tomo: 453, numero: 198, fecha: '2026-10-23', diarioId: '2026-10-23',
    pagina: 1, categoria: 'GENERAL', seccion: 'Portada', titular: 'Sumario',
    contenido: 'Texto 2', duisEncontrados: [], nitsEncontrados: [], nombresClave: [],
    rangos: [[1, 0, 7]], pdfUrlOficial: '/pdf/23-10-2026.pdf#page=1'
  };

  it('fusionarCorpus combina registros de distintos diarios sin duplicar ni borrar', () => {
    const fusion = fusionarCorpus([r1], [r2], '2026-10-23');
    assert.equal(fusion.length, 2);
    assert.equal(fusion[0]!.diarioId, '2026-10-20');
    assert.equal(fusion[1]!.diarioId, '2026-10-23');
  });

  it('fusionarCorpus reemplaza únicamente los registros del diario que se reingiere', () => {
    const r2Modificado = { ...r2, titular: 'Sumario Actualizado' };
    const fusion = fusionarCorpus([r1, r2], [r2Modificado], '2026-10-23');
    assert.equal(fusion.length, 2);
    assert.equal(fusion.find((r) => r.id === r2.id)?.titular, 'Sumario Actualizado');
    assert.equal(fusion.find((r) => r.id === r1.id)?.titular, 'Sumario');
  });

  it('fusionarCatalogo incorpora nuevos diarios y previene colisiones de PDF', () => {
    const cat = fusionarCatalogo([d1], d2);
    assert.equal(cat.length, 2);
    assert.deepEqual(cat.map((d) => d.id), ['2026-10-20', '2026-10-23']);
  });

  it('fusionarCatalogo rechaza mismo diario con sha256 distinto si no se indica reemplazar', () => {
    const d2Modificado = { ...d2, sha256: '9'.repeat(64) };
    assert.throws(
      () => fusionarCatalogo([d1, d2], d2Modificado),
      /sha256 distinto/
    );
  });
});

describe('Verificación integral del corpus completo', () => {
  it('todos los registros del corpus corresponden a su respectiva página de texto en public/data', () => {
    const paginasDe = (id: string) => {
      const p = path.join(process.cwd(), `public/data/paginas-${id}.json`);
      if (!fs.existsSync(p)) return null;
      return JSON.parse(fs.readFileSync(p, 'utf8')).paginas as string[];
    };
    const res = verificarCorpus(corpus.slice(0, 100), catalogo, paginasDe);
    assert.equal(res.sinDiario.length, 0);
    assert.equal(res.problemas.length, 0, `problemas: ${JSON.stringify(res.problemas.slice(0, 5))}`);
  });
});
