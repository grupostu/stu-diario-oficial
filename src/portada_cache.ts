// Portada ya renderizada y comprimida (gzip/br) con ETag: se recalcula solo si cambian los contadores (máx. cada 5 s).
import type { Diario } from './diarios.js';
import type { AlmacenPublicaciones, AlmacenSuscripciones } from './almacen.js';
import { precomprimir, type Precomprimida } from './respuesta_cache.js';
import { renderPortal } from './views.js';

// El contador de alertas cambia con cada suscripción: la portada se vuelve a renderizar como máximo una vez cada 5 s.
const PORTAL_REFRESCO_MS = 5_000;

export class PortadaCache {
  private clave = '';
  private html = '';
  private pre: Precomprimida | null = null;
  private renderizadoEn = 0;

  constructor(
    private readonly publicaciones: AlmacenPublicaciones,
    private readonly suscripciones: AlmacenSuscripciones,
    private readonly catalogo: Diario[]
  ) {
    // Pre-calentar el HTML en el arranque.
    this.obtener();
  }

  invalidar(): void {
    this.clave = '';
    this.html = '';
    this.pre = null;
  }

  private claveActual(): string {
    return `${this.publicaciones.contar()}:${this.suscripciones.contar()}`;
  }

  private renderizar(): string {
    const clave = this.claveActual();
    if (clave !== this.clave || !this.html) {
      this.html = renderPortal({ totalDocumentos: this.publicaciones.contar(), totalAlertas: this.suscripciones.contar(), diarios: this.catalogo });
      this.clave = clave;
      this.pre = null;
    }
    return this.html;
  }

  obtener(): Precomprimida {
    const ahora = Date.now();
    if (!this.pre || (ahora - this.renderizadoEn > PORTAL_REFRESCO_MS && this.clave !== this.claveActual())) {
      this.pre = precomprimir(this.renderizar(), 'text/html; charset=utf-8', 5);
      this.renderizadoEn = ahora;
    }
    return this.pre;
  }
}
