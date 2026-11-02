const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// =========================================================================
// MIDDLEWARES GLOBALES Y SEGURIDAD DEFENSIVA (OWASP)
// =========================================================================
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Normaliza un registro de la tabla productos para garantizar tipos numéricos
 * exactos en el JSON consumido por el frontend.
 */
function normalizarProducto(row) {
    const stock = Number(row.stock);
    const stockMinimo = Number(row.stock_minimo);
    return {
        id_producto: Number(row.id_producto),
        nombre: row.nombre,
        categoria: row.categoria,
        precio: Number(row.precio),
        stock,
        stock_minimo: stockMinimo,
        en_alerta: stock <= stockMinimo,
        brecha_reposicion: stock <= stockMinimo ? Math.max(stockMinimo * 2 - stock, stockMinimo - stock + 5) : 0
    };
}

// =========================================================================
// ENDPOINT 1: Listar Catálogo de Productos (GET /api/productos)
// Contrato PLAN.md Sección 4.1
// =========================================================================
app.get('/api/productos', async (req, res) => {
    try {
        const sql = `
            SELECT id_producto, nombre, categoria, precio, stock, stock_minimo 
            FROM productos 
            ORDER BY nombre ASC;
        `;
        const [rows] = await pool.query(sql);
        return res.status(200).json(rows.map(normalizarProducto));
    } catch (error) {
        console.error('[GET /api/productos] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al consultar el catálogo de medicamentos.'
        });
    }
});

// =========================================================================
// ENDPOINT 2: Listar Productos con Alerta de Reposición (GET /api/alertas)
// Contrato PLAN.md Sección 4.2 (stock <= stock_minimo)
// =========================================================================
app.get('/api/alertas', async (req, res) => {
    try {
        const sql = `
            SELECT id_producto, nombre, categoria, precio, stock, stock_minimo 
            FROM productos 
            WHERE stock <= stock_minimo 
            ORDER BY stock ASC;
        `;
        const [rows] = await pool.query(sql);
        return res.status(200).json(rows.map(normalizarProducto));
    } catch (error) {
        console.error('[GET /api/alertas] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al consultar las alertas de bajo stock.'
        });
    }
});

// =========================================================================
// ENDPOINT 3: Registrar Nuevo Medicamento (POST /api/productos)
// Contrato PLAN.md Sección 4.3
// =========================================================================
app.post('/api/productos', async (req, res) => {
    try {
        // Prevención de Mass Assignment: filtrar estrictamente los campos permitidos
        const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
        const categoria = typeof req.body?.categoria === 'string' ? req.body.categoria.trim() : '';
        const precio = Number(req.body?.precio);
        const stock = Number.parseInt(req.body?.stock, 10);
        const stockMinimo = req.body?.stock_minimo !== undefined
            ? Number.parseInt(req.body.stock_minimo, 10)
            : 10;

        if (!nombre || nombre.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del medicamento es obligatorio (máx. 100 caracteres).'
            });
        }

        if (!categoria || categoria.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'La categoría farmacológica es obligatoria (máx. 50 caracteres).'
            });
        }

        if (!Number.isFinite(precio) || precio <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio unitario debe ser mayor a S/ 0.00.'
            });
        }

        if (!Number.isInteger(stock) || stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock inicial debe ser un número entero mayor o igual a 0.'
            });
        }

        if (!Number.isInteger(stockMinimo) || stockMinimo < 1) {
            return res.status(400).json({
                success: false,
                message: 'El stock mínimo de alerta debe ser al menos 1 unidad.'
            });
        }

        const sql = `
            INSERT INTO productos (nombre, categoria, precio, stock, stock_minimo) 
            VALUES (?, ?, ?, ?, ?);
        `;
        const [result] = await pool.execute(sql, [
            nombre,
            categoria,
            Number(precio.toFixed(2)),
            stock,
            stockMinimo
        ]);

        return res.status(201).json({
            success: true,
            message: 'Producto registrado correctamente',
            id_producto: result.insertId
        });
    } catch (error) {
        console.error('[POST /api/productos] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno al registrar el nuevo medicamento.'
        });
    }
});

