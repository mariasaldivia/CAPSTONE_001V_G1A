// routes/requerimientosRoutes.js
import { Router } from "express";
import * as R from "../controllers/requerimientosController.js";
import { uploadRequerimientos } from "../middleware/uploadRequerimientos.js";

const r = Router();

/* =======================
   GENERALES
   ======================= */
r.get("/", R.listarRequerimientos);
r.post("/", uploadRequerimientos.single("imagen"), R.crearRequerimiento);

/* =======================
   HISTORIAL
   ======================= */
r.get("/_historial/lista/all", R.listarHistorial);
r.patch("/_historial/:folio", R.actualizarHistorial);

/* =======================
   POR FOLIO
   ======================= */
r.get("/folio/:folio", R.obtenerPorFolio);
r.delete("/folio/:folio", R.eliminarPorFolio);

/* =======================
   POR ID
   ======================= */
r.get("/:id", R.obtenerRequerimiento);
r.patch("/:id", R.actualizarRequerimiento);
r.patch("/:id/estado", R.cambiarEstado);
r.post("/:id/adjunto", uploadRequerimientos.single("imagen"), R.subirAdjunto);
r.delete("/:id", R.eliminarRequerimiento);

export default r;
