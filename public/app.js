/**
 * CONTROLADOR CLIENTE ERP & POS — BOTICA "NOVA SALUD" (FARMAPLUS)
 * Fase 4 del PLAN.md: Fetch API + Carrito + Web Audio API + Anime.js + Canvas 3D
 */

// =========================================================================
// 1. MÓDULO DE SONIDOS SINTETIZADOS (Web Audio API Nativa - Sección 5.3 PLAN.md)
// =========================================================================
const SoundEffects = (() => {
    let ctx = null;
    let enabled = true;

    function getContext() {
        if (!enabled) return null;
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) ctx = new AudioCtx();
        }
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    function playTone(freq, durationMs, type = 'sine', delayMs = 0, gainVal = 0.08) {
        const audio = getContext();
        if (!audio) return;

        setTimeout(() => {
            try {
                const osc = audio.createOscillator();
                const gain = audio.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, audio.currentTime);

                gain.gain.setValueAtTime(gainVal, audio.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + durationMs / 1000);

                osc.connect(gain);
                gain.connect(audio.destination);

                osc.start();
                osc.stop(audio.currentTime + durationMs / 1000);
            } catch (_) {
                // Ignorar si el navegador bloquea autoplay antes de interacción
            }
        }, delayMs);
    }

    return {
        click() {
            playTone(600, 40, 'sine', 0, 0.06);
        },
        success() {
            // Acorde armónico ascendente estilo caja registradora
            playTone(523.25, 110, 'triangle', 0, 0.09);   // C5
            playTone(659.25, 110, 'triangle', 90, 0.09);  // E5
            playTone(783.99, 140, 'triangle', 180, 0.09); // G5
            playTone(1046.5, 240, 'sine', 270, 0.11);     // C6
        },
        alert() {
            // Tono doble de precaución para stock crítico
            playTone(440, 120, 'sawtooth', 0, 0.07);
            playTone(349.23, 180, 'sawtooth', 150, 0.07);
        },
        toggle() {
            enabled = !enabled;
            if (enabled) this.click();
            return enabled;
        },
        isEnabled() {
            return enabled;
        }
    };
})();

// =========================================================================
// 2. ESTADO GLOBAL DE LA APLICACIÓN Y SANITIZACIÓN XSS (OWASP)
// =========================================================================
const AppState = {
    productos: [],
    alertas: [],
    ventas: [],
    carrito: new Map(), // id_producto -> { producto, cantidad }
    categoriaActiva: 'TODAS',
    busquedaPOS: '',
    busquedaInventario: '',
    procesandoVenta: false,
    procesandoProducto: false
};

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMoney(amount) {
    return `S/ ${Number(amount || 0).toFixed(2)}`;
}

function formatSku(id) {
    return `SKU-${String(id).padStart(4, '0')}`;
}

function getCategoryIcon(categoria) {
    const map = {
        'Analgésicos': 'fa-tablets',
        'Antiinflamatorios': 'fa-capsules',
        'Antibióticos': 'fa-shield-virus',
        'Antihistamínicos': 'fa-allergies',
        'Gastroenterología': 'fa-prescription-bottle',
        'Respiratorios': 'fa-lungs',
        'Vitaminas': 'fa-bolt',
        'Cuidado Personal': 'fa-pump-medical',
        'Material Médico': 'fa-kit-medical',
        'Dispositivos Médicos': 'fa-temperature-half'
    };
    return map[categoria] || 'fa-pills';
}

