import sql from "mssql";
import { getPool } from "../pool.js";

/* ======================================================
   🔤 Catálogos y normalización
   ====================================================== */
const ESTADOS_CANON = new Set(["Pendiente", "EnRevision", "Aprobado", "Rechazado"]);
const METODOS = new Set(["Transferencia", "Fisico"]);

// Acepta variantes y devuelve el canon DB
function normEstado(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === "pendiente") return "Pendiente";
  if (["enrevision", "en revisión", "en_revision"].includes(s)) return "EnRevision";
  if (s === "aprobado") return "Aprobado";
  if (s === "rechazado") return "Rechazado";
  return null;
}

// Normalización de RUT para JOIN con SOCIOS
const RUT_EQ_CERT = `
  REPLACE(REPLACE(UPPER(S.RUT),'.',''),'-','') =
  REPLACE(REPLACE(UPPER(C.RUT),'.',''),'-','')
`;
const RUT_EQ_HIST = `
  REPLACE(REPLACE(UPPER(S.RUT),'.',''),'-','') =
  REPLACE(REPLACE(UPPER(H.RUT),'.',''),'-','')
`;

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
      SELECT
        C.ID_Cert, C.Folio, C.Nombre, C.RUT, C.Direccion, C.Email,
        C.Metodo_Pago, C.Comprobante_URL, C.Estado, C.Notas, C.Fecha_Solicitud,
        COALESCE(C.TELEFONO, S.Telefono) AS TELEFONO   -- 👈 TELEFONO (fallback desde SOCIOS)
      FROM dbo.CERTIFICADO_RESIDENCIA C
      LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ_CERT}
    `;
    if (estado) q += ` WHERE C.Estado = @estado `;
    q += ` ORDER BY C.Fecha_Solicitud DESC;`;

    const request = pool.request();
    if (estado) request.input("estado", sql.VarChar(12), estado);
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
        SELECT TOP 1
          C.*,
          COALESCE(C.TELEFONO, S.Telefono) AS TELEFONO  -- 👈 TELEFONO
        FROM dbo.CERTIFICADO_RESIDENCIA C
        LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ_CERT}
        WHERE C.ID_Cert = @id;
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
      .query(`
        SELECT TOP 1
          C.*,
          COALESCE(C.TELEFONO, S.Telefono) AS TELEFONO   -- 👈 TELEFONO
        FROM dbo.CERTIFICADO_RESIDENCIA C
        LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ_CERT}
        WHERE C.Folio = @folio;
      `);

    if (recordset.length) return res.json({ ok: true, data: recordset[0] });

    // 2) Fallback al historial (última versión con snapshots)
    const r2 = await pool
      .request()
      .input("folio", sql.VarChar(20), folio)
      .query(`
        SELECT TOP 1
          H.ID_Cert, H.Folio, H.Nombre, H.RUT, H.Direccion, H.Email,
          H.Metodo_Pago, H.Comprobante_URL, H.Estado, H.Comentario, H.Validador_FK, H.Fecha_Cambio,
          COALESCE(H.TELEFONO, S.Telefono) AS TELEFONO   -- 👈 TELEFONO
        FROM dbo.HISTORIAL_CERTIFICADO H
        LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ_HIST}
        WHERE H.Folio = @folio
        ORDER BY H.Fecha_Cambio DESC, H.ID_Hist DESC;
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
        H.ID_Hist, H.ID_Cert, H.Folio, H.Nombre, H.RUT,
        H.Direccion, H.Email, H.Metodo_Pago, H.Comprobante_URL,
        H.Estado, H.Comentario, H.Validador_FK, H.Fecha_Cambio,
        COALESCE(H.TELEFONO, S.Telefono) AS TELEFONO   -- 👈 TELEFONO
      FROM dbo.HISTORIAL_CERTIFICADO H
      LEFT JOIN dbo.SOCIOS S ON ${RUT_EQ_HIST}
      ${estado ? "WHERE H.Estado = @estado" : ""}
      ORDER BY H.Fecha_Cambio DESC, H.ID_Hist DESC;
    `);

    res.json({ ok: true, data: recordset });
  } catch (e) {
    console.error("listarHistorial:", e);
    res.status(500).json({ ok: false, error: "DB_ERROR_HIST" });
  }
}

/* ======================================================
   ➕ CREAR (socio web o manual) — con TELEFONO
   POST /api/certificados
   ====================================================== */
export async function crearCertificado(req, res) {
  try {
    const {
      nombre, rut, direccion, email,
      telefono,                         // 👈 NUEVO
      metodoPago, comprobanteUrl = null,
      idSocio = null, idUsuarioSolicita = null,
      notas = "Solicitud web (socio)"
    } = req.body || {};

    if (!nombre || !rut || !direccion) {
      return res.status(400).json({ ok: false, error: "FALTAN_CAMPOS" });
    }
    if (!METODOS.has(metodoPago)) {
      return res.status(400).json({ ok: false, error: "METODO_INVALIDO" });
    }
    // (Convertimos un string vacío "" en un 'null' real para la BDD)
    const emailFinal = (email && String(email).trim()) ? String(email).trim() : null;

    const pool = await getPool();

    // Buscar teléfono en SOCIOS si no viene
    const telLookup = await pool.request()
      .input("rut", sql.VarChar(20), rut)
      .query(`
        SELECT TOP 1 Telefono
        FROM dbo.SOCIOS
        WHERE REPLACE(REPLACE(UPPER(RUT),'.',''),'-','') =
              REPLACE(REPLACE(UPPER(@rut),'.',''),'-','')
      `);
    const telefonoFinal = (telefono && String(telefono).trim()) || telLookup.recordset?.[0]?.Telefono || null;

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      // 1) Insert principal Pendiente (con TELEFONO)
      const req1 = new sql.Request(tx)
        .input("idSocio", sql.Int, idSocio)
        .input("idUser", sql.Int, idUsuarioSolicita)
        .input("nombre", sql.NVarChar(120), nombre)
        .input("rut", sql.VarChar(12), rut)
        .input("dir", sql.NVarChar(200), direccion)
        .input("email", sql.NVarChar(160), emailFinal)
        .input("tel", sql.VarChar(20), telefonoFinal)      // 👈 TELEFONO
        .input("metodo", sql.VarChar(20), metodoPago)
        .input("url", sql.NVarChar(400), comprobanteUrl)
        .input("notas", sql.NVarChar(500), notas)
        .input("estado", sql.VarChar(12), "Pendiente");

      const ins = await req1.query(`
        INSERT INTO dbo.CERTIFICADO_RESIDENCIA
          (ID_Socio, ID_Usuario_Solicita, Nombre, RUT, Direccion, Email, TELEFONO,
           Metodo_Pago, Comprobante_URL, Notas, Estado)
        OUTPUT inserted.ID_Cert, inserted.Folio, inserted.Estado, inserted.Fecha_Solicitud,
               inserted.Nombre, inserted.RUT, inserted.Direccion, inserted.Email,
               inserted.TELEFONO, inserted.Metodo_Pago, inserted.Comprobante_URL
        VALUES (@idSocio, @idUser, @nombre, @rut, @dir, @email, @tel,
                @metodo, @url, @notas, @estado);
      `);

      const row = ins.recordset[0];

      // 2) Historial inicial con snapshot (incluye TELEFONO)
      await new sql.Request(tx)
        .input("idc", sql.Int, row.ID_Cert)
        .input("estado", sql.VarChar(12), "Pendiente")
        .input("folio", sql.VarChar(20), row.Folio)
        .input("nom", sql.NVarChar(120), row.Nombre)
        .input("rut", sql.VarChar(12), row.RUT)
        .input("dir", sql.NVarChar(200), row.Direccion)
        .input("mail", sql.NVarChar(160), row.Email)
        .input("tel", sql.VarChar(20), row.TELEFONO)        // 👈 TELEFONO
        .input("met", sql.VarChar(20), row.Metodo_Pago)
        .input("url", sql.NVarChar(400), row.Comprobante_URL)
        .query(`
          INSERT INTO dbo.HISTORIAL_CERTIFICADO
            (ID_Cert, Estado, Folio, Nombre, RUT, Direccion, Email, TELEFONO, Metodo_Pago, Comprobante_URL)
          VALUES (@idc, @estado, @folio, @nom, @rut, @dir, @mail, @tel, @met, @url);
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
   PATCH /api/certificados/:id/estado
   ====================================================== */
