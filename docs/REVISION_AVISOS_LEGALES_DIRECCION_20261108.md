# REVISIÓN DE AVISOS LEGALES, DESLINDES Y PRIVACIDAD — DIARIOS OFICIALES
## Documento para la Dirección General de Grupo Stu, S.A.S.
> **ESTADO: BORRADOR — REQUIERE REVISIÓN DE ABOGADO**  
> **DECISIÓN PENDIENTE DE LA DIRECCIÓN GENERAL (NO APROBADO)**  
> **Fecha:** 2026-11-08  
> **Plataforma:** Diarios Oficiales (`diariosoficiales.grupostu.com` / `diariooficialsv.grupostu.com`)  
> **Repositorio:** `C:\Dev\Stu_Diario_Oficial`  

---

## 1. PROPÓSITO DEL DOCUMENTO

Este documento recopila de forma íntegra todos los textos, advertencias, descargos de responsabilidad y cláusulas de privacidad actualmente vigentes en la plataforma **Stu Diario Oficial**. Se señalan observaciones técnicas y jurídicas preliminares y se someten a la Dirección General preguntas clave para su validación final junto con el asesor legal corporativo.

> [!IMPORTANT]
> Ningún texto oficial ni término legal ha sido inventado. Todo contenido del corpus se deriva estrictamente del Diario Oficial de El Salvador publicado por la Imprenta Nacional.

---

## 2. COMPILACIÓN DE AVISOS LEGALES ACTUALES

