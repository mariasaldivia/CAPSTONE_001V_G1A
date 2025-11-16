import { sql, getPool } from '../pool.js';

/**
 * 🚀 POST /api/finanzas
 * Crea un nuevo movimiento (Ingreso o Egreso)
 */
export const crearMovimiento = async (req, res) => {
  // 1. Obtenemos los datos del formulario (frontend)
  const { Tipo, Monto, Descripcion, Categoria, ID_Socio_FK } = req.body;
  
  // 2. Obtenemos el ID del admin/tesorera que está registrando esto.
  // 👇 ¡IMPORTANTE! Esto debe venir de tu middleware de seguridad (del token).
  // Por ahora, para probar, pondremos '1' (o un ID de usuario admin que exista)
  const ID_Dire_FK = req.user?.ID_Usuario || 1; // 👈 CAMBIA ESTO O USA EL MIDDLEWARE

  // Validación simple
  if (!Tipo || !Monto || !Descripcion || !Categoria) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('Tipo', sql.NVarChar(10), Tipo)
      .input('Monto', sql.Decimal(10, 2), Monto)
      .input('Descripcion', sql.NVarChar(255), Descripcion)
      .input('Categoria', sql.NVarChar(50), Categoria)
      .input('ID_Socio_FK', sql.Int, ID_Socio_FK || null)
      .input('ID_Dire_FK', sql.Int, ID_Dire_FK)
      .query(`
        INSERT INTO MOVIMIENTOS (Tipo, Monto, Descripcion, Categoria, ID_Socio_FK, ID_Dire_FK)
        VALUES (@Tipo, @Monto, @Descripcion, @Categoria, @ID_Socio_FK, @ID_Dire_FK)
      `);
    
    res.status(201).json({ message: 'Movimiento registrado con éxito' });

  } catch (err) {
    console.error('Error al crear movimiento:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * 🚀 GET /api/finanzas/dashboard
 * Devuelve los totales (Saldo, Ingresos, Egresos)
 */
export const obtenerDashboard = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT 
          -- 1. Saldo Neto (Ingresos - Egresos)
          ISNULL(SUM(CASE WHEN Tipo = 'Ingreso' THEN Monto ELSE -Monto END), 0) AS SaldoNeto,
          
          -- 2. Total de Ingresos (todo lo que entró)
          ISNULL(SUM(CASE WHEN Tipo = 'Ingreso' THEN Monto ELSE 0 END), 0) AS TotalIngresos,
          
          -- 3. Total de Egresos (todo lo que salió)
          ISNULL(SUM(CASE WHEN Tipo = 'Egreso' THEN Monto ELSE 0 END), 0) AS TotalEgresos
          
        FROM MOVIMIENTOS
      `);

    // El resultado es un array con un solo objeto: [ { SaldoNeto: 0, ... } ]
    res.json(result.recordset[0]); 

  } catch (err) {
    console.error('Error al obtener dashboard:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * 🚀 GET /api/finanzas
 * Devuelve una lista de los últimos 50 movimientos
 */
export const obtenerMovimientos = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT TOP 50
          M.ID_Movimiento,
          M.Tipo,
          M.Monto,
          M.Descripcion,
          M.Categoria,
          M.Fecha,
          U.Nombre_Usuario AS RegistradoPor, -- El admin que lo registró
          S.Nombres AS Socio -- El socio que pagó (si aplica)
        FROM MOVIMIENTOS M
        JOIN USUARIO U ON M.ID_Dire_FK = U.ID_Usuario
        LEFT JOIN SOCIOS S ON M.ID_Socio_FK = S.ID_Socio
        ORDER BY M.Fecha DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error('Error al obtener movimientos:', err);
    res.status(500).json({ error: err.message });
  }
};