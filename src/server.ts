// Punto de entrada del servicio: carga el corpus, arma los almacenes y escucha. Toda la lógica de rutas vive en
// src/app.ts y src/rutas_*.ts; los datos se leen solo a través de src/almacen.ts.
import { AlmacenOcrEnDisco, AlmacenPublicacionesEnMemoria, AlmacenSuscripcionesEnMemoria } from './almacen.js';
import { crearApp } from './app.js';
import { cargarPublicaciones, RUTAS_PUBLICAS } from './carga_datos.js';
import { cargarCatalogo } from './diarios.js';
import { DiarioIndex } from './indexer.js';
import { LimitadorTasa } from './limitador.js';
import { NotifierEngine } from './notifier.js';
import { PortadaCache } from './portada_cache.js';

const PORT = process.env.PORT || 4700;

const indice = new DiarioIndex();
const catalogo = cargarCatalogo();
const { registros, origen } = cargarPublicaciones();
if (origen && registros.length > 0) {
  indice.addBatch(registros);
  console.log(`[stu-diario-oficial] ${registros.length} publicaciones indexadas desde ${origen}.`);
}

const publicaciones = new AlmacenPublicacionesEnMemoria(indice);
const suscripciones = new AlmacenSuscripcionesEnMemoria(new NotifierEngine());

const app = crearApp({
  publicaciones,
  suscripciones,
  ocr: new AlmacenOcrEnDisco(RUTAS_PUBLICAS),
  catalogo,
  portada: new PortadaCache(publicaciones, suscripciones, catalogo),
  // Limitación por IP con penalización exponencial (ver src/limitador.ts). Configurable por entorno.
  // El límite de alertas (datos personales) y el de lecturas de archivos en disco son aparte y más estrictos.
  limites: {
    busqueda: new LimitadorTasa(Number(process.env.RATE_LIMIT_SEARCH_MAX) || 90, 60_000),
    alertas: new LimitadorTasa(Number(process.env.RATE_LIMIT_ALERTS_MAX) || 5, 10 * 60_000),
    lecturas: new LimitadorTasa(Number(process.env.RATE_LIMIT_READS_MAX) || 120, 60_000)
  },
  maxSuscripciones: Number(process.env.MAX_SUSCRIPCIONES) || 50_000
});

const servidor = app.listen(PORT, () => {
  console.log(`[stu-diario-oficial] Servidor escuchando en puerto ${PORT}`);
  console.log(`[stu-diario-oficial] ${publicaciones.contar()} publicaciones indexadas en ${catalogo.length} diario(s).`);
});
// Detrás de Caddy/Cloudflare: el keep-alive del origen debe ser MAYOR que el del proxy (evita 502 por conexiones reutilizadas ya cerradas).
servidor.keepAliveTimeout = 65_000;
servidor.headersTimeout = 66_000;
servidor.requestTimeout = 30_000;
