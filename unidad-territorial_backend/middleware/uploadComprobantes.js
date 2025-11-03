// middleware/uploadComprobantes.js
import multer from "multer";
import fs from "fs";
import path from "path";

const UP_DIR = path.resolve("uploads", "comprobantes");

// Asegura carpeta
fs.mkdirSync(UP_DIR, { recursive: true });

// Storage y nombre de archivo
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UP_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    // limpia nombre original
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});

// Filtro de tipos
function fileFilter(_req, file, cb) {
  const ok =
    file.mimetype === "application/pdf" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png";
  cb(ok ? null : new Error("TIPO_NO_PERMITIDO"), ok);
}

// 5 MB máx
const limits = { fileSize: 5 * 1024 * 1024 };

// 👉 Este es el objeto que necesitas exportar
const uploadComprobantes = multer({ storage, fileFilter, limits });

// Export nombrado (lo que usas en el import del router)
export { uploadComprobantes };

// (Opcional) export default por si alguna vez lo importas por default
export default uploadComprobantes;
