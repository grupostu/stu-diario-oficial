import type { AlertaSuscripcion, DiarioRecord } from './types.js';
export declare class NotifierEngine {
    private subscriptions;
    subscribe(sub: Omit<AlertaSuscripcion, 'id' | 'activa' | 'fechaCreacion'>): AlertaSuscripcion;
    checkMatches(record: DiarioRecord): Array<{
        sub: AlertaSuscripcion;
        record: DiarioRecord;
    }>;
    getSubscriptionsCount(): number;
}
