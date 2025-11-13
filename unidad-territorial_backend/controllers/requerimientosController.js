import { getPool, sql } from "../pool.js";
import path from "path";
/* ===========================
 * Helper: Genera la URL pública de un archivo
 * =========================== */
const publicUrlFor = (filePath) => {
  const base = (process.env.VITE_API_URL || "http://localhost:4010").replace(/\/+$/, "");
  // Asegúrate que la ruta pública coincida con tu 'uploadRequerimientos.js'
  const rel = `/uploads/requerimientos/${path.basename(filePath)}`;
  return `${base}${rel}`;
};

/* ===========================
 * 1. CREAR NUEVO REQUERIMIENTO (POST)
 * (Inserta en VECINAL y en BITACORA)
 * =========================== */
export const crearMensajeBuzon = async (req, res) => {
  const { 
    socioNombre, // -> Viene del frontend
    rut_socio,
    telefono, 
    tipo, 
    comentarios, 
    direccion 
  } = req.body;

  // 2. Leemos el archivo (si vino) desde req.file
  const imagenURL = req.file ? publicUrlFor(req.file.path) : null;

  // 3. Mapeamos los nombres del frontend a la BDD
  // (Tu frontend envía 'socioNombre', 'tipo', 'comentarios')
  const nombre = socioNombre;
  const rut = rut_socio;
  const asunto = tipo;
  const mensaje = comentarios || ""; // Asegurarnos que no sea null

  if (!nombre || !asunto || !mensaje) {
    return res.status(400).json({ ok: false, message: "Faltan campos obligatorios." });
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin(); // <-- Inicia Transacción

    // 1. Inserta en la tabla principal
    const reqBuzon = new sql.Request(tx);
    reqBuzon.input("NombreSocio", sql.NVarChar(120), nombre);
    reqBuzon.input("RUT", sql.VarChar(12), rut || null);
    reqBuzon.input("Telefono", sql.VarChar(30), telefono || null);
    reqBuzon.input("Asunto", sql.NVarChar(200), asunto);
    reqBuzon.input("Mensaje", sql.NVarChar(sql.MAX), mensaje);
    reqBuzon.input("Direccion", sql.NVarChar(255), direccion || null);
    reqBuzon.input("ImagenURL", sql.NVarChar(400), imagenURL || null);
    
    const resultBuzon = await reqBuzon.query(`
      INSERT INTO dbo.BUZON_VECINAL 
        (NombreSocio, RUT, Telefono, Asunto, Mensaje, Direccion, ImagenURL, Estado)
      OUTPUT inserted.ID_Buzon, inserted.Folio, inserted.FechaCreacion, inserted.Estado
      VALUES 
        (@NombreSocio, @RUT, @Telefono, @Asunto, @Mensaje, @Direccion, @ImagenURL, 'Pendiente');
    `);

    const nuevoTicket = resultBuzon.recordset[0];

    // 2. Inserta el primer registro en la Bitácora
    const reqBitacora = new sql.Request(tx);
    reqBitacora.input("ID_Buzon_FK", sql.Int, nuevoTicket.ID_Buzon);
    reqBitacora.input("ID_Usuario_FK", sql.Int, null); // Creado por el público
    reqBitacora.input("EstadoAnterior", sql.VarChar(20), null);
    reqBitacora.input("EstadoNuevo", sql.VarChar(20), nuevoTicket.Estado);
    reqBitacora.input("Comentario", sql.NVarChar(1000), "Requerimiento a aviso creado por vecino.");

    await reqBitacora.query(`
      INSERT INTO dbo.BUZON_BITACORA
        (ID_Buzon_FK, ID_Usuario_FK, EstadoAnterior, EstadoNuevo, Comentario)
      VALUES
        (@ID_Buzon_FK, @ID_Usuario_FK, @EstadoAnterior, @EstadoNuevo, @Comentario);
    `);

    await tx.commit(); // <-- Confirma Transacción
    res.status(201).json({ ok: true, data:{
      Folio: nuevoTicket.Folio,
      Adjunto_URL:imagenURL
    } });

  } catch (error) {
    await tx.rollback(); // <-- Deshace todo si falla
    console.error("Error al crear mensaje de buzón:", error);
    res.status(500).json({ ok: false, message: "Error al guardar el mensaje", error: error.message });
  }
};

/* ===========================
 * 2. LISTAR MENSAJES (GET)
 * (Lee de la tabla principal BUZON_VECINAL)
 * =========================== */
export const listarMensajesBuzon = async (req, res) => {
  const estado = req.query.estado || null; 
  try {
    const pool = await getPool();
    const request = pool.request();
    let query = "SELECT * FROM dbo.BUZON_VECINAL";
    const estadosValidos = ['Pendiente', 'En Revisión', 'Resuelto'];

    if (estado && estadosValidos.includes(estado)) {
      query += " WHERE Estado = @Estado";
      request.input("Estado", sql.VarChar(20), estado);
    }
    query += " ORDER BY FechaCreacion DESC";

    const result = await request.query(query);
    res.status(200).json({ ok: true, data: result.recordset });
  } catch (error) {
    console.error("Error al listar mensajes:", error);
    res.status(500).json({ ok: false, message: "Error al obtener los mensajes", error: error.message });
  }
};

