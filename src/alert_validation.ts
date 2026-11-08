import { evaluarCriterio } from './criterio.js';

// Validación estricta del cuerpo de POST /api/v1/alerts (entrada no confiable).

export interface AlertaValidada {
  usuarioEmail: string;
  telefonoWhatsapp?: string;
  criterioBusqueda: string;
  tipoCriterio: 'DUI' | 'NOMBRE';
}

const EMAIL_RE = /^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,24}$/;
const TEL_RE = /^\+?[0-9 ()-]{8,20}$/;

export function validarAlerta(body: unknown): { ok: true; value: AlertaValidada } | { ok: false; error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const criterio = typeof b.criterioBusqueda === 'string' ? b.criterioBusqueda.trim() : '';
  const email = typeof b.usuarioEmail === 'string' ? b.usuarioEmail.trim() : '';
  const tel = typeof b.telefonoWhatsapp === 'string' ? b.telefonoWhatsapp.trim() : '';

  // Sin consentimiento expreso no se guarda ningún dato personal.
  if (b.consentimiento !== true) {
    return { ok: false, error: 'Para guardar la alerta debes aceptar el aviso de privacidad.' };
  }

  // Mismo criterio que el navegador: DUI completo y con verificador válido, o nombre sin etiquetas ni símbolos.
  const evaluado = evaluarCriterio(criterio);
  if (!evaluado.ok) {
    return { ok: false, error: evaluado.error };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'Escribe un correo electrónico válido.' };
  }
  if (tel && !TEL_RE.test(tel)) {
    return { ok: false, error: 'El teléfono solo admite números, espacios y el signo +.' };
  }
  return {
    ok: true,
    value: {
      usuarioEmail: email,
      telefonoWhatsapp: tel || undefined,
      criterioBusqueda: evaluado.valor,
      tipoCriterio: evaluado.tipo
    }
  };
}
