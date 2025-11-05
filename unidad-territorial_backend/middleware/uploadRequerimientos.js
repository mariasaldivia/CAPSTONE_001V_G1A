// middleware/uploadRequerimientos.js
import multer from "multer";
import path from "path";
import fs from "fs";

const UP_DIR = path.resolve("uploads/requerimientos");
fs.mkdirSync(UP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path.basename((file.originalname || "adjunto").replace(/\s+/g, "_"), ext);
    const name = `${Date.now()}_${base}${ext}`;
    cb(null, name);
  },
});

export const uploadRequerimientos = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    // Solo imágenes
    if (!file.mimetype.startsWith("image/")) return cb(new Error("SOLO_IMAGENES"));
    cb(null, true);
  },
});
