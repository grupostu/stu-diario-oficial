// Localización y carga de los datos del servicio (corpus de publicaciones y carpeta pública).
// Todo sale de los PDF (scripts/construir_corpus.ts). Nunca hay datos de ejemplo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DiarioRecord } from './types.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/** Carpetas candidatas de archivos públicos (en desarrollo, compilado y contenedor). */
export const RUTAS_PUBLICAS: string[] = [path.join(AQUI, '../public'), path.join(process.cwd(), 'public'), path.join(AQUI, 'public')];

/** Primera carpeta pública que existe (o undefined). */
export function carpetaPublica(): string | undefined {
  return RUTAS_PUBLICAS.find((p) => fs.existsSync(p));
}

const RUTAS_CORPUS = [
  path.join(AQUI, 'data_diario_real.json'),
  path.join(AQUI, '../src/data_diario_real.json'),
  path.join(process.cwd(), 'src/data_diario_real.json'),
  path.join(process.cwd(), 'dist/data_diario_real.json')
];

/** Lee las publicaciones del corpus. Si falta o está dañado devuelve [] y lo registra (el servicio arranca igual). */
export function cargarPublicaciones(): { registros: DiarioRecord[]; origen: string | undefined } {
  const origen = RUTAS_CORPUS.find((p) => fs.existsSync(p));
  if (!origen) return { registros: [], origen: undefined };
  try {
    return { registros: JSON.parse(fs.readFileSync(origen, 'utf8')) as DiarioRecord[], origen };
  } catch (err) {
    console.error('[stu-diario-oficial] Error al leer data_diario_real.json:', err);
    return { registros: [], origen };
  }
}
