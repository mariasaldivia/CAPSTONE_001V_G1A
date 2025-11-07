import { getPool, sql } from "../pool.js";

/**
 * Obtiene todos los socios, separados en 'aprobados' y 'pendientes'.
 */
export const getSocios = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        ID_Socio, 
        ID_Usuario, 
        RUT, 
        Nombres, 
        Apellidos, 
        CONVERT(varchar, Fecha_Nacimiento, 23) as Fecha_Nacimiento, -- Formato YYYY-MM-DD
        Calle, 
        Numero_Casa, 
        Correo, 
        Telefono, 
        Fecha_Inscripcion,
        Estado_Inscripcion
      FROM dbo.SOCIOS
    `);

    const socios = result.recordset;

    const aprobados = socios.filter(s => s.Estado_Inscripcion === 'Aprobado');
    const pendientes = socios.filter(s => s.Estado_Inscripcion === 'Pendiente');
    const rechazados = socios.filter(s => s.Estado_Inscripcion === 'Rechazado');

    res.status(200).json({ ok: true, aprobados, pendientes, rechazados});

  } catch (error) {
    console.error("Error al obtener socios:", error);
    res.status(500).json({ ok: false, message: "Error al obtener socios", error: error.message });
  }
};

/**
 * Aprueba un postulante cambiando su estado a 'Activo'.
 */
export const aprobarSocio = async (req, res) => {
  const { idSocio } = req.params;
  try {
    const pool = await getPool();
    await pool.request()
      .input("idSocio", sql.Int, idSocio)
      .query(`
        UPDATE dbo.SOCIOS 
        SET Estado_Inscripcion = 'Aprobado' 
        WHERE ID_Socio = @idSocio
      `);
    
    res.status(200).json({ ok: true, message: "Socio aprobado exitosamente." });

  } catch (error) {
    console.error("Error al aprobar socio:", error);
    res.status(500).json({ ok: false, message: "Error al aprobar socio", error: error.message });
  }
};

/**
 * Rechaza (elimina) un postulante.
 * Esto eliminará al SOCIO, su ROL y su USUARIO.
 */
export const rechazarSocio = async (req, res) => {
  const { idSocio } = req.params;
  try {
    const pool = await getPool();
    await pool.request()
      .input("idSocio", sql.Int, idSocio)
      .query(`
        UPDATE dbo.SOCIOS 
        SET Estado_Inscripcion = 'Rechazado' 
        WHERE ID_Socio = @idSocio
      `);
    
    res.status(200).json({ ok: true, message: "El postulante fue rechazado." });

  } catch (error) {
    console.error("Error al rechazar socio:", error);
    res.status(500).json({ ok: false, message: "Error al rechazar socio", error: error.message });
  }
};

/** PARA DATOS DEL PERFIL
 *  Obtiene los detalles de un socio específico usando el ID_Usuario (de la sesión).
 */
export const obtenerDetallesSocio = async (req, res) => {
  // Obtenemos el ID_Usuario que viene de la URL (React nos lo enviará)
  const { idUsuario } = req.params;

  if (!idUsuario) {
    return res.status(400).json({ ok: false, message: "No se proporcionó ID de usuario" });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      // Pasamos el ID_Usuario como parámetro seguro
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        SELECT 
          ID_Socio, 
          ID_Usuario, 
          RUT, 
          Nombres, 
          Apellidos, 
          CONVERT(varchar, Fecha_Nacimiento, 23) as Fecha_Nacimiento,
          Calle, 
          Numero_Casa, 
          Correo, 
          Telefono, 
          Fecha_Inscripcion,
          Estado_Inscripcion
        FROM dbo.SOCIOS
        WHERE ID_Usuario = @idUsuario  
      `);

    // Verificamos si encontramos al socio
    if (result.recordset.length > 0) {
      // Devolvemos solo el primer registro (debería ser único)
      res.status(200).json({ ok: true, socio: result.recordset[0] });
    } else {
      res.status(404).json({ ok: false, message: "Socio no encontrado con ese ID de usuario" });
    }

  } catch (error) {
    console.error("Error al obtener detalles del socio:", error);
    res.status(500).json({ ok: false, message: "Error al obtener detalles del socio", error: error.message });
  }
};

export const actualizarContacto = async (req, res) => {
  const { idUsuario } = req.params;
  
  // 1. EXTRAEMOS LOS NUEVOS CAMPOS
  const { Correo, Telefono, Calle, Numero_Casa } = req.body; 

  if (!idUsuario) {
    return res.status(400).json({ ok: false, message: "No se proporcionó ID de usuario" });
  }

  const pool = await getPool();
  const params = pool.request();
  let setClauses = [];

  params.input("idUsuario", sql.Int, idUsuario);

  // Verificamos si el correo fue enviado
  if (Correo !== undefined) {
    setClauses.push("Correo = @Correo");
    params.input("Correo", sql.NVarChar(120), Correo);
  }

  // Verificamos si el teléfono fue enviado
  if (Telefono !== undefined) {
    setClauses.push("Telefono = @Telefono");
    params.input("Telefono", sql.NVarChar(30), Telefono);
  }

  // Verificamos si la calle fue enviada
  if (Calle !== undefined) {
    setClauses.push("Calle = @Calle");
    params.input("Calle", sql.NVarChar(120), Calle);
  }

  // Verificamos si el N° de casa fue enviado
  if (Numero_Casa !== undefined) {
    setClauses.push("Numero_Casa = @Numero_Casa");
    params.input("Numero_Casa", sql.NVarChar(20), Numero_Casa);
  }

  // Si no se envió nada válido, no hacemos nada
  if (setClauses.length === 0) {
    return res.status(400).json({ ok: false, message: "No se proporcionaron campos válidos para actualizar." });
  }

  try {
    const query = `
      UPDATE dbo.SOCIOS
      SET ${setClauses.join(", ")}
      WHERE ID_Usuario = @idUsuario;
    `;
    
    await params.query(query);
    
    // 4. DEVOLVEMOS LOS NUEVOS DATOS ACTUALIZADOS
    res.status(200).json({ 
      ok: true, 
      message: "Contacto actualizado exitosamente",
      datosActualizados: { Correo, Telefono, Calle, Numero_Casa } 
    });

  } catch (error) {
    console.error("Error al actualizar contacto:", error);
    res.status(500).json({ ok: false, message: "Error en el servidor", error: error.message });
  }
};