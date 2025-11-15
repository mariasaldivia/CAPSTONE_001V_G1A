
import { sql, getPool } from "../pool.js";
// Utilidad para normalizar horas desde el frontend ("HH:mm" o vacío)
function normalizarHora(h) {
  if (!h) return null;
  const v = String(h).trim();
  if (!v) return null;
  // "HH:mm"
  if (/^\d{2}:\d{2}$/.test(v)) return `${v}:00`;
  // "HH:mm:ss"
  if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
  // cualquier otra cosa -> lo ignoramos
  return null;
}

// 📌 Crear un proyecto
export const crearProyecto = async (req, res) => {
  console.log("📥 Datos recibidos del frontend:", req.body);

  const {
    Nombre,
    Descripcion,
    Bases,
    FechaInicio,
    FechaFin,
    HoraInicio,
    HoraFin,
    TipoProyecto,
  } = req.body;

  try {
    // Validación básica
    if (!Nombre || !Descripcion || !FechaInicio || !FechaFin) {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios (Nombre, Descripción, Fechas)" });
    }

    const pool = await getPool();

    // 🔹 Normalizar horas (mantenemos NVARCHAR)
    const horaInicioValida = HoraInicio
      ? `${HoraInicio.length === 5 ? HoraInicio + ":00" : HoraInicio}`
      : null;

    const horaFinValida = HoraFin
      ? `${HoraFin.length === 5 ? HoraFin + ":00" : HoraFin}`
      : null;

    // 🔹 Determinar estado según fecha actual
    const fechaActual = new Date();
    const fechaFinProyecto = new Date(FechaFin);
    const estadoInicial =
      fechaFinProyecto < fechaActual ? "Finalizado" : "Abierto";

    console.log("⏱ Horas normalizadas:", {
      HoraInicio,
      HoraFin,
      horaInicioValida,
      horaFinValida,
    });

    const request = pool.request();
    request.input("Nombre", sql.NVarChar(120), Nombre);
    request.input("Descripcion", sql.NVarChar(500), Descripcion);
    request.input("Bases", sql.NVarChar(400), Bases || null);
    request.input("FechaInicio", sql.Date, FechaInicio);
    request.input("FechaFin", sql.Date, FechaFin);
    request.input("HoraInicio", sql.NVarChar(8), horaInicioValida);
    request.input("HoraFin", sql.NVarChar(8), horaFinValida);
    request.input("Estado", sql.NVarChar(20), estadoInicial);
    request.input("TipoProyecto", sql.NVarChar(30), TipoProyecto || "JJVV");

    await request.query(`
      INSERT INTO PROYECTO_VECINAL
      (Nombre, Descripcion, Bases, FechaInicio, FechaFin, HoraInicio, HoraFin, Estado, TipoProyecto)
    VALUES
      (@Nombre, @Descripcion, @Bases, @FechaInicio, @FechaFin, @HoraInicio, @HoraFin, @Estado, @TipoProyecto)
    `);

    console.log("✅ Proyecto creado correctamente");
    res.status(201).json({ message: "✅ Proyecto creado correctamente" });
  } catch (err) {
    console.error("❌ Error al crear proyecto:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📌 Obtener todos los proyectos
export const obtenerProyectos = async (req, res) => {
  try {
    const pool = await getPool();

    // 🔹 Actualizar estado automático
    await pool.request().query(`
      UPDATE PROYECTO_VECINAL
      SET Estado = 'Finalizado'
      WHERE FechaFin < GETDATE() AND Estado <> 'Finalizado';
    `);

    // 🔹 Obtener proyectos con total de interesados
    const result = await pool.request().query(`
      SELECT 
        P.ID_Proyecto,
        P.Nombre,
        P.Descripcion,
        P.Bases,
        P.FechaInicio,
        P.FechaFin,
        CONVERT(VARCHAR(8), P.HoraInicio, 108) AS HoraInicio,
        CONVERT(VARCHAR(8), P.HoraFin, 108) AS HoraFin,
        P.Estado,
        P.Fecha_Creacion,
        P.TipoProyecto,

        -- 🔹 Contador de interesados
        (SELECT COUNT(*) 
         FROM INTERES_PROYECTO I 
         WHERE I.ID_Proyecto = P.ID_Proyecto
        ) AS TotalInteres

      FROM PROYECTO_VECINAL P
      ORDER BY P.FechaInicio ASC;
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ Error al obtener proyectos:", err);
    res.status(500).json({ error: "Error al obtener proyectos" });
  }
};

// 📌 Actualizar proyecto (fecha, hora, estado o bases)
export const actualizarProyecto = async (req, res) => {
  const { id } = req.params;
  const { FechaInicio, FechaFin, HoraInicio, HoraFin, Estado, Bases } = req.body;

  try {
    const pool = await getPool();

    const horaInicioNorm = normalizarHora(HoraInicio);
    const horaFinNorm = normalizarHora(HoraFin);

    const request = pool.request()
      .input("ID_Proyecto", sql.Int, id)
      .input("FechaInicio", sql.Date, FechaInicio || null)
      .input("FechaFin", sql.Date, FechaFin || null)
      .input("HoraInicio", sql.NVarChar(8), horaInicioNorm)
      .input("HoraFin", sql.NVarChar(8), horaFinNorm)
      .input("Estado", sql.NVarChar(20), Estado || null)
      .input("Bases", sql.NVarChar(400), Bases || null);

    await request.query(`
      UPDATE PROYECTO_VECINAL
      SET 
        FechaInicio = ISNULL(@FechaInicio, FechaInicio),
        FechaFin = ISNULL(@FechaFin, FechaFin),
        HoraInicio = ISNULL(@HoraInicio, HoraInicio),
        HoraFin = ISNULL(@HoraFin, HoraFin),
        Estado = ISNULL(@Estado, Estado),
        Bases = ISNULL(@Bases, Bases)
      WHERE ID_Proyecto = @ID_Proyecto
    `);

    res.json({ message: "✅ Proyecto actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar proyecto:", err);
    res.status(500).json({ error: err.message });
  }
};
// 📌 Eliminar un proyecto
export const eliminarProyecto = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await getPool();

    // Verificar si existe el proyecto
    const check = await pool
      .request()
      .input("ID_Proyecto", sql.Int, id)
      .query("SELECT ID_Proyecto FROM PROYECTO_VECINAL WHERE ID_Proyecto = @ID_Proyecto");

    if (check.recordset.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    // ⚠️ Si hay postulaciones asociadas, no dejar eliminar (opcional)
    const dependencias = await pool
      .request()
      .input("ID_Proyecto", sql.Int, id)
      .query("SELECT COUNT(*) AS total FROM POSTULACION_PROYECTO WHERE ID_Proyecto = @ID_Proyecto");

    if (dependencias.recordset[0].total > 0) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un proyecto con postulaciones asociadas." });
    }

    // Eliminar el proyecto
    await pool
      .request()
      .input("ID_Proyecto", sql.Int, id)
      .query("DELETE FROM PROYECTO_VECINAL WHERE ID_Proyecto = @ID_Proyecto");

    res.json({ message: "✅ Proyecto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar proyecto:", err);
    res.status(500).json({ error: err.message });
  }
};