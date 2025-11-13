import express from "express";
import {
  crearPostulacion,
  obtenerPostulacionesPorProyecto,
  actualizarEstadoPostulacion,
  rechazarPostulaciones,
} from "../controllers/postulacionController.js";

const router = express.Router();

// 🔹 POST /api/postulaciones → registrar una nueva postulación
router.post("/", crearPostulacion);

// 🔹 GET /api/postulaciones/:idProyecto → obtener postulaciones por proyecto
router.get("/:idProyecto", obtenerPostulacionesPorProyecto);

router.put("/:id", actualizarEstadoPostulacion);
router.delete("/rechazar/:idProyecto", rechazarPostulaciones);
export default router;