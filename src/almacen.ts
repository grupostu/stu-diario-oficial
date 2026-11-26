// Capa de acceso a datos del servicio. Las rutas solo conocen estas interfaces: hoy las implementa la memoria del
// proceso (índice en RAM, suscripciones en RAM, JSON en disco) y mañana una base de datos con `tenant_id` sin tocar
// rutas ni contratos. Cada método recibe `tenantId` (por defecto el diario público) para que el aislamiento por
// inquilino quede en la firma desde ya. Las interfaces son síncronas hoy; pasarán a asíncronas al conectar la BD.
import fs from 'node:fs';
import { createHmac, randomBytes } from 'node:crypto';
import path from 'node:path';
import type { DiarioIndex, ParametrosIndice, RespuestaBusqueda } from './indexer.js';
import type { NotifierEngine } from './notifier.js';
import { cargarOcr, type ArchivoOcr } from './ocr.js';
import { CacheTTL } from './respuesta_cache.js';
import type { AlertaSuscripcion, CategoryType, DiarioRecord } from './types.js';

/** Inquilino del sitio público (único hasta que haya varios clientes). */
export const TENANT_PUBLICO = 'publico';

export interface AlmacenPublicaciones {
  contar(tenantId?: string): number;
  todas(tenantId?: string): DiarioRecord[];
  getById(id: string, tenantId?: string): DiarioRecord | undefined;
  buscar(params: ParametrosIndice, tenantId?: string): RespuestaBusqueda;
  recientesPorCategoria(categoria: CategoryType, limite: number, tenantId?: string): DiarioRecord[];
  /** Publicaciones de una edición (por id de diario; si el registro no lo trae, por su fecha). */
  deDiario(diarioId: string, tenantId?: string): DiarioRecord[];
  /** Publicaciones que cubren una página del PDF. */
  dePagina(pagina: number, tenantId?: string): DiarioRecord[];
  /** Avisos de marcas existentes en los diarios cargados. */
  marcas(tenantId?: string): DiarioRecord[];
}

export interface AlmacenSuscripciones {
  suscribir(sub: Omit<AlertaSuscripcion, 'id' | 'activa' | 'fechaCreacion'>, tenantId?: string): AlertaSuscripcion;
  suscribirUnaVez(sub: Omit<AlertaSuscripcion, 'id' | 'activa' | 'fechaCreacion'>, maxSuscripciones: number, tenantId?: string): { suscripcion?: AlertaSuscripcion; estado: 'creada' | 'existente' | 'limite' };
  contar(tenantId?: string): number;
}

export interface AlmacenOcr {
  /** Texto OCR del diario (null si no existe o es inválido). */
  cargar(diarioId: string, tenantId?: string): ArchivoOcr | null;
  /** Texto oficial de una página del PDF (null si no hay JSON de páginas o la página no existe). */
  textoPagina(diarioId: string, pagina: number, tenantId?: string): string | null;
}

/** Publicaciones en memoria: el índice es de solo lectura tras el arranque, así que los agrupados se calculan una vez. */
export class AlmacenPublicacionesEnMemoria implements AlmacenPublicaciones {
  private readonly porDiario = new Map<string, DiarioRecord[]>();

  constructor(private readonly indice: DiarioIndex) {
    for (const r of indice.getAllRecords()) {
      const id = r.diarioId ?? r.fecha;
      const lista = this.porDiario.get(id);
      if (lista) lista.push(r);
      else this.porDiario.set(id, [r]);
    }
  }

  contar(_tenantId?: string): number {
    return this.indice.count();
  }
  todas(): DiarioRecord[] {
    return this.indice.getAllRecords();
  }
  getById(id: string): DiarioRecord | undefined {
    return this.indice.getById(id);
  }
  buscar(params: ParametrosIndice): RespuestaBusqueda {
    return this.indice.buscar(params);
  }
  recientesPorCategoria(categoria: CategoryType, limite: number): DiarioRecord[] {
    return this.indice.getRecentByCategory(categoria, limite);
  }
  deDiario(diarioId: string): DiarioRecord[] {
    return this.porDiario.get(diarioId) ?? [];
  }
  dePagina(pagina: number): DiarioRecord[] {
    return this.indice.getAllRecords().filter((r) => r.pagina <= pagina && (r.paginaFin ?? r.pagina) >= pagina);
  }
  marcas(): DiarioRecord[] {
    return this.indice.getAllRecords().filter((r) => r.categoria === 'REGISTRO_MARCA');
  }
}