// =========================================================================
// 3. NOTIFICACIONES TOAST Y ANIMACIONES ANIME.JS
// =========================================================================
function mostrarToast(mensaje, tipo = 'ok') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${tipo === 'error' ? 'toast-error' : ''}`;
    const icon = tipo === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';

    toast.innerHTML = `
        <i class="fa-solid ${icon}" aria-hidden="true"></i>
        <span>${escapeHtml(mensaje)}</span>
    `;
    container.appendChild(toast);

    if (window.anime) {
        window.anime({
            targets: toast,
            translateX: [60, 0],
            opacity: [0, 1],
            duration: 320,
            easing: 'easeOutCubic'
        });
    }

    setTimeout(() => {
        if (window.anime) {
            window.anime({
                targets: toast,
                opacity: 0,
                translateX: 40,
                duration: 250,
                easing: 'easeInCubic',
                complete: () => toast.remove()
            });
        } else {
            toast.remove();
        }
    }, 3600);
}

// =========================================================================
// 4. NAVEGACIÓN ENTRE VISTAS DEL APP-SHELL (TABS)
// =========================================================================
function cambiarVista(targetId) {
    SoundEffects.click();

    const views = document.querySelectorAll('.workspace-view');
    const navButtons = document.querySelectorAll('.nav-item[data-target]');

    views.forEach((view) => {
        const isMatch = view.id === targetId;
        view.hidden = !isMatch;
        view.classList.toggle('active', isMatch);
    });

    navButtons.forEach((btn) => {
        const isMatch = btn.dataset.target === targetId;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    const targetEl = document.getElementById(targetId);
    if (targetEl && window.anime) {
        window.anime({
            targets: targetEl,
            opacity: [0.4, 1],
            translateY: [6, 0],
            duration: 240,
            easing: 'easeOutQuad'
        });
    }
}

// =========================================================================
// 5. CONSUMO DE API REST (FASE 2 -> FASE 4)
// =========================================================================
async function cargarDatosSistema(silencioso = false) {
    try {
        const [resProd, resAlertas, resVentas] = await Promise.all([
            fetch('/api/productos'),
            fetch('/api/alertas'),
            fetch('/api/ventas')
        ]);

        if (!resProd.ok || !resAlertas.ok || !resVentas.ok) {
            throw new Error('Error de comunicación con el servidor Express.');
        }

        AppState.productos = await resProd.json();
        AppState.alertas = await resAlertas.json();
        AppState.ventas = await resVentas.json();

        actualizarKPIs();
        renderizarCatalogoPOS();
        renderizarAlertas();
        renderizarTablaInventario();
        renderizarTablaVentas();
        sincronizarCarritoConStock();

        if (!silencioso && AppState.alertas.length > 0) {
            // Pulso sutil en el badge de alertas
            if (window.anime) {
                window.anime({
                    targets: '#nav-badge-alertas, #card-kpi-alertas',
                    scale: [1, 1.08, 1],
                    duration: 500,
                    easing: 'easeInOutSine'
                });
            }
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarToast('No se pudo sincronizar con MySQL. Verifica que el servidor esté activo.', 'error');
    }
}

function actualizarKPIs() {
    const totalProductos = AppState.productos.length;
    const totalUnidades = AppState.productos.reduce((acc, p) => acc + Number(p.stock), 0);
    const totalAlertas = AppState.alertas.length;
    const totalVentasMonto = AppState.ventas.reduce((acc, v) => acc + Number(v.total), 0);

    const elTotalProd = document.getElementById('kpi-total-productos');
    const elUnidades = document.getElementById('kpi-unidades-totales');
    const elAlertas = document.getElementById('kpi-productos-alerta');
    const elNavBadge = document.getElementById('nav-badge-alertas');
    const elBadgeAlertasView = document.getElementById('badge-total-alertas');
    const elVentasHoy = document.getElementById('kpi-ventas-hoy');
    const elCantVentas = document.getElementById('kpi-cantidad-ventas');

    if (elTotalProd) elTotalProd.textContent = String(totalProductos);
    if (elUnidades) elUnidades.textContent = `${totalUnidades} und. en almacén`;
    if (elAlertas) elAlertas.textContent = String(totalAlertas);
    if (elNavBadge) elNavBadge.textContent = String(totalAlertas);
    if (elBadgeAlertasView) elBadgeAlertasView.textContent = `${totalAlertas} productos críticos`;
    if (elVentasHoy) elVentasHoy.textContent = formatMoney(totalVentasMonto);
    if (elCantVentas) elCantVentas.textContent = `${AppState.ventas.length} comprobantes`;
}

// =========================================================================
// 6. RENDERIZADO DEL CATÁLOGO POS Y FILTROS EN TIEMPO REAL
// =========================================================================
function obtenerProductosFiltradosPOS() {
    const termino = AppState.busquedaPOS.trim().toLowerCase();
    return AppState.productos.filter((p) => {
        const coincideCategoria =
            AppState.categoriaActiva === 'TODAS' || p.categoria === AppState.categoriaActiva;
        const sku = formatSku(p.id_producto).toLowerCase();
        const coincideTexto =
            !termino ||
            p.nombre.toLowerCase().includes(termino) ||
            p.categoria.toLowerCase().includes(termino) ||
            sku.includes(termino);
        return coincideCategoria && coincideTexto;
    });
}

function renderizarCatalogoPOS() {
    const grid = document.getElementById('grid-productos');
    const emptyState = document.getElementById('pos-sin-resultados');
    if (!grid) return;

    const filtrados = obtenerProductosFiltradosPOS();

    if (filtrados.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.hidden = false;
        return;
    }

    if (emptyState) emptyState.hidden = true;

    grid.innerHTML = filtrados
        .map((prod) => {
            const esCritico = prod.stock <= prod.stock_minimo;
            const agotado = prod.stock <= 0;
            const icon = getCategoryIcon(prod.categoria);
            const badgeClass = esCritico ? 'stock-badge-critical' : 'stock-badge-ok';
            const badgeText = agotado
                ? 'AGOTADO'
                : esCritico
                ? `CRÍTICO: ${prod.stock} UND`
                : `STOCK: ${prod.stock} UND`;

            return `
                <article
                    class="producto-card ${esCritico ? 'card-low-stock' : ''} ${agotado ? 'card-out-of-stock' : ''}"
                    data-id="${prod.id_producto}"
                    tabindex="0"
                    role="button"
                    aria-label="Agregar ${escapeHtml(prod.nombre)} al ticket por ${formatMoney(prod.precio)}">
                    <div class="prod-card-head">
                        <span class="prod-sku-tag">${formatSku(prod.id_producto)}</span>
                        <span class="prod-stock-badge ${badgeClass}">${badgeText}</span>
                    </div>

                    <div class="prod-card-body">
                        <span class="prod-cat-label">
                            <i class="fa-solid ${icon}" aria-hidden="true"></i>
                            ${escapeHtml(prod.categoria)}
                        </span>
                        <h3 class="prod-title">${escapeHtml(prod.nombre)}</h3>
                    </div>

                    <div class="prod-card-foot">
                        <div class="prod-price-wrap">
                            <span class="prod-price-caption">Precio Unit.</span>
                            <strong class="prod-price-val">${formatMoney(prod.precio)}</strong>
                        </div>
                        <button
                            type="button"
                            class="btn-pos-add"
                            data-add-id="${prod.id_producto}"
                            ${agotado ? 'disabled' : ''}
                            title="Agregar al ticket">
                            <i class="fa-solid fa-plus" aria-hidden="true"></i>
                        </button>
                    </div>
                </article>
            `;
        })
        .join('');
}

// =========================================================================
// 7. CONTROL DEL CARRITO / CAJA REGISTRADORA Y CÁLCULO DE VUELTO
// =========================================================================
function sincronizarCarritoConStock() {
    for (const [id, item] of AppState.carrito.entries()) {
        const prodActual = AppState.productos.find((p) => p.id_producto === id);
        if (!prodActual || prodActual.stock <= 0) {
            AppState.carrito.delete(id);
        } else {
            item.producto = prodActual;
            if (item.cantidad > prodActual.stock) {
                item.cantidad = prodActual.stock;
            }
        }
    }
    renderizarCarrito();
}

function agregarAlCarrito(idProducto) {
    const producto = AppState.productos.find((p) => p.id_producto === Number(idProducto));
    if (!producto) return;

    if (producto.stock <= 0) {
        SoundEffects.alert();
        mostrarToast(`"${producto.nombre}" se encuentra sin existencias.`, 'error');
        return;
    }

    const existente = AppState.carrito.get(producto.id_producto);
    const nuevaCantidad = existente ? existente.cantidad + 1 : 1;

    if (nuevaCantidad > producto.stock) {
        SoundEffects.alert();
        mostrarToast(`Stock máximo alcanzado para "${producto.nombre}" (${producto.stock} und).`, 'error');
        return;
    }

    AppState.carrito.set(producto.id_producto, {
        producto,
        cantidad: nuevaCantidad
    });

    if (producto.stock <= producto.stock_minimo) {
        SoundEffects.alert();
    } else {
        SoundEffects.click();
    }

    renderizarCarrito();
}

function modificarCantidadCarrito(idProducto, delta) {
    const item = AppState.carrito.get(Number(idProducto));
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad <= 0) {
        AppState.carrito.delete(Number(idProducto));
        SoundEffects.click();
    } else if (nuevaCantidad > item.producto.stock) {
        SoundEffects.alert();
        mostrarToast(`Solo hay ${item.producto.stock} unidades disponibles en almacén.`, 'error');
        return;
    } else {
        item.cantidad = nuevaCantidad;
        SoundEffects.click();
    }

    renderizarCarrito();
}

function vaciarCarrito() {
    AppState.carrito.clear();
    SoundEffects.click();
    renderizarCarrito();
}

function obtenerTotalCarrito() {
    let total = 0;
    for (const { producto, cantidad } of AppState.carrito.values()) {
        total += Number(producto.precio) * cantidad;
    }
    return Number(total.toFixed(2));
}

function actualizarVuelto() {
    const inputEfectivo = document.getElementById('input-efectivo');
    const elVuelto = document.getElementById('vuelto-cliente');
    if (!inputEfectivo || !elVuelto) return;

    const total = obtenerTotalCarrito();
    const recibido = Number(inputEfectivo.value);

    if (!RecibidoValido(recibido) || total === 0 || recibido < total) {
        elVuelto.textContent = 'S/ 0.00';
        return;
    }
    elVuelto.textContent = formatMoney(recibido - total);
}

function RecibidoValido(val) {
    return Number.isFinite(val) && val > 0;
}

function renderizarCarrito() {
    const container = document.getElementById('carrito-items');
    const contador = document.getElementById('carrito-contador');
    const btnVaciar = document.getElementById('btn-vaciar-carrito');
    const btnConfirmar = document.getElementById('btn-confirmar-venta');
    const elSubtotal = document.getElementById('carrito-subtotal');
    const elIgv = document.getElementById('carrito-igv');
    const elTotal = document.getElementById('carrito-total');

    if (!container) return;

    let totalUnidades = 0;
    const totalImporte = obtenerTotalCarrito();

    for (const item of AppState.carrito.values()) {
        totalUnidades += item.cantidad;
    }

    if (contador) contador.textContent = `${totalUnidades} und.`;
    if (btnVaciar) btnVaciar.disabled = AppState.carrito.size === 0;
    if (btnConfirmar) btnConfirmar.disabled = AppState.carrito.size === 0 || AppState.procesandoVenta;

    const opGravada = totalImporte / 1.18;
    const igv = totalImporte - opGravada;

    if (elSubtotal) elSubtotal.textContent = formatMoney(opGravada);
    if (elIgv) elIgv.textContent = formatMoney(igv);
    if (elTotal) elTotal.textContent = formatMoney(totalImporte);

    actualizarVuelto();

    if (AppState.carrito.size === 0) {
        container.innerHTML = `
            <div class="checkout-empty-state" id="carrito-vacio-msg">
                <div class="empty-cart-circle" aria-hidden="true">
                    <i class="fa-solid fa-basket-shopping"></i>
                </div>
                <p class="empty-cart-title">Ticket sin medicamentos</p>
                <p class="empty-cart-hint">Haz clic en cualquier producto del catálogo o escanea su código para agregarlo.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = Array.from(AppState.carrito.values())
        .map(({ producto, cantidad }) => {
            const sub = Number(producto.precio) * cantidad;
            return `
                <div class="cart-row" data-cart-id="${producto.id_producto}">
                    <div class="cart-row-info">
                        <div class="cart-row-title" title="${escapeHtml(producto.nombre)}">${escapeHtml(producto.nombre)}</div>
                        <div class="cart-row-meta">${formatMoney(producto.precio)} x ${cantidad} = <strong>${formatMoney(sub)}</strong></div>
                    </div>
                    <div class="cart-row-actions">
                        <button type="button" class="qty-btn" data-qty-id="${producto.id_producto}" data-delta="-1" aria-label="Disminuir cantidad">&minus;</button>
                        <span class="qty-num">${cantidad}</span>
                        <button type="button" class="qty-btn" data-qty-id="${producto.id_producto}" data-delta="1" aria-label="Aumentar cantidad">+</button>
                        <button type="button" class="qty-btn qty-btn-remove" data-qty-id="${producto.id_producto}" data-delta="-9999" title="Quitar ítem" aria-label="Eliminar ítem">
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            `;
        })
        .join('');
}