### 2.1. Cintillo Superior de Transparencia y Fuente Oficial (Portada)
* **Ubicación:** Barra superior del portal (`src/views.ts:193-198`).
* **Texto vigente:**
  > «Archivo digital independiente con fines informativos y de transparencia. No sustituye la fe pública de la Imprenta Nacional de El Salvador ni de la Presidencia de la República.
  > Fuente oficial: [diariooficial.gob.sv](https://www.diariooficial.gob.sv/) · [Imprenta Nacional](https://www.imprentanacional.gob.sv/)»

### 2.2. Marco Legal, Términos de Uso y Descargo de Responsabilidad (Portada)
* **Ubicación:** Bloque inferior previo al pie de página (`src/views.ts:503-528`).
* **Texto vigente:**
  1. **Información Pública Oficiosa (LAIP):**  
     «De conformidad con los Arts. 10 y 11 de la *Ley de Acceso a la Información Pública* de El Salvador, las publicaciones del Diario Oficial son información de libre acceso y dominio público. Este portal facilita su búsqueda tecnológica.»
  2. **No Sustitución ni Carácter Certificante:**  
     «**Grupo Stu, S.A.S.** es una entidad privada e independiente; no representa ni sustituye a la Imprenta Nacional (`diariooficial.gob.sv`) ni emite certificaciones, constancias oficiales o copias fieles con valor probatorio judicial.»
  3. **Limitación Total de Responsabilidad:**  
     «Las transcripciones se extraen automáticamente del texto del PDF y se ofrecen «tal cual» con fines orientativos. **Grupo Stu, S.A.S. no es responsable de la exactitud de la información contenida ni del uso, interpretación o decisiones tomadas por el usuario.**»

### 2.3. Explicación Didáctica y Prevención Jurídica (Preguntas Frecuentes)
* **Ubicación:** Sección de preguntas en portada (`src/views.ts:472-499`).
* **Texto vigente sobre edictos y rebeldía:**
  > «En El Salvador, cuando un juzgado civil, mercantil o de sentencia no encuentra a una persona demandada o imputada, la ley ordena emplazarla por **edicto en el Diario Oficial**. Si no te presentas con tu abogado en el plazo concedido (usualmente 10 días hábiles), el tribunal te declara formalmente en **calidad de rebeldía** y dicta sentencia condenatoria o embargo ejecutivo sin que hayas ejercido tu derecho de defensa.»
* **Texto vigente sobre herencias:**
  > «Los edictos de aceptación de herencia (publicados por juzgados civiles y por notarios) confieren la *administración y representación definitiva de la sucesión* a los herederos declarados. Si consideras que tienes igual o mejor derecho hereditario, el edicto publicado en el Diario Oficial es la prueba legal para personarte ante el juez o notario.»

### 2.4. Política de Privacidad y Tratamiento de Datos Personales
* **Ubicación:** Página pública `/privacidad` (`src/privacidad.ts`).
* **Puntos clave vigentes:**
  - **Responsable:** Grupo Stu, S.A.S.
  - **Datos recabados:** DUI o nombre a vigilar; correo electrónico; WhatsApp opcional.
  - **Finalidad exclusiva:** Envío de alertas cuando coincida una nueva publicación. Cero venta, cesión o publicidad.
  - **Temporalidad:** Mientras la alerta esté activa. Baja inmediata y supresión de datos al solicitarse.
  - **Ejercicio de derechos ARCO:** Vía correo `soporte@grupostu.com`.
  - **Medidas técnicas:** Cero escritura de DUI/correo/teléfono en logs del servidor, respuestas API con identificador opaco (sin eco de datos personales), consentimiento explícito obligatorio (`checkbox` requerido antes de registrar).

### 2.5. Textos de Páginas Sin Capa de Texto y Reconocimiento OCR
* **Ubicación:** Vistas de páginas escaneadas y visor (`src/ocr.ts`, `src/visor_cliente.ts`).
* **Etiqueta obligatoria y visible:**
  > «**Reconocido automáticamente, puede contener errores.** Este texto lo produjo un programa a partir de la imagen de la página; no es el texto oficial ni una transcripción revisada. Compáralo siempre con el PDF original.»
* **Aviso en visor para páginas escaneadas sin OCR:**
  > «Esta página no tiene texto digital en el PDF, por eso no hay transcripción. Se muestra solo el documento original.»
* **Regla técnica complementaria:** Las vistas OCR contienen `<meta name="robots" content="noindex">` y el texto jamás se indexa ni se busca como texto oficial.

---

## 3. OBSERVACIONES JURÍDICAS Y TÉCNICAS

1. **Sobre la cita de la LAIP (Ley de Acceso a la Información Pública):**
   - El Art. 10 enumera la información oficiosa obligatoria y el Art. 11 la publicidad de las normas estatales en el Diario Oficial. La mención actual es técnicamente correcta, pero se sugiere evaluar si debe complementarse con la garantía constitucional del **Art. 6 de la Constitución de la República de El Salvador** (libertad de difusión y acceso a fuentes públicas de información).
2. **Sobre el plazo de 10 días para edictos judiciales (CPCM):**
   - En el Código Procesal Civil y Mercantil (CPCM), el plazo para contestar demanda tras emplazamiento por edicto varía: en el proceso común son 20 días hábiles (Art. 283 CPCM), mientras que en procesos abreviados o ejecutivos suele ser de 10 días hábiles.
   - **Recomendación:** Matizar la redacción para indicar: *«en el plazo legal que fije el juez (usualmente entre 10 y 20 días hábiles según el tipo de juicio)»*, evitando que el usuario asuma un plazo incorrecto para su caso particular.
3. **Deslinde de Fe Pública y Asesoría Legal:**
   - Debe constar expresamente que la plataforma **no brinda asesoría jurídica profesional** y que el usuario debe consultar a un abogado o notario autorizado por la Corte Suprema de Justicia de El Salvador ante cualquier notificación o edicto.
4. **Tratamiento de Datos en Alertas por DUI:**
   - La arquitectura actual ya implementa minimización radical (no guarda en logs, no hace eco en la respuesta JSON). Se recomienda que el abogado determine si se debe incorporar un mecanismo de doble confirmación (*double opt-in*) por correo para confirmar la titularidad antes de activar la alerta.

---

## 4. PREGUNTAS Y DECISIONES PENDIENTES PARA LA DIRECCIÓN

| # | Asunto | Pregunta para la Dirección / Asesor Legal | Propuesta Técnica |
|---|--------|-------------------------------------------|-------------------|
| **D-1** | Términos y Condiciones | ¿Se mantiene el descargo de 3 puntos en la portada o se crea una página completa `/terminos` independiente? | Mantener el resumen visible en portada y enlazar a `/terminos` detallados cuando el abogado los apruebe. |
| **D-2** | Plazos procesales en FAQ | ¿Se ajusta la redacción del FAQ para no fijar «10 días» como plazo único ante edictos judiciales? | Ajustar a «plazo legal concedido por el tribunal (según el tipo de juicio)» con advertencia de consultar a un abogado. |
| **D-3** | Doble Confirmación en Alertas | ¿Se requiere verificación por enlace de correo antes de activar la vigilancia de un DUI? | Mantener registro directo en MVP y habilitar verificación en el siguiente sprint de IdP / Stu Cuenta. |
| **D-4** | Política OCR para escaneos | ¿Se ratifica que el texto OCR de páginas escaneadas (ej. Decreto 690) se mantenga en ruta separada con `noindex` y sin indexar en el buscador? | **Ratificado en código:** Separado por diseño; nunca se mezcla con el texto oficial del PDF. |
| **D-5** | Notificación por WhatsApp | ¿Las alertas por WhatsApp se gestionarán con proveedor local homologado o se mantendrá como canal opcional secundario? | Canal opcional secundario en fase de captura; envío pendiente de integración oficial. |

---

> **AVISO FINAL:**  
> Este documento representa un borrador de trabajo técnico. No constituye dictamen jurídico definitivo ni debe considerarse aprobado sin la firma o visto bueno de la Dirección General y del asesor legal designado por Grupo Stu, S.A.S.
