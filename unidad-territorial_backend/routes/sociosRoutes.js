import { Router } from "express";
import { getSocios, aprobarSocio, rechazarSocio, obtenerDetallesSocio } from "../controllers/sociosController.js";

const router = Router();

// GET /api/socios
// Obtiene todos los socios (aprobados y pendientes)
router.get("/", getSocios);

// PATCH /api/socios/aprobar/:idSocio
// Aprueba un socio pendiente
router.patch("/aprobar/:idSocio", aprobarSocio);

// DELETE /api/socios/rechazar/:idSocio
// Rechaza (elimina) un socio pendiente
router.delete("/rechazar/:idSocio", rechazarSocio);

// RUTA PERFIL
router.get("/detalles/:idUsuario", obtenerDetallesSocio);

export default router;

