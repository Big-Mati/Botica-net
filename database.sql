-- BASE DE DATOS: botica_net_db

CREATE DATABASE IF NOT EXISTS botica_net_db
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE botica_net_db;

-- Eliminar tablas previas en orden inverso de claves foráneas
DROP TABLE IF EXISTS movimientos_kardex;
DROP TABLE IF EXISTS lotes;
DROP TABLE IF EXISTS detalle_ventas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS vendedores;


-- TABLA CATEGORIAS (Clasificación)
-- Agrupa los medicamentos por tipo (ej. Analgésicos) y evita nombres repetidos

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(150) NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- TABLA VENDEDORES (Operadores de Caja y Turnos)
-- Identifica al personal de turno para auditoría de caja y control de accesos

CREATE TABLE vendedores (
    id_vendedor INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    clave VARCHAR(100) NOT NULL,
    turno VARCHAR(20) NOT NULL DEFAULT 'Mañana',
    rol VARCHAR(50) NOT NULL DEFAULT 'Cajero Farmacéutico',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- TABLA PRODUCTOS (Inventario Central y Umbrales de Stock)
-- Lista principal de medicamentos con sus precios y alerta de stock mínimo

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 10,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE RESTRICT
);


-- TABLA LOTES (Control FEFO y Ubicación Física en Anaquel)
-- Permite al personal ubicar el medicamento en segundos
-- y despachar primero los lotes con vencimiento más próximo (FEFO / DIGEMID)

CREATE TABLE lotes (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    codigo_lote VARCHAR(30) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    stock_lote INT NOT NULL DEFAULT 0,
    ubicacion_anaquel VARCHAR(80) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
);


-- TABLA VENTAS (Cabecera de Comprobante Fiscal)
-- Registra el comprobante (boleta), cliente, total cobrado y método de pago (Yape/Tarjeta/Efectivo)

CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_vendedor INT NOT NULL DEFAULT 1,
    numero_comprobante VARCHAR(20) NOT NULL UNIQUE,
    cliente VARCHAR(100) NOT NULL DEFAULT 'Público General',
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'Efectivo',
    total DECIMAL(10, 2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor) ON DELETE RESTRICT
);


-- TABLA DETALLE_VENTAS (Líneas de Medicamentos Despachados)
-- Guarda cada producto vendido en la boleta con su cantidad y precio

CREATE TABLE detalle_ventas (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT
);


-- TABLA MOVIMIENTOS_KARDEX (Trazabilidad y Auditoría de Inventario)
-- Registra cada entrada por compra o salida por venta con stock anterior y nuevo

CREATE TABLE movimientos_kardex (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    tipo_movimiento ENUM('ENTRADA_INICIAL', 'ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_MERMA') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_posterior INT NOT NULL,
    motivo_referencia VARCHAR(120) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
);


-- DATOS PARA DEMOSTRACIÓN

-- Categorias farmaceuticas
INSERT INTO categorias (id_categoria, nombre, descripcion) VALUES
(1, 'Analgésicos', 'Alivio del dolor de intensidad leve a moderada'),
(2, 'Antiinflamatorios', 'Tratamiento de inflamaciones y dolor articular'),
(3, 'Antihistamínicos', 'Alivio de síntomas de alergias y rinitis'),
(4, 'Gastroenterología', 'Protección gástrica y antiácidos'),
(5, 'Vitaminas', 'Suplementos nutricionales y defensas inmunológicas'),
(6, 'Cuidado Personal', 'Antisépticos, higiene y desinfección dérmica'),
(7, 'Material Médico', 'Insumos estériles de curación y primeros auxilios'),
(8, 'Antibióticos', 'Tratamiento de infecciones bacterianas con receta'),
(9, 'Respiratorios', 'Broncodilatadores y aerosoles pulmonares'),
(10, 'Dispositivos Médicos', 'Equipos de diagnóstico y monitoreo de salud');

-- Operador de caja
INSERT INTO vendedores (id_vendedor, codigo, nombre, usuario, clave, turno, rol) VALUES
(1, 'V-001', 'Carlos Mendoza', 'vendedor', '123', 'Mañana', 'Cajero Farmacéutico');

