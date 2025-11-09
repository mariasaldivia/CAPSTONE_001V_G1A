/* PARA que funcione CERTICADO e HISTORIAL  */
/* Insertar variable TELEFONO  */
USE [unidad_territorial];
GO

ALTER TABLE dbo.HISTORIAL_CERTIFICADO
ADD TELEFONO [varchar](20) NULL;
GO

USE [unidad_territorial];
GO

ALTER TABLE dbo.CERTIFICADO_RESIDENCIA
ADD TELEFONO [varchar](20) NULL;
GO
USE [unidad_territorial];
GO

/* Email en la tabla principal acepte nulos */
ALTER TABLE dbo.CERTIFICADO_RESIDENCIA
ALTER COLUMN Email [nvarchar](160) NULL;
GO


USE [unidad_territorial];
GO
/* Crear tabla BUZON_VECINAL antes conocida como REQUERIMIENTOS */
CREATE TABLE [dbo].[BUZON_VECINAL](
	[ID_Buzon] [int] IDENTITY(1,1) NOT NULL,
	[Folio] AS ('BV-' + RIGHT('00000' + CONVERT(varchar(10), [ID_Buzon]), 5)) PERSISTED,

	[NombreSocio] [nvarchar](120) NOT NULL,
	[RUT] [varchar](12) NULL,           
	[Telefono] [varchar](30) NULL,

	[Asunto] [nvarchar](200) NOT NULL,
	[Mensaje] [nvarchar](max) NOT NULL,
	
    [Direccion] [nvarchar](255) NULL,       /* Dirección o ubicación aproximada */
    [ImagenURL] [nvarchar](400) NULL,       /* Imagen (opcional) */

	[Estado] [varchar](20) NOT NULL 
		CONSTRAINT [DF_Buzon_Estado] DEFAULT ('Pendiente'),
	[FechaCreacion] [datetime2](7) NOT NULL 
		CONSTRAINT [DF_Buzon_Fecha] DEFAULT (sysdatetime()),
	
	/* Para uso de la directiva */
	[ResueltoPor_ID] [int] NULL,
	[FechaResuelto] [datetime2](7) NULL,
	[RespuestaAdmin] [nvarchar](1000) NULL,

 CONSTRAINT [PK_BuzonVecinal] PRIMARY KEY CLUSTERED ([ID_Buzon] ASC)
);
GO

/* Reglas para los estados */
ALTER TABLE [dbo].[BUZON_VECINAL] WITH CHECK ADD CONSTRAINT [CK_Buzon_Estado] CHECK  
  (([Estado]='Pendiente' OR [Estado]='En Revisión' OR [Estado]='Resuelto'));
GO
/* Que el id sea de un uario*/
ALTER TABLE [dbo].[BUZON_VECINAL] ADD CONSTRAINT [FK_Buzon_ResueltoPorUsuario]
FOREIGN KEY ([ResueltoPor_ID]) REFERENCES [dbo].[USUARIO]([ID_Usuario]);
GO

/* TABLA RECOMENDADA: BITÁCORA DE CAMBIOS DEL BUZÓN */
CREATE TABLE [dbo].[BUZON_BITACORA](
	[ID_Bitacora] [int] IDENTITY(1,1) NOT NULL
		CONSTRAINT [PK_BuzonBitacora] PRIMARY KEY,

	[ID_Buzon_FK] [int] NOT NULL
		CONSTRAINT [FK_Bitacora_Buzon] FOREIGN KEY REFERENCES [dbo].[BUZON_VECINAL]([ID_Buzon]),
	
	[ID_Usuario_FK] [int] NULL  /* Quién hizo el cambio (el admin/directiva) */
		CONSTRAINT [FK_Bitacora_Usuario] FOREIGN KEY REFERENCES [dbo].[USUARIO]([ID_Usuario]),

	[FechaCambio] [datetime2](7) NOT NULL
		CONSTRAINT [DF_Bitacora_Fecha] DEFAULT (sysdatetime()),

	[EstadoAnterior] [varchar](20) NULL, /* Ej: 'Pendiente' */
	[EstadoNuevo] [varchar](20) NOT NULL, /* Ej: 'En Revisión' */

	[Comentario] [nvarchar](1000) NULL /* Aquí guardas la "RespuestaAdmin" o una nota */
);
GO

/* Creamos un índice en el ID del Buzón para ver rápido todo el historial de un caso */
CREATE INDEX IX_BuzonBitacora_BuzonID ON dbo.BUZON_BITACORA(ID_Buzon_FK);
GO