// =========================================================================
// 8. PROCESAMIENTO TRANSACCIONAL DE VENTA (POST /api/ventas)
// =========================================================================
async function procesarVenta(evento) {
    evento.preventDefault();
    if (AppState.carrito.size === 0 || AppState.procesandoVenta) return;

    const btnConfirmar = document.getElementById('btn-confirmar-venta');
    const textoBtn = document.getElementById('texto-btn-venta');
    const inputCliente = document.getElementById('input-cliente');
    const cliente = (inputCliente?.value || 'Público General').trim() || 'Público General';

    const itemsPayload = Array.from(AppState.carrito.values()).map(({ producto, cantidad }) => ({
        id_producto: producto.id_producto,
        cantidad,
        precio_unitario: Number(producto.precio)
    }));

    AppState.procesandoVenta = true;
    if (btnConfirmar) btnConfirmar.disabled = true;
    if (textoBtn) textoBtn.textContent = 'PROCESANDO TRANSACCIÓN...';

    try {
        const res = await fetch('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente, items: itemsPayload })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || 'No se pudo completar la venta.');
        }

        // Guardar copia para mostrar el voucher antes de limpiar el carrito
        const itemsVendidos = Array.from(AppState.carrito.values()).map(({ producto, cantidad }) => ({
            nombre: producto.nombre,
            cantidad,
            precio_unitario: Number(producto.precio),
            subtotal: Number(producto.precio) * cantidad
        }));

        SoundEffects.success();
        mostrarToast(`Comprobante ${data.comprobante} emitido por ${formatMoney(data.total)}`);

        // Limpiar carrito y campos
        AppState.carrito.clear();
        const inputEfectivo = document.getElementById('input-efectivo');
        if (inputEfectivo) inputEfectivo.value = '';
        if (inputCliente) inputCliente.value = 'Público General';

        await cargarDatosSistema(true);

        // Mostrar Voucher Electrónico
        abrirModalVoucher({
            numero_comprobante: data.comprobante,
            cliente,
            fecha: new Date().toLocaleString('es-PE'),
            total: data.total,
            items: itemsVendidos
        });
    } catch (error) {
        SoundEffects.alert();
        mostrarToast(error.message, 'error');
    } finally {
        AppState.procesandoVenta = false;
        if (textoBtn) textoBtn.textContent = 'EMITIR COMPROBANTE (F12)';
        renderizarCarrito();
    }
}

