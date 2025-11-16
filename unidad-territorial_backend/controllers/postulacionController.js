import { sql, getPool } from "../pool.js";

// 📌 Crear una postulación
export const crearPostulacion = async (req, res) => {
  const { ID_Socio, ID_Proyecto, Comentario } = req.body;

  try {
    const pool = await getPool();

    await pool.request()
      .input("ID_Socio", sql.Int, ID_Socio)
      .input("ID_Proyecto", sql.Int, ID_Proyecto)
      .input("Comentario", sql.NVarChar(500), Comentario || "")
      .input("Estado", sql.NVarChar(20), "Pendiente")
      .query(`
        INSERT INTO POSTULACION_PROYECTO (ID_Socio, ID_Proyecto, Comentario, Estado, Fecha_Postulacion)
        VALUES (@ID_Socio, @ID_Proyecto, @Comentario, @Estado, SYSDATETIME())
      `);

    res.status(201).json({ message: "✅ Postulación registrada correctamente" });
  } catch (err) {
    console.error("❌ Error al crear postulación:", err);
    res.status(500).json({ error: "Error al crear postulación" });
  }
};

// 📌 Obtener todas las postulaciones de un proyecto
export const obtenerPostulacionesPorProyecto = async (req, res) => {
  const { idProyecto } = req.params;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("ID_Proyecto", sql.Int, idProyecto)
      .query(`
        SELECT 
          p.ID_Postulacion,
          p.ID_Proyecto,
          p.ID_Socio,
          p.Comentario,
          p.Estado,
          p.Fecha_Postulacion,
          s.Nombres,
          s.Apellidos,
          s.Correo,
          s.Telefono,
          s.Rut
        FROM POSTULACION_PROYECTO p
        INNER JOIN SOCIOS s ON s.ID_Socio = p.ID_Socio
        WHERE p.ID_Proyecto = @ID_Proyecto
        ORDER BY p.Fecha_Postulacion DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al obtener postulaciones:", err);
    res.status(500).json({ error: "Error al obtener postulaciones" });
  }
};
// ✅ Actualizar estado de una postulación
// 📌 Actualizar estado de una postulación
export const actualizarEstadoPostulacion = async (req, res) => {
  const idPostulacion = req.params.id;  // ← FIX AQUÍ
  const { Estado } = req.body;

  console.log("📥 Datos recibidos:", { idPostulacion, Estado });

  try {
    if (!idPostulacion) {
      return res.status(400).json({ error: "Falta el ID de la postulación" });
    }

    if (!Estado || typeof Estado !== "string" || Estado.trim() === "") {
      return res.status(400).json({ error: "El campo Estado es obligatorio" });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("ID_Postulacion", sql.Int, idPostulacion)
      .input("Estado", sql.NVarChar(20), Estado)
      .query(`
        UPDATE dbo.POSTULACION_PROYECTO
        SET Estado = @Estado
        WHERE ID_Postulacion = @ID_Postulacion
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    res.json({ message: "✅ Estado actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar postulación:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 📌 Rechazar todas las postulaciones de un proyecto y eliminarlas
export const rechazarPostulaciones = async (req, res) => {
  const { idProyecto } = req.params;
  

  try {
    const pool = await getPool();

    // Verificar si el proyecto existe
    const check = await pool
      .request()
      .input("ID_Proyecto", sql.Int, idProyecto)
      .query("SELECT 1 FROM dbo.PROYECTO_VECINAL WHERE ID_Proyecto = @ID_Proyecto");

    if (check.recordset.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    // Actualizar estado de las postulaciones a "Rechazada"
    await pool
      .request()
      .input("ID_Proyecto", sql.Int, idProyecto)
      .query(`
        UPDATE dbo.POSTULACION_PROYECTO
        SET Estado = 'Rechazada'
        WHERE ID_Proyecto = @ID_Proyecto
      `);

    // Eliminar postulaciones rechazadas
    await pool
      .request()
      .input("ID_Proyecto", sql.Int, idProyecto)
      .query(`
        DELETE FROM dbo.POSTULACION_PROYECTO
        WHERE ID_Proyecto = @ID_Proyecto AND Estado = 'Rechazada'
      `);

    res.json({ message: "✅ Postulaciones rechazadas y eliminadas correctamente" });
  } catch (err) {
    console.error("❌ Error al rechazar postulaciones:", err);
    res.status(500).json({ error: err.message });
  }
};