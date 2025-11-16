// ================================
// 🌐 Configuración básica
// ================================
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { getPool } from "./pool.js";

// ================================
// 🧩 Rutas
// ================================
import authRoutes from "./routes/authRoutes.js";
import certificadosRoutes from "./routes/certificadosRoutes.js";
import sociosRoutes from "./routes/sociosRoutes.js"; // <-- Se importa la ruta de socios
import noticiasRoutes from "./routes/noticiasRoutes.js";
import requerimientosRoutes from "./routes/requerimientosRoutes.js"; //
import proyectoRoutes from "./routes/proyectoRoutes.js";
import postulacionRoutes from "./routes/postulacionRoutes.js";
import interesRoutes from "./routes/interesRoutes.js";
import finanzasRoutes from './routes/finanzasRoutes.js';

// ================================
// 🚀 Inicialización de servidor
// ================================
const app = express();
const PORT = process.env.PORT || 4010;
const ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:5173";

// ================================
// 🧰 Middlewares globales
// ================================
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.resolve("uploads")));

// ================================
// 🩺 Health Checks
// ================================
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

app.get("/health/db", async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ================================
// 📦 Rutas API
// ================================
app.use("/api/auth", authRoutes);
app.use("/api/certificados", certificadosRoutes);
app.use("/api/socios", sociosRoutes); // <-- Se usa la ruta de socios
app.use("/api/noticias", noticiasRoutes);
app.use("/api/requerimientos", requerimientosRoutes); 
app.use("/api/proyectos", proyectoRoutes);
app.use("/api/postulaciones", postulacionRoutes);
app.use("/api/interes", interesRoutes);
app.use('/api/finanzas', finanzasRoutes);


// ================================
// ⚠️ Manejo de rutas no encontradas
// ================================
app.use((_req, res) => res.status(404).json({ error: "❌ Ruta no encontrada" }));

// ================================
// 🚀 Inicio del servidor
// ================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
