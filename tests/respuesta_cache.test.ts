import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync, brotliDecompressSync } from 'node:zlib';
import { CacheTTL, enviarPrecomprimida, precomprimir } from '../src/respuesta_cache.js';

// Respuesta falsa mínima: solo lo que usa enviarPrecomprimida.
function falsa(cabeceras: Record<string, string> = {}, metodo = 'GET') {
  const h: Record<string, unknown> = {};
  let cuerpo: Buffer | undefined;
  let estado = 200;
  const res: any = {
    set: (o: Record<string, string>) => Object.assign(h, o),
    setHeader: (k: string, v: unknown) => (h[k] = v),
    vary: () => res,
    status: (n: number) => ((estado = n), res),
    end: (b?: Buffer) => (cuerpo = b)
  };
  return { req: { headers: cabeceras, method: metodo } as any, res, h, salida: () => ({ estado, cuerpo }) };
}

test('precomprimir: gzip y brotli se descomprimen al cuerpo original y el ETag es estable', () => {
  const texto = 'x'.repeat(5000) + 'áé';
  const p = precomprimir(texto, 'text/plain');
  assert.equal(gunzipSync(p.gz!).toString('utf8'), texto);
  assert.equal(brotliDecompressSync(p.br!).toString('utf8'), texto);
  assert.equal(precomprimir(texto, 'text/plain').etag, p.etag);
});

test('enviarPrecomprimida: negocia br > gzip > identidad y responde 304 con If-None-Match', () => {
  const p = precomprimir('y'.repeat(4000), 'text/html');
  const a = falsa({ 'accept-encoding': 'gzip, br' });
  enviarPrecomprimida(a.req, a.res, p);
  assert.equal(a.h['Content-Encoding'], 'br');
  const b = falsa({ 'accept-encoding': 'gzip' });
  enviarPrecomprimida(b.req, b.res, p);
  assert.equal(b.h['Content-Encoding'], 'gzip');
  const c = falsa({});
  enviarPrecomprimida(c.req, c.res, p);
  assert.equal(c.h['Content-Encoding'], undefined);
  assert.equal(c.salida().cuerpo!.length, 4000);
  const d = falsa({ 'if-none-match': p.etag });
  enviarPrecomprimida(d.req, d.res, p);
  assert.equal(d.salida().estado, 304);
});

test('CacheTTL: vence por tiempo y respeta el tope de entradas', () => {
  const c = new CacheTTL<number>(2, 1000);
  c.set('a', 1, 0);
  c.set('b', 2, 0);
  c.set('c', 3, 0); // expulsa la más antigua
  assert.equal(c.get('a', 1), undefined);
  assert.equal(c.get('c', 1), 3);
  assert.equal(c.get('c', 2000), undefined);
  assert.ok(c.tamano <= 2);
});
