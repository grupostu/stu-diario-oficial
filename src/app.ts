// Ensamblado de la aplicación Express: seguridad, estáticos, rutas, 404 y manejador final de errores.
import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import type { ContextoRutas } from './contexto.js';
import { carpetaPublica } from './carga_datos.js';
import { renderError } from './pagina_base.js';
import { rutasAlertas } from './rutas_alertas.js';
import { rutasDatos } from './rutas_datos.js';
import { rutasOcr } from './rutas_ocr.js';
import { rutasPaginas } from './rutas_paginas.js';
import { cabecerasSeguridad, PROXIES_DE_CONFIANZA } from './seguridad_http.js';

/** Error de Express con estado HTTP opcional (body-parser lo añade en JSON roto o cuerpo demasiado grande). */
interface ErrorHttp {
  status?: unknown;
}

function estadoDeError(err: unknown): number {
  const s = (err as ErrorHttp | null)?.status;
  return typeof s === 'number' && Number.isInteger(s) && s >= 400 && s < 600 ? s : 500;
}

export function crearApp(ctx: ContextoRutas): Application {
  const app = express();
  app.disable('x-powered-by');
  // El servicio corre detrás de un proxy inverso local o de la red privada del contenedor: solo de ellos se acepta X-Forwarded-For.
  app.set('trust proxy', PROXIES_DE_CONFIANZA);

  app.use(cabecerasSeguridad);
  app.use(express.json({ limit: '64kb' }));

  // Archivos estáticos (PDFs originales de la gaceta) con caché inmutable de 30 días.
  const publica = carpetaPublica();
  if (publica) {
    app.use('/data', express.static(path.join(publica, 'data'), { maxAge: 0, etag: true, setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache') }));
    app.use(express.static(publica, { maxAge: '30d', immutable: true }));
    console.log(`[stu-diario-oficial] Sirviendo archivos estáticos desde: ${publica}`);
  }

  app.use(rutasPaginas(ctx));
  app.use(rutasDatos(ctx));
  app.use(rutasOcr(ctx));
  app.use(rutasAlertas(ctx));

  // 404 para rutas desconocidas: HTML con la identidad del sitio (las rutas /api, /data y /pdf responden JSON).
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (/^[/](api|data|pdf)[/]/.test(req.path)) return res.status(404).json({ error: 'No encontrado' });
    res.set('Cache-Control', 'no-store');
    res.status(404).type('html').send(renderError(404, 'Página no encontrada', 'La dirección que buscas no existe o fue movida.'));
  });

  // Manejador final de errores: respuesta genérica, sin trazas ni rutas internas.
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const status = estadoDeError(err);
    res.set('Cache-Control', 'no-store');
    const msg = status >= 500 ? 'Error interno del servidor' : 'Solicitud inválida';
    if (String(req.headers.accept ?? '').includes('text/html') && !req.path.startsWith('/api/')) {
      return res.status(status).type('html').send(renderError(status, msg, status >= 500 ? 'Ocurrió un problema de nuestro lado. Inténtalo de nuevo en unos minutos.' : 'No pudimos procesar la solicitud.'));
    }
    res.status(status).json({ error: msg });
  });

  return app;
}
