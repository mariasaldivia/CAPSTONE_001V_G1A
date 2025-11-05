// controllers/requerimientosController.js
import path from "path";
import { getPool } from "../pool.js";

/* =========================
   Helpers
   ========================= */
const ok = (res, data = {}, code = 200) => res.status(code).json({ ok: true, data });
const fail = (res, error = "ERROR", code = 500) => res.status(code).json({ ok: false, error });
const now = () => new Date();

/** Genera folio tipo R000001 con relleno a 6 */
const buildFolio = async (pool) => {
  const q = await pool.request().query(`
    SELECT TOP 1 FOLIO
    FROM dbo.HISTORIAL_REQUERIMIENTOS
    WHERE ISNUMERIC(REPLACE(FOLIO,'R','')) = 1
    ORDER BY TRY_CONVERT(INT, REPLACE(FOLIO,'R','')) DESC
  `);

  const last = q.recordset?.[0]?.FOLIO || "R000000";
  const n = parseInt(String(last).replace(/^R/i, ""), 10) || 0;
  const next = n + 1;
  return `R${String(next).padStart(6, "0")}`;
};

/** Construye URL pública para un archivo subido */
const publicUrlFor = (filePath) => {
  const base =
    (process.env.API_PUBLIC_URL?.replace(/\/+$/, "")) ||
    (process.env.APP_BASE_URL?.replace(/\/+$/, "")) ||
    `http://localhost:${process.env.PORT || 4010}`;
  const rel = `/uploads/requerimientos/${path.basename(filePath)}`;
  return `${base}${rel}`;
};

/* =========================================================
   Normalización de RUT (para JOIN sin puntos ni guión)
   ========================================================= */
const RUT_EQ = `
  REPLACE(REPLACE(UPPER(S.RUT),'.',''),'-','') =
  REPLACE(REPLACE(UPPER(R.PERFIL_RUT),'.',''),'-','')
`;
const RUT_EQ_H = `
  REPLACE(REPLACE(UPPER(S.RUT),'.',''),'-','') =
  REPLACE(REPLACE(UPPER(H.PERFIL_RUT),'.',''),'-','')
`;

/* =========================
   Crear requerimiento
   ========================= */
