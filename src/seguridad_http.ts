// Piezas de seguridad HTTP compartidas por todas las rutas: cabeceras de endurecimiento, IP de confianza,
// limitación de tasa exponencial y validación del número de página. Una sola copia para todo el servicio.
import type { NextFunction, Request, Response } from 'express';
import type { LimitadorTasa } from './limitador.js';

/** Proxies de confianza: solo de ellos se acepta X-Forwarded-For (proxy local o red privada del contenedor). */
export const PROXIES_DE_CONFIANZA = 'loopback, linklocal, uniquelocal';

/** Cabeceras de endurecimiento (no restringen scripts en línea: la portada los usa). */
export function cabecerasSeguridad(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "base-uri 'self'; object-src 'none'; frame-ancestors 'self'");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
}

/** IP del cliente según la configuración de proxies de confianza de Express. */
export function ipCliente(req: Request): string {
  return req.ip || 'desconocida';
}

/** Middleware de limitación por IP con penalización exponencial (ver src/limitador.ts). */
export function limitarTasa(limitador: LimitadorTasa) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const d = limitador.consumir(ipCliente(req));
    if (d.permitido) return next();
    res.set({ 'Cache-Control': 'no-store', 'Retry-After': String(d.reintentarEnSeg) });
    res.status(429).json({ error: 'Demasiadas solicitudes', aviso: `Hiciste demasiadas consultas seguidas. Espera ${d.reintentarEnSeg} segundos y vuelve a intentar.`, reintentarEnSeg: d.reintentarEnSeg });
  };
}

/** Número de página estricto (1 a 5 dígitos). Devuelve NaN si no cumple: nunca se confía en parseInt sobre texto libre. */
export function parsearNumeroPagina(valor: unknown): number {
  const texto = String(valor);
  return /^\d{1,5}$/.test(texto) ? parseInt(texto, 10) : NaN;
}