/** Suscripciones en memoria (se pierden al reiniciar; la BD las hará persistentes). */
export class AlmacenSuscripcionesEnMemoria implements AlmacenSuscripciones {
  private readonly porPayload = new Map<string, AlertaSuscripcion>();
  private readonly claveDedupe = randomBytes(32);

  constructor(private readonly motor: NotifierEngine) {}
  suscribir(sub: Omit<AlertaSuscripcion, 'id' | 'activa' | 'fechaCreacion'>): AlertaSuscripcion {
    return this.motor.subscribe(sub);
  }

  suscribirUnaVez(
    sub: Omit<AlertaSuscripcion, 'id' | 'activa' | 'fechaCreacion'>,
    maxSuscripciones: number,
    tenantId = TENANT_PUBLICO
  ): { suscripcion?: AlertaSuscripcion; estado: 'creada' | 'existente' | 'limite' } {
    const material = JSON.stringify({
      tenantId,
      email: sub.usuarioEmail.trim().toLocaleLowerCase('en-US'),
      telefono: sub.telefonoWhatsapp?.replace(/[\s()-]/g, '') ?? '',
      criterio: sub.tipoCriterio === 'DUI'
        ? sub.criterioBusqueda.replace(/\D/g, '')
        : sub.criterioBusqueda.trim().toLocaleLowerCase('es-SV'),
      tipo: sub.tipoCriterio
    });
    const digest = createHmac('sha256', this.claveDedupe).update(material).digest('base64url');
    const existente = this.porPayload.get(digest);
    if (existente?.activa) return { suscripcion: existente, estado: 'existente' };
    if (existente) this.porPayload.delete(digest);
    if (this.contar(tenantId) >= maxSuscripciones) return { estado: 'limite' };

    const suscripcion = this.motor.subscribe(sub);
    this.porPayload.set(digest, suscripcion);
    return { suscripcion, estado: 'creada' };
  }

  contar(_tenantId?: string): number {
    return this.motor.getSubscriptionsCount();
  }
}

/** OCR y texto de páginas leídos de public/data con caché de 10 min (el JSON de páginas pesa varios MB). */
export class AlmacenOcrEnDisco implements AlmacenOcr {
  private readonly cacheOcr = new CacheTTL<ArchivoOcr | null>(16, 10 * 60_000);
  private readonly cachePaginas = new CacheTTL<string[] | null>(16, 10 * 60_000);

  constructor(private readonly rutasPublicas: string[]) {}

  cargar(diarioId: string): ArchivoOcr | null {
    const c = this.cacheOcr.get(diarioId);
    if (c !== undefined) return c;
    return this.cacheOcr.set(diarioId, cargarOcr(diarioId));
  }

  textoPagina(diarioId: string, pagina: number): string | null {
    let paginas = this.cachePaginas.get(diarioId);
    if (paginas === undefined) {
      paginas = this.leerPaginas(diarioId);
      this.cachePaginas.set(diarioId, paginas);
    }
    return paginas?.[pagina - 1] ?? null;
  }

  private leerPaginas(diarioId: string): string[] | null {
    for (const base of this.rutasPublicas) {
      const archivo = path.join(base, 'data', `paginas-${diarioId}.json`);
      if (!fs.existsSync(archivo)) continue;
      try {
        const j = JSON.parse(fs.readFileSync(archivo, 'utf8')) as { paginas?: unknown };
        if (Array.isArray(j.paginas)) return j.paginas.map((x: unknown) => String(x));
      } catch (err) {
        // Archivo ilegible: se prueba con la siguiente ruta y, si ninguna sirve, la página queda sin texto.
        console.error(`[stu-diario-oficial] No se pudo leer ${archivo}:`, err instanceof Error ? err.message : err);
      }
    }
    return null;
  }
}
