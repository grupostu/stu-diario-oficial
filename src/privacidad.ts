import { renderPaginaBase } from './pagina_base.js';
// Página de aviso de privacidad (español sencillo; describe solo lo que el sitio hace hoy).
export function renderPrivacidad(): string {
  return renderPaginaBase({
    titulo: 'Aviso de privacidad',
    descripcion: 'Información sobre privacidad y tratamiento de datos en el sitio del Diario Oficial.',
    cuerpo: `<div class="contenido">
  <p><a href="/">&larr; Volver al buscador</a></p>
  <h1>Aviso de privacidad</h1>
  <p>Este aviso explica cómo se trata la información cuando consultas este sitio. El responsable del tratamiento es <strong>Grupo Stu, S.A.S. de C.V.</strong></p>

  <h2>Consultas y datos enviados</h2>
  <p>El sitio permite consultar publicaciones públicas. Las alertas por correo están temporalmente deshabilitadas: no solicites ni envíes por este medio tu DUI, nombre, correo o teléfono para registrarte en alertas. La API rechaza las altas y no las guarda.</p>
  <p>Los sistemas de entrega y seguridad pueden registrar datos técnicos necesarios para operar el sitio, como dirección IP, ruta solicitada, fecha, estado de respuesta y errores operativos. El período de conservación depende de la configuración vigente de la infraestructura.</p>

  <h2>Finalidades y conservación</h2>
  <p>La información pública consultada se usa para mostrar resultados. No se crea un perfil de alertas ni se conserva una suscripción desde este sitio. El período de conservación de los datos técnicos depende de la configuración efectiva de infraestructura.</p>

  <h2>Tus derechos y contacto</h2>
  <p>Puedes presentar directamente a Grupo Stu solicitudes de acceso y copia, corrección, eliminación, oposición, portabilidad, olvido o limitación, según la legislación aplicable. Escríbenos a <a href="mailto:soporte@grupostu.com">soporte@grupostu.com</a>; verificaremos tu identidad de manera proporcional a la solicitud y te indicaremos el trámite que corresponde. No envíes contraseñas, códigos de acceso ni datos completos de pago.</p>

  <h2>Seguridad</h2>
  <p>El sitio aplica medidas técnicas para proteger el servicio. No incluyas información sensible en búsquedas. Las altas de alertas están deshabilitadas y la API no almacena datos de suscripción.</p>

  <h2>Sobre el contenido del Diario Oficial</h2>
  <p>Los edictos y avisos que se muestran son publicaciones oficiales ya públicas. Si crees que una publicación te afecta, la fuente original es el Diario Oficial.</p>

  <p style="margin-top:2rem;font-size:.85rem">Grupo Stu, S.A.S. de C.V. · Esta página puede actualizarse; la versión vigente es la que ves aquí.</p>
</div>`
  });
}
