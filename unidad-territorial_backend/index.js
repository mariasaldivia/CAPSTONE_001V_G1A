import express from "express";
import dotenv from "dotenv";
import pool from "./db/pool.js";  // tu pool de PostgreSQL

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Endpoint mínimo para probar que el servidor corre
app.get("/", (req, res) => {
  res.send("Backend funcionando!");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

