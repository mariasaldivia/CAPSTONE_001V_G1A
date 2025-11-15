import { sql, getPool } from "../pool.js";

// Registrar interés
export const registrarInteres = async (req, res) => {
  const { idProyecto } = req.params;
  const { idSocio } = req.body; // puede venir null

  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("ID_Proyecto", sql.Int, idProyecto);

    if (idSocio) {
      request.input("ID_Socio", sql.Int, idSocio);
    } else {
      request.input("ID_Socio", sql.Int, null); // 🔹 IMPORTANTE
    }

    await request.query(`
      INSERT INTO INTERES_PROYECTO (ID_Socio, ID_Proyecto)
      VALUES (@ID_Socio, @ID_Proyecto);
    `);

    res.status(201).json({ message: "Interés registrado correctamente" });

  } catch (err) {
    console.error("❌ Error al registrar interés:", err);
    res.status(500).json({ error: "Error al registrar interés" });
  }
};


// Obtener interesados por proyecto (para la directiva)
export const obtenerInteresados = async (req, res) => {
  const { idProyecto } = req.params;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("ID_Proyecto", sql.Int, idProyecto)
      .query(`
        SELECT 
          I.ID_Interes,
          S.Nombres,
          S.Apellidos,
          I.Fecha_Interes
        FROM INTERES_PROYECTO I
        LEFT JOIN SOCIOS S ON S.ID_Socio = I.ID_Socio  -- 🔹 Permite NULL
        WHERE I.ID_Proyecto = @ID_Proyecto
        ORDER BY I.Fecha_Interes DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al obtener interesados:", err);
    res.status(500).json({ error: "Error al obtener interesados" });
  }
};