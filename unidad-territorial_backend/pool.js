// unidad-territorial_backend/pool.js
import dotenv from "dotenv";
dotenv.config(); // 👈 Asegura que .env esté cargado ANTES de leer process.env

import sql from "mssql";

const sqlConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  server: process.env.SQL_HOST,       // 127.0.0.1
  port: Number(process.env.SQL_PORT), // 1433
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise = null;

export async function getPool() {
  if (!poolPromise) {
    console.log("🔌 MSSQL conectar →",
      `${sqlConfig.server}:${sqlConfig.port} db=${sqlConfig.database} user=${sqlConfig.user}`
    );

    poolPromise = sql.connect(sqlConfig)
      .then(pool => {
        console.log("✅ MSSQL pool conectado");
        return pool;
      })
      .catch(err => {
        console.error("❌ Error MSSQL:", err?.message || err);
        poolPromise = null;     // permitir reintentar en la próxima llamada
        throw err;
      });
  }
  return poolPromise;
}

export { sql };
