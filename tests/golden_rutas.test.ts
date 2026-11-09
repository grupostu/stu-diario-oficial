// Pruebas de caracterización (golden): congelan el comportamiento observable de cada ruta (estado, cabeceras
// relevantes y cuerpo). Se arranca el servidor real en el puerto 9851 y se compara con tests/golden/*.txt.
// Solo se regeneran a propósito con UPDATE_GOLDEN=1 (y el cambio debe explicarse en el commit).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const PORT = 9851;
const DIR_GOLDEN = path.join(import.meta.dirname, 'golden');
const ACTUALIZAR = process.env.UPDATE_GOLDEN === '1';
// Cuerpos más grandes que esto se congelan como huella SHA-256 + longitud.
const MAX_CUERPO_LITERAL = 300_000;
const CABECERAS_RELEVANTES = ['content-type', 'cache-control', 'cdn-cache-control', 'location', 'vary', 'content-encoding', 'etag', 'retry-after', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'content-security-policy', 'permissions-policy', 'cross-origin-opener-policy', 'x-powered-by'];

interface Resp {
  status: number;
  headers: http.IncomingHttpHeaders;
  cuerpo: Buffer;
}

function pedir(opts: { path: string; method?: string; headers?: Record<string, string>; body?: string }): Promise<Resp> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = { 'accept-encoding': 'identity', ...(opts.headers ?? {}) };
    const req = http.request({ host: '127.0.0.1', port: PORT, path: opts.path, method: opts.method ?? 'GET', headers }, (res) => {
      const trozos: Buffer[] = [];
      res.on('data', (c: Buffer) => trozos.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, cuerpo: Buffer.concat(trozos) }));
    });
    req.on('error', reject);
    req.setTimeout(10_000, () => req.destroy(new Error('timeout')));
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/** Representación textual estable de una respuesta (sin valores volátiles). */
function serializar(r: Resp, normalizar?: (t: string) => string): string {
  let cuerpo = r.cuerpo;
  if (r.headers['content-encoding'] === 'gzip') cuerpo = gunzipSync(cuerpo);
  const lineas = [`HTTP ${r.status}`];
  // El ETag de la búsqueda cambia con el tiempo de consulta (tiempoMs): en esas respuestas no se congela.
  const volatil = cuerpo.includes('"tiempoMs"');
  for (const k of CABECERAS_RELEVANTES) {
    const v = r.headers[k];
    // Los ETag débiles de Express dependen del cuerpo con valores volátiles; solo se congelan los fuertes (respuestas precomprimidas).
    if (k === 'etag' && (volatil || String(v).startsWith('W/'))) continue;
    if (v !== undefined) lineas.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  }
  let texto = cuerpo.toString('utf8');
  texto = texto.replace(/"tiempoMs":[\d.]+/g, '"tiempoMs":0');
  if (normalizar) texto = normalizar(texto);
  if (cuerpo.length > MAX_CUERPO_LITERAL) {
    lineas.push('', `[cuerpo grande] bytes=${cuerpo.length} sha256=${createHash('sha256').update(cuerpo).digest('hex')}`);
  } else {
    lineas.push('', texto);
  }
  return lineas.join('\n') + '\n';
}

function compararGolden(nombre: string, actual: string): void {
  const archivo = path.join(DIR_GOLDEN, `${nombre}.txt`);
  if (ACTUALIZAR) {
    mkdirSync(DIR_GOLDEN, { recursive: true });
    writeFileSync(archivo, actual, 'utf8');
    return;
  }
  assert.ok(existsSync(archivo), `Falta el golden ${nombre}.txt (genéralo con UPDATE_GOLDEN=1)`);
  // Se ignora el fin de línea del sistema (git en Windows puede convertir CRLF).
  const esperado = readFileSync(archivo, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(actual.replace(/\r\n/g, '\n'), esperado, `La respuesta de «${nombre}» cambió respecto al golden`);
}

let hijo: ChildProcess;

before(async () => {
  hijo = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    env: { ...process.env, PORT: String(PORT), RATE_LIMIT_ALERTS_MAX: '50', RATE_LIMIT_SEARCH_MAX: '1000', RATE_LIMIT_READS_MAX: '1000', NODE_ENV: 'production' },
    stdio: 'ignore'
  });
  for (let i = 0; i < 120; i++) {
    try {
      const r = await pedir({ path: '/health' });
      if (r.status === 200) return;
    } catch { /* aún no arranca */ }
    await new Promise((res) => setTimeout(res, 250));
  }
  throw new Error('El servidor no arrancó');
});

