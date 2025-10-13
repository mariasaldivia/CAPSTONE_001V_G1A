-- ===========================================
--     CREACIÓN DE TABLAS PARA EL SISTEMA
-- ===========================================

-- TABLA USUARIO (base para todos los perfiles)
-- Esta tabla guarda la información general de login para cualquier usuario
/*CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,  -- Identificador único autoincremental
  nombre_usuario VARCHAR(50) UNIQUE NOT NULL, -- login
  contrasena_hash VARCHAR(255) NOT NULL,
  tipo_usuario VARCHAR(20), -- INFORMATIVO: puede ser 'SOCIO', 'DIRECTIVA' o ambos
  estado VARCHAR(20) CHECK (estado IN ('Activo','Inactivo')) DEFAULT 'Inactivo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_login TIMESTAMP
);   SE MODIFICO*/ 

-- TABLA SOCIOS (información específica de socios)
-- Cada usuario puede aparecer solo una vez como socio
-- Coas
CREATE TABLE IF NOT EXISTS socio (
  id_socio SERIAL PRIMARY KEY,
  id_usuario INTEGER UNIQUE REFERENCES usuario(id_usuario) ON DELETE CASCADE,  -- relación 1 a 1. Con CASCADE si se elimina el usuario se elimina el socio
  rut VARCHAR(12) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  direccion VARCHAR(150) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100) UNIQUE,
  fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado_inscripcion VARCHAR(20) 
    CHECK (estado_inscripcion IN ('Pendiente', 'Aprobado', 'Rechazado'))
    DEFAULT 'Pendiente'
);

-- TABLA DIRECTIVA (información específica de miembros de la directiva)
-- Cada usuario puede aparecer solo una vez como directivo
CREATE TABLE IF NOT EXISTS directiva (
  id_admin SERIAL PRIMARY KEY,
  id_usuario INTEGER UNIQUE REFERENCES usuario(id_usuario) ON DELETE CASCADE,  -- relación 1 a 1. Con CASCADE si se elimina el usuario se elimina el DIRECTIVO
  cargo VARCHAR(20)
    CHECK (cargo IN ('Presidente', 'Secretario', 'Tesorero')) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_inicio_cargo DATE,
  -- fecha_inicio_cargo DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin_cargo DATE,
  activo BOOLEAN DEFAULT TRUE
);

