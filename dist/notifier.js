export class NotifierEngine {
    subscriptions = [];
    subscribe(sub) {
        const record = {
            ...sub,
            id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            activa: true,
            fechaCreacion: new Date().toISOString()
        };
        this.subscriptions.push(record);
        return record;
    }
    checkMatches(record) {
        const alertsToSend = [];
        for (const sub of this.subscriptions) {
            if (!sub.activa)
                continue;
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
    getSubscriptionsCount() {
        return this.subscriptions.length;
    }
}
