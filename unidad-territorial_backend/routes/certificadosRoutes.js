import { Router } from "express";
import * as C from "../controllers/certificadosController.js";

const r = Router();

/* ======================================================
   📋 RUTAS CERTIFICADOS
   Ordenadas de más específicas a más generales
   ====================================================== */

// 🕓 Historial completo (pendientes + resueltas)
r.get("/_historial/lista/all", C.listarHistorial);

// ✏️ NUEVO: editar la última versión de un folio en el historial
r.patch("/_historial/:folio", C.actualizarHistorial);

// 🔍 Obtener certificado por Folio (para botón "Ver" en historial)
r.get("/folio/:folio", C.obtenerPorFolio);

// ✏️ Editar certificado (para botón "Editar" en historial)
r.patch("/:id", C.actualizarCertificado);

// 🗑️ Eliminar certificado (para botón "Eliminar" en historial)
r.delete("/:id", C.eliminarCertificado);

// 📜 Listar certificados (por estado) — ej: ?estado=Pendiente
r.get("/", C.listarCertificados);

// ➕ Crear certificado (socio web o ingreso manual)
r.post("/", C.crearCertificado);

// 🔄 Cambiar estado (Aprobado, Rechazado, etc.)
r.patch("/:id/estado", C.cambiarEstado);

// 📘 Obtener certificado por ID (detalles)
r.get("/:id", C.obtenerCertificado);

export default r;
