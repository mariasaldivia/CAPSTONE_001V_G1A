/* 1. Usar la base de datos */
USE [unidad_territorial];
GO

/* 2. Crear la tabla de Movimientos */
CREATE TABLE MOVIMIENTOS (
    ID_Movimiento INT IDENTITY(1,1) PRIMARY KEY,  
    Tipo NVARCHAR(10) NOT NULL,            
    Monto DECIMAL(10,2) NOT NULL CHECK (Monto > 0),
    Descripcion NVARCHAR(255) NOT NULL,
    Categoria NVARCHAR(50) NOT NULL,      
    Fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    ID_Socio_FK INT NULL,  -- El socio que paga la cuota
    ID_Dire_FK INT NOT NULL, -- El directivo (usuario) que registra el movimiento

    -- Validaciones
    CONSTRAINT CK_Movimientos_Tipo CHECK (Tipo IN ('Ingreso','Egreso')),
    
    -- (Puedes añadir más categorías aquí si lo necesitas)
    CONSTRAINT CK_Movimientos_Categoria CHECK (
        Categoria IN ('Cuota Socio', 'Donación','Arriendo Espacios', 'Ingreso Evento',
                      'Gastos Evento', 'Reparaciones', 'Materiales')
    )
);
GO

/* 3. Crear las Foreign Keys (Relaciones) */

-- Enlaza con el Socio que pagó (si aplica)
ALTER TABLE MOVIMIENTOS  
    ADD CONSTRAINT FK_Movimientos_Socio FOREIGN KEY (ID_Socio_FK)
    REFERENCES SOCIOS(ID_Socio);
GO

-- Enlaza con el Usuario (Admin/Tesorera) que registró el movimiento
ALTER TABLE MOVIMIENTOS
    ADD CONSTRAINT FK_Movimientos_Admin FOREIGN KEY (ID_Dire_FK)
    REFERENCES USUARIO(ID_Usuario);
GO

PRINT '¡Tabla MOVIMIENTOS creada con éxito!';