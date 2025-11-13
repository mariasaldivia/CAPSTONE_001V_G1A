// routes/certificadosRoutes.js
import { Router } from "express";
import * as C from "../controllers/certificadosController.js";
import { uploadComprobantes } from "../middleware/uploadComprobantes.js"; // 👈 middleware de subida

const r = Router();

/* ======================================================
   📋 RUTAS CERTIFICADOS
   Ordenadas de más específicas a más generales
   ====================================================== */

// 🧾 Subir comprobante (imagen o PDF)
r.post("/:id/comprobante", uploadComprobantes.single("file"), C.subirComprobante);

// 🕓 Historial completo (pendientes + resueltas)
r.get("/_historial/lista/all", C.listarHistorial);

// ✏️ Editar la última versión de un folio en el historial
r.patch("/_historial/:folio", C.actualizarHistorial);

/* ======================================================
   🔹 RUTAS POR FOLIO — deben ir antes que las de ID
   ====================================================== */

// 🔍 Obtener certificado por folio
r.get("/folio/:folio", C.obtenerPorFolio);

// 🗑️ Eliminar certificado o historial por folio (clave para resolver tu problema)
r.delete("/folio/:folio", C.eliminarPorFolio);

/* ======================================================
   🔹 PDF — GENERAR / SERVIR (preview o download)
   ====================================================== */
   
r.get("/:valor/pdf", C.servirCertificadoPDF);


/* ======================================================
   🔹 RUTAS POR ID (deben ir después de las de folio)
   ====================================================== */

// 🔄 Cambiar estado de un certificado
r.patch("/:id/estado", C.cambiarEstado);

// ✏️ Actualizar certificado (tabla principal)
r.patch("/:id", C.actualizarCertificado);

// 📘 Obtener certificado por ID
r.get("/:id", C.obtenerCertificado);

// 🗑️ Eliminar por ID
r.delete("/:id", C.eliminarCertificado);

/* ======================================================
   🔹 RUTAS GENERALES (al final)
   ====================================================== */

// 📜 Listar certificados (por estado) — ej: ?estado=Pendiente
r.get("/", C.listarCertificados);

// ➕ Crear certificado (socio web o ingreso manual)
r.post("/", C.crearCertificado);

export default r;
