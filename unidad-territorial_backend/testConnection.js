// testConnection.js
import pool from "./db/pool.js";

async function testConnection(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query("SELECT NOW()");
      console.log("Conexión exitosa:", result.rows[0]);
      return;
    } catch (err) {
      console.log("DB no lista, reintentando en 3s...");
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error("No se pudo conectar a la DB después de varios intentos");
}

testConnection();

