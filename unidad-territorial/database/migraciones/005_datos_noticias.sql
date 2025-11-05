-- 1. Agregar la nueva columna 'tipo' a la tabla de noticias
ALTER TABLE [unidad_territorial].[dbo].[NOTICIA]
ADD 
    tipo VARCHAR(50) NOT NULL 
    CONSTRAINT DF_NOTICIA_tipo DEFAULT 'Junta de vecino',
    CONSTRAINT CK_NOTICIA_tipo CHECK (tipo IN ('Municipalidad', 'Junta de vecino'));
GO

-- 2. Modificar el Stored Procedure de creación para que acepte el nuevo campo
ALTER PROCEDURE [dbo].[spNoticia_Create]
    @titulo NVARCHAR(200),
    @subtitulo NVARCHAR(250),
    @slug NVARCHAR(220),
    @resumen NVARCHAR(800),
    @cuerpo_html NVARCHAR(MAX),
    @imagen_principal NVARCHAR(400),
    @imagen_sec_1 NVARCHAR(400),
    @imagen_sec_2 NVARCHAR(400),
    @publish_at DATETIME2,
    @estado TINYINT,
    @tipo NVARCHAR(50) -- Parámetro añadido
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [dbo].[NOTICIA] (
        titulo, subtitulo, slug, resumen, cuerpo_html, 
        imagen_principal, imagen_sec_1, imagen_sec_2, 
        publish_at, estado, 
        tipo -- Columna añadida
    )
    VALUES (
        @titulo, @subtitulo, @slug, @resumen, @cuerpo_html, 
        @imagen_principal, @imagen_sec_1, @imagen_sec_2, 
        @publish_at, @estado, 
        @tipo -- Valor añadido
    );
END
GO

-- 3. Actualizar la Vista de noticias publicadas
ALTER VIEW [dbo].[vw_NoticiasPublicadas]
AS
SELECT 
    id, 
    titulo, 
    subtitulo, 
    slug,
    resumen,
    cuerpo_html,
    imagen_principal,
    imagen_sec_1,
    imagen_sec_2,
    estado,
    publish_at,
    created_at,
    updated_at,
    tipo  -- <-- Columna añadida
FROM 
    dbo.NOTICIA
WHERE 
    estado = 1 AND publish_at <= SYSDATETIME();
GO

-- 4. Actualizar la Vista del historial de noticias
ALTER VIEW [dbo].[vw_NoticiasHistorial]
AS
SELECT 
    id, 
    titulo, 
    subtitulo, 
    slug,
    resumen,
    cuerpo_html,
    imagen_principal,
    imagen_sec_1,
    imagen_sec_2,
    estado,
    publish_at,
    created_at,
    updated_at,
    tipo  -- <-- Columna añadida
FROM 
    dbo.NOTICIA;
GO

PRINT '✅ Migración 005 ejecutada: Columna [tipo] añadida a NOTICIA y Vistas/SPs actualizados.';