// =========================================================================
// 9. RENDERIZADO DE ALERTAS DE STOCK Y REABASTECIMIENTO EN 1 CLIC
// =========================================================================
function renderizarAlertas() {
    const grid = document.getElementById('grid-alertas');
    const empty = document.getElementById('alertas-sin-datos');
    if (!grid) return;

    if (AppState.alertas.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.hidden = false;
        return;
    }

    if (empty) empty.hidden = true;

    grid.innerHTML = AppState.alertas
        .map((prod) => {
            const brecha = Math.max(prod.stock_minimo * 2 - prod.stock, prod.stock_minimo - prod.stock + 10);
            return `
                <article class="alerta-card">
                    <div>
                        <div class="alerta-top">
                            <span class="prod-sku-tag">${formatSku(prod.id_producto)}</span>
                            <span class="prod-stock-badge stock-badge-critical">BAJO STOCK</span>
                        </div>
                        <h3 class="alerta-title" style="margin-top:0.55rem;">${escapeHtml(prod.nombre)}</h3>
                        <span class="prod-cat-label">${escapeHtml(prod.categoria)}</span>
                    </div>

                    <div class="alerta-metrics-row">
                        <div class="alerta-stat">
                            <span>Stock Actual</span>
                            <strong class="text-crimson">${prod.stock}</strong>
                        </div>
                        <div class="alerta-stat">
                            <span>Stock Mínimo</span>
                            <strong>${prod.stock_minimo}</strong>
                        </div>
                        <div class="alerta-stat">
                            <span>Sugerido Reponer</span>
                            <strong class="text-emerald">+${brecha} und</strong>
                        </div>
                    </div>

                    <div class="alerta-footer">
                        <span class="mono-text" style="font-size:0.78rem;color:var(--text-secondary);">
                            P. Unit: <strong>${formatMoney(prod.precio)}</strong>
                        </span>
                        <button
                            type="button"
                            class="btn btn-emerald"
                            data-reponer-id="${prod.id_producto}"
                            data-reponer-cant="${brecha}">
                            <i class="fa-solid fa-boxes-packing" aria-hidden="true"></i>
                            <span>Reabastecer +${brecha}</span>
                        </button>
                    </div>
                </article>
            `;
        })
        .join('');
}

