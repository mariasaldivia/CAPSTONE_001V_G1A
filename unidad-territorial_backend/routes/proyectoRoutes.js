// routes/proyectoRoutes.js
import express from "express";
import {
    obtenerProyectos,
    crearProyecto,
    actualizarProyecto,
    eliminarProyecto, 
} from "../controllers/proyectoController.js";

const router = express.Router();

// 🔹 GET /api/proyectos  → obtener todos los proyectos
router.get("/", obtenerProyectos);

// 🔹 POST /api/proyectos  → crear un nuevo proyecto
router.post("/", crearProyecto);

// 🔹 PUT /api/proyectos/:id  → actualizar proyecto (ej. estado o fechas)
router.put("/:id", actualizarProyecto);
router.delete("/:id", eliminarProyecto);

export default router;