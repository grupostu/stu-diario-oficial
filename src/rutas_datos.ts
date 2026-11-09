// API de consulta (solo lectura): búsqueda, catálogo, registros por diario, coincidencias, página, marcas, edictos y leyes.
// Los contratos JSON no cambian; los cuerpos que no varían tras el arranque se serializan y comprimen una sola vez.
import { Router, type Request, type Response } from 'express';
import { validarParametrosBusqueda } from './busqueda_esquema.js';
import type { ContextoRutas } from './contexto.js';
import { CABECERAS_BORDE_API, SIN_CACHE, TIPO_JSON } from './contexto.js';
import { ID_DIARIO } from './diarios.js';
import { CacheTTL, enviarPrecomprimida, precomprimir, type Precomprimida } from './respuesta_cache.js';
import { limitarTasa, parsearNumeroPagina } from './seguridad_http.js';

export function rutasDatos(ctx: ContextoRutas): Router {
  const r = Router();
  const { publicaciones, catalogo, limites } = ctx;

  // Búsqueda por campo y párrafo. Todos los parámetros se validan con un esquema estricto (src/busqueda_esquema.ts):
  // consulta <= 200 caracteres, sección conocida, página y tamaño de página acotados. Nunca se compila una RegExp con la entrada.
  const cacheBusqueda = new CacheTTL<Precomprimida>(1000, 60_000);
  r.get('/api/v1/search', limitarTasa(limites.busqueda), (req: Request, res: Response) => {
    const v = validarParametrosBusqueda(req.query as Record<string, unknown>);
    if (!v.ok) {
      res.set('Cache-Control', 'no-store');
      const aviso = v.errores.map((e) => e.mensaje).join(' ');
      res.status(400).json({ error: 'Parámetros de búsqueda inválidos', errores: v.errores, aviso, entradaInvalida: true });
      return;
    }
    const { q, categoria, soloDui, pagina, porPagina } = v.valor;
    // El índice es de solo lectura tras el arranque: el resultado de una consulta validada se reutiliza 60 s (tope 1.000 consultas).
    const clave = JSON.stringify([q, categoria, soloDui, pagina, porPagina]);
    let pre = cacheBusqueda.get(clave);
    if (!pre) pre = cacheBusqueda.set(clave, precomprimir(JSON.stringify(publicaciones.buscar({ q, categoria, soloDui, pagina, porPagina })), TIPO_JSON, 4));
    enviarPrecomprimida(req, res, pre, CABECERAS_BORDE_API);
  });

  // Catálogo de diarios disponibles (lo que el visor puede abrir).
  const diariosPre = precomprimir(JSON.stringify({ diarios: catalogo }), TIPO_JSON, 9);
  r.get('/api/v1/diarios', (req: Request, res: Response) => {
    enviarPrecomprimida(req, res, diariosPre, SIN_CACHE);
  });

  // Publicaciones de un diario con su texto y los rangos exactos que ocupan en el PDF (el visor las resalta).
  const registrosPre = new Map<string, Precomprimida>();
  r.get('/api/v1/diarios/:id/registros', (req: Request, res: Response) => {
    const id = String(req.params.id);
    if (!ID_DIARIO.test(id) || !catalogo.some((d) => d.id === id)) {
      res.status(404).json({ error: 'Diario no encontrado' });
      return;
    }
    const cacheado = registrosPre.get(id);
    if (cacheado) return enviarPrecomprimida(req, res, cacheado, SIN_CACHE);
    const cuerpo = {
      diario: id,
      registros: publicaciones.deDiario(id).map((x) => ({
        id: x.id,
        pagina: x.pagina,
        paginaFin: x.paginaFin ?? x.pagina,
        titular: x.titular,
        clasificacionJuridica: x.clasificacionJuridica,
        contenido: x.contenido,
        duisEncontrados: x.duisEncontrados,
        rangos: x.rangos ?? []
      }))
    };
    // Los registros de un diario no cambian tras el arranque: se serializan y comprimen una sola vez.
    const pre = precomprimir(JSON.stringify(cuerpo), TIPO_JSON, 6);
    registrosPre.set(id, pre);
    enviarPrecomprimida(req, res, pre, SIN_CACHE);
  });

  // Dónde más aparece lo buscado: coincidencias por diario (para saltar de un diario a otro).
  const cacheCoincidencias = new CacheTTL<Precomprimida>(500, 60_000);
  r.get('/api/v1/coincidencias', limitarTasa(limites.busqueda), (req: Request, res: Response) => {
    const v = validarParametrosBusqueda({ q: req.query.q } as Record<string, unknown>);
    if (!v.ok) {
      res.status(400).json({ error: 'Parámetros de búsqueda inválidos', diarios: [] });
      return;
    }
    const cacheada = cacheCoincidencias.get(v.valor.q);
    if (cacheada) return enviarPrecomprimida(req, res, cacheada, SIN_CACHE);
    const resultado = publicaciones.buscar({ q: v.valor.q, pagina: 1, porPagina: 5000 });
    const por = new Map<string, { total: number; primeraPagina: number }>();
    for (const x of resultado.resultados) {
      const id = x.diario.diarioId ?? x.diario.fecha;
      const u = por.get(id);
      if (!u) por.set(id, { total: 1, primeraPagina: x.diario.pagina });
      else {
        u.total++;
        if (x.diario.pagina < u.primeraPagina) u.primeraPagina = x.diario.pagina;
      }
    }
    const cuerpo = { diarios: catalogo.map((d) => ({ id: d.id, tomo: d.tomo, numero: d.numero, fecha: d.fecha, total: por.get(d.id)?.total ?? 0, primeraPagina: por.get(d.id)?.primeraPagina ?? 1 })) };
    const pre = cacheCoincidencias.set(v.valor.q, precomprimir(JSON.stringify(cuerpo), TIPO_JSON, 4));
    enviarPrecomprimida(req, res, pre, SIN_CACHE);
  });

  // Compatibilidad: publicaciones que ocupan una página (de todos los diarios, normalmente uno).
  r.get('/api/v1/page-data/:page', limitarTasa(limites.lecturas), (req: Request, res: Response) => {
    const pageNum = parsearNumeroPagina(req.params.page);
    if (isNaN(pageNum)) {
      res.status(400).json({ error: 'Número de página inválido' });
      return;
    }
    const registros = publicaciones.dePagina(pageNum);
    res.set(CABECERAS_BORDE_API);
    res.json({ pagina: pageNum, totalRegistros: registros.length, records: registros });
  });

  // Marcas: solo avisos de marcas que existan en los diarios cargados.
  r.get('/api/v1/marcas', limitarTasa(limites.busqueda), (req: Request, res: Response) => {
    const consulta = String(req.query.q || '').trim().toLowerCase().slice(0, 100);
    let filtradas = publicaciones.marcas();
    if (consulta) filtradas = filtradas.filter((m) => `${m.titular} ${m.contenido}`.toLowerCase().includes(consulta));
    res.set(CABECERAS_BORDE_API);
    res.json({
      total: filtradas.length,
      marcas: filtradas.map((m) => ({ id: m.id, diarioId: m.diarioId ?? m.fecha, tomo: m.tomo, numero: m.numero, fecha: m.fecha, pagina: m.pagina, titular: m.titular, contenido: m.contenido })),
      aviso: filtradas.length === 0 ? 'Los diarios cargados no contienen avisos de marcas para este criterio.' : undefined
    });
  });

  // Últimos edictos judiciales.
  const edictos = publicaciones.recientesPorCategoria('EDICTO_JUDICIAL', 20);
  const edictosPre = precomprimir(JSON.stringify({ total: edictos.length, edictos }), TIPO_JSON, 9);
  r.get('/api/v1/edictos-recientes', (req: Request, res: Response) => {
    enviarPrecomprimida(req, res, edictosPre, CABECERAS_BORDE_API);
  });

  // Decretos y resoluciones oficiales.
  const leyes = publicaciones
    .todas()
    .filter((x) => (x.categoria === 'DECRETO_LEGISLATIVO' || x.categoria === 'ACUERDO_EJECUTIVO') && /^(Decreto|Acuerdo) No\./.test(x.titular))
    .slice(0, 40);
  const leyesPre = precomprimir(JSON.stringify({ total: leyes.length, leyes }), TIPO_JSON, 9);
  r.get('/api/v1/leyes-recientes', (req: Request, res: Response) => {
    enviarPrecomprimida(req, res, leyesPre, CABECERAS_BORDE_API);
  });

  return r;
}