export const crearRequerimiento = async (req, res) => {
  const {
    socioNombre,
    rut_socio,     // PERFIL_RUT
    email,
    telefono,      // puede venir vacío
    tipo,          // ASUNTO
    direccion,
    comentarios,   // → DESCRIPCION
  } = req.body;

  if (!socioNombre || !rut_socio || !tipo || !direccion) {
    return fail(res, "Faltan datos obligatorios (socioNombre, rut_socio, tipo, direccion).", 400);
  }

  const descripcion = (comentarios || "").trim();
  const asunto = tipo || "Otro";

  try {
    const pool = await getPool();
    const folio = await buildFolio(pool);
    const created = now();

    // Si vino imagen en el mismo POST
    let imagenUrl = null;
    if (req.file) imagenUrl = publicUrlFor(req.file.path);

    // ── NUEVO: si no viene teléfono, buscar en SOCIOS por RUT normalizado
    const telFromSocioRs = await pool.request()
      .input("rutSocio", rut_socio)
      .query(`
        SELECT TOP 1 s.Telefono
        FROM dbo.SOCIOS s
        WHERE REPLACE(REPLACE(UPPER(s.RUT),'.',''),'-','')
           = REPLACE(REPLACE(UPPER(@rutSocio),'.',''),'-','')
      `);
    const telefonoFinal = (telefono && String(telefono).trim()) || telFromSocioRs.recordset?.[0]?.Telefono || null;

    // Inserta en principal (incluye TELEFONO)
    await pool.request()
      .input("folio", folio)
      .input("rut", rut_socio)
      .input("nombre", socioNombre)
      .input("mail", email || null)
      .input("tel", telefonoFinal)
      .input("asunto", asunto)
      .input("direccion", direccion || null)
      .input("desc", descripcion)
      .input("estado", "Pendiente")
      .input("actor", null)
      .input("created", created)
      .input("img", imagenUrl)
      .query(`
        INSERT INTO dbo.REQUERIMIENTOS
          (FOLIO, PERFIL_RUT, NOMBRE_SOLICITANTE, EMAIL_SOLICITANTE, TELEFONO,
           ASUNTO, DIRECCION, DESCRIPCION, ESTADO, ACTOR_NOMBRE, CREATED_AT, IMAGEN_URL)
        VALUES
          (@folio, @rut, @nombre, @mail, @tel,
           @asunto, @direccion, @desc, @estado, @actor, @created, @img)
      `);

    // Inserta en historial (incluye TELEFONO)
    await pool.request()
      .input("folio", folio)
      .input("rut", rut_socio)
      .input("nombre", socioNombre)
      .input("mail", email || null)
      .input("tel", telefonoFinal)
      .input("asunto", asunto)
      .input("direccion", direccion || null)
      .input("desc", descripcion)
      .input("estado", "Pendiente")
      .input("created", created)
      .input("updated", created)
      .input("validador", null)
      .input("img", imagenUrl)
      .query(`
        INSERT INTO dbo.HISTORIAL_REQUERIMIENTOS
          (FOLIO, PERFIL_RUT, NOMBRE_SOLICITANTE, EMAIL_SOLICITANTE, TELEFONO,
           ASUNTO, DIRECCION, DESCRIPCION, ESTADO, CREATED_AT, UPDATED_AT, VALIDADOR_NOMBRE, IMAGEN_URL)
        VALUES
          (@folio, @rut, @nombre, @mail, @tel,
           @asunto, @direccion, @desc, @estado, @created, @updated, @validador, @img)
      `);

    return ok(res, { Folio: folio, Imagen_URL: imagenUrl, Adjunto_URL: imagenUrl });
  } catch (e) {
    console.error("crearRequerimiento:", e);
    return fail(res, e.message || "ERROR_CREAR_REQUERIMIENTO");
  }
};

/* =========================
   Listar requerimientos (?estado)
   – con JOIN a SOCIOS para TELEFONO y fallback de correo
   ========================= */
export const listarRequerimientos = async (req, res) => {
  const { estado } = req.query;
  try {
    const pool = await getPool();
    let sql = `
      SELECT
        R.ID, R.FOLIO, R.PERFIL_RUT, R.NOMBRE_SOLICITANTE,
        COALESCE(R.EMAIL_SOLICITANTE, S.Correo) AS EMAIL_SOLICITANTE,
        R.ASUNTO, R.DIRECCION, R.DESCRIPCION, R.ESTADO, R.ACTOR_NOMBRE,
        R.CREATED_AT, R.IMAGEN_URL,
        S.Telefono AS TELEFONO
      FROM dbo.REQUERIMIENTOS R
      LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ}
    `;
    if (estado) sql += " WHERE R.ESTADO = @estado";
    sql += " ORDER BY R.CREATED_AT DESC, R.ID DESC";

    const rq = pool.request();
    if (estado) rq.input("estado", estado);

    const rs = await rq.query(sql);
    return ok(res, rs.recordset || []);
  } catch (e) {
    console.error("listarRequerimientos:", e);
    return fail(res, e.message || "ERROR_LISTAR");
  }
};

/* =========================
   Obtener requerimiento por ID – con JOIN a SOCIOS
   ========================= */
