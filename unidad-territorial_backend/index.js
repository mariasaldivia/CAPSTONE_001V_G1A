import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pool from "./db/pool.js";  // tu pool de PostgreSQL

import express from "express";
import cors from "cors";

const app = express();

// Permitir CORS completo para desarrollo
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Manejar preflight globalmente
app.options("*", cors());

app.use(express.json());


// Endpoint mínimo para probar que el servidor corre
app.get("/", (req, res) => {
  res.send("Backend funcionando!");
});

app.post("/api/login", (req, res) => {
  console.log("Login recibido:", req.body);
  res.json({ username: "test", roles: ["SOCIO"] });
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

