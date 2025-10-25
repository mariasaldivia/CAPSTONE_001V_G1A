import jwt from "jsonwebtoken";
import { getPool, sql } from "../pool.js"; // pool en la raíz

const JWT_SECRET = process.env.JWT_SECRET || "cambia_esto_super_secreto";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

function issueToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/** ===========================
 *  🔐 LOGIN (multirol)
 *  =========================== */
export const login = async (req, res) => {
  const { correo, contrasena } = req.body || {};
  try {
    if (!correo || !contrasena) {
      return res.status(400).json({ ok: false, error: "Faltan credenciales" });
    }

    const pool = await getPool();

    // 1) Usuario
    // Quita "Cargo" porque no existe en tu esquema
    const ures = await pool.request()
      .input("correo", sql.NVarChar, correo)
      .input("pwd", sql.NVarChar, contrasena) // en prod: usa bcrypt/argon2
      .query(`
        SELECT ID_Usuario, Nombre_Usuario, Correo
        FROM dbo.USUARIO
        WHERE Correo = @correo AND Contrasena = @pwd
      `);

    if (ures.recordset.length === 0) {
      return res.status(401).json({ ok: false, error: "Credenciales inválidas" });
    }
    const user = ures.recordset[0];

    // 2) Roles
    // Si tienes la vista dbo.vw_UsuarioConRoles úsala; si no, dejamos join.
    let roles = [];
    try {
      const vres = await pool.request()
        .input("idU", sql.Int, user.ID_Usuario)
        .query(`
          SELECT Roles_Asignados
          FROM dbo.vw_UsuarioConRoles
          WHERE ID_Usuario = @idU
        `);
      if (vres.recordset.length) {
        const raw = vres.recordset[0].Roles_Asignados || "";
        roles = String(raw)
          .split(",")
          .map(r => r.trim())
          .filter(Boolean)
          .map(r => r.toUpperCase());
      }
    } catch {
      // fallback si la vista no existe
      const rres = await pool.request()
        .input("idU", sql.Int, user.ID_Usuario)
        .query(`
          SELECT r.Nombre_Rol
          FROM dbo.USUARIO_ROL ur
          JOIN dbo.ROL r ON r.ID_Rol = ur.ID_Rol
          WHERE ur.ID_Usuario = @idU
          ORDER BY r.Nombre_Rol
        `);
      roles = rres.recordset.map(x => String(x.Nombre_Rol).toUpperCase());
    }

    if (roles.length === 0) {
      return res.status(403).json({ ok: false, error: "Usuario sin roles asignados" });
    }

    // 3) Si hay varios roles → forzar selección en el front
    if (roles.length > 1) {
      return res.status(200).json({
        ok: true,
        needsRoleSelection: true,
        usuario: {
          ID_Usuario: user.ID_Usuario,
          Nombre_Usuario: user.Nombre_Usuario,
          Correo: user.Correo
        },
        roles
      });
    }

    // 4) Un solo rol → emitir token
    const rol = roles[0];
    const token = issueToken({
      sub: user.ID_Usuario,
      nombre: user.Nombre_Usuario,
      tipo_usuario: rol,
      roles
    });

    return res.status(200).json({
      ok: true,
      needsRoleSelection: false,
      usuario: {
        ID_Usuario: user.ID_Usuario,
        Nombre_Usuario: user.Nombre_Usuario,
        Correo: user.Correo,
        Tipo_Usuario: rol,
        Roles: roles
      },
      roles,
      rol,
      token
    });
  } catch (err) {
    const full = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    console.error("[/login] error FULL:", full);
    return res.status(500).json({ ok: false, error: "Error en login" });
  }
};

/** ===========================
 *  🧭 ELECCIÓN DE ROL
 *  =========================== */
export const chooseRole = async (req, res) => {
  const { usuarioId, rolElegido } = req.body || {};
  try {
    if (!usuarioId || !rolElegido) {
      return res.status(400).json({ ok: false, error: "Faltan datos" });
    }

    const rol = String(rolElegido).toUpperCase();
    const pool = await getPool();

    // Validar que ese rol esté asociado al usuario (sin "Cargo")
    const v = await pool.request()
      .input("idU", sql.Int, usuarioId)
      .input("rol", sql.NVarChar, rol)
      .query(`
        SELECT TOP 1 u.ID_Usuario, u.Nombre_Usuario, u.Correo
        FROM dbo.USUARIO u
        WHERE u.ID_Usuario = @idU
          AND EXISTS (
            SELECT 1
            FROM dbo.USUARIO_ROL ur
            JOIN dbo.ROL r ON r.ID_Rol = ur.ID_Rol
            WHERE ur.ID_Usuario = u.ID_Usuario
              AND UPPER(r.Nombre_Rol) = @rol
          )
      `);

    if (v.recordset.length === 0) {
      return res.status(403).json({ ok: false, error: "Rol no asignado al usuario" });
    }

    const u = v.recordset[0];
    const token = issueToken({
      sub: u.ID_Usuario,
      nombre: u.Nombre_Usuario,
      tipo_usuario: rol,
      roles: [rol]
    });

    return res.status(200).json({ ok: true, rol, token });
  } catch (err) {
    const full = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    console.error("[/choose-role] error FULL:", full);
    return res.status(500).json({ ok: false, error: "Error al elegir rol" });
  }
};
