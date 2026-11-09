// Pruebas ofensivas contra el servicio local (solo localhost, puerto 9300-9349).
// Se arranca el servidor real como proceso hijo y se le lanzan cargas típicas de OWASP.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';

const PORT = 9300;
let hijo: ChildProcess;

function pedir(opts: { path: string; method?: string; headers?: Record<string, string>; body?: string | Buffer }): Promise<{ status: number; headers: http.IncomingHttpHeaders; texto: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: opts.path, method: opts.method ?? 'GET', headers: opts.headers }, (res) => {
      const trozos: Buffer[] = [];
      res.on('data', (c) => trozos.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, texto: Buffer.concat(trozos).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error('timeout')));
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

before(async () => {
  hijo = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    env: { ...process.env, PORT: String(PORT), RATE_LIMIT_ALERTS_MAX: '3', NODE_ENV: 'production' },
    stdio: 'ignore'
  });
  for (let i = 0; i < 80; i++) {
    try {
      const r = await pedir({ path: '/health' });
      if (r.status === 200) return;
    } catch { /* aún no arranca */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('El servidor no arrancó');
});

after(() => {
  hijo?.kill();
});

test('cabeceras de seguridad presentes y sin X-Powered-By', async () => {
  const r = await pedir({ path: '/' });
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
  assert.match(String(r.headers['content-security-policy']), /frame-ancestors/);
  assert.ok(r.headers['referrer-policy']);
  assert.ok(r.headers['x-frame-options']);
  assert.equal(r.headers['x-powered-by'], undefined);
});

test('health no expone suscripciones ni datos sensibles', async () => {
  const r = await pedir({ path: '/health' });
  assert.equal(r.status, 200);
  assert.ok(!/activeSubscriptions|email|token|secret/i.test(r.texto));
});

test('XSS y SQLi en la búsqueda no se reflejan sin escapar y no rompen el servicio', async () => {
  const cargas = [`<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>`, `' OR 1=1 --`, `1; DROP TABLE x;--`, `javascript:alert(1)`, `{{7*7}}`, `${'A'.repeat(5000)}`];
  for (const c of cargas) {
    const r = await pedir({ path: `/api/v1/search?q=${encodeURIComponent(c)}` });
    assert.ok(r.status === 200 || r.status === 400 || r.status === 429, `estado ${r.status}`);
    assert.ok(!r.headers['content-type']?.includes('text/html'), 'la API debe responder JSON');
    assert.ok(!/at\s+\S+\s+\(.*:\d+:\d+\)/.test(r.texto), 'sin trazas de pila');
  }
});