export async function cambiarEstado(req, res) {
  const id = Number(req.params.id);
  const estadoCanon = normEstado(req.body?.estado);
  const comentario = req.body?.comentario ?? null;
  const validadorId = req.body?.validadorId ?? null;

  const generarPDFFlag = req.body?.generarPDF;
  const sendEmailFlag  = req.body?.sendEmail;

  if (!id) return res.status(400).json({ ok: false, error: "ID_INVALIDO" });
  if (!estadoCanon || !ESTADOS_CANON.has(estadoCanon)) {
    return res.status(400).json({ ok: false, error: "ESTADO_INVALIDO" });
  }

  try {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      // 1️⃣ Obtener datos actuales
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

      // 2️⃣ Actualizar historial (upsert de última fila) — incluye TELEFONO
      const existingHist = await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`SELECT TOP 1 ID_Hist FROM dbo.HISTORIAL_CERTIFICADO WHERE ID_Cert = @id;`);

      if (existingHist.recordset.length) {
        await new sql.Request(tx)
          .input("id", sql.Int, id)
          .input("estado", sql.VarChar(12), estadoCanon)
          .input("coment", sql.NVarChar(500), comentario)
          .input("val", sql.Int, validadorId)
          .input("nom", sql.NVarChar(120), cert.Nombre)
          .input("rut", sql.VarChar(12), cert.RUT)
          .input("dir", sql.NVarChar(200), cert.Direccion)
          .input("mail", sql.NVarChar(160), cert.Email)
          .input("tel", sql.VarChar(20), cert.TELEFONO)      // 👈 TELEFONO
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
                TELEFONO = @tel,
                Metodo_Pago = @met,
                Comprobante_URL = @url,
                Fecha_Cambio = SYSDATETIME()
            WHERE ID_Cert = @id;
          `);
      } else {
        await new sql.Request(tx)
          .input("id", sql.Int, id)
          .input("estado", sql.VarChar(12), estadoCanon)
          .input("folio", sql.VarChar(20), cert.Folio)
          .input("nom", sql.NVarChar(120), cert.Nombre)
          .input("rut", sql.VarChar(12), cert.RUT)
          .input("dir", sql.NVarChar(200), cert.Direccion)
          .input("mail", sql.NVarChar(160), cert.Email)
          .input("tel", sql.VarChar(20), cert.TELEFONO)      // 👈 TELEFONO
          .input("met", sql.VarChar(20), cert.Metodo_Pago)
          .input("url", sql.NVarChar(400), cert.Comprobante_URL)
          .input("coment", sql.NVarChar(500), comentario)
          .input("val", sql.Int, validadorId)
          .query(`
            INSERT INTO dbo.HISTORIAL_CERTIFICADO
              (ID_Cert, Estado, Folio, Nombre, RUT, Direccion, Email, TELEFONO, Metodo_Pago, Comprobante_URL, Comentario, Validador_FK)
            VALUES
              (@id, @estado, @folio, @nom, @rut, @dir, @mail, @tel, @met, @url, @coment, @val);
          `);
      }

      // 3️⃣ Eliminar de la tabla de pendientes
      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`DELETE FROM dbo.CERTIFICADO_RESIDENCIA WHERE ID_Cert = @id;`);

      await tx.commit();

      const folio = cert.Folio;
      const generarPDF = generarPDFFlag ?? (estadoCanon === "Aprobado");
      const sendEmail  = sendEmailFlag  ?? (estadoCanon === "Aprobado");

      let certificadoUrl = null;
      let emailSent = false;

      if (estadoCanon === "Aprobado" && generarPDF) {
        certificadoUrl = `/uploads/certificados/${folio}.pdf`; // placeholder
      }
      if (estadoCanon === "Aprobado" && sendEmail) {
        emailSent = true; // simula éxito
      }

      return res.json({
        ok: true,
        mensaje: "Estado actualizado correctamente",
        certificadoUrl,
        email: { sent: emailSent }
      });
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
export async function actualizarCertificado(req, res) {
  const { id } = req.params;
  const { nombre, rut, direccion, email, telefono, metodoPago } = req.body; // 👈 TELEFONO

  try {
    const pool = await getPool();
    await pool.request()
      .input("ID_Cert", sql.Int, Number(id))
      .input("Nombre", sql.NVarChar(120), nombre)
      .input("RUT", sql.VarChar(12), rut)
      .input("Direccion", sql.NVarChar(200), direccion)
      .input("Email", sql.NVarChar(160), email)
      .input("Telefono", sql.VarChar(20), telefono || null)  // 👈 TELEFONO
      .input("Metodo_Pago", sql.VarChar(20), metodoPago)
      .query(`
        UPDATE CERTIFICADO_RESIDENCIA
        SET Nombre=@Nombre, RUT=@RUT, Direccion=@Direccion,
            Email=@Email, TELEFONO=@Telefono, Metodo_Pago=@Metodo_Pago
        WHERE ID_Cert=@ID_Cert
      `);

    return res.json({ ok: true, data: { id: Number(id), nombre, rut, direccion, email, telefono, metodoPago } });
  } catch (e) {
    console.error("❌ Error actualizarCertificado:", e);
    res.status(500).json({ ok: false, error: "Error al actualizar certificado" });
  }
}

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
      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`DELETE FROM dbo.HISTORIAL_CERTIFICADO WHERE ID_Cert=@id;`);

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

/* ======================================================
   🗑️ ELIMINAR POR FOLIO
   DELETE /api/certificados/folio/:folio
   ====================================================== */
export async function eliminarPorFolio(req, res) {
  const folio = String(req.params.folio || "").trim();
  if (!folio) return res.status(400).json({ ok: false, error: "FOLIO_REQUERIDO" });

  try {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const cur = await new sql.Request(tx)
        .input("folio", sql.VarChar(20), folio)
        .query(`
          SELECT TOP 1 ID_Cert
          FROM dbo.CERTIFICADO_RESIDENCIA
          WHERE Folio = @folio;
        `);

      const idCert = cur.recordset?.[0]?.ID_Cert ?? null;

      const reqHist = new sql.Request(tx)
        .input("folio", sql.VarChar(20), folio);
      if (idCert) reqHist.input("id", sql.Int, idCert);
      const delHist = await reqHist.query(`
        DELETE FROM dbo.HISTORIAL_CERTIFICADO
        WHERE Folio = @folio
        ${idCert ? " OR ID_Cert = @id" : ""};
      `);

      const reqMain = new sql.Request(tx)
        .input("folio", sql.VarChar(20), folio);
      if (idCert) reqMain.input("id", sql.Int, idCert);
      const delMain = await reqMain.query(`
        DELETE FROM dbo.CERTIFICADO_RESIDENCIA
        WHERE Folio = @folio
        ${idCert ? " OR ID_Cert = @id" : ""};
      `);

      await tx.commit();

      const removedHist = delHist.rowsAffected?.reduce((a, b) => a + b, 0) || 0;
      const removedMain = delMain.rowsAffected?.reduce((a, b) => a + b, 0) || 0;

      return res.json({
        ok: true,
        data: { folio, idCert, removedHist, removedMain }
      });
    } catch (inner) {
      await tx.rollback();
      console.error("eliminarPorFolio.tx:", inner);
      return res.status(500).json({ ok: false, error: "DB_TX_ERROR" });
    }
  } catch (e) {
    console.error("eliminarPorFolio:", e);
    return res.status(500).json({ ok: false, error: "DB_ERROR_ELIMINAR_FOLIO" });
  }
}

/* ======================================================
   ✏️ ACTUALIZAR HISTORIAL por FOLIO (última versión)
   PATCH /api/certificados/_historial/:folio
   ====================================================== */
export async function actualizarHistorial(req, res) {
  const folio = String(req.params.folio || '').trim();
  if (!folio) return res.status(400).json({ ok: false, error: "FOLIO_REQUERIDO" });

  const {
    nombre, rut, direccion, email,
    telefono,                         // 👈 TELEFONO
    metodoPago, comprobanteUrl,
    comentario
  } = req.body || {};

  try {
    const pool = await getPool();

    const sets = [];
    const rq = pool.request().input("folio", sql.VarChar(20), folio);

    if (nombre !== undefined) { sets.push("Nombre = @nom"); rq.input("nom", sql.NVarChar(120), nombre); }
    if (rut !== undefined) { sets.push("RUT = @rut"); rq.input("rut", sql.VarChar(12), rut); }
    if (direccion !== undefined) { sets.push("Direccion = @dir"); rq.input("dir", sql.NVarChar(200), direccion); }
    if (email !== undefined) { sets.push("Email = @mail"); rq.input("mail", sql.NVarChar(160), email); }
    if (telefono !== undefined) { sets.push("TELEFONO = @tel"); rq.input("tel", sql.VarChar(20), telefono || null); } // 👈 TELEFONO
    if (metodoPago !== undefined) {
      const met = (String(metodoPago).toLowerCase() === "fisico") ? "Fisico" : "Transferencia";
      sets.push("Metodo_Pago = @met"); rq.input("met", sql.VarChar(20), met);
    }
    if (comprobanteUrl !== undefined) { sets.push("Comprobante_URL = @url"); rq.input("url", sql.NVarChar(400), comprobanteUrl); }
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

/* ======================================================
   ⬆️ SUBIR COMPROBANTE
   POST /api/certificados/:id/comprobante
   ====================================================== */
export async function subirComprobante(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "ID_INVALIDO" });

  const file = req.file;
  if (!file) return res.status(400).json({ ok: false, error: "FILE_REQUIRED" });

  const publicUrl = `/uploads/comprobantes/${file.filename}`;

  try {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const cur = await new sql.Request(tx)
        .input("id", sql.Int, id)
        .query(`
          SELECT TOP 1 * FROM dbo.CERTIFICADO_RESIDENCIA WHERE ID_Cert = @id;
        `);

      if (!cur.recordset.length) {
        await tx.rollback();
        return res.status(404).json({ ok: false, error: "CERT_NO_ENCONTRADO" });
      }

      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .input("url", sql.NVarChar(400), publicUrl)
        .query(`
          UPDATE dbo.CERTIFICADO_RESIDENCIA
          SET Comprobante_URL = @url
          WHERE ID_Cert = @id;
        `);

      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .input("url", sql.NVarChar(400), publicUrl)
        .query(`
          UPDATE h
             SET Comprobante_URL = @url,
                 Fecha_Cambio = SYSDATETIME()
          FROM dbo.HISTORIAL_CERTIFICADO h
          WHERE h.ID_Cert = @id
            AND h.ID_Hist = (
              SELECT TOP 1 ID_Hist
              FROM dbo.HISTORIAL_CERTIFICADO
              WHERE ID_Cert = @id
              ORDER BY Fecha_Cambio DESC, ID_Hist DESC
            );
        `);

      await tx.commit();
      return res.json({ ok: true, data: { id, comprobanteUrl: publicUrl } });
    } catch (inner) {
      await tx.rollback();
      console.error("subirComprobante.tx:", inner);
      return res.status(500).json({ ok: false, error: "DB_TX_ERROR" });
    }
  } catch (e) {
    console.error("subirComprobante:", e);
    return res.status(500).json({ ok: false, error: "DB_ERROR_UPLOAD" });
  }
}