export const obtenerRequerimiento = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const rs = await pool.request().input("id", id).query(`
      SELECT
        R.ID, R.FOLIO, R.PERFIL_RUT, R.NOMBRE_SOLICITANTE,
        COALESCE(R.EMAIL_SOLICITANTE, S.Correo) AS EMAIL_SOLICITANTE,
        R.ASUNTO, R.DIRECCION, R.DESCRIPCION, R.ESTADO, R.ACTOR_NOMBRE,
        R.CREATED_AT, R.IMAGEN_URL,
        S.Telefono AS TELEFONO
      FROM dbo.REQUERIMIENTOS R
      LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ}
      WHERE R.ID = @id
    `);

    if (!rs.recordset?.length) return fail(res, "NO_ENCONTRADO", 404);
    return ok(res, rs.recordset[0]);
  } catch (e) {
    console.error("obtenerRequerimiento:", e);
    return fail(res, e.message || "ERROR_OBTENER");
  }
};

/* =========================
   Actualizar requerimiento por ID (principal)
   ========================= */
export const actualizarRequerimiento = async (req, res) => {
  const { id } = req.params;
  const { tipo, direccion, comentarios, descripcion } = req.body;

  const asunto = tipo ?? null;
  const dir = direccion ?? null;
  const desc = (comentarios ?? descripcion ?? "").trim();

  try {
    const pool = await getPool();

    const ex = await pool.request().input("id", id).query(`
      SELECT ID FROM dbo.REQUERIMIENTOS WHERE ID=@id
    `);
    if (!ex.recordset?.length) return fail(res, "NO_ENCONTRADO", 404);

    await pool.request()
      .input("id", id)
      .input("asunto", asunto)
      .input("direccion", dir)
      .input("desc", desc)
      .query(`
        UPDATE dbo.REQUERIMIENTOS
        SET ASUNTO     = COALESCE(@asunto, ASUNTO),
            DIRECCION  = @direccion,
            DESCRIPCION= @desc
        WHERE ID = @id
      `);

    return ok(res, { ID: id });
  } catch (e) {
    console.error("actualizarRequerimiento:", e);
    return fail(res, e.message || "ERROR_ACTUALIZAR");
  }
};

/* =========================
   Cambiar estado (ID)
   ========================= */
export const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const { estado, validadorNombre = null } = req.body;

  if (!estado) return fail(res, "Estado requerido.", 400);

  try {
    const pool = await getPool();

    // Obtener FOLIO a partir del ID
    const ex = await pool.request().input("id", id).query(`
      SELECT FOLIO FROM dbo.REQUERIMIENTOS WHERE ID=@id
    `);
    if (!ex.recordset?.length) return fail(res, "NO_ENCONTRADO", 404);
    const folio = ex.recordset[0].FOLIO;

    // Actualiza principal
    await pool.request()
      .input("id", id)
      .input("estado", estado)
      .input("actor", validadorNombre)
      .query(`
        UPDATE dbo.REQUERIMIENTOS
        SET ESTADO=@estado,
            ACTOR_NOMBRE=@actor
        WHERE ID=@id
      `);

    // Actualiza historial (estado + updated + validador)
    await pool.request()
      .input("folio", folio)
      .input("estado", estado)
      .input("validador", validadorNombre)
      .input("updated", now())
      .query(`
        UPDATE dbo.HISTORIAL_REQUERIMIENTOS
        SET ESTADO=@estado,
            VALIDADOR_NOMBRE=@validador,
            UPDATED_AT=@updated
        WHERE FOLIO=@folio
      `);

    // Si el estado es final, eliminar de principal (opcional)
    if (estado === "Aprobado" || estado === "Rechazado") {
      await pool.request().input("id", id).query(`
        DELETE FROM dbo.REQUERIMIENTOS WHERE ID=@id
      `);
    }

    return ok(res, { FOLIO: folio, estado });
  } catch (e) {
    console.error("cambiarEstado:", e);
    return fail(res, e.message || "ERROR_CAMBIAR_ESTADO");
  }
};

/* =========================
   Subir adjunto (archivo) – ACTUALIZA ambas tablas
   ========================= */