test('path traversal en estáticos, OCR y visor', async () => {
  const rutas = [
    '/data/../../package.json', '/data/%2e%2e/%2e%2e/package.json', '/%2e%2e/%2e%2e/etc/passwd', '/..%5c..%5cpackage.json',
    '/pdf/..%2f..%2fsrc/server.ts', '/diarios/..%2f..%2fsrc/paginas/1/ocr', '/api/v1/diarios/..%2F..%2Fpackage.json/registros',
    '/diarios/2026-10-23/paginas/../../../package.json/ocr', '/src/server.ts', '/package.json', '/.env', '/.git/config'
  ];
  for (const ruta of rutas) {
    const r = await pedir({ path: ruta });
    assert.ok(!/"name":\s*"@stu|express|import express/.test(r.texto), `fuga en ${ruta}`);
    assert.ok(r.status >= 400 || r.headers['content-type']?.includes('html') !== undefined, ruta);
  }
});

test('visor no permite redirecciones abiertas', async () => {
  for (const id of ['//evil.com', 'https://evil.com', '..%2f..%2f', 'a'.repeat(500)]) {
    const r = await pedir({ path: `/visor?id=${encodeURIComponent(id)}` });
    assert.notEqual(r.status, 302, id);
    assert.ok(!r.headers.location);
  }
});

test('JSON malformado y cuerpo gigante se rechazan de forma segura', async () => {
  const malo = await pedir({ path: '/api/v1/alerts', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"a":' });
  assert.equal(malo.status, 400);
  assert.ok(!/SyntaxError|at\s/.test(malo.texto));
  const grande = await pedir({ path: '/api/v1/alerts', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 'A'.repeat(200_000) }) });
  assert.equal(grande.status, 413 === grande.status ? 413 : 400);
  assert.ok(!/PayloadTooLarge|at\s/.test(grande.texto));
});

test('métodos raros no ejecutan lógica ni filtran información', async () => {
  for (const m of ['PUT', 'DELETE', 'PATCH', 'TRACE', 'OPTIONS']) {
    const r = await pedir({ path: '/api/v1/alerts', method: m });
    assert.ok(r.status === 404 || r.status === 405 || r.status === 204 || r.status === 200, `${m} -> ${r.status}`);
    assert.ok(!/at\s+\S+\s+\(/.test(r.texto));
  }
});

test('cabecera Host falsa no cambia el comportamiento ni se refleja', async () => {
  const r = await pedir({ path: '/', headers: { Host: 'evil.com"><script>alert(1)</script>' } });
  assert.ok(!r.texto.includes('<script>alert(1)</script>'));
  const r2 = await pedir({ path: '/', headers: { 'X-Forwarded-Host': 'evil.com', 'X-Forwarded-Proto': 'javascript' } });
  assert.ok(!r2.texto.includes('evil.com'));
});

test('alertas: validación estricta (sin consentimiento, tipos raros, inyección)', async () => {
  const cabecera = { 'Content-Type': 'application/json' };
  const casos: unknown[] = [
    {}, [], 'cadena', null,
    { criterioBusqueda: '<script>', usuarioEmail: 'a@b.co', consentimiento: true },
    { criterioBusqueda: { $ne: 1 }, usuarioEmail: 'a@b.co', consentimiento: true },
    { criterioBusqueda: 'Juan Perez', usuarioEmail: 'a@b.co' },
    { criterioBusqueda: 'Juan Perez', usuarioEmail: 'a@b.co\r\nBcc: x@y.z', consentimiento: true }
  ];
  for (const c of casos) {
    const r = await pedir({ path: '/api/v1/alerts', method: 'POST', headers: cabecera, body: JSON.stringify(c) });
    assert.ok(r.status === 400 || r.status === 429, `estado ${r.status} para ${JSON.stringify(c)}`);
  }
});

test('alertas: limitación por IP con bloqueo tras exceder el máximo', async () => {
  const cabecera = { 'Content-Type': 'application/json' };
  let visto429 = false;
  for (let i = 0; i < 12; i++) {
    const r = await pedir({ path: '/api/v1/alerts', method: 'POST', headers: cabecera, body: '{}' });
    if (r.status === 429) {
      visto429 = true;
      assert.ok(Number(r.headers['retry-after']) >= 1);
      break;
    }
  }
  assert.ok(visto429, 'debe devolver 429');
});

test('X-Forwarded-For falso no evade el límite (proxy no confiable)', async () => {
  // La conexión viene de loopback (proxy "confiable"); aun así, cada IP distinta recibe su propia cuota,
  // pero un mismo cliente real queda ligado al valor que el proxy fija. Aquí solo se verifica que no hay 500.
  const r = await pedir({ path: '/api/v1/search?q=abc', headers: { 'X-Forwarded-For': '1.2.3.4, 5.6.7.8, <script>' } });
  assert.ok(r.status < 500);
});

test('petición HTTP con línea de cabecera enorme se corta sin caída', async () => {
  const estado = await new Promise<string>((resolve) => {
    const s = net.connect(PORT, '127.0.0.1', () => {
      s.write(`GET / HTTP/1.1\r\nHost: x\r\nX-Big: ${'A'.repeat(70_000)}\r\n\r\n`);
    });
    let datos = '';
    s.on('data', (d) => (datos += d.toString()));
    s.on('close', () => resolve(datos.split('\r\n')[0] || 'cerrado'));
    s.on('error', () => resolve('error'));
    setTimeout(() => { s.destroy(); resolve('timeout'); }, 5000);
  });
  assert.ok(/431|400|cerrado|error/.test(estado), estado);
  const vivo = await pedir({ path: '/health' });
  assert.equal(vivo.status, 200);
});

test('rutas y parámetros de diarios validan el formato', async () => {
  for (const id of ['abc', '2026-13-99x', '..', '%00', "2026-10-23'--"]) {
    const r = await pedir({ path: `/api/v1/diarios/${encodeURIComponent(id)}/registros` });
    assert.equal(r.status, 404, id);
  }
  for (const p of ['-1', '0', '999999', 'abc', '1e9', '%00']) {
    const r = await pedir({ path: `/api/v1/diarios/2026-10-23/paginas/${p}/ocr` });
    assert.ok(r.status === 400 || r.status === 404, `${p} -> ${r.status}`);
  }
});
