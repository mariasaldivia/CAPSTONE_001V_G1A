/* ================================================================
 SCRIPT FINAL PARA MÓDULOS DE PROYECTOS (Versión 4)
 - Borra tablas antiguas si existen (para una instalación limpia)
 - Crea tablas (Proyecto, Postulación, Interés)
 - Añade campos para Vecinos (basado en RUT)
 - Añade Índices Únicos Filtrados
================================================================
*/

-- 1. Asegurarnos de que estamos en la base de datos correcta
USE [unidad_territorial];
GO

-- 2. Borrar las tablas en orden inverso (primero las que tienen FOREIGN KEY)
-- Si las tablas no existen, no dará error y continuará.
DROP TABLE IF EXISTS [dbo].[INTERES_PROYECTO];
DROP TABLE IF EXISTS [dbo].[POSTULACION_PROYECTO];
DROP TABLE IF EXISTS [dbo].[PROYECTO_VECINAL];
GO

PRINT 'Tablas antiguas eliminadas (si existían).';

-- 3. Crear la tabla principal de Proyectos
CREATE TABLE [dbo].[PROYECTO_VECINAL] (
    ID_Proyecto INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(120) NOT NULL,
    Descripcion NVARCHAR(255),
    FechaInicio DATE,
    FechaFin DATE,
    Bases NVARCHAR(MAX),
    Estado NVARCHAR(30) DEFAULT 'Abierto',
    Fecha_Creacion DATETIME2 DEFAULT SYSDATETIME(),
    -- Columnas añadidas directamente
    HoraInicio NVARCHAR(8) NULL,
    HoraFin NVARCHAR(8) NULL,
    TipoProyecto NVARCHAR(30) NOT NULL DEFAULT 'JJVV'
);
GO

-- 4. Crear la tabla de Postulaciones (solo para Socios en proyectos 'JJVV')
CREATE TABLE [dbo].[POSTULACION_PROYECTO] (
    ID_Postulacion INT IDENTITY(1,1) PRIMARY KEY,
    ID_Socio INT NOT NULL,
    ID_Proyecto INT NOT NULL,
    Fecha_Postulacion DATETIME2 DEFAULT SYSDATETIME(),
    Estado NVARCHAR(20) DEFAULT 'Pendiente',
    Comentario NVARCHAR(255),
    FOREIGN KEY (ID_Socio) REFERENCES SOCIOS(ID_Socio),
    FOREIGN KEY (ID_Proyecto) REFERENCES PROYECTO_VECINAL(ID_Proyecto)
);
GO

-- 5. Crear la tabla de Interés (para Socios O Vecinos)
CREATE TABLE [dbo].[INTERES_PROYECTO] (
    ID_Interes INT IDENTITY(1,1) PRIMARY KEY,
    ID_Socio INT NULL, -- Se crea como NULL de inmediato
    ID_Proyecto INT NOT NULL,
    Fecha_Interes DATETIME2 DEFAULT SYSDATETIME(),
    
    -- Campos para Vecinos (visitantes)
    Nombre_Vecino NVARCHAR(120) NULL,
    RUT_Vecino NVARCHAR(20) NULL,    
    Telefono_Vecino NVARCHAR(30) NULL,
    Email_Vecino NVARCHAR(120) NULL,

    FOREIGN KEY (ID_Socio) REFERENCES SOCIOS(ID_Socio),
    FOREIGN KEY (ID_Proyecto) REFERENCES PROYECTO_VECINAL(ID_Proyecto)
);
GO

-- 6. Añadir la regla de negocio (O es Socio, O es Vecino con RUT)
ALTER TABLE [dbo].[INTERES_PROYECTO]
ADD CONSTRAINT CHK_Interes_Origen
CHECK (
    (ID_Socio IS NOT NULL AND RUT_Vecino IS NULL) -- Es un Socio
    OR
    (ID_Socio IS NULL AND RUT_Vecino IS NOT NULL) -- Es un Vecino (RUT es obligatorio)
);
GO

-- 7. Añadir Índices Únicos para evitar duplicados
-- (Previene que un SOCIO se registre dos veces en el mismo proyecto)
CREATE UNIQUE INDEX UQ_Interes_Socio_Proyecto
ON dbo.INTERES_PROYECTO (ID_Proyecto, ID_Socio)
WHERE ID_Socio IS NOT NULL; -- Solo aplica a las filas que son de Socios
GO

-- (Previene que un VECINO se registre dos veces en el mismo proyecto)
CREATE UNIQUE INDEX UQ_Interes_Vecino_Proyecto
ON dbo.INTERES_PROYECTO (ID_Proyecto, RUT_Vecino)
WHERE RUT_Vecino IS NOT NULL; -- Solo aplica a las filas que son de Vecinos
GO


-- 8. Mensaje de éxito
PRINT '¡Tablas PROYECTO_VECINAL, POSTULACION_PROYECTO e INTERES_PROYECTO creadas con éxito!';