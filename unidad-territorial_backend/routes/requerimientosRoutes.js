import { Router } from "express";
import { 
  crearMensajeBuzon, 
  listarMensajesBuzon,
  cambiarEstadoBuzon,
  listarBitacoraPorBuzon 
} from "../controllers/requerimientosController.js";

// 1. AÑADE LA 'S' AQUÍ (en el import)
import { uploadRequerimientos } from "../middleware/uploadRequerimientos.js";

// (Tus imports de auth...)

const router = Router(); 

// --- Ruta Pública ---
// 2. AÑADE LA 'S' AQUÍ (en el uso)
router.post("/", uploadRequerimientos.single("imagen"), crearMensajeBuzon);


// --- Rutas de Admin/Directiva ---
router.get("/", listarMensajesBuzon);
router.get("/:id/bitacora", listarBitacoraPorBuzon);
router.patch("/:id/estado", cambiarEstadoBuzon);

export default router;