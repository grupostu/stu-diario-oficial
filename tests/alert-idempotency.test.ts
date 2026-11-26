import assert from 'node:assert/strict';
import test from 'node:test';
import { AlmacenSuscripcionesEnMemoria } from '../src/almacen.js';
import { NotifierEngine } from '../src/notifier.js';

test('reintentar la misma alerta devuelve la suscripción existente sin duplicarla', () => {
  const engine = new NotifierEngine();
  const store = new AlmacenSuscripcionesEnMemoria(engine);
  const payload = {
    usuarioEmail: 'Persona@Example.com',
    criterioBusqueda: 'Juan Pérez',
    tipoCriterio: 'NOMBRE' as const
  };

  const first = store.suscribirUnaVez(payload, 1);
  const retry = store.suscribirUnaVez({ ...payload, usuarioEmail: 'persona@example.com', criterioBusqueda: '  juan pérez  ' }, 1);

  assert.equal(first.estado, 'creada');
  assert.equal(retry.estado, 'existente');
  assert.equal(retry.suscripcion?.id, first.suscripcion?.id);
  assert.equal(engine.getSubscriptionsCount(), 1);
});

test('la clave de idempotencia separa payloads distintos y respeta el límite', () => {
  const engine = new NotifierEngine();
  const store = new AlmacenSuscripcionesEnMemoria(engine);
  const base = { usuarioEmail: 'persona@example.com', criterioBusqueda: 'Juan Pérez', tipoCriterio: 'NOMBRE' as const };

  assert.equal(store.suscribirUnaVez(base, 1).estado, 'creada');
  assert.equal(store.suscribirUnaVez({ ...base, criterioBusqueda: 'María López' }, 1).estado, 'limite');
  assert.equal(store.suscribirUnaVez({ ...base, usuarioEmail: 'otra@example.com' }, 1).estado, 'limite');
  assert.equal(engine.getSubscriptionsCount(), 1);
});
