import { Router } from 'express';
import {
  crearMovimiento,
  obtenerMovimientos,
  obtenerDashboard,
} from '../controllers/finanzasController.js';

// 💡 ¡IMPORTANTE! Aquí debes importar tu middleware de seguridad
// Este 'protect' revisa el token JWT
// Y 'isTesorera' revisa si el rol es 'Tesorera' o 'Admin'
// import { protect, isTesorera } from '../middleware/authMiddleware.js';

const router = Router();

// --- RUTAS PROTEGIDAS (Solo Tesorería/Admin) ---

// POST /api/finanzas/
// Crea un movimiento (ya sea Ingreso o Egreso)
// router.post('/', protect, isTesorera, crearMovimiento); // <-- Así se verá con seguridad
router.post('/', crearMovimiento); // <-- Por ahora lo dejamos sin seguridad para probar

// GET /api/finanzas/dashboard
// Obtiene los totales (Saldo Neto, Ingresos, Egresos)
// router.get('/dashboard', protect, isTesorera, obtenerDashboard);
router.get('/dashboard', obtenerDashboard);

// GET /api/finanzas/
// Obtiene la lista de los últimos movimientos
// router.get('/', protect, isTesorera, obtenerMovimientos);
router.get('/', obtenerMovimientos);


export default router;