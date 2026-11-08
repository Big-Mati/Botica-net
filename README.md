# 🏥 Botica Nova — Sistema Web de Gestión de Inventario y Ventas (BoticaNet+)
### ERP & Terminal POS Farmacéutico con Pantalla de Cliente Mobile-First (Customer-Facing Display)

---

## 🌟 Descripción General

**BoticaNet+ Nova** es una plataforma integral de gestión farmacéutica desarrollada para la botica **"Botica Nova"**. Resuelve de forma definitiva los problemas de desabastecimiento, quiebres de stock y demoras en caja mediante una arquitectura desacoplada y moderna:

* **Backend:** API REST en **Node.js + Express** con transacciones atómicas seguras en **MySQL** (`mysql2/promise`), soporte nativo para despliegue en la nube (`process.env.DB_*`, `CORS_ORIGIN`) y sincronización ultraligera en memoria RAM para dispositivos móviles.
* **Frontend:** Aplicación de alto rendimiento en **React 19 + Vite** (`client/`), con aceleración gráfica por GPU, semáforo clínico de inventario en 3 niveles (`<= 15` crítico, `16–30` medio, `> 30` óptimo), emisión inmediata de Boleta Electrónica SUNAT en caja y estética visual clínica de alta gama.
* **Customer-Facing Display (CFD):** Visor de cliente *Mobile-First* sincronizado en tiempo real con el Terminal POS para correr en el smartphone del profesor o en ventana simulada, con soporte para códigos QR reales (`yape.jpeg` y `plin.jpeg`) y generador QR de conexión 100% offline.

---

## 🛡️ ARQUITECTURA DE LAS 3 CONTINGENCIAS (ZERO-FAIL DEMO)

