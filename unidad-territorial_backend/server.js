import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { getPool } from "./pool.js";         // <-- ahora el pool está en la raíz
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 4010;
const ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());

// Health básico (no toca DB)
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

// Health de DB (consulta real)
app.get("/health/db", async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rutas API
app.use("/api/auth", authRoutes);

// 404 SIEMPRE al final
app.use((_req, res) => res.status(404).json({ error: "❌ Ruta no encontrada" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
