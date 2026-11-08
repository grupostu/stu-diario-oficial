// Página de aviso de privacidad (español sencillo; describe solo lo que el sitio hace hoy).
export function renderPrivacidad(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso de privacidad · Diarios Oficiales de El Salvador</title>
  <meta name="description" content="Qué datos pedimos para las alertas del Diario Oficial, para qué los usamos, cuánto tiempo los guardamos y cómo pedir tu baja.">
  <style>
    body{margin:0;background:#0f172a;color:#e2e8f0;font:16px/1.65 system-ui,sans-serif}
    main{max-width:760px;margin:0 auto;padding:32px 16px 64px}
    h1{font-size:1.7rem;color:#fff} h2{font-size:1.15rem;color:#34d399;margin-top:2rem}
    a{color:#6ee7b7} li{margin:.3rem 0}
  </style>
</head>
<body>
<main>
  <p><a href="/">&larr; Volver al buscador</a></p>
  <h1>Aviso de privacidad</h1>
  <p>Este aviso explica cómo trata tus datos el servicio de alertas de este sitio. Lo responsable del tratamiento es <strong>Grupo Stu, S.A.S.</strong></p>

  <h2>Qué datos pedimos</h2>
  <ul>
    <li>El DUI o el nombre que quieres vigilar.</li>
    <li>Tu correo electrónico, para enviarte la alerta.</li>
    <li>Tu número de WhatsApp, solo si decides darlo (es opcional).</li>
  </ul>
  <p>La búsqueda en el sitio no guarda lo que escribes: se consulta el archivo y se muestra el resultado.</p>

  <h2>Para qué los usamos</h2>
  <p>Únicamente para avisarte cuando el DUI o el nombre que indicaste aparezca en una nueva publicación del Diario Oficial. No los usamos para publicidad ni los vendemos o cedemos a terceros con otros fines.</p>

  <h2>Cuánto tiempo los guardamos</h2>
  <p>Mientras tu alerta siga activa. Si pides la baja, se desactiva y se borran tus datos.</p>

  <h2>Tus derechos</h2>
  <p>Puedes pedir en cualquier momento que te demos de baja, que corrijamos o que borremos tus datos. Escribe a <a href="mailto:soporte@grupostu.com">soporte@grupostu.com</a> indicando el correo con el que te registraste.</p>

  <h2>Seguridad y registros</h2>
  <p>No escribimos tu DUI, correo ni teléfono en los registros del servidor, y las respuestas del sitio no te devuelven esos datos. El consentimiento es obligatorio para guardar una alerta.</p>

  <h2>Sobre el contenido del Diario Oficial</h2>
  <p>Los edictos y avisos que se muestran son publicaciones oficiales ya públicas. Si crees que una publicación te afecta, la fuente original es el Diario Oficial.</p>

  <p style="margin-top:2rem;color:#94a3b8;font-size:.85rem">Grupo Stu, S.A.S. · Esta página puede actualizarse; la versión vigente es la que ves aquí.</p>
</main>
</body>
</html>`;
}
