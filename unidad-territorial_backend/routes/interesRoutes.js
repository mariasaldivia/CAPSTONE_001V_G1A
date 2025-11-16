import express from "express";
import { registrarInteres, obtenerInteresados } from "../controllers/interesController.js";

const router = express.Router();

// Registrar interés
router.post("/", registrarInteres);

// Obtener interesados por proyecto
router.get("/:idProyecto", obtenerInteresados);

export default router;