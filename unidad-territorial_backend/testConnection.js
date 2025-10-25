import dotenv from "dotenv";
dotenv.config();
import sql from "mssql";

const cfg = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_HOST,       // 127.0.0.1
  port: Number(process.env.SQL_PORT), // 1433
  database: process.env.SQL_DATABASE, // unidad_territorial
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: { max: 1, min: 0, idleTimeoutMillis: 10000 }
};

console.log("🔧 Probar conexión con config:", {
  user: cfg.user,
  password: cfg.password ? "********" : "(vacío)",
  server: cfg.server,
  port: cfg.port,
  database: cfg.database
});

try {
  const pool = await sql.connect(cfg);
  console.log("✅ Conectado. Probando SELECT 1…");
  const r = await pool.request().query("SELECT 1 AS ok, DB_NAME() AS db, SUSER_SNAME() AS login");
  console.log("Resultado:", r.recordset);
  process.exit(0);
} catch (err) {
  console.error("❌ Falló la conexión:");
  console.error("  message:", err.message);
  console.error("  code:", err.code);
  console.error("  name:", err.name);
  console.error("  number:", err.number);
  console.error("  original:", err.originalError?.message || err.originalError);
  process.exit(1);
}
