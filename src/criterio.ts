// Criterio de vigilancia o búsqueda (DUI o nombre): UNA sola fuente de verdad para servidor y navegador (R3-002, R3-003).
//
// La función vive como texto JavaScript simple (ES2018) para poder:
//  - ejecutarla en el servidor (aquí abajo, con `new Function`), y
//  - incrustarla tal cual en la página (`CRITERIO_CLIENT_JS`), de modo que ambos lados den el mismo veredicto.
// Reglas: solo letras (con tildes y ñ), números, espacios, punto, coma, apóstrofo y guion; nada de etiquetas HTML ni símbolos.
// Un texto solo numérico debe ser un DUI completo con dígito verificador válido. Un DUI con letras se rechaza.

export const CRITERIO_CLIENT_JS = String.raw`
function evaluarCriterio(entrada) {
  var texto = String(entrada == null ? '' : entrada).replace(/\s+/g, ' ').trim();
  var fallo = function (codigo, error) { return { ok: false, codigo: codigo, error: error }; };
  if (texto.length < 3) return fallo('corto', 'Escribe al menos 3 caracteres del DUI o nombre a vigilar.');
  if (texto.length > 120) return fallo('largo', 'El criterio admite 120 caracteres como máximo.');
  if (/[<>]/.test(texto)) return fallo('etiquetas', 'No uses etiquetas ni los signos < >. Escribe solo letras, números y guiones.');
  var digitos = texto.replace(/\D/g, '');
  var letras = (texto.match(/\p{L}/gu) || []).length;
  if (letras === 0 && digitos.length === 0) return fallo('solo_simbolos', 'Escribe letras o números: con solo símbolos no se puede buscar ni vigilar.');
  if (!/^[\p{L}\p{M}0-9 .,'’–-]+$/u.test(texto)) {
    return fallo('simbolos', 'Usa solo letras, números, espacios y guiones; quita los símbolos.');
  }
  if (letras === 0) {
    if (digitos.length < 9) return fallo('dui_incompleto', 'El DUI está incompleto: lleva 9 dígitos (8 más el verificador), por ejemplo 00000000-0.');
    if (digitos.length > 9) return fallo('dui_largo', 'El DUI tiene demasiados dígitos: son 9 (8 más el verificador), por ejemplo 00000000-0.');
    var suma = 0;
    for (var i = 0; i < 8; i++) suma += Number(digitos.charAt(i)) * (9 - i);
    if ((10 - (suma % 10)) % 10 !== Number(digitos.charAt(8))) {
      return fallo('dui_verificador', 'El dígito verificador de este DUI no es válido. Revisa que lo hayas escrito bien.');
    }
    return { ok: true, valor: digitos.slice(0, 8) + '-' + digitos.slice(8), tipo: 'DUI' };
  }
  if (digitos.length > 0 && /^[\p{L}0-9]{8}\s?[–-]\s?[\p{L}0-9]$/u.test(texto)) {
    return fallo('dui_forma', 'Un DUI solo lleva números: 8 dígitos, un guion y el dígito verificador, por ejemplo 00000000-0.');
  }
  if (letras < 3) return fallo('corto', 'Un nombre necesita al menos 3 letras.');
  return { ok: true, valor: texto, tipo: 'NOMBRE' };
}
`;

export type EvaluacionCriterio =
  | { ok: true; valor: string; tipo: 'DUI' | 'NOMBRE' }
  | { ok: false; codigo: string; error: string };

/** Misma función que ejecuta el navegador (se construye desde el mismo texto). */
export const evaluarCriterio = new Function(`${CRITERIO_CLIENT_JS}; return evaluarCriterio;`)() as (entrada: unknown) => EvaluacionCriterio;

/** Códigos que, en la BÚSQUEDA, indican una consulta mal formada (no una consulta legítima sin resultados). */
const CODIGOS_BUSQUEDA_INVALIDA = new Set(['etiquetas', 'solo_simbolos', 'dui_forma']);

/** Aviso para la búsqueda cuando el texto trae etiquetas, solo símbolos o un «DUI» con letras; null si es una consulta aceptable. */
export function avisoConsultaBusqueda(entrada: string): string | null {
  const r = evaluarCriterio(entrada);
  return !r.ok && CODIGOS_BUSQUEDA_INVALIDA.has(r.codigo) ? r.error : null;
}
