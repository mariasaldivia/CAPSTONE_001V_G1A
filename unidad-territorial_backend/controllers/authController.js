import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getPool, sql } from "../pool.js"; // pool en la raíz

const JWT_SECRET = process.env.JWT_SECRET || "cambia_esto_super_secreto";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

function issueToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/** ===========================
 *  🔐 LOGIN(multirol) Actualizado con BCTYPT
 *  =========================== */
export const login = async (req, res) => {
  const { correo, contrasena } = req.body || {};
  try {
    if (!correo || !contrasena) {
      return res.status(400).json({ ok: false, error: "Faltan credenciales" });
    }

    const pool = await getPool();

    // 1) Usuario
    const ures = await pool.request()
      .input("correo", sql.NVarChar, correo)
      //.input("pwd", sql.NVarChar, contrasena) // en prod: usa bcrypt/argon2
      .query(`
        SELECT ID_Usuario, Nombre_Usuario, Correo, Contrasena, Tipo_Usuario
        FROM dbo.USUARIO
        WHERE Correo = @correo
      `);

    if (ures.recordset.length === 0) {
      return res.status(401).json({ ok: false, error: "Credenciales inválidas" });
    }
    const user = ures.recordset[0];

    const match = await bcrypt.compare(contrasena, user.Contrasena);

    if (!match) {
      return res.status(401).json({ ok: false, error: "Credenciales inválidas" });
    }

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

// =================================================================
// 🆕 FUNCIÓN DE REGISTRO (Actualizada con 'Contrasena')
// =================================================================
export const register = async (req, res) => {
  const {
    name,
    lastname,
    rut,
    birthdate,
    street,
    number,
    email,
    phone,
    password,
  } = req.body;
let pool;
  let transaction;

  try {
    pool = await getPool();

    // 2. Validar que el correo o RUT no existan
    const check = await pool.request()
      .input("correo", sql.NVarChar(100), email)
      .input("rut", sql.NVarChar(20), rut)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM dbo.USUARIO WHERE Correo = @correo) as emailCount,
          (SELECT COUNT(*) FROM dbo.SOCIOS WHERE RUT = @rut) as rutCount
      `);

    if (check.recordset[0].emailCount > 0) {
      return res.status(409).json({ message: "El correo electrónico ya está registrado." });
    }
    if (check.recordset[0].rutCount > 0) {
      return res.status(409).json({ message: "El RUT ya está registrado." });
    }

    // 3. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Iniciar Transacción (para asegurar que todo se guarde o nada se guarde)
    transaction = pool.transaction();
    await transaction.begin();

    // 5. Crear el USUARIO
    const userResult = await transaction.request()
      .input("correo", sql.NVarChar(100), email)
      .input("nombreUsuario", sql.NVarChar(100), `${name} ${lastname}`)
      .input("passwordHash", sql.NVarChar(255), passwordHash)
      .input("estado", sql.NVarChar(20), "Activo")
      .input("tipoUsuario", sql.NVarChar(50), "SOCIO") // 👈 AÑADIMOS EL VALOR
      .query(`
          INSERT INTO dbo.USUARIO (Correo, Nombre_Usuario, Contrasena, Estado, Fecha_Creacion, Tipo_Usuario)
          OUTPUT inserted.ID_Usuario
          VALUES (@correo, @nombreUsuario, @passwordHash, @estado, GETDATE(), @tipoUsuario)
      `);
    
    const newUserId = userResult.recordset[0].ID_Usuario;

    // 6. Asignar el ROL de "SOCIO"
    // Buscamos el ID del rol 'SOCIO'
    const rolResult = await transaction.request()
      .input("nombreRol", sql.NVarChar(50), "SOCIO")
      .query("SELECT ID_Rol FROM dbo.ROL WHERE Nombre_Rol = @nombreRol");

    if (rolResult.recordset.length === 0) {
      // Si no existe el rol 'SOCIO', cancelamos todo
      await transaction.rollback();
      return res.status(500).json({ message: "Error crítico: El rol 'SOCIO' no existe en la base de datos." });
    }
    const idRolSocio = rolResult.recordset[0].ID_Rol;

    // Asignamos el rol al usuario
    await transaction.request()
      .input("idUsuario", sql.Int, newUserId)
      .input("idRol", sql.Int, idRolSocio)
      .query(`
          INSERT INTO dbo.USUARIO_ROL (ID_Usuario, ID_Rol)
          VALUES (@idUsuario, @idRol)
      `);

    // 7. Crear el SOCIO
    await transaction.request()
      .input("idUsuario", sql.Int, newUserId)
      .input("rut", sql.NVarChar(20), rut)
      .input("nombres", sql.NVarChar(100), name)
      .input("apellidos", sql.NVarChar(100), lastname)
      .input("fechaNacimiento", sql.Date, birthdate)
      .input("calle", sql.NVarChar(100), street)
      .input("numeroCasa", sql.NVarChar(20), number)
      .input("correo", sql.NVarChar(100), email)
      .input("telefono", sql.NVarChar(20), phone)
      .input("estadoInscripcion", sql.NVarChar(20), "Pendiente") // O 'Activo' si prefieres
      .query(`
          INSERT INTO dbo.SOCIOS (
              ID_Usuario, RUT, Nombres, Apellidos, Fecha_Nacimiento,
              Calle, Numero_Casa, Correo, Telefono,
              Fecha_Inscripcion, Estado_Inscripcion
          ) VALUES (
              @idUsuario, @rut, @nombres, @apellidos, @fechaNacimiento,
              @calle, @numeroCasa, @correo, @telefono,
              GETDATE(), @estadoInscripcion
          )
      `);

    // 8. Confirmar la transacción
    await transaction.commit();

    // 9. Enviar respuesta de éxito
    res.status(201).json({ 
      ok: true, 
      message: "¡Registro exitoso! Tu cuenta ha sido creada y está pendiente de aprobación." 
    });

  } catch (error) {
    // Si algo falla, revertir todo
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Error en /register:", error);
    res.status(500).json({ message: "Error interno del servidor al registrar.", error: error.message });
  }
};

