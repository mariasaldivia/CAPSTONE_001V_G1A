import jwt from 'jsonwebtoken';
import { getPool, sql } from '../pool.js';

/**
 * 🚀 Middleware "protect"
 * Revisa si el token es válido y si el usuario existe.
 */
export const protect = async (req, res, next) => {
  let token;

  // Revisa si el token viene en el header 'Authorization'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Obtener el token (ej: "Bearer eyJhbG...")
      token = req.headers.authorization.split(' ')[1];

      // 2. Verificar el token con tu Clave Secreta
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 3. Buscar al usuario en la BD para adjuntarlo al 'req'
      // Esto es crucial para saber QUIÉN está haciendo la petición
      const pool = await getPool();
      const result = await pool.request()
        .input('ID_Usuario', sql.Int, decoded.sub) // 'sub' es el ID de usuario del token
        .query(`
          SELECT 
            u.ID_Usuario, 
            u.Nombre_Usuario, 
            u.Tipo_Usuario, 
            d.Cargo
          FROM USUARIO u
          -- Unimos con DIRECTIVA para saber su cargo (ej: 'Tesorera')
          LEFT JOIN DIRECTIVA d ON u.ID_Usuario = d.ID_Usuario AND d.Activo = 1
          WHERE u.ID_Usuario = @ID_Usuario
        `);

      if (result.recordset.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      // 4. ¡Éxito! Adjuntamos el usuario al 'req' para usarlo después
      // (Lo usaremos en 'crearMovimiento' y en 'isTesorera')
      req.user = result.recordset[0];
        // 👀 AGREGA ESTO:
   //     console.log("🔍 USUARIO DESDE BD:", {
     //   id: req.user.ID_Usuario,
      //  tipo: req.user.Tipo_Usuario,
      //  cargo: req.user.Cargo
       // });
            
      next(); // Pasa al siguiente middleware (ej: 'isTesorera')

    } catch (error) {
      console.error(error);
      res.status(401).json({ error: 'Token no válido o expirado' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'No autorizado, no hay token' });
  }
};


/**
 * 🚀 Middleware "isTesorera"
 * Revisa si el usuario (que ya pasó por 'protect') tiene el rol correcto.
 */
export const isTesorera = (req, res, next) => {
  // 'req.user' fue adjuntado por el middleware 'protect'
  const tipo = req.user.Tipo_Usuario; // Ej: 'ADMIN'
  const cargo = req.user.Cargo;      // Ej: 'Tesorera'

  // Si es el Admin general O si su cargo es 'Tesorera', tiene permiso
  if (tipo === 'DIRECTIVA' || cargo === 'Directiva') {
    next(); // ¡Permiso concedido! Pasa al controlador final.
  } else {
    res.status(403).json({ error: 'Acción permitida solo para Tesorería o Admin' });
  }
};