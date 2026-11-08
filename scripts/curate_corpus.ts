// Uso: npx tsx scripts/curate_corpus.ts   (reescribe src/data_diario_real.json ya curado)
import fs from 'node:fs';
import path from 'node:path';
import { curarCorpus } from '../src/curate.js';
import type { DiarioRecord } from '../src/types.js';

const ruta = path.join(process.cwd(), 'src', 'data_diario_real.json');
const antes = JSON.parse(fs.readFileSync(ruta, 'utf8')) as DiarioRecord[];
const despues = curarCorpus(antes);
fs.writeFileSync(ruta, JSON.stringify(despues, null, 2) + '\n', 'utf8');
console.log(`[curate] ${antes.length} -> ${despues.length} registros`);
