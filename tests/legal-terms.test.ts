import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Términos que sugieren validez oficial o certificación que Grupo Stu no puede otorgar
const PROHIBIDOS = [/certificaci[oó]n oficial/i, /copia fiel/i, /ficha certificada/i, /imprimir constancia/i];

test('las vistas públicas no contienen términos legales prohibidos', () => {
  const src = readFileSync(join(process.cwd(), 'src', 'views.ts'), 'utf8');
  for (const re of PROHIBIDOS) {
    assert.equal(re.test(src), false, `Término prohibido encontrado: ${re}`);
  }
});
