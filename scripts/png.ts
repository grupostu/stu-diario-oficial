// Codificador PNG mínimo (sin dependencias nativas) para entregar a un motor de OCR la imagen
// escaneada de una página del PDF. Solo soporta los formatos que entrega pdf.js: gris, RGB y RGBA de 8 bits.
import zlib from 'node:zlib';

/** Tipos de color PNG que usamos: 0 = gris, 2 = RGB, 6 = RGBA. */
export type TipoColorPng = 0 | 2 | 6;

const TABLA_CRC: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 de un bloque (el que exige la especificación PNG). */
export function crc32(datos: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloque(tipo: string, datos: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + datos.length);
  out.writeUInt32BE(datos.length, 0);
  out.write(tipo, 4, 'latin1');
  Buffer.from(datos.buffer, datos.byteOffset, datos.length).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + datos.length)), 8 + datos.length);
  return out;
}

/** Codifica píxeles de 8 bits por canal (filas contiguas, sin relleno) como PNG. */
export function codificarPng(ancho: number, alto: number, tipoColor: TipoColorPng, pixeles: Uint8Array): Buffer {
  const canales = tipoColor === 0 ? 1 : tipoColor === 2 ? 3 : 4;
  const fila = ancho * canales;
  if (!Number.isInteger(ancho) || !Number.isInteger(alto) || ancho < 1 || alto < 1) throw new Error('Dimensiones de imagen inválidas');
  if (pixeles.length !== fila * alto) throw new Error(`Se esperaban ${fila * alto} bytes y llegaron ${pixeles.length}`);
  // Cada fila va precedida del byte de filtro 0 (sin filtro).
  const crudo = Buffer.alloc((fila + 1) * alto);
  for (let y = 0; y < alto; y++) {
    crudo[y * (fila + 1)] = 0;
    Buffer.from(pixeles.buffer, pixeles.byteOffset + y * fila, fila).copy(crudo, y * (fila + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; // profundidad de bits
  ihdr[9] = tipoColor;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', ihdr),
    bloque('IDAT', zlib.deflateSync(crudo)),
    bloque('IEND', new Uint8Array(0))
  ]);
}