// =========================================================================
// ENDPOINT ADICIONAL ERP: Reabastecer Stock Rápido (PUT /api/productos/:id/stock)
// Permite reponer existencias directamente desde el módulo de Alertas
// =========================================================================
app.put('/api/productos/:id/stock', async (req, res) => {
    try {
        const idProducto = Number.parseInt(req.params.id, 10);
        const cantidadIngreso = Number.parseInt(req.body?.cantidad, 10);

        if (!Number.isInteger(idProducto) || idProducto <= 0) {
            return res.status(400).json({ success: false, message: 'ID de producto inválido.' });
        }

        if (!Number.isInteger(cantidadIngreso) || cantidadIngreso <= 0 || cantidadIngreso > 10000) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad de reposición debe ser un entero entre 1 y 10,000.'
            });
        }

        const [result] = await pool.execute(
            'UPDATE productos SET stock = stock + ? WHERE id_producto = ?;',
            [cantidadIngreso, idProducto]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Medicamento no encontrado.' });
        }

        const [rows] = await pool.execute(
            'SELECT id_producto, nombre, categoria, precio, stock, stock_minimo FROM productos WHERE id_producto = ?;',
            [idProducto]
        );

        return res.status(200).json({
            success: true,
            message: `Se ingresaron +${cantidadIngreso} unidades al almacén.`,
            producto: normalizarProducto(rows[0])
        });
    } catch (error) {
        console.error('[PUT /api/productos/:id/stock] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno al actualizar el stock del medicamento.'
        });
    }
});