-- Catalogo de Medicamentos (Con stock suficiente y stock crítico para alertas)
INSERT INTO productos (id_producto, id_categoria, nombre, precio, stock, stock_minimo) VALUES
(1, 1, 'Paracetamol 500mg (Caja x 20)', 4.50, 45, 10),
(2, 2, 'Ibuprofeno 400mg (Blister x 10)', 3.20, 30, 10),
(3, 3, 'Loratadina 10mg (Blister x 10)', 5.00, 25, 8),
(4, 4, 'Omeprazol 20mg (Caja x 30)', 8.50, 40, 12),
(5, 5, 'Vitamina C 1g Efervescente', 18.00, 20, 5),
(6, 6, 'Alcohol Medicinal 70° (500ml)', 6.00, 35, 10),
(7, 7, 'Gasas Estériles (Sobre x 5)', 2.50, 50, 15),
-- Medicamentos con Stock Crítico
(8, 8, 'Amoxicilina 500mg (Blister x 10)', 6.50, 4, 15),
(9, 8, 'Azitromicina 500mg (Caja x 3)', 14.00, 2, 8),
(10, 9, 'Salbutamol Inhalador 100mcg', 16.50, 3, 10),
(11, 10, 'Termómetro Digital Clínico', 12.00, 1, 5);

-- Lotes Farmacéuticos con ubicacion fisica en Anaquel y Control FEFO
INSERT INTO lotes (id_producto, codigo_lote, fecha_vencimiento, stock_lote, ubicacion_anaquel) VALUES
(1, 'LOT-2026-P01', '2027-08-15', 45, 'Pasillo 1 · Anaquel A-01 · Nivel 2'),
(2, 'LOT-2026-I02', '2027-10-20', 30, 'Pasillo 1 · Anaquel A-02 · Nivel 1'),
(3, 'LOT-2026-L03', '2027-06-12', 25, 'Pasillo 2 · Anaquel B-01 · Nivel 3'),
(4, 'LOT-2026-O04', '2028-01-30', 40, 'Pasillo 2 · Anaquel B-02 · Nivel 2'),
(5, 'LOT-2026-V05', '2027-04-18', 20, 'Vitrina Central · Nivel 1'),
(6, 'LOT-2026-A06', '2028-05-10', 35, 'Almacén Posterior · Estante C-01'),
(7, 'LOT-2026-G07', '2028-11-25', 50, 'Almacén Posterior · Estante C-02'),
(8, 'LOT-2026-AM08', '2026-12-15', 4, 'Pasillo 1 · Anaquel A-03 · Nivel 1 (FEFO)'),
(9, 'LOT-2026-AZ09', '2026-11-30', 2, 'Pasillo 1 · Anaquel A-03 · Nivel 2 (FEFO)'),
(10, 'LOT-2026-S10', '2027-03-22', 3, 'Vitrina Especial · Nivel 2'),
(11, 'LOT-2026-T11', '2029-12-31', 1, 'Vitrina Dispositivos · Nivel 1');

-- Ventas de prueba iniciales
INSERT INTO ventas (id_venta, id_vendedor, numero_comprobante, cliente, metodo_pago, total, fecha) VALUES
(1, 1, 'B001-00001', 'James Bond Armani', 'Efectivo', 9.00, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 1, 'B001-00002', 'Rosa Flores Quispe', 'Yape / Plin', 24.50, DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- Detalle de Ventas Iniciales
INSERT INTO detalle_ventas (id_detalle, id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 2, 4.50, 9.00),   -- 2 Paracetamol a 4.50 = 9.00
(2, 2, 2, 2, 3.20, 6.40),   -- 2 Ibuprofeno a 3.20 = 6.40
(3, 2, 5, 1, 18.00, 18.00); -- 1 Vitamina C a 18.00 = 18.00

-- Historial inicial del Kardex (Inventario Inicial + Salidas por Ventas)
INSERT INTO movimientos_kardex (id_producto, tipo_movimiento, cantidad, stock_anterior, stock_posterior, motivo_referencia, fecha) VALUES
(1, 'ENTRADA_INICIAL', 47, 0, 47, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(1, 'SALIDA_VENTA', 2, 47, 45, 'Venta Boleta B001-00001', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 'ENTRADA_INICIAL', 32, 0, 32, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(2, 'SALIDA_VENTA', 2, 32, 30, 'Venta Boleta B001-00002', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, 'ENTRADA_INICIAL', 21, 0, 21, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(5, 'SALIDA_VENTA', 1, 21, 20, 'Venta Boleta B001-00002', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 'ENTRADA_INICIAL', 25, 0, 25, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(4, 'ENTRADA_INICIAL', 40, 0, 40, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(6, 'ENTRADA_INICIAL', 35, 0, 35, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(7, 'ENTRADA_INICIAL', 50, 0, 50, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(8, 'ENTRADA_INICIAL', 4, 0, 4, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(9, 'ENTRADA_INICIAL', 2, 0, 2, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(10, 'ENTRADA_INICIAL', 3, 0, 3, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(11, 'ENTRADA_INICIAL', 1, 0, 1, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 4 HOUR));