after(() => {
  hijo?.kill();
});

const ID_PUB = 'do-453-20261023-p1-r1';
const sinUptime = (t: string): string => t.replace(/"uptimeSeconds":\d+/, '"uptimeSeconds":0');

const RUTAS_GET: Array<{ nombre: string; ruta: string; headers?: Record<string, string>; normalizar?: (t: string) => string }> = [
  { nombre: 'portada', ruta: '/' },
  { nombre: 'portada_gzip', ruta: '/', headers: { 'accept-encoding': 'gzip' } },
  { nombre: 'privacidad', ruta: '/privacidad' },
  { nombre: 'robots', ruta: '/robots.txt' },
  { nombre: 'sitemap', ruta: '/sitemap.xml' },
  { nombre: 'health', ruta: '/health', normalizar: sinUptime },
  { nombre: 'api_health', ruta: '/api/health', normalizar: sinUptime },
  { nombre: 'diarios', ruta: '/api/v1/diarios' },
  { nombre: 'registros_diario', ruta: '/api/v1/diarios/2026-10-23/registros' },
  { nombre: 'registros_diario_inexistente', ruta: '/api/v1/diarios/2020-01-01/registros' },
  { nombre: 'registros_diario_id_invalido', ruta: '/api/v1/diarios/..%2F..%2Fetc/registros' },
  { nombre: 'busqueda_texto', ruta: '/api/v1/search?q=juzgado' },
  { nombre: 'busqueda_categoria', ruta: '/api/v1/search?q=herencia&categoria=EDICTO_JUDICIAL' },
  { nombre: 'busqueda_pagina_2', ruta: '/api/v1/search?q=juzgado&pagina=2&porPagina=5' },
  { nombre: 'busqueda_solo_dui', ruta: '/api/v1/search?q=juzgado&soloDui=true' },
  { nombre: 'busqueda_vacia', ruta: '/api/v1/search' },
  { nombre: 'busqueda_sin_resultados', ruta: '/api/v1/search?q=zzzxxyyqq' },
  { nombre: 'busqueda_pagina_cero', ruta: '/api/v1/search?q=juzgado&pagina=0' },
  { nombre: 'busqueda_pagina_texto', ruta: '/api/v1/search?q=juzgado&pagina=abc' },
  { nombre: 'busqueda_consulta_larga', ruta: `/api/v1/search?q=${'a'.repeat(201)}` },
  { nombre: 'busqueda_seccion_invalida', ruta: '/api/v1/search?q=juzgado&categoria=NO_EXISTE' },
  { nombre: 'busqueda_xss', ruta: `/api/v1/search?q=${encodeURIComponent('<script>alert(1)</script>')}` },
  { nombre: 'coincidencias', ruta: '/api/v1/coincidencias?q=juzgado' },
  { nombre: 'coincidencias_invalida', ruta: '/api/v1/coincidencias' },
  { nombre: 'visor_valido', ruta: `/visor?id=${ID_PUB}` },
  { nombre: 'visor_desconocido', ruta: '/visor?id=no-existe-123' },
  { nombre: 'visor_sin_id', ruta: '/visor' },
  { nombre: 'ocr_vista', ruta: '/diarios/2026-10-23/paginas/1/ocr' },
  { nombre: 'ocr_vista_fuera_de_rango', ruta: '/diarios/2026-10-23/paginas/999/ocr' },
  { nombre: 'ocr_vista_pagina_texto', ruta: '/diarios/2026-10-23/paginas/abc/ocr' },
  { nombre: 'ocr_vista_diario_desconocido', ruta: '/diarios/2020-01-01/paginas/1/ocr' },
  { nombre: 'ocr_api', ruta: '/api/v1/diarios/2026-10-23/paginas/1/ocr' },
  { nombre: 'ocr_api_fuera_de_rango', ruta: '/api/v1/diarios/2026-10-23/paginas/999/ocr' },
  { nombre: 'ocr_api_diario_desconocido', ruta: '/api/v1/diarios/2020-01-01/paginas/1/ocr' },
  { nombre: 'page_data', ruta: '/api/v1/page-data/28' },
  { nombre: 'page_data_invalida', ruta: '/api/v1/page-data/abc' },
  { nombre: 'marcas', ruta: '/api/v1/marcas' },
  { nombre: 'marcas_consulta', ruta: '/api/v1/marcas?q=zzz' },
  { nombre: 'edictos_recientes', ruta: '/api/v1/edictos-recientes' },
  { nombre: 'leyes_recientes', ruta: '/api/v1/leyes-recientes' },
  { nombre: 'no_encontrada_html', ruta: '/ruta-que-no-existe' },
  { nombre: 'no_encontrada_api', ruta: '/api/v1/nada' },
  { nombre: 'no_encontrada_data', ruta: '/data/nada.json' },
  { nombre: 'no_encontrada_pdf', ruta: '/pdf/nada.pdf' },
  { nombre: 'estatico_tokens_css', ruta: '/stu-ui/tokens.css' },
  { nombre: 'estatico_favicon', ruta: '/favicon.svg' }
];

