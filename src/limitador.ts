// Limitador de tasa por clave (IP) con penalización exponencial anti-abuso.
// Ventana fija: tras superar `max` solicitudes dentro de la ventana, la clave queda bloqueada y cada reincidencia
// duplica el bloqueo (hasta `bloqueoMaxMs`). La memoria está acotada: se purgan las claves vencidas y, si aun así
// se supera `maxClaves`, se descartan las más antiguas.

export interface DecisionTasa {
  permitido: boolean;
  /** Segundos que debe esperar el cliente antes de reintentar (0 si fue permitido). */
  reintentarEnSeg: number;
}

interface EstadoClave {
  inicio: number;
  cuenta: number;
  reincidencias: number;
  bloqueadoHasta: number;
  ultimaActividad: number;
}

export class LimitadorTasa {
  private estados: Map<string, EstadoClave> = new Map();

  constructor(
    private readonly max: number,
    private readonly ventanaMs: number,
    private readonly bloqueoMaxMs: number = 15 * 60_000,
    private readonly maxClaves: number = 20_000
  ) {}

  consumir(clave: string, ahora: number = Date.now()): DecisionTasa {
    let e = this.estados.get(clave);
    if (!e) {
      if (this.estados.size >= this.maxClaves) this.purgar(ahora);
      e = { inicio: ahora, cuenta: 0, reincidencias: 0, bloqueadoHasta: 0, ultimaActividad: ahora };
      this.estados.set(clave, e);
    }
    e.ultimaActividad = ahora;
    if (e.bloqueadoHasta > ahora) {
      // Insistir durante el bloqueo no lo alarga, pero tampoco lo acorta.
      return { permitido: false, reintentarEnSeg: Math.max(1, Math.ceil((e.bloqueadoHasta - ahora) / 1000)) };
    }
    if (ahora - e.inicio >= this.ventanaMs) {
      // Un periodo largo sin abuso perdona las reincidencias.
      if (ahora - e.inicio >= this.ventanaMs * 10) e.reincidencias = 0;
      e.inicio = ahora;
      e.cuenta = 0;
    }
    e.cuenta++;
    if (e.cuenta <= this.max) return { permitido: true, reintentarEnSeg: 0 };
    e.reincidencias++;
    const bloqueo = Math.min(this.ventanaMs * 2 ** (e.reincidencias - 1), this.bloqueoMaxMs);
    e.bloqueadoHasta = ahora + bloqueo;
    e.cuenta = 0;
    e.inicio = e.bloqueadoHasta;
    return { permitido: false, reintentarEnSeg: Math.max(1, Math.ceil(bloqueo / 1000)) };
  }

  private purgar(ahora: number): void {
    for (const [k, e] of this.estados) {
      if (e.bloqueadoHasta <= ahora && ahora - e.ultimaActividad >= this.ventanaMs) this.estados.delete(k);
    }
    // Si todo sigue activo, se descartan las entradas más antiguas (el Map conserva el orden de inserción).
    let exceso = this.estados.size - Math.floor(this.maxClaves * 0.9);
    for (const k of this.estados.keys()) {
      if (exceso-- <= 0) break;
      this.estados.delete(k);
    }
  }

  get tamano(): number {
    return this.estados.size;
  }
}