/* ===========================
 * 3. CAMBIAR ESTADO (Función genérica para "En Revisión" o "Resuelto")
 * (Actualiza VECINAL e inserta en BITACORA)
 * =========================== */
export const cambiarEstadoBuzon = async (req, res) => {
  const { id } = req.params; // ID_Buzon
  const { estadoNuevo, respuestaAdmin, idAdmin } = req.body;

  // Validación
  const estadosValidos = ['En Revisión', 'Resuelto'];
  if (!estadosValidos.includes(estadoNuevo)) {
    return res.status(400).json({ ok: false, message: "Estado nuevo no válido." });
  }
  if (estadoNuevo === 'Resuelto' && !respuestaAdmin) {
    return res.status(400).json({ ok: false, message: "Se requiere un comentario para resolver el ticket." });
  }
  if (!idAdmin) {
    return res.status(400).json({ ok: false, message: "Se requiere un ID de administrador." });
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    // 1. Obtener el estado anterior
    const reqEstado = new sql.Request(tx);
    reqEstado.input("ID_Buzon", sql.Int, id);
    const estadoResult = await reqEstado.query("SELECT Estado FROM dbo.BUZON_VECINAL WHERE ID_Buzon = @ID_Buzon");
    
    if (estadoResult.recordset.length === 0) {
      throw new Error("Ticket no encontrado.");
    }
    const estadoAnterior = estadoResult.recordset[0].Estado;

    if (estadoAnterior === 'Resuelto') {
      throw new Error("El ticket ya está resuelto.");
    }

    // 2. Actualizar la tabla principal
    const reqUpdate = new sql.Request(tx);
    reqUpdate.input("ID_Buzon", sql.Int, id);
    reqUpdate.input("Estado", sql.VarChar(20), estadoNuevo);
    reqUpdate.input("RespuestaAdmin", sql.NVarChar(1000), respuestaAdmin || null);
    reqUpdate.input("ResueltoPor_ID", sql.Int, idAdmin);
    
    let queryUpdate = `
      UPDATE dbo.BUZON_VECINAL
      SET 
        Estado = @Estado,
        ResueltoPor_ID = @ResueltoPor_ID,
        RespuestaAdmin = COALESCE(@RespuestaAdmin, RespuestaAdmin)
    `;
    // Solo actualiza la fecha de resuelto si el estado es 'Resuelto'
    if (estadoNuevo === 'Resuelto') {
      queryUpdate += ", FechaResuelto = SYSDATETIME()";
    }
    queryUpdate += " WHERE ID_Buzon = @ID_Buzon";

    await reqUpdate.query(queryUpdate);

    // 3. Insertar en la Bitácora
    const reqBitacora = new sql.Request(tx);
    reqBitacora.input("ID_Buzon_FK", sql.Int, id);
    reqBitacora.input("ID_Usuario_FK", sql.Int, idAdmin);
    reqBitacora.input("EstadoAnterior", sql.VarChar(20), estadoAnterior);
    reqBitacora.input("EstadoNuevo", sql.VarChar(20), estadoNuevo);
    reqBitacora.input("Comentario", sql.NVarChar(1000), respuestaAdmin || `Cambiado a ${estadoNuevo}`);

    await reqBitacora.query(`
      INSERT INTO dbo.BUZON_BITACORA
        (ID_Buzon_FK, ID_Usuario_FK, EstadoAnterior, EstadoNuevo, Comentario)
      VALUES
        (@ID_Buzon_FK, @ID_Usuario_FK, @EstadoAnterior, @EstadoNuevo, @Comentario);
    `);

    await tx.commit();
    res.status(200).json({ ok: true, message: `Ticket actualizado a: ${estadoNuevo}` });

  } catch (error) {
    await tx.rollback();
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ ok: false, message: error.message || "Error al actualizar el estado" });
  }
};

/* ===========================
 * 4. OBTENER BITÁCORA DE UN TICKET (GET)
 * (¡Nueva! Para ver el historial de un solo ticket)
 * =========================== */
export const listarBitacoraPorBuzon = async (req, res) => {
  const { id } = req.params; // ID_Buzon

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("ID_Buzon_FK", sql.Int, id)
      .query(`
        SELECT B.*, U.Nombre_Usuario 
        FROM dbo.BUZON_BITACORA B
        LEFT JOIN dbo.USUARIO U ON B.ID_Usuario_FK = U.ID_Usuario
        WHERE B.ID_Buzon_FK = @ID_Buzon_FK
        ORDER BY B.FechaCambio ASC;
      `);
      
    res.status(200).json({ ok: true, data: result.recordset });
  } catch (error) {
    console.error("Error al listar bitácora:", error);
    res.status(500).json({ ok: false, message: "Error al obtener la bitácora", error: error.message });
  }
};