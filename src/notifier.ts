import type { AlertaSuscripcion, DiarioRecord } from './types.js';

export class NotifierEngine {
  private subscriptions: AlertaSuscripcion[] = [];

  subscribe(sub: Omit<AlertaSuscripcion, 'id' | 'activa' | 'fechaCreacion'>): AlertaSuscripcion {
    const record: AlertaSuscripcion = {
      ...sub,
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      activa: true,
      fechaCreacion: new Date().toISOString()
    };
    this.subscriptions.push(record);
    return record;
  }

  checkMatches(record: DiarioRecord): Array<{ sub: AlertaSuscripcion; record: DiarioRecord }> {
    const alertsToSend: Array<{ sub: AlertaSuscripcion; record: DiarioRecord }> = [];

    for (const sub of this.subscriptions) {
      if (!sub.activa) continue;

      const crit = sub.criterioBusqueda.toLowerCase().trim();
      const critDigits = crit.replace(/\D/g, '');

      // Comparación por DUI
      if (sub.tipoCriterio === 'DUI') {
        const matchesDui = record.duisEncontrados.some((d) => d.replace(/\D/g, '') === critDigits);
        if (matchesDui) {
          alertsToSend.push({ sub, record });
          continue;
        }
      }

      // Comparación por Nombre, Marca o Empresa en texto
      if (record.contenido.toLowerCase().includes(crit)) {
        alertsToSend.push({ sub, record });
      }
    }

    return alertsToSend;
  }

  getSubscriptionsCount(): number {
    return this.subscriptions.length;
  }
}