> [!IMPORTANT]
> Para garantizar que tu sustentación y demostración ante el jurado sea **100% libre de fallos** ante cualquier imprevisto de red o laboratorio, el sistema incorpora **3 Planes de Demostración Simultáneos**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ PLAN A (Nube / Vercel + Render):                                       │
│ • La laptop y el celular tienen acceso a Internet.                     │
│ • La laptop corre el POS y el smartphone del profesor abre la URL.     │
├────────────────────────────────────────────────────────────────────────┤
│ PLAN B (Red Local / Hotspot de Windows - 100% Offline):                │
│ • No hay Internet en el aula/laboratorio.                              │
│ • La laptop activa "Zona con cobertura inalámbrica móvil" (Hotspot).   │
│ • El celular se conecta al Wi-Fi de la laptop y escanea el QR con la   │
│   IP local detectada automáticamente (ej: http://192.168.137.1:5173).  │
├────────────────────────────────────────────────────────────────────────┤
│ PLAN C (Misma PC / Ventana Flotante Simulada - EL SALVA-VIDAS):        │
│ • El profesor no saca su celular o no hay conexión posible.            │
│ • Un solo clic en [📱 Visor Cliente] -> [🖥️ Abrir Simulador Móvil].    │
│ • Abre una ventana emergente vertical exacta (420x880px) a la derecha. │
│ • Sincronización instantánea a 0 ms por BroadcastChannel de memoria.   │
└────────────────────────────────────────────────────────────────────────┘
```

### ⚡ ¿Cómo activar el Plan C en un solo paso?
1. En el encabezado del Terminal POS, haz clic en el botón verde **`[📱 Visor Cliente]`**.
2. Presiona el botón verde grande: **`[🚀 Abrir Simulador Móvil en esta PC]`**.
3. ¡Listo! Se abrirá una ventana emergente vertical que replica con fidelidad milimétrica la pantalla del smartphone del cliente al lado derecho de tu monitor. Cada medicamento escaneado, método de pago o vuelto en la PC se reflejará a **0 ms sin requerir Internet**.

---

## 📱 Pantalla de Cliente Mobile-First (Customer-Facing Display)

Diseñada bajo estándares de concurso (Combinación 1A + 2A + 3A + 4A + 5A) para pantallas verticales de smartphones (`max-width: 480px; min-height: 100dvh`):

1. **🌿 Estado 1: `IDLE` (En Espera & Salud):**
   - Halo radial verde esmeralda, reloj en tiempo real (`HH:MM AM/PM`) y baliza activa `● Caja 01 Disponible`.
   - Tarjeta de bienvenida con respiración suave del isotipo médico.
   - Carrusel automático de 3 consejos farmacéuticos rotando cada 5 segundos (genéricos bioequivalentes, control FEFO/DIGEMID y boleta con DNI).
2. **🛒 Estado 2: `CARRITO` (Apple Wallet / Porcelain):**
   - Entrada física de resorte elástico (`@keyframes cfdSpringDrop`) para cada producto escaneado.
   - Resaltado especial con badge `✨ Registrado en caja` en el último producto ingresado.
   - Miniaturas nítidas WebP (`/productos/*.webp`), píldora `x{cant} und.`, precio y subtotal.
   - Banner dinámico cuando se recibe efectivo: `Efectivo entregado: S/ ...` ➔ **`Su vuelto: S/ ...`**.
   - Dock inferior fijo con desenfoque de cristal (`backdrop-filter: blur(20px)`), desglose de Op. Gravada, IGV 18% y **Total a pagar** en tipografía monumental `2.15rem`.
3. **💜 Estado 3A: `PAGO_YAPE` (Inmersión Pantalla Completa · QR Reales Yape / Plin):**
   - Selector interactivo **`QR Yape` | `QR Plin`** con transición automática entre fondo púrpura (`#742384`) y azul/turquesa Plin (`#00d3b5`).
   - Carga directa de los códigos QR oficiales (`client/public/qr/yape.jpeg` y `plin.jpeg`) con respaldo vectorial automático.
   - Esquinas de encuadre y haz láser horizontal animado que sube y baja.
   - Comercio verificado `✓ BOTICA NOVA S.A.C.` y monto exacto en tipografía gigante.
4. **💳 Estado 3B: `PAGO_TARJETA` (Terminal Contactless NFC):**
   - Fondo azul noche obsidiana (`#0f172a`), ondas de radar NFC concéntricas animadas en esmeralda y cian, monto exacto e instrucción interactiva.
5. **🧾 Estado 4: `COMPROBANTE` (Ticket Digital Térmico en Visor y en Caja POS):**
   - Apertura instantánea del **Recibo Térmico SUNAT** tanto en la pantalla del cajero (`PosPage.jsx`) como en el smartphone del cliente (`CustomerDisplay.jsx`).
   - Vibración háptica en smartphones (`navigator.vibrate([70, 40, 100])`) al confirmarse el cobro.
   - Ticket digital de papel blanco con **bordes dentados en zig-zag (CSS clip-path)**, serie correlativa `B001-XXXXX`, desglose de Op. Gravada, IGV 18%, efectivo recibido/vuelto, QR SUNAT y botones para **Imprimir/PDF** (`@media print` limpio) y **Compartir por WhatsApp**.

---

## 🔐 Cockpit Espacial de Autenticación (`LoginHUD`)

* **Video Cinemático en Bucle:** Alternancia suave entre videos de fondo (`video1.mp4` y `video2.mp4`).
* **Telemetría de Base de Datos en Vivo:** Píldora de cristal escarchado con radar de ondas activo (`@keyframes radarPing`) e indicador de estado de conexión y reloj tabular sincronizado.
* **Brillo Automático del Botón:** Destello *shimmer* que cruza el botón de inicio de sesión automáticamente cada 4.5 segundos y al pasar el cursor.
* **Atajo F9 de Demostración Rápida:** Rellena las credenciales con efecto de mecanografía y accede al sistema en 1 segundo.

---

## 🗄️ Modelo y Diseño de la Base de Datos (`botica_net_db`)

El sistema cuenta con una arquitectura relacional normalizada de **7 tablas** para asegurar consistencia en ventas, control de vencimiento de medicamentos (**FEFO**), ubicación rápida en anaqueles y auditoría de Kardex en tiempo real:

<p align="center">
  <img src="img/db_design.jpg" alt="Diseño de la Base de Datos botica_net_db" width="100%" />
</p>

---

## 🚀 Guía de Instalación y Puesta en Marcha

### Paso 1: Requisitos Previos
* **Node.js** (v18 o superior): [https://nodejs.org](https://nodejs.org)
* **MySQL Server** (mediante **XAMPP**, WampServer o servicio nativo).

---

### Paso 2: Importar la Base de Datos
En tu gestor de base de datos MySQL (o phpMyAdmin):
1. Asegúrate de que el servicio MySQL esté corriendo.
2. Importa el archivo `database.sql` en la raíz del proyecto:
   ```bash
   mysql -u root -p < database.sql
   ```
*(Si usas XAMPP sin contraseña, presiona `Enter` cuando solicite password).*

---

### Paso 3: Instalar Dependencias (Raíz y Cliente)
Abre una terminal en la raíz del proyecto y ejecuta:

```bash
# 1. Instalar dependencias del Backend (Express, MySQL2)
npm install

# 2. Instalar dependencias del Frontend (React, Vite, Router)
npm --prefix client install
```

---

### Paso 4: Iniciar el Proyecto

Tienes dos formas sencillas de iniciarlo:

#### ⚡ Opción A: Modo Automatizado (1 Solo Comando — Recomendado)
Abre **una sola terminal** en la raíz del proyecto y ejecuta:
```bash
npm run dev
```
*Salida:* Gracias a `concurrently`, este comando levanta de forma simultánea el **Backend en el puerto 3000** (`[API]`) y el **Frontend en el puerto 5173** (`[VITE]`), sincronizados y con colores diferenciados. Para detener ambos servidores, presiona `Ctrl + C`.

---

#### 🛠️ Opción B: Modo Tradicional (Dos Terminales Separadas)
Si prefieres tener cada proceso en su propia ventana independiente:

* **Terminal 1 — Servidor Backend (Node.js Express):**
  ```bash
  npm start
  ```
  *Al abrir `http://localhost:3000/` verás el **Explorador JSON de la API REST** con el estado de la BD y la lista de todos los endpoints.*

* **Terminal 2 — Frontend React + Vite (Abierto a la Red Local):**
  ```bash
  npm run client
  ```
  *Al abrir `http://localhost:5173/` verás la interfaz clínica completa (Login HUD, POS, Inventario, Alertas y Kardex).*

> [!TIP]
> Al estar configurado con `--host` y el generador QR nativo (`qrLocalMatrix.js`), cualquier smartphone conectado a la misma red Wi-Fi o Hotspot de Windows puede escanear el código QR del modal **Visor Cliente** sin requerir acceso a Internet.

---

### Paso 5: Compilación para Producción y Despliegue en la Nube (Build)
Si deseas generar la versión optimizada para producción o servir todo el sistema unificado desde `http://localhost:3000`:
```bash
npm --prefix client run build
```
Los archivos optimizados se generan en `client/dist/` y son detectados automáticamente por `index.js`. Para entornos cloud (Vercel + Render/Railway), el sistema soporta variables de entorno (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DB_SSL`, `CORS_ORIGIN` y `VITE_API_URL`).

---

## ⌨️ Atajos de Teclado y Credenciales de Demostración

| Atajo / Credencial | Acción / Función |
| :---: | :--- |
| **`vendedor` / `123`** | Credenciales oficiales de acceso al sistema en `LoginHUD`. |
| **`F9`** | **Auto-Login Demostrativo:** Escribe automáticamente las credenciales y accede a caja. |
| **`F2`** | **Búsqueda Rápida en POS:** Enfoca de inmediato el buscador de medicamentos y lotes. |
| **`F12`** | **Cobro Rápido en Caja:** Emite la Boleta Electrónica SUNAT y abre el recibo térmico. |
| **`Esc`** | **Cerrar Recibo / Nueva Venta:** Cierra el modal de boleta en caja y prepara el siguiente despacho. |
| **`Alt + L`** | **Bloqueo Inmediato:** Bloquea la sesión del cajero y regresa al cockpit 3D (también se activa tras 2 min de inactividad). |
| **`[📱 Visor Cliente]`** | Abre el modal de sincronización con QR 100% offline y simulador de celular en PC. |
| **`/?visor=cliente`** | URL directa para cargar la Pantalla de Cliente en cualquier smartphone. |

---

## 🔌 Especificación Completa de la API REST (12 Endpoints)

| Método | Endpoint | Descripción | Estado HTTP |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/login` | Autenticación de operadores contra la tabla `vendedores` en MySQL. | `200 OK` |
| `GET` | `/api/productos` | Catálogo completo con join FEFO 1:1 de lotes y ubicaciones. | `200 OK` |
| `GET` | `/api/alertas` | Medicamentos con stock crítico ($stock \le stock\_minimo$). | `200 OK` |
| `POST` | `/api/productos` | Alta de nuevo medicamento con lote inicial y asiento en Kardex. | `201 Created` |
| `PUT` | `/api/productos/:id/stock` | Reabastecimiento rápido de existencias con registro en Kardex. | `200 OK` |
| `POST` | `/api/ventas` | Emisión de boleta con descuento atómico (`FOR UPDATE`) y Kardex. | `201 Created` |
| `GET` | `/api/ventas` | Historial correlativo de las últimas boletas emitidas. | `200 OK` |
| `GET` | `/api/ventas/:id` | Detalle fiscal y líneas de fármacos de un comprobante. | `200 OK` |
| `GET` | `/api/kardex` | Bitácora contable de entradas, salidas por venta y mermas. | `200 OK` |
| `GET` | `/api/categorias` | Listado de categorías terapéuticas activas. | `200 OK` |
| `GET` | `/api/lotes` | Control de lotes FEFO, fechas de vencimiento y anaqueles. | `200 OK` |
| **`GET/POST`** | **`/api/visor-estado`** | **CFD Omni-Sync:** Sincroniza en RAM carrito, QR, vuelto y boleta + IP local. | `200 OK` |

---

## 📁 Estructura del Código

```text
Botica_Net/
│
├── index.js                      # Backend Express, 12 endpoints REST, CORS y servidor SPA
├── db.js                         # Pool MySQL asíncrono (soporta XAMPP local y variables Cloud)
├── database.sql                  # DDL de 7 tablas relacionales y catálogo clínico inicial
├── package.json                  # Dependencias y scripts del servidor backend
├── README.md                     # Manual integral de arquitectura, instalación y uso
├── PLAN.md                       # Plan maestro de fases, requerimientos y contingencias
│
├── img/                          # Diagramas y capturas del sistema (db_design.jpg, etc.)
│
└── client/                       # Frontend SPA (React 19 + Vite)
    ├── package.json              # Dependencias y scripts del frontend (vite, build, lint)
    ├── vite.config.js            # Configuración de proxy /api y host para red local
    ├── vercel.json               # Reglas de reescritura SPA para despliegue en Vercel
    ├── public/
    │   ├── favicon.svg           # Isotipo oficial de Botica Nova
    │   ├── video1.mp4            # Video cinemático diurno de farmacia
    │   ├── video2.mp4            # Video cinemático de anaqueles
    │   ├── qr/                   # Códigos QR reales de recaudación (yape.jpeg y plin.jpeg)
    │   └── productos/            # 11 fotografías WebP verificadas en alta resolución
    └── src/
        ├── App.jsx               # Enrutador, watchdog de inactividad (2 min) y ?visor=cliente
        ├── App.css               # Sistema de diseño clínico, recibo térmico e impresión limpia
        ├── pages/
        │   ├── PosPage.jsx       # Terminal POS con Ticket de 5 pasos, Boleta en Caja y Omni-Sync
        │   ├── AlertasPage.jsx   # Semáforo completo (<=15 Rojo, 16-30 Amarillo, >30 Verde)
        │   ├── InventarioPage.jsx # Catálogo maestro FEFO y alta con selector visual WebP
        │   ├── KardexPage.jsx    # Auditoría contable de entradas, salidas y saldos
        │   └── ComprobantesPage.jsx # Historial correlativo SUNAT e inspección de boletas
        ├── components/
        │   ├── Navbar.jsx        # Barra superior ejecutiva con estado de turno y atajos
        │   ├── LoginHUD.jsx      # Cockpit 3D con videos en bucle, telemetría y atajo F9
        │   ├── CustomerDisplay.jsx # Visor de Cliente Mobile-First (4 estados + QR Yape/Plin)
        │   ├── PaymentQrBox.jsx  # Lector inteligente de QR reales (yape.jpeg / plin.jpeg)
        │   ├── VisorModal.jsx    # Modal Zero-Fail (QR Hotspot 100% offline + Simulador Plan C)
        │   └── Icons.jsx         # Sistema iconográfico vectorial clínico
        └── utils/
            ├── productImages.js  # Resolutor de imágenes WebP del catálogo farmacéutico
            ├── qrLocalMatrix.js  # Generador nativo de matriz QR ISO/IEC 18004 sin Internet
            └── apiBridge.js      # Puente transparente para VITE_API_URL en la nube
```

---

## 👨‍💻 Equipo de Desarrollo

| Mateo Vicente | Miguel Córdova |
| :---: | :---: |
| 🚀 FullStack Developer | 🚀 FullStack Developer |
| <picture><img src="https://github.com/mrpeak-1/MiniCientificos-Android/blob/main/.github-assets/programmer.gif?raw=true" width="160" alt="Mateo"></picture> | <picture><img src="https://github.com/mrpeak-1/MiniCientificos-Android/blob/main/.github-assets/programmer.gif?raw=true" width="160" alt="Miguel"></picture> |

<p align="center">
  <strong>© 2026 Botica_Net+ Nova — Software de Gestión Farmacéutica</strong>
</p>