async function reabastecerProducto(idProducto, cantidad) {
    try {
        SoundEffects.click();
        const res = await fetch(`/api/productos/${idProducto}/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Error al reabastecer stock.');
        }
        SoundEffects.success();
        mostrarToast(data.message);
        await cargarDatosSistema(true);
    } catch (error) {
        mostrarToast(error.message, 'error');
    }
}

// =========================================================================
// 10. RENDERIZADO DE TABLA DE INVENTARIO Y TABLA DE HISTORIAL DE VENTAS
// =========================================================================
function renderizarTablaInventario() {
    const tbody = document.getElementById('tabla-inventario-body');
    if (!tbody) return;

    const filtro = AppState.busquedaInventario.trim().toLowerCase();
    const lista = AppState.productos.filter((p) => {
        if (!filtro) return true;
        return (
            p.nombre.toLowerCase().includes(filtro) ||
            p.categoria.toLowerCase().includes(filtro) ||
            formatSku(p.id_producto).toLowerCase().includes(filtro)
        );
    });

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding:2rem;color:var(--text-muted);">
                    No se encontraron medicamentos con ese criterio.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista
        .map((p) => {
            const critico = p.stock <= p.stock_minimo;
            return `
                <tr class="${critico ? 'row-critical' : ''}">
                    <td class="mono-text">${formatSku(p.id_producto)}</td>
                    <td><strong>${escapeHtml(p.nombre)}</strong></td>
                    <td>${escapeHtml(p.categoria)}</td>
                    <td class="text-right mono-text"><strong>${formatMoney(p.precio)}</strong></td>
                    <td class="text-center mono-text ${critico ? 'text-crimson' : ''}"><strong>${p.stock}</strong></td>
                    <td class="text-center mono-text">${p.stock_minimo}</td>
                    <td class="text-center">
                        <span class="prod-stock-badge ${critico ? 'stock-badge-critical' : 'stock-badge-ok'}">
                            ${critico ? 'REPONER' : 'ABASTECIDO'}
                        </span>
                    </td>
                    <td class="text-center">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="min-height:32px;padding:0.25rem 0.65rem;font-size:0.75rem;"
                            data-ir-pos-id="${p.id_producto}"
                            ${p.stock <= 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Despachar
                        </button>
                    </td>
                </tr>
            `;
        })
        .join('');
}

function renderizarTablaVentas() {
    const tbody = document.getElementById('tabla-ventas-body');
    if (!tbody) return;

    if (AppState.ventas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding:2rem;color:var(--text-muted);">
                    Aún no se han registrado ventas.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = AppState.ventas
        .map((v) => {
            const fechaStr = new Date(v.fecha).toLocaleString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            return `
                <tr>
                    <td class="mono-text">#${String(v.id_venta).padStart(4, '0')}</td>
                    <td><strong class="mono-text text-emerald">${escapeHtml(v.numero_comprobante)}</strong></td>
                    <td>${escapeHtml(v.cliente)}</td>
                    <td class="text-center mono-text">${v.total_unidades || '-'}</td>
                    <td class="text-right mono-text"><strong>${formatMoney(v.total)}</strong></td>
                    <td class="text-right mono-text">${escapeHtml(fechaStr)}</td>
                    <td class="text-center">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="min-height:32px;padding:0.25rem 0.65rem;font-size:0.75rem;"
                            data-ver-voucher-id="${v.id_venta}">
                            <i class="fa-solid fa-receipt" aria-hidden="true"></i> Ver Ticket
                        </button>
                    </td>
                </tr>
            `;
        })
        .join('');
}

// =========================================================================
// 11. MODALES: ALTA DE MEDICAMENTO Y VOUCHER IMPRIMIBLE
// =========================================================================
function abrirModalProducto() {
    SoundEffects.click();
    const modal = document.getElementById('modal-producto');
    const card = document.getElementById('modal-producto-card');
    if (!modal) return;

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');

    if (window.anime && card) {
        window.anime({
            targets: card,
            scale: [0.92, 1],
            opacity: [0, 1],
            duration: 240,
            easing: 'easeOutCubic'
        });
    }

    setTimeout(() => document.getElementById('prod-nombre')?.focus(), 80);
}

function cerrarModalProducto() {
    const modal = document.getElementById('modal-producto');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
}

async function guardarNuevoProducto(evento) {
    evento.preventDefault();
    if (AppState.procesandoProducto) return;

    const nombre = document.getElementById('prod-nombre')?.value.trim();
    const categoria = document.getElementById('prod-categoria')?.value;
    const precio = Number(document.getElementById('prod-precio')?.value);
    const stock = Number.parseInt(document.getElementById('prod-stock')?.value, 10);
    const stockMinimo = Number.parseInt(document.getElementById('prod-stock-minimo')?.value, 10);

    if (!nombre || !categoria || !Number.isFinite(precio) || precio <= 0 || !Number.isInteger(stock) || stock < 0) {
        SoundEffects.alert();
        mostrarToast('Completa todos los campos del medicamento con valores válidos.', 'error');
        return;
    }

    const btnGuardar = document.getElementById('btn-guardar-producto');
    AppState.procesandoProducto = true;
    if (btnGuardar) btnGuardar.disabled = true;

    try {
        const res = await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                categoria,
                precio,
                stock,
                stock_minimo: stockMinimo || 10
            })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || 'No se pudo registrar el medicamento.');
        }

        SoundEffects.success();
        mostrarToast(`"${nombre}" incorporado al catálogo correctamente.`);
        document.getElementById('form-nuevo-producto')?.reset();
        cerrarModalProducto();
        await cargarDatosSistema(true);
    } catch (error) {
        SoundEffects.alert();
        mostrarToast(error.message, 'error');
    } finally {
        AppState.procesandoProducto = false;
        if (btnGuardar) btnGuardar.disabled = false;
    }
}

function abrirModalVoucher(venta) {
    const modal = document.getElementById('modal-voucher');
    if (!modal) return;

    const total = Number(venta.total || 0);
    const gravada = total / 1.18;
    const igv = total - gravada;

    document.getElementById('voucher-numero').textContent = venta.numero_comprobante;
    document.getElementById('voucher-cliente').textContent = venta.cliente;
    document.getElementById('voucher-fecha').textContent = venta.fecha;
    document.getElementById('voucher-subtotal').textContent = formatMoney(gravada);
    document.getElementById('voucher-igv').textContent = formatMoney(igv);
    document.getElementById('voucher-total').textContent = formatMoney(total);

    const tbody = document.getElementById('voucher-items-body');
    if (tbody) {
        tbody.innerHTML = (venta.items || [])
            .map(
                (i) => `
                <tr>
                    <td>${i.cantidad}</td>
                    <td>${escapeHtml(i.nombre)}</td>
                    <td class="text-right">${formatMoney(i.subtotal)}</td>
                </tr>
            `
            )
            .join('');
    }

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
}

async function consultarYMostrarVoucher(idVenta) {
    try {
        SoundEffects.click();
        const res = await fetch(`/api/ventas/${idVenta}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || 'No se pudo cargar el comprobante.');
        }
        abrirModalVoucher({
            numero_comprobante: data.venta.numero_comprobante,
            cliente: data.venta.cliente,
            fecha: new Date(data.venta.fecha).toLocaleString('es-PE'),
            total: data.venta.total,
            items: data.venta.items
        });
    } catch (error) {
        mostrarToast(error.message, 'error');
    }
}