export const subirAdjunto = async (req, res) => {
  try {
    if (!req.file) return fail(res, "No se recibió archivo.", 400);

    const imagenUrl = publicUrlFor(req.file.path);

    const pool = await getPool();

    // Actualiza por ID en principal
    const id = req.params.id;
    const ex = await pool.request().input("id", id).query(`
      SELECT FOLIO FROM dbo.REQUERIMIENTOS WHERE ID=@id
    `);
    if (!ex.recordset?.length) return fail(res, "NO_ENCONTRADO", 404);

    const folio = ex.recordset[0].FOLIO;

    await pool.request().input("id", id).input("url", imagenUrl).query(`
      UPDATE dbo.REQUERIMIENTOS SET IMAGEN_URL=@url WHERE ID=@id
    `);

    // Refleja también en HISTORIAL por FOLIO
    await pool.request().input("folio", folio).input("url", imagenUrl).query(`
      UPDATE dbo.HISTORIAL_REQUERIMIENTOS SET IMAGEN_URL=@url WHERE FOLIO=@folio
    `);

    return ok(res, { url: imagenUrl, Folio: folio });
  } catch (e) {
    console.error("subirAdjunto:", e);
    return fail(res, e.message || "ERROR_SUBIR_ADJUNTO");
  }
};

/* =========================
   Historial – listar todo (?estado)
   – con JOIN a SOCIOS para TELEFONO y fallback de correo
   ========================= */
export const listarHistorial = async (req, res) => {
  const { estado } = req.query;
  try {
    const pool = await getPool();
    let sql = `
      SELECT
        H.ID, H.FOLIO, H.PERFIL_RUT, H.NOMBRE_SOLICITANTE,
        COALESCE(H.EMAIL_SOLICITANTE, S.Correo) AS EMAIL_SOLICITANTE,
        H.ASUNTO, H.DIRECCION, H.DESCRIPCION, H.ESTADO,
        H.CREATED_AT, H.UPDATED_AT, H.VALIDADOR_NOMBRE, H.IMAGEN_URL,
        S.Telefono AS TELEFONO
      FROM dbo.HISTORIAL_REQUERIMIENTOS H
      LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ_H}
    `;
    if (estado) sql += " WHERE H.ESTADO=@estado";
    sql += " ORDER BY H.UPDATED_AT DESC, H.CREATED_AT DESC, H.ID DESC";

    const rq = pool.request();
    if (estado) rq.input("estado", estado);

    const rs = await rq.query(sql);
    return ok(res, rs.recordset || []);
  } catch (e) {
    console.error("listarHistorial:", e);
    return fail(res, e.message || "ERROR_LISTAR_HISTORIAL");
  }
};

/* =========================
   Historial – actualizar por FOLIO
   ========================= */
export const actualizarHistorial = async (req, res) => {
  const { folio } = req.params;
  const { tipo, direccion, comentarios, descripcion, estado } = req.body;

  const asunto = tipo ?? null;
  const dir = direccion ?? null;
  const desc = (comentarios ?? descripcion ?? "").trim();

  try {
    const pool = await getPool();

    const ex = await pool.request().input("folio", folio).query(`
      SELECT ID FROM dbo.HISTORIAL_REQUERIMIENTOS WHERE FOLIO=@folio
    `);
    if (!ex.recordset?.length) return fail(res, "NO_ENCONTRADO", 404);

    await pool.request()
      .input("folio", folio)
      .input("asunto", asunto)
      .input("direccion", dir)
      .input("desc", desc)
      .input("estado", estado ?? null)
      .input("updated", now())
      .query(`
        UPDATE dbo.HISTORIAL_REQUERIMIENTOS
        SET ASUNTO     = COALESCE(@asunto, ASUNTO),
            DIRECCION  = @direccion,
            DESCRIPCION= @desc,
            ESTADO     = COALESCE(@estado, ESTADO),
            UPDATED_AT = @updated
        WHERE FOLIO = @folio
      `);

    // Refleja cambios básicos en principal (si existe todavía)
    await pool.request()
      .input("folio", folio)
      .input("asunto", asunto)
      .input("direccion", dir)
      .input("desc", desc)
      .query(`
        UPDATE dbo.REQUERIMIENTOS
        SET ASUNTO = COALESCE(@asunto, ASUNTO),
            DIRECCION = @direccion,
            DESCRIPCION = @desc
        WHERE FOLIO = @folio
      `);

    return ok(res, { FOLIO: folio });
  } catch (e) {
    console.error("actualizarHistorial:", e);
    return fail(res, e.message || "ERROR_ACTUALIZAR_HISTORIAL");
  }
};