// =========================================================================
// ENDPOINT 4: Registrar Venta con Descuento Atómico de Stock (POST /api/ventas)
// Contrato PLAN.md Sección 4.4 (Transacción SQL ACID: START TRANSACTION / COMMIT / ROLLBACK)
// =========================================================================
app.post('/api/ventas', async (req, res) => {
    const clienteInput = typeof req.body?.cliente === 'string' ? req.body.cliente.trim() : '';
    const cliente = (clienteInput || 'Público General').slice(0, 100);
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

    if (rawItems.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'El carrito de despacho está vacío. Agregue al menos un medicamento.'
        });
    }

    // Consolidar ítems repetidos por id_producto para validar stock real total
    const mapaItems = new Map();
    for (const item of rawItems) {
        const idProducto = Number.parseInt(item?.id_producto, 10);
        const cantidad = Number.parseInt(item?.cantidad, 10);

        if (!Number.isInteger(idProducto) || idProducto <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos de ítem inválidos: id_producto y cantidad deben ser enteros positivos.'
            });
        }

        const acumulado = mapaItems.get(idProducto) || 0;
        mapaItems.set(idProducto, acumulado + cantidad);
    }

    let conn;
    try {
        // 1. Iniciar transacción SQL segura
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 2. Generar número de comprobante único (ej: B001-98765)
        const numeroComprobante = `B001-${Date.now().toString().slice(-5)}`;

        let montoTotal = 0;
        const detallesParaInsertar = [];

        // 3. Verificar existencias reales bloqueando las filas involucradas (FOR UPDATE)
        for (const [idProducto, cantidadSolicitada] of mapaItems.entries()) {
            const [rows] = await conn.execute(
                'SELECT id_producto, nombre, precio, stock FROM productos WHERE id_producto = ? FOR UPDATE;',
                [idProducto]
            );

            if (rows.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    success: false,
                    message: `El medicamento con ID #${idProducto} no existe en el catálogo.`
                });
            }

            const producto = rows[0];
            const stockActual = Number(producto.stock);

            if (stockActual < cantidadSolicitada) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para "${producto.nombre}". Disponible: ${stockActual} und., solicitado: ${cantidadSolicitada} und.`
                });
            }

            const precioUnitario = Number(producto.precio);
            const subtotal = Number((cantidadSolicitada * precioUnitario).toFixed(2));
            montoTotal = Number((montoTotal + subtotal).toFixed(2));

            detallesParaInsertar.push({
                id_producto: idProducto,
                nombre: producto.nombre,
                cantidad: cantidadSolicitada,
                precio_unitario: precioUnitario,
                subtotal
            });
        }

        // 4. Insertar cabecera en tabla ventas
        const [ventaResult] = await conn.execute(
            'INSERT INTO ventas (numero_comprobante, cliente, total) VALUES (?, ?, ?);',
            [numeroComprobante, cliente, montoTotal]
        );
        const idVenta = ventaResult.insertId;

        // 5. Insertar en detalle_ventas y descontar stock atómicamente
        for (const item of detallesParaInsertar) {
            await conn.execute(
                `INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) 
                 VALUES (?, ?, ?, ?, ?);`,
                [idVenta, item.id_producto, item.cantidad, item.precio_unitario, item.subtotal]
            );

            await conn.execute(
                'UPDATE productos SET stock = stock - ? WHERE id_producto = ?;',
                [item.cantidad, item.id_producto]
            );
        }

        // 6. Confirmar transacción
        await conn.commit();

        return res.status(201).json({
            success: true,
            message: 'Venta procesada con éxito',
            id_venta: idVenta,
            comprobante: numeroComprobante,
            cliente,
            total: montoTotal,
            items: detallesParaInsertar
        });
    } catch (error) {
        if (conn) {
            try {
                await conn.rollback();
            } catch (rbErr) {
                console.error('[POST /api/ventas] Error en rollback:', rbErr.message);
            }
        }
        console.error('[POST /api/ventas] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error crítico al procesar la venta en la base de datos.'
        });
    } finally {
        // 7. Liberar conexión de vuelta al pool
        if (conn) {
            conn.release();
        }
    }
});

// =========================================================================
// ENDPOINT 5: Historial Reciente de Ventas (GET /api/ventas)
// Contrato PLAN.md Sección 4.5
// =========================================================================
app.get('/api/ventas', async (req, res) => {
    try {
        const sql = `
            SELECT 
                v.id_venta,
                v.numero_comprobante,
                v.cliente,
                v.total,
                v.fecha,
                COALESCE(SUM(dv.cantidad), 0) AS total_unidades
            FROM ventas v
            LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
            GROUP BY v.id_venta, v.numero_comprobante, v.cliente, v.total, v.fecha
            ORDER BY v.fecha DESC 
            LIMIT 15;
        `;
        const [rows] = await pool.query(sql);
        const ventas = rows.map((r) => ({
            id_venta: Number(r.id_venta),
            numero_comprobante: r.numero_comprobante,
            cliente: r.cliente,
            total: Number(r.total),
            fecha: r.fecha,
            total_unidades: Number(r.total_unidades)
        }));
        return res.status(200).json(ventas);
    } catch (error) {
        console.error('[GET /api/ventas] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al consultar el historial reciente de ventas.'
        });
    }
});

// =========================================================================
// ENDPOINT ADICIONAL ERP: Detalle de un Comprobante (GET /api/ventas/:id)
// =========================================================================
app.get('/api/ventas/:id', async (req, res) => {
    try {
        const idVenta = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(idVenta) || idVenta <= 0) {
            return res.status(400).json({ success: false, message: 'ID de venta inválido.' });
        }

        const [ventaRows] = await pool.execute(
            'SELECT id_venta, numero_comprobante, cliente, total, fecha FROM ventas WHERE id_venta = ?;',
            [idVenta]
        );

        if (ventaRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado.' });
        }

        const [detalleRows] = await pool.execute(
            `SELECT dv.id_detalle, dv.id_producto, p.nombre, p.categoria, dv.cantidad, dv.precio_unitario, dv.subtotal
             FROM detalle_ventas dv
             INNER JOIN productos p ON dv.id_producto = p.id_producto
             WHERE dv.id_venta = ?;`,
            [idVenta]
        );

        return res.status(200).json({
            success: true,
            venta: {
                id_venta: Number(ventaRows[0].id_venta),
                numero_comprobante: ventaRows[0].numero_comprobante,
                cliente: ventaRows[0].cliente,
                total: Number(ventaRows[0].total),
                fecha: ventaRows[0].fecha,
                items: detalleRows.map((d) => ({
                    id_producto: Number(d.id_producto),
                    nombre: d.nombre,
                    categoria: d.categoria,
                    cantidad: Number(d.cantidad),
                    precio_unitario: Number(d.precio_unitario),
                    subtotal: Number(d.subtotal)
                }))
            }
        });
    } catch (error) {
        console.error('[GET /api/ventas/:id] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el detalle del comprobante.'
        });
    }
});

// =========================================================================
// ARRANQUE DEL SERVIDOR EXPRESS
// =========================================================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor ERP/POS Botica "Nova Salud" activo en http://localhost:${PORT}`);
});
