import sql from "mssql";
import { getPool } from "../pool.js";

/* ======================================================
   🔤 Catálogos y normalización
   ====================================================== */
const ESTADOS_CANON = new Set(["Pendiente", "EnRevision", "Aprobado", "Rechazado"]);
const METODOS = new Set(["Transferencia", "Fisico"]);

// Acepta variantes como "En revisión", "en_revision", etc. y devuelve el canon DB
function normEstado(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === "pendiente") return "Pendiente";
  if (["enrevision", "en revisión", "en_revision"].includes(s)) return "EnRevision";
  if (s === "aprobado") return "Aprobado";
  if (s === "rechazado") return "Rechazado";
  return null;
}

/* ======================================================
   📜 LISTAR (pendientes)
   GET /api/certificados?estado=Pendiente
   ====================================================== */
export async function listarCertificados(req, res) {
  const estadoRaw = req.query.estado || null;
  const estado = estadoRaw ? normEstado(estadoRaw) : null;

  try {
    const pool = await getPool();

    let q = `
      SELECT ID_Cert, Folio, Nombre, RUT, Direccion, Email,
             Metodo_Pago, Comprobante_URL, Estado, Notas, Fecha_Solicitud
      FROM dbo.CERTIFICADO_RESIDENCIA
    `;
    const params = [];
    if (estado) {
      q += ` WHERE Estado = @estado `;
      params.push(["estado", sql.VarChar(12), estado]);
    }
    q += ` ORDER BY Fecha_Solicitud DESC;`;

    const request = pool.request();
    for (const [n, t, v] of params) request.input(n, t, v);
    const { recordset } = await request.query(q);

    res.json({ ok: true, data: recordset });
  } catch (err) {
    console.error("listarCertificados:", err);
    res.status(500).json({ ok: false, error: "DB_ERROR_LISTAR" });
  }
}

/* ======================================================
   🔍 DETALLE POR ID (si aún está en principal)
   GET /api/certificados/:id
   ====================================================== */
