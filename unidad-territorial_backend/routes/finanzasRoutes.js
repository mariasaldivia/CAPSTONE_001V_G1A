import { Router } from 'express';
import {
  crearMovimiento,
  obtenerMovimientos,
  obtenerDashboard,
} from '../controllers/finanzasController.js';

// 1. Importa tus "porteros" de seguridad
// (Asegúrate que la ruta a tu middleware sea correcta)
import { protect, isTesorera } from '../middleware/authMiddleware.js';

const router = Router();

/*
 * Todas estas rutas están protegidas. El usuario debe:
 * 1. Estar logueado (función 'protect')
 * 2. Tener el Cargo 'Tesorera' o Rol 'ADMIN' (función 'isTesorera')
 */

// POST /api/finanzas
// Crea un movimiento (ya sea Ingreso o Egreso)
router.post('/', protect, isTesorera, crearMovimiento);

// GET /api/finanzas/dashboard
// Obtiene los totales (Saldo Neto, Ingresos, Egresos)
router.get('/dashboard', protect, isTesorera, obtenerDashboard);

// GET /api/finanzas/
// Obtiene la lista de los últimos movimientos
router.get('/', protect, isTesorera, obtenerMovimientos);


export default router;