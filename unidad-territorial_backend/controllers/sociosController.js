import { getPool, sql } from "../pool.js";

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


 //Aprueba un postulante cambiando su estado a 'Activo'.

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


 //Rechaza (elimina) un postulante.

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

//Obtiene los detalles de un socio específico usando el ID_Usuario (de la sesión).
 
export const obtenerDetallesSocio = async (req, res) => {
  const { idUsuario } = req.params;

  if (!idUsuario) {
    return res.status(400).json({ ok: false, message: "No se proporcionó ID de usuario" });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
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

    if (result.recordset.length > 0) {
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
  
  const { Correo, Telefono, Calle, Numero_Casa } = req.body; 

  if (!idUsuario) {
    return res.status(400).json({ ok: false, message: "No se proporcionó ID de usuario" });
  }

  const pool = await getPool();
  const params = pool.request();
  let setClauses = [];

  params.input("idUsuario", sql.Int, idUsuario);

  if (Correo !== undefined) {
    setClauses.push("Correo = @Correo");
    params.input("Correo", sql.NVarChar(120), Correo);
  }

  if (Telefono !== undefined) {
    setClauses.push("Telefono = @Telefono");
    params.input("Telefono", sql.NVarChar(30), Telefono);
  }

  if (Calle !== undefined) {
    setClauses.push("Calle = @Calle");
    params.input("Calle", sql.NVarChar(120), Calle);
  }

  if (Numero_Casa !== undefined) {
    setClauses.push("Numero_Casa = @Numero_Casa");
    params.input("Numero_Casa", sql.NVarChar(20), Numero_Casa);
  }

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
export const buscarSocioPorIdentificador = async (req, res) => {
  const { correo, rut } = req.query;

  if (!correo && !rut) {
    return res.status(400).json({
      ok: false,
      message: "Debe enviar correo o rut para buscar al socio",
    });
  }

  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT 
        ID_Socio,
        ID_Usuario,
        RUT,
        Nombres,
        Apellidos,
        Correo,
        Telefono
      FROM dbo.SOCIOS
      WHERE `;

    if (correo) {
      query += `Correo = @value`;
      request.input("value", sql.NVarChar, correo);
    } else {
      query += `RUT = @value`;
      request.input("value", sql.NVarChar, rut);
    }

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró un socio con esos datos",
      });
    }

    return res.status(200).json({
      ok: true,
      socio: result.recordset[0],
    });
  } catch (error) {
    console.error("Error buscando socio:", error);
    res.status(500).json({
      ok: false,
      message: "Error interno en el servidor",
      error: error.message,
    });
  }
};