// =========================================================================
// 12. MONITOR MOLECULAR 3D (CANVAS INTERACTIVO DE PARTÍCULAS MÉDICAS)
// =========================================================================
function iniciarCanvasMolecular() {
    const canvas = document.getElementById('particulas-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodos = Array.from({ length: 18 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        r: Math.random() * 2.2 + 1.6
    }));

    function animar() {
        if (document.hidden) {
            requestAnimationFrame(animar);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < nodos.length; i++) {
            const a = nodos[i];
            a.x += a.vx;
            a.y += a.vy;

            if (a.x < 10 || a.x > canvas.width - 10) a.vx *= -1;
            if (a.y < 10 || a.y > canvas.height - 10) a.vy *= -1;

            for (let j = i + 1; j < nodos.length; j++) {
                const b = nodos[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 78) {
                    ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - dist / 78) * 0.35})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }

            ctx.fillStyle = i % 4 === 0 ? '#10B981' : '#A7F3D0';
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animar);
    }

    requestAnimationFrame(animar);
}

// =========================================================================
// 13. INICIALIZACIÓN DE EVENTOS Y ATAJOS DE TECLADO DE CAJA
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Reloj en vivo del terminal
    const elReloj = document.getElementById('reloj-terminal');
    const tickReloj = () => {
        if (elReloj) {
            elReloj.textContent = new Date().toLocaleTimeString('es-PE', { hour12: false });
        }
    };
    tickReloj();
    setInterval(tickReloj, 1000);

    // Iniciar monitor 3D y cargar datos reales desde MySQL
    iniciarCanvasMolecular();
    cargarDatosSistema();

    // Navegación del Sidebar
    document.querySelectorAll('.nav-item[data-target]').forEach((btn) => {
        btn.addEventListener('click', () => cambiarVista(btn.dataset.target));
    });

    // Clic en el KPI de Alertas lleva directo a la vista de Alertas
    document.getElementById('card-kpi-alertas')?.addEventListener('click', () => {
        cambiarVista('seccion-alertas');
    });

    // Toggle de Audio UI
    document.getElementById('btn-toggle-audio')?.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const activo = SoundEffects.toggle();
        btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
        const icon = document.getElementById('icono-audio');
        if (icon) {
            icon.className = activo ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        }
    });

    // Buscador / Scanner POS (Enter agrega el primer resultado automáticamente)
    const inputBuscarPOS = document.getElementById('buscar-pos');
    inputBuscarPOS?.addEventListener('input', (e) => {
        AppState.busquedaPOS = e.target.value;
        renderizarCatalogoPOS();
    });

    inputBuscarPOS?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const filtrados = obtenerProductosFiltradosPOS();
            if (filtrados.length > 0) {
                agregarAlCarrito(filtrados[0].id_producto);
                inputBuscarPOS.select();
            }
        }
    });

    // Selector y Píldoras de Categoría
    const selectCat = document.getElementById('filtro-categoria-pos');
    const pillsContainer = document.getElementById('barra-categorias-pills');

    function fijarCategoria(cat) {
        AppState.categoriaActiva = cat;
        if (selectCat) selectCat.value = cat;
        pillsContainer?.querySelectorAll('.cat-pill').forEach((pill) => {
            pill.classList.toggle('active', pill.dataset.categoria === cat);
        });
        SoundEffects.click();
        renderizarCatalogoPOS();
    }

    selectCat?.addEventListener('change', (e) => fijarCategoria(e.target.value));
    pillsContainer?.addEventListener('click', (e) => {
        const pill = e.target.closest('.cat-pill');
        if (pill) fijarCategoria(pill.dataset.categoria);
    });

    // Delegación de clics en la grilla de productos POS
    document.getElementById('grid-productos')?.addEventListener('click', (e) => {
        const card = e.target.closest('.producto-card[data-id]');
        if (card) {
            agregarAlCarrito(Number(card.dataset.id));
        }
    });

    // Delegación de controles del Carrito (+ / - / eliminar)
    document.getElementById('carrito-items')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.qty-btn[data-qty-id]');
        if (btn) {
            modificarCantidadCarrito(Number(btn.dataset.qtyId), Number(btn.dataset.delta));
        }
    });

    document.getElementById('btn-vaciar-carrito')?.addEventListener('click', vaciarCarrito);
    document.getElementById('form-venta')?.addEventListener('submit', procesarVenta);

    // Píldoras de método de pago y cálculo de vuelto
    document.querySelectorAll('.pay-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pay-pill').forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            const cajaEfectivo = document.getElementById('caja-efectivo-box');
            if (cajaEfectivo) {
                cajaEfectivo.hidden = pill.dataset.metodo !== 'EFECTIVO';
            }
            SoundEffects.click();
        });
    });

    document.getElementById('input-efectivo')?.addEventListener('input', actualizarVuelto);

    // Botones de recarga
    document.getElementById('btn-recargar-catalogo')?.addEventListener('click', () => {
        SoundEffects.click();
        cargarDatosSistema();
        mostrarToast('Catálogo sincronizado con MySQL.');
    });
    document.getElementById('btn-refrescar-alertas')?.addEventListener('click', () => {
        SoundEffects.click();
        cargarDatosSistema();
    });
    document.getElementById('btn-refrescar-historial')?.addEventListener('click', () => {
        SoundEffects.click();
        cargarDatosSistema();
    });

    // Reabastecer desde Alertas
    document.getElementById('grid-alertas')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-reponer-id]');
        if (btn) {
            reabastecerProducto(Number(btn.dataset.reponerId), Number(btn.dataset.reponerCant));
        }
    });

    // Buscador de Inventario y acción rápida de enviar al POS
    document.getElementById('buscar-inventario')?.addEventListener('input', (e) => {
        AppState.busquedaInventario = e.target.value;
        renderizarTablaInventario();
    });

    document.getElementById('tabla-inventario-body')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-ir-pos-id]');
        if (btn) {
            agregarAlCarrito(Number(btn.dataset.irPosId));
            cambiarVista('seccion-pos');
        }
    });

    // Ver voucher desde Historial
    document.getElementById('tabla-ventas-body')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-ver-voucher-id]');
        if (btn) {
            consultarYMostrarVoucher(Number(btn.dataset.verVoucherId));
        }
    });

    // Modal Nuevo Medicamento
    document.getElementById('btn-nuevo-producto-header')?.addEventListener('click', abrirModalProducto);
    document.getElementById('btn-abrir-modal-producto')?.addEventListener('click', abrirModalProducto);
    document.getElementById('btn-cerrar-modal')?.addEventListener('click', cerrarModalProducto);
    document.getElementById('btn-cancelar-modal')?.addEventListener('click', cerrarModalProducto);
    document.getElementById('form-nuevo-producto')?.addEventListener('submit', guardarNuevoProducto);

    // Modal Voucher
    document.getElementById('btn-cerrar-voucher')?.addEventListener('click', () => {
        const m = document.getElementById('modal-voucher');
        if (m) m.hidden = true;
    });
    document.getElementById('btn-imprimir-voucher')?.addEventListener('click', () => {
        window.print();
    });

    // Atajos de teclado tipo Terminal POS (F1, F2, F3, F4, F12, Escape)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalProducto();
            const mv = document.getElementById('modal-voucher');
            if (mv) mv.hidden = true;
        } else if (e.key === 'F1') {
            e.preventDefault();
            cambiarVista('seccion-pos');
        } else if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
            e.preventDefault();
            cambiarVista('seccion-pos');
            inputBuscarPOS?.focus();
        } else if (e.key === 'F3') {
            e.preventDefault();
            cambiarVista('seccion-inventario');
        } else if (e.key === 'F4') {
            e.preventDefault();
            cambiarVista('seccion-historial');
        } else if (e.key === 'F12') {
            e.preventDefault();
            const btnVenta = document.getElementById('btn-confirmar-venta');
            if (btnVenta && !btnVenta.disabled) {
                btnVenta.click();
            }
        }
    });
});