/* =========================
   Obtener por FOLIO (principal o historial)
   – con JOIN a SOCIOS
   ========================= */
export const obtenerPorFolio = async (req, res) => {
  const { folio } = req.params;
  try {
    const pool = await getPool();

    const principal = await pool.request().input("folio", folio).query(`
      SELECT
        R.ID, R.FOLIO, R.PERFIL_RUT, R.NOMBRE_SOLICITANTE,
        COALESCE(R.EMAIL_SOLICITANTE, S.Correo) AS EMAIL_SOLICITANTE,
        R.ASUNTO, R.DIRECCION, R.DESCRIPCION, R.ESTADO, R.ACTOR_NOMBRE,
        R.CREATED_AT, R.IMAGEN_URL,
        S.Telefono AS TELEFONO
      FROM dbo.REQUERIMIENTOS R
      LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ}
      WHERE R.FOLIO=@folio
    `);
    if (principal.recordset?.length) return ok(res, principal.recordset[0]);

    const hist = await pool.request().input("folio", folio).query(`
      SELECT
        H.ID, H.FOLIO, H.PERFIL_RUT, H.NOMBRE_SOLICITANTE,
        COALESCE(H.EMAIL_SOLICITANTE, S.Correo) AS EMAIL_SOLICITANTE,
        H.ASUNTO, H.DIRECCION, H.DESCRIPCION, H.ESTADO,
        H.CREATED_AT, H.UPDATED_AT, H.VALIDADOR_NOMBRE, H.IMAGEN_URL,
        S.Telefono AS TELEFONO
      FROM dbo.HISTORIAL_REQUERIMIENTOS H
      LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ_H}
      WHERE H.FOLIO=@folio
    `);
    if (hist.recordset?.length) return ok(res, hist.recordset[0]);

    return fail(res, "NO_ENCONTRADO", 404);
  } catch (e) {
    console.error("obtenerPorFolio:", e);
    return fail(res, e.message || "ERROR_OBTENER_FOLIO");
  }
};

/* =========================
   Eliminar por ID (principal)
   ========================= */
export const eliminarRequerimiento = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();

    const ex = await pool.request().input("id", id).query(`
      SELECT FOLIO FROM dbo.REQUERIMIENTOS WHERE ID=@id
    `);
    if (!ex.recordset?.length) return fail(res, "NO_ENCONTRADO", 404);

    await pool.request().input("id", id).query(`
      DELETE FROM dbo.REQUERIMIENTOS WHERE ID=@id
    `);

    return ok(res, { ID: id });
  } catch (e) {
    console.error("eliminarRequerimiento:", e);
    return fail(res, e.message || "ERROR_ELIMINAR");
  }
};

/* =========================
   Eliminar por FOLIO (borra principal + historial)
   ========================= */
export const eliminarPorFolio = async (req, res) => {
  const { folio } = req.params;
  try {
    const pool = await getPool();

    await pool.request().input("folio", folio).query(`
      DELETE FROM dbo.REQUERIMIENTOS WHERE FOLIO=@folio
    `);

    await pool.request().input("folio", folio).query(`
      DELETE FROM dbo.HISTORIAL_REQUERIMIENTOS WHERE FOLIO=@folio
    `);

    return ok(res, { FOLIO: folio });
  } catch (e) {
    console.error("eliminarPorFolio:", e);
    return fail(res, e.message || "ERROR_ELIMINAR_FOLIO");
  }
};
