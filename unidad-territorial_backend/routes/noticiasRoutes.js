// backend/routes/noticiasRoutes.js
import { Router } from "express";
import { getPool, sql } from "../pool.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const UP_DIR = path.resolve("uploads", "noticias");
fs.mkdirSync(UP_DIR, { recursive: true });

const PUBLIC_BASE = process.env.PUBLIC_BASE || `http://localhost:${process.env.PORT || 4010}`;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UP_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({ storage });

const fileUrl = (file) => (file ? `${PUBLIC_BASE}/uploads/noticias/${file.filename}` : null);

// Helpers para extraer archivos sin repetir
function groupByField(files = []) {
  const map = {};
  for (const f of files) {
    if (!map[f.fieldname]) map[f.fieldname] = [];
    map[f.fieldname].push(f);
  }
  return map;
}

function pickMainFile(groups) {
  // prioridad por nombres más comunes
  return (
    (groups["mainImage"] && groups["mainImage"][0]) ||
    (groups["imagen_principal"] && groups["imagen_principal"][0]) ||
    (groups["file"] && groups["file"][0]) ||
    null
  );
}

function pickSecondaryPair(groups) {
  // 1) explícitos por campo
  const s1 =
    (groups["secondary1"] && groups["secondary1"][0]) ||
    (groups["imagen_sec_1"] && groups["imagen_sec_1"][0]) ||
    null;

  const s2 =
    (groups["secondary2"] && groups["secondary2"][0]) ||
    (groups["imagen_sec_2"] && groups["imagen_sec_2"][0]) ||
    null;

  // 2) si llega arreglo "imagenes[]", usar posiciones 0 y 1
  const arr = groups["imagenes[]"] || [];
  const arr0 = arr[0] || null;
  const arr1 = arr[1] || null;

  // Reglas:
  // - Si ya tengo s1/s2 explícitos, los respeto.
  // - Si faltan, completo desde imagenes[] por índice (0 -> sec_1, 1 -> sec_2).
  const sec1 = s1 || arr0 || null;
  let sec2 = s2 || arr1 || null;

  // Evitar duplicar misma imagen por accidente (mismo filename)
  if (sec1 && sec2 && sec1.filename === sec2.filename) {
    sec2 = null;
  }

  return { sec1, sec2 };
}

async function getCurrentImages(pool, id) {
  const q = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT imagen_principal, imagen_sec_1, imagen_sec_2
      FROM dbo.NOTICIA
      WHERE id=@id
    `);
  return q.recordset?.[0] || {};
}

/* ===============================
   Crear noticia (POST)
================================ */
router.post("/", upload.any(), async (req, res) => {
  try {
    const { titulo, subtitulo, slug, resumen, cuerpo_html, publish_at, estado, tipo } = req.body;
    const pool = await getPool();

    const groups = groupByField(req.files || []);
    const fMain = pickMainFile(groups);
    const { sec1, sec2 } = pickSecondaryPair(groups);

    const mainImg = fileUrl(fMain);
    const secImg1 = fileUrl(sec1);
    const secImg2 = fileUrl(sec2);

    await pool
      .request()
      .input("titulo", sql.NVarChar(200), titulo)
      .input("subtitulo", sql.NVarChar(250), subtitulo || null)
      .input("slug", sql.NVarChar(220), slug)
      .input("resumen", sql.NVarChar(800), resumen || null)
      .input("cuerpo_html", sql.NVarChar(sql.MAX), cuerpo_html || "")
      .input("imagen_principal", sql.NVarChar(400), mainImg)
      .input("imagen_sec_1", sql.NVarChar(400), secImg1)
      .input("imagen_sec_2", sql.NVarChar(400), secImg2)
      .input("publish_at", sql.DateTime2, publish_at || null)
      .input("estado", sql.TinyInt, estado ?? 1)
      .input("tipo", sql.NVarChar(50), tipo)
      .execute("dbo.spNoticia_Create");

    res.json({ ok: true, mensaje: "Noticia publicada correctamente" });
  } catch (err) {
    console.error("Error al crear noticia:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ===============================
   Actualizar noticia (PUT)
================================ */
router.put("/:id", upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, subtitulo, slug, resumen, cuerpo_html, publish_at, estado, tipo } = req.body;
    const pool = await getPool();

    const current = await getCurrentImages(pool, id);

    const groups = groupByField(req.files || []);
    const fMain = pickMainFile(groups);
    const { sec1, sec2 } = pickSecondaryPair(groups);

    const mainImg = fileUrl(fMain) || current.imagen_principal || null;
    let secImg1 = fileUrl(sec1) || current.imagen_sec_1 || null;
    let secImg2 = fileUrl(sec2) || current.imagen_sec_2 || null;

    // Evitar secundaria duplicada tras actualización
    if (secImg1 && secImg2 && secImg1 === secImg2) {
      secImg2 = null;
    }

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("titulo", sql.NVarChar(200), titulo)
      .input("subtitulo", sql.NVarChar(250), subtitulo || null)
      .input("slug", sql.NVarChar(220), slug)
      .input("resumen", sql.NVarChar(800), resumen || null)
      .input("cuerpo_html", sql.NVarChar(sql.MAX), cuerpo_html || "")
      .input("imagen_principal", sql.NVarChar(400), mainImg)
      .input("imagen_sec_1", sql.NVarChar(400), secImg1)
      .input("imagen_sec_2", sql.NVarChar(400), secImg2)
      .input("publish_at", sql.DateTime2, publish_at || null)
      .input("estado", sql.TinyInt, estado ?? null)
      .input("tipo", sql.NVarChar(50), tipo)
      .query(`
        UPDATE dbo.NOTICIA
        SET titulo=@titulo,
            subtitulo=@subtitulo,
            slug=@slug,
            resumen=@resumen,
            cuerpo_html=@cuerpo_html,
            imagen_principal=@imagen_principal,
            imagen_sec_1=@imagen_sec_1,
            imagen_sec_2=@imagen_sec_2,
            publish_at = COALESCE(@publish_at, publish_at),
            estado     = COALESCE(@estado, estado),
            tipo       = COALESCE(@tipo, tipo),
            updated_at = SYSDATETIME()
        WHERE id=@id
      `);

    res.json({ ok: true, mensaje: "Noticia actualizada correctamente" });
  } catch (err) {
    console.error("Error al actualizar noticia:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ===============================
   Listar públicas
================================ */
router.get("/publicas", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT * FROM dbo.vw_NoticiasPublicadas ORDER BY publish_at DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al listar públicas:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ===============================
   Listar historial
================================ */
router.get("/historial", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT * FROM dbo.vw_NoticiasHistorial ORDER BY publish_at DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al listar historial:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ===============================
   Cambiar estado
================================ */
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const pool = await getPool();

    await pool.request().input("id", sql.Int, id).input("estado", sql.TinyInt, estado).execute("dbo.spNoticia_SetEstado");

    res.json({ ok: true, mensaje: "Estado actualizado" });
  } catch (err) {
    console.error("Error al cambiar estado:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ===============================
   Eliminar
================================ */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input("id", sql.Int, id).execute("dbo.spNoticia_Delete");
    res.json({ ok: true, mensaje: "Noticia eliminada definitivamente" });
  } catch (err) {
    console.error("Error al eliminar noticia:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
