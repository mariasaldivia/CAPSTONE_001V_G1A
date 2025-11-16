import { sql, getPool } from "../pool.js";

// Registrar interés de SOCIOS o vecinos
export const registrarInteres = async (req, res) => {
  // 1. Leer TODOS los campos posibles que el frontend envía en el body
  const {
    ID_Proyecto,
    ID_Socio,
    Nombre_Vecino,
    RUT_Vecino,
    Telefono_Vecino,
    Email_Vecino,
  } = req.body;

  // 2. Validación (corresponde a la regla 'CHK_Interes_Origen' de la BD)
  if (!ID_Proyecto) {
    return res.status(400).json({ error: "ID_Proyecto es obligatorio." });
  }
  // Si NO es un socio Y TAMPOCO es un vecino (con RUT), es un error.
  if (!ID_Socio && !RUT_Vecino) {
    return res
      .status(400)
      .json({ error: "Se requiere un ID de Socio o un RUT de Vecino." });
  }

  try {
    const pool = await getPool();
    //3. Query para insertar los datos
    const query = `
      INSERT INTO INTERES_PROYECTO (
        ID_Proyecto, 
        ID_Socio,
        Nombre_Vecino,
        RUT_Vecino,
        Telefono_Vecino,
        Email_Vecino,
        Fecha_Interes
      ) VALUES (
        @ID_Proyecto,
        @ID_Socio,
        @Nombre_Vecino,
        @RUT_Vecino,
        @Telefono_Vecino,
        @Email_Vecino,
        SYSDATETIME()
      )
    `;
    // 4. Entregar TODOS los valores. Los que sean 'undefined' se irán como 'null'.
    await pool
      .request()
      .input("ID_Proyecto", sql.Int, ID_Proyecto)
      .input("ID_Socio", sql.Int, ID_Socio || null) // Si ID_Socio es undefined, envía NULL
      .input("Nombre_Vecino", sql.NVarChar, Nombre_Vecino || null)
      .input("RUT_Vecino", sql.NVarChar, RUT_Vecino || null)
      .input("Telefono_Vecino", sql.NVarChar, Telefono_Vecino || null)
      .input("Email_Vecino", sql.NVarChar, Email_Vecino || null)
      .query(query);

    res.status(201).json({ message: "Interés registrado correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar interés:", err);
    // Manejo de error por si el RUT ya se registró (si tuvieras una regla UNIQUE)
    if (err.number === 2627 || err.number === 2601) {
      return res
        .status(409)
        .json({ error: "Este RUT o Socio ya registró interés en este proyecto." });
    }
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
          I.Fecha_Interes,
          
          -- Usamos COALESCE para mostrar el dato del Socio, y si es NULL, mostrar el del Vecino
          COALESCE(S.Nombres + ' ' + S.Apellidos, I.Nombre_Vecino) AS NombreCompleto,
          COALESCE(S.RUT, I.RUT_Vecino) AS RUT,
          COALESCE(S.Telefono, I.Telefono_Vecino) AS Telefono,
          COALESCE(S.Correo, I.Email_Vecino) AS Contacto,
          
          -- Creamos un campo 'Tipo' para que la directiva sepa si es Socio o Vecino
          CASE 
            WHEN I.ID_Socio IS NOT NULL THEN 'Socio'
            ELSE 'Vecino' 
          END AS TipoUsuario
          
        FROM INTERES_PROYECTO I
        LEFT JOIN SOCIOS S ON S.ID_Socio = I.ID_Socio -- LEFT JOIN es clave
        WHERE I.ID_Proyecto = @ID_Proyecto
        ORDER BY I.Fecha_Interes DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al obtener interesados:", err);
    res.status(500).json({ error: "Error al obtener interesados" });
  }
};