for (const caso of RUTAS_GET) {
  test(`golden GET ${caso.nombre}`, async () => {
    const r = await pedir({ path: caso.ruta, headers: caso.headers });
    compararGolden(caso.nombre, serializar(r, caso.normalizar));
  });
}

test('golden portada: revalidación con ETag responde 304', async () => {
  const primera = await pedir({ path: '/' });
  const r = await pedir({ path: '/', headers: { 'if-none-match': String(primera.headers.etag) } });
  compararGolden('portada_304', serializar(r));
});

test('golden HEAD portada', async () => {
  const r = await pedir({ path: '/', method: 'HEAD' });
  compararGolden('portada_head', serializar(r));
});

test('golden método no permitido en la portada (POST) cae al 404', async () => {
  const r = await pedir({ path: '/', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  compararGolden('portada_post', serializar(r));
});

test('golden alertas: validaciones, JSON roto y alta correcta', async () => {
  const json = { 'content-type': 'application/json' };
  const casos: Array<{ nombre: string; cuerpo: string; headers?: Record<string, string> }> = [
    { nombre: 'alerta_sin_consentimiento', cuerpo: JSON.stringify({ usuarioEmail: 'a@b.com', criterioBusqueda: 'Juan Perez' }) },
    { nombre: 'alerta_correo_invalido', cuerpo: JSON.stringify({ usuarioEmail: 'no-es-correo', criterioBusqueda: 'Juan Perez', consentimiento: true }) },
    { nombre: 'alerta_criterio_vacio', cuerpo: JSON.stringify({ usuarioEmail: 'a@b.com', criterioBusqueda: '', consentimiento: true }) },
    { nombre: 'alerta_telefono_invalido', cuerpo: JSON.stringify({ usuarioEmail: 'a@b.com', telefonoWhatsapp: 'abc', criterioBusqueda: 'Juan Perez', consentimiento: true }) },
    { nombre: 'alerta_json_roto', cuerpo: '{"usuarioEmail":' },
    { nombre: 'alerta_json_roto_html', cuerpo: '{"usuarioEmail":', headers: { accept: 'text/html' } },
    { nombre: 'alerta_cuerpo_enorme', cuerpo: JSON.stringify({ x: 'a'.repeat(70_000) }) }
  ];
  for (const c of casos) {
    const r = await pedir({ path: '/api/v1/alerts', method: 'POST', headers: { ...json, ...(c.headers ?? {}) }, body: c.cuerpo });
    compararGolden(c.nombre, serializar(r));
  }
  const ok = await pedir({ path: '/api/v1/alerts', method: 'POST', headers: json, body: JSON.stringify({ usuarioEmail: 'prueba@example.com', criterioBusqueda: 'Juan Perez', consentimiento: true }) });
  compararGolden('alerta_ok', serializar(ok, (t) => t.replace(/"id":"[^"]+"/, '"id":"alert-X"')));
  // El alta cambia el contador de la portada (se refresca como máximo cada 5 s): el estado y los datos sensibles no se exponen.
  const salud = await pedir({ path: '/health' });
  assert.ok(!/activeSubscriptions|prueba@example\.com/.test(salud.cuerpo.toString('utf8')));
});