export async function obtenerCertificado(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "ID_INVALIDO" });

  try {
    const pool = await getPool();
    const { recordset } = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT TOP 1 *
        FROM dbo.CERTIFICADO_RESIDENCIA
        WHERE ID_Cert = @id;
      `);

    if (!recordset.length) return res.status(404).json({ ok: false, error: "NO_ENCONTRADO" });
    res.json({ ok: true, data: recordset[0] });
  } catch (e) {
    console.error("obtenerCertificado:", e);
    res.status(500).json({ ok: false, error: "DB_ERROR_DETALLE" });
  }
}

/* ======================================================
   🔎 DETALLE POR FOLIO (principal o historial)
   GET /api/certificados/folio/:folio
   ====================================================== */
export async function obtenerPorFolio(req, res) {
  const folio = String(req.params.folio || "").trim();
  if (!folio) return res.status(400).json({ ok: false, error: "FOLIO_REQUERIDO" });

  try {
    const pool = await getPool();

    // 1) Intentar en la principal (pendiente)
    let { recordset } = await pool
      .request()
      .input("folio", sql.VarChar(20), folio)
      .query(`SELECT TOP 1 * FROM dbo.CERTIFICADO_RESIDENCIA WHERE Folio = @folio;`);

    if (recordset.length) return res.json({ ok: true, data: recordset[0] });

    // 2) Fallback al historial (última versión con snapshots)
    const r2 = await pool
      .request()
      .input("folio", sql.VarChar(20), folio)
      .query(`
        SELECT TOP 1
          ID_Cert, Folio, Nombre, RUT, Direccion, Email,
          Metodo_Pago, Comprobante_URL, Estado, Comentario, Validador_FK, Fecha_Cambio
        FROM dbo.HISTORIAL_CERTIFICADO
        WHERE Folio = @folio
        ORDER BY Fecha_Cambio DESC, ID_Hist DESC;
      `);

    if (!r2.recordset.length) {
      return res.status(404).json({ ok: false, error: "NO_ENCONTRADO" });
    }
    return res.json({ ok: true, data: r2.recordset[0] });
  } catch (e) {
    console.error("obtenerPorFolio:", e);
    res.status(500).json({ ok: false, error: "DB_ERROR_DETALLE_FOLIO" });
  }
}

/* ======================================================
   🕓 HISTORIAL (1 fila por solicitud)
   GET /api/certificados/_historial/lista/all?estado=Aprobado
   ====================================================== */
export async function listarHistorial(req, res) {
  const estadoRaw = req.query.estado || null;
  const estado = estadoRaw ? normEstado(estadoRaw) : null;

  try {
    const pool = await getPool();
    const request = pool.request();
    if (estado) request.input("estado", sql.VarChar(12), estado);

    const { recordset } = await request.query(`
      SELECT
        ID_Hist, ID_Cert, Folio, Nombre, RUT,
        Estado, Comentario, Validador_FK, Fecha_Cambio
      FROM dbo.HISTORIAL_CERTIFICADO
      ${estado ? "WHERE Estado = @estado" : ""}
      ORDER BY Fecha_Cambio DESC, ID_Hist DESC;
    `);

    res.json({ ok: true, data: recordset });
  } catch (e) {
    console.error("listarHistorial:", e);
    res.status(500).json({ ok: false, error: "DB_ERROR_HIST" });
  }
}

/* ======================================================
   ➕ CREAR (socio web o manual)
   - Inserta en principal (Pendiente).
   - Crea UNA fila en historial con snapshots (Pendiente).
   POST /api/certificados
   ====================================================== */
export async function crearCertificado(req, res) {
  try {
    const {
      nombre, rut, direccion, email,
      metodoPago, comprobanteUrl = null,
      idSocio = null, idUsuarioSolicita = null,
      notas = "Solicitud web (socio)"
    } = req.body || {};

    if (!nombre || !rut || !direccion || !email) {
      return res.status(400).json({ ok: false, error: "FALTAN_CAMPOS" });
    }
    if (!METODOS.has(metodoPago)) {
      return res.status(400).json({ ok: false, error: "METODO_INVALIDO" });
    }
    if (metodoPago === "Transferencia" && !comprobanteUrl) {
      return res.status(400).json({ ok: false, error: "FALTA_COMPROBANTE" });
    }

    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      // 1) Insert principal Pendiente
      const req1 = new sql.Request(tx)
        .input("idSocio", sql.Int, idSocio)
        .input("idUser", sql.Int, idUsuarioSolicita)
        .input("nombre", sql.NVarChar(120), nombre)
        .input("rut", sql.VarChar(12), rut)
        .input("dir", sql.NVarChar(200), direccion)
        .input("email", sql.NVarChar(160), email)
        .input("metodo", sql.VarChar(20), metodoPago)
        .input("url", sql.NVarChar(400), comprobanteUrl)
        .input("notas", sql.NVarChar(500), notas)
        .input("estado", sql.VarChar(12), "Pendiente");

      const ins = await req1.query(`
        INSERT INTO dbo.CERTIFICADO_RESIDENCIA
          (ID_Socio, ID_Usuario_Solicita, Nombre, RUT, Direccion, Email,
           Metodo_Pago, Comprobante_URL, Notas, Estado)
        OUTPUT inserted.ID_Cert, inserted.Folio, inserted.Estado, inserted.Fecha_Solicitud,
               inserted.Nombre, inserted.RUT, inserted.Direccion, inserted.Email,
               inserted.Metodo_Pago, inserted.Comprobante_URL
        VALUES (@idSocio, @idUser, @nombre, @rut, @dir, @email,
                @metodo, @url, @notas, @estado);
      `);

      const row = ins.recordset[0];

      // 2) Historial inicial con snapshot
      await new sql.Request(tx)
        .input("idc", sql.Int, row.ID_Cert)
        .input("estado", sql.VarChar(12), "Pendiente")
        .input("folio", sql.VarChar(20), row.Folio)
        .input("nom", sql.NVarChar(120), row.Nombre)
        .input("rut", sql.VarChar(12), row.RUT)
        .input("dir", sql.NVarChar(200), row.Direccion)
        .input("mail", sql.NVarChar(160), row.Email)
        .input("met", sql.VarChar(20), row.Metodo_Pago)
        .input("url", sql.NVarChar(400), row.Comprobante_URL)
        .query(`
          INSERT INTO dbo.HISTORIAL_CERTIFICADO
            (ID_Cert, Estado, Folio, Nombre, RUT, Direccion, Email, Metodo_Pago, Comprobante_URL)
          VALUES (@idc, @estado, @folio, @nom, @rut, @dir, @mail, @met, @url);
        `);

      await tx.commit();
      res.status(201).json({ ok: true, data: row });
    } catch (inner) {
      await tx.rollback();
      console.error("crearCertificado.tx:", inner);
      res.status(500).json({ ok: false, error: "DB_TX_ERROR" });
    }
  } catch (e) {
    console.error("crearCertificado:", e);
    res.status(500).json({ ok: false, error: "DB_ERROR_CREAR" });
  }
}

/* ======================================================
   🔄 CAMBIAR ESTADO (Aprobar / Rechazar / EnRevision / Pendiente)
   - ACTUALIZA la fila de historial (no inserta otra)
   - ELIMINA de la principal (deja de ser pendiente)
   PATCH /api/certificados/:id/estado
   ====================================================== */

   export async function cambiarEstado(req, res) {
  const id = Number(req.params.id);
  const estadoCanon = normEstado(req.body?.estado);
  const comentario = req.body?.comentario ?? null;
  const validadorId = req.body?.validadorId ?? null;

  if (!id) return res.status(400).json({ ok: false, error: "ID_INVALIDO" });
  if (!estadoCanon || !ESTADOS_CANON.has(estadoCanon)) {
    return res.status(400).json({ ok: false, error: "ESTADO_INVALIDO" });
  }

  try {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      // 1️⃣ Obtener datos actuales del certificado antes de eliminarlo
      const { recordset } = await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`
          SELECT TOP 1 *
          FROM dbo.CERTIFICADO_RESIDENCIA
          WHERE ID_Cert = @id;
        `);

      if (!recordset.length) {
        await tx.rollback();
        return res.status(404).json({ ok: false, error: "NO_ENCONTRADO_EN_PENDIENTES" });
      }

      const cert = recordset[0];

      // 2️⃣ Actualizar si existe en historial; si no, insertarlo
      const existingHist = await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`SELECT TOP 1 ID_Hist FROM dbo.HISTORIAL_CERTIFICADO WHERE ID_Cert = @id;`);

      if (existingHist.recordset.length) {
        // 🟢 Actualiza la fila existente
        await new sql.Request(tx)
          .input("id", sql.Int, id)
          .input("estado", sql.VarChar(12), estadoCanon)
          .input("coment", sql.NVarChar(500), comentario)
          .input("val", sql.Int, validadorId)
          .input("nom", sql.NVarChar(120), cert.Nombre)
          .input("rut", sql.VarChar(12), cert.RUT)
          .input("dir", sql.NVarChar(200), cert.Direccion)
          .input("mail", sql.NVarChar(160), cert.Email)
          .input("met", sql.VarChar(20), cert.Metodo_Pago)
          .input("url", sql.NVarChar(400), cert.Comprobante_URL)
          .query(`
            UPDATE dbo.HISTORIAL_CERTIFICADO
            SET Estado = @estado,
                Comentario = @coment,
                Validador_FK = @val,
                Nombre = @nom,
                RUT = @rut,
                Direccion = @dir,
                Email = @mail,
                Metodo_Pago = @met,
                Comprobante_URL = @url,
                Fecha_Cambio = SYSDATETIME()
            WHERE ID_Cert = @id;
          `);
      } else {
        // 🟡 No existía: lo crea con estado actualizado
        await new sql.Request(tx)
          .input("id", sql.Int, id)
          .input("estado", sql.VarChar(12), estadoCanon)
          .input("folio", sql.VarChar(20), cert.Folio)
          .input("nom", sql.NVarChar(120), cert.Nombre)
          .input("rut", sql.VarChar(12), cert.RUT)
          .input("dir", sql.NVarChar(200), cert.Direccion)
          .input("mail", sql.NVarChar(160), cert.Email)
          .input("met", sql.VarChar(20), cert.Metodo_Pago)
          .input("url", sql.NVarChar(400), cert.Comprobante_URL)
          .input("coment", sql.NVarChar(500), comentario)
          .input("val", sql.Int, validadorId)
          .query(`
            INSERT INTO dbo.HISTORIAL_CERTIFICADO
              (ID_Cert, Estado, Folio, Nombre, RUT, Direccion, Email, Metodo_Pago, Comprobante_URL, Comentario, Validador_FK)
            VALUES
              (@id, @estado, @folio, @nom, @rut, @dir, @mail, @met, @url, @coment, @val);
          `);
      }

      // 3️⃣ Eliminar solo de la tabla de pendientes
      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`DELETE FROM dbo.CERTIFICADO_RESIDENCIA WHERE ID_Cert = @id;`);

      await tx.commit();
      return res.json({ ok: true, mensaje: "Estado actualizado correctamente" });
    } catch (inner) {
      await tx.rollback();
      console.error("cambiarEstado.tx:", inner);
      return res.status(500).json({ ok: false, error: "DB_TX_ERROR" });
    }
  } catch (e) {
    console.error("cambiarEstado:", e);
    return res.status(500).json({ ok: false, error: "DB_ERROR_CAMBIO_ESTADO" });
  }
}



/* ======================================================
   ✏️ ACTUALIZAR CAMPOS (editar mientras es pendiente)
   PATCH /api/certificados/:id
   ====================================================== */

// PATCH /api/certificados/:id
export const actualizarCertificado = async (req, res) => {
  const { id } = req.params;
  const { nombre, rut, direccion, email, metodoPago } = req.body;

  try {
    const pool = await getPool();
    await pool.request()
      .input("ID_Cert", id)
      .input("Nombre", nombre)
      .input("RUT", rut)
      .input("Direccion", direccion)
      .input("Email", email)
      .input("Metodo_Pago", metodoPago)
      .query(`
        UPDATE CERTIFICADO_RESIDENCIA
        SET Nombre=@Nombre, RUT=@RUT, Direccion=@Direccion,
            Email=@Email, Metodo_Pago=@Metodo_Pago
        WHERE ID_Cert=@ID_Cert
      `);

    return res.json({ ok: true, data: { id, nombre, rut, direccion, email, metodoPago } });
  } catch (e) {
    console.error("❌ Error actualizarCertificado:", e);
    res.status(500).json({ ok: false, error: "Error al actualizar certificado" });
  }
};



/* ======================================================
   🗑️ ELIMINAR
   DELETE /api/certificados/:id
   ====================================================== */
export async function eliminarCertificado(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "ID_INVALIDO" });

  try {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      // borrar historial (una fila)
      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`DELETE FROM dbo.HISTORIAL_CERTIFICADO WHERE ID_Cert=@id;`);

      // borrar principal si existe
      const del = await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`DELETE FROM dbo.CERTIFICADO_RESIDENCIA WHERE ID_Cert=@id;`);

      await tx.commit();

      const affected = del.rowsAffected?.[0] ?? 0;
      return res.json({ ok: true, removedFromMain: affected > 0 });
    } catch (inner) {
      await tx.rollback();
      console.error("eliminarCertificado.tx:", inner);
      res.status(500).json({ ok: false, error: "DB_TX_ERROR" });
    }
  } catch (e) {
    console.error("eliminarCertificado:", e);
    res.status(500).json({ ok: false, error: "DB_ERROR_ELIMINAR" });
  }
}
// ➕ NUEVO: actualizar historial por FOLIO (última versión)
export async function actualizarHistorial(req, res) {
  const folio = String(req.params.folio || '').trim();
  if (!folio) return res.status(400).json({ ok: false, error: "FOLIO_REQUERIDO" });

  const {
    nombre, rut, direccion, email,
    metodoPago, comprobanteUrl, // puede venir null para limpiar
    comentario
  } = req.body || {};

  try {
    const pool = await getPool();

    // SET dinámico solo con campos enviados (undefined = no tocar)
    const sets = [];
    const rq = pool.request().input("folio", sql.VarChar(20), folio);

    if (nombre !== undefined) { sets.push("Nombre = @nom"); rq.input("nom", sql.NVarChar(120), nombre); }
    if (rut !== undefined) { sets.push("RUT = @rut"); rq.input("rut", sql.VarChar(12), rut); }
    if (direccion !== undefined) { sets.push("Direccion = @dir"); rq.input("dir", sql.NVarChar(200), direccion); }
    if (email !== undefined) { sets.push("Email = @mail"); rq.input("mail", sql.NVarChar(160), email); }
    if (metodoPago !== undefined) {
      const met = (String(metodoPago).toLowerCase() === "fisico") ? "Fisico" : "Transferencia";
      sets.push("Metodo_Pago = @met"); rq.input("met", sql.VarChar(20), met);
    }
    if (comprobanteUrl !== undefined) { // permite setear a null
      sets.push("Comprobante_URL = @url"); rq.input("url", sql.NVarChar(400), comprobanteUrl);
    }
    if (comentario !== undefined) { sets.push("Comentario = @coment"); rq.input("coment", sql.NVarChar(500), comentario); }

    if (!sets.length) return res.status(400).json({ ok: false, error: "SIN_CAMBIOS" });

    const q = `
      WITH Last AS (
        SELECT TOP 1 ID_Hist
        FROM dbo.HISTORIAL_CERTIFICADO
        WHERE Folio = @folio
        ORDER BY Fecha_Cambio DESC, ID_Hist DESC
      )
      UPDATE h
         SET ${sets.join(", ")},
             Fecha_Cambio = SYSDATETIME()
      FROM dbo.HISTORIAL_CERTIFICADO h
      INNER JOIN Last l ON l.ID_Hist = h.ID_Hist;

      SELECT TOP 1 *
      FROM dbo.HISTORIAL_CERTIFICADO
      WHERE Folio = @folio
      ORDER BY Fecha_Cambio DESC, ID_Hist DESC;
    `;

    const { recordset } = await rq.query(q);
    return res.json({ ok: true, data: recordset[0] || null });
  } catch (e) {
    console.error("actualizarHistorial:", e);
    return res.status(500).json({ ok: false, error: "DB_ERROR_ACT_HIST" });
  }
}
