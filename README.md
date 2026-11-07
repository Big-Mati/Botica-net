# 🏥 Botica Nova — Sistema Web de Gestión de Inventario y Ventas (BoticaNet+)
### ERP & Terminal POS Farmacéutico con Pantalla de Cliente Mobile-First (Customer-Facing Display)

---

## 🌟 Descripción General

**BoticaNet+ Nova** es una plataforma integral de gestión farmacéutica desarrollada para la botica **"Botica Nova"**. Resuelve de forma definitiva los problemas de desabastecimiento, quiebres de stock y demoras en caja mediante una arquitectura desacoplada y moderna:

* **Backend:** API REST en **Node.js + Express** con transacciones atómicas seguras en **MySQL** (`mysql2/promise`) y sincronización ultraligera en memoria RAM para dispositivos móviles.
* **Frontend:** Aplicación de alto rendimiento en **React 19 + Vite** (`client/`), con aceleración gráfica por GPU, diseño responsivo, feedback háptico/sonoro con **Web Audio API** y estética visual clínica de alta gama.
* **Customer-Facing Display (CFD):** Visor de cliente *Mobile-First* sincronizado en tiempo real con el Terminal POS para correr en el smartphone del profesor o en ventana simulada.

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
3. **💜 Estado 3A: `PAGO_YAPE` (Inmersión Pantalla Completa):**
   - Fondo ciruela/púrpura (`#742384`) con acentos Plin (`#00d3b5`).
   - Tarjeta blanca central de alto contraste con **Código QR SVG grande (220x220px)**.
   - Esquinas de encuadre y haz láser horizontal animado que sube y baja.
   - Comercio verificado `✓ BOTICA NOVA S.A.C.` y monto exacto en tipografía gigante.
4. **💳 Estado 3B: `PAGO_TARJETA` (Terminal Contactless NFC):**
   - Fondo azul noche obsidiana (`#0f172a`), ondas de radar NFC concéntricas animadas en esmeralda y cian, monto exacto e instrucción interactiva.
5. **🧾 Estado 4: `COMPROBANTE` (Ticket Digital Térmico):**
   - Vibración háptica en smartphones (`navigator.vibrate([70, 40, 100])`) al confirmarse el cobro.
   - Ticket digital de papel blanco con **bordes dentados en zig-zag (CSS clip-path)**.
   - Datos fiscales, serie correlativa oficial `B001-XXXXX`, tabla de medicamentos, código QR oficial SUNAT y botones interactivos para **Imprimir/PDF** y **Compartir por WhatsApp**.

---

## 🔐 Cockpit Espacial de Autenticación (`LoginHUD`)

* **Video Cinemático en Bucle:** Alternancia suave entre videos de fondo (`video1.mp4` y `video2.mp4`).
* **Telemetría de Base de Datos en Vivo:** Píldora de cristal escarchado con radar de ondas activo (`@keyframes radarPing`) e indicador de estado de conexión y reloj tabular sincronizado.
* **Brillo Automático del Botón:** Destello *shimmer* que cruza el botón de inicio de sesión automáticamente cada 4.5 segundos y al pasar el cursor.
* **Atajo F9 de Demostración Rápida:** Rellena las credenciales con efecto de mecanografía y accede al sistema en 1 segundo.

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

### Paso 4: Iniciar el Proyecto (Modo Desarrollo Completo)

Para tener activa tanto la API REST con la base de datos como el frontend con soporte para red local Wi-Fi (`--host`), ejecuta en dos terminales:

#### Terminal 1 — Servidor Backend (Node.js Express):
```bash
npm start
```
*Salida esperada:*
```text
🚀 Servidor ERP/POS Botica "Nova Salud" activo en http://localhost:3000
✅ Conexion exitosa a la base de datos MySQL (botica_db)
```

#### Terminal 2 — Frontend React + Vite (Abierto a la Red Local):
```bash
npm run client
```
*Salida esperada:*
```text
  VITE v8.3.5  ready in 280 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.XX:5173/
```

> [!TIP]
> Al estar configurado con `--host`, cualquier smartphone conectado a la misma red Wi-Fi o Hotspot puede ingresar directamente mediante la URL de red (`Network`).

---

### Paso 5: Compilación para Producción (Build)
Si deseas generar la versión optimizada y empaquetada para producción:
```bash
npm --prefix client run build
```
Los archivos optimizados se generan en `client/dist/`.

---

## ⌨️ Atajos de Teclado y Credenciales de Demostración

| Atajo / Credencial | Acción / Función |
| :---: | :--- |
| **`vendedor` / `123`** | Credenciales oficiales de acceso al sistema en `LoginHUD`. |
| **`F9`** | **Auto-Login Demostrativo:** Escribe automáticamente las credenciales y accede a caja. |
| **`Alt + L`** | **Bloqueo Inmediato:** Bloquea la sesión del cajero y regresa al cockpit 3D. |
| **`F12`** | Emisión rápida de Boleta Electrónica en el POS. |
| **`[📱 Visor Cliente]`** | Abre el modal de sincronización con QR y simulador de celular en PC. |
| **`/?visor=cliente`** | URL directa para cargar la Pantalla de Cliente en cualquier smartphone. |

---

## 🔌 Especificación de la API REST

| Método | Endpoint | Descripción | Estado HTTP |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/productos` | Catálogo completo de medicamentos ordenado alfabéticamente. | `200 OK` |
| `GET` | `/api/alertas` | Medicamentos con stock crítico ($stock \le stock\_minimo$). | `200 OK` |
| `POST` | `/api/productos` | Registro de nuevos medicamentos en inventario. | `201 Created` |
| `POST` | `/api/ventas` | Emisión de venta con descuento atómico de stock (`FOR UPDATE`). | `201 Created` |
| `GET` | `/api/ventas` | Historial de las últimas ventas emitidas. | `200 OK` |
| `GET` | `/api/ventas/:id` | Detalle fiscal y líneas de producto de una venta. | `200 OK` |
| **`GET`** | **`/api/visor-estado`** | **CFD Omni-Sync:** Retorna el estado en memoria RAM e IP local. | `200 OK` |
| **`POST`** | **`/api/visor-estado`** | **CFD Omni-Sync:** Actualiza el carrito, método y montos en RAM. | `200 OK` |

---

## 📁 Estructura del Código

```text
Botica_Net/
│
├── index.js                      # Backend Express, API REST y endpoints CFD en RAM
├── db.js                         # Pool asíncrono con mysql2/promise
├── database.sql                  # DDL de tablas relacionales y catálogo de prueba
├── package.json                  # Dependencias del servidor backend
├── README.md                     # Este manual integral de arquitectura y uso
├── PLAN.md                       # Plan maestro de requerimientos y módulos
│
└── client/                       # Frontend SPA (React 19 + Vite)
    ├── package.json              # Dependencias y scripts del frontend (vite --host)
    ├── vite.config.js            # Configuración de proxy y host para red local
    ├── public/
    │   ├── favicon.svg           # Isotipo oficial de Botica Nova
    │   ├── video1.mp4            # Video cinemático diurno de farmacia
    │   ├── video2.mp4            # Video cinemático de anaqueles
    │   └── productos/            # Fotografías WebP en alta resolución
    │       ├── paracetamol.webp
    │       ├── amoxicilina.webp
    │       ├── ibuprofeno.webp
    │       └── ...
    └── src/
        ├── App.jsx               # Enrutador, guardia de sesión y detector de ?visor=cliente
        ├── App.css               # Estilos globales y barra de sesión POS
        ├── pages/
        │   ├── PosPage.jsx       # Terminal POS con métodos de pago y emisor Omni-Sync
        │   ├── InventarioPage.jsx # Control de stock y kardex
        │   ├── AlertasPage.jsx   # Reposición de stock crítico FEFO / DIGEMID
        │   └── ComprobantesPage.jsx # Historial tributario
        ├── components/
        │   ├── LoginHUD.jsx      # Cockpit de autenticación 3D con videos y telemetría
        │   ├── LoginHUD.css      # Estilos cinemáticos y degradados de lujo
        │   ├── CustomerDisplay.jsx # Visor de Cliente Mobile-First (Estados 1, 2, 3, 4)
        │   ├── CustomerDisplay.css # Estilos táctiles Awwwards y ticket con bordes dentados
        │   ├── VisorModal.jsx    # Modal de doble acción (QR para móvil y simulador Plan C)
        │   ├── VisorModal.css    # Estilos del modal de contingencia
        │   └── Navbar.jsx        # Navegación del ERP farmacéutico
        └── utils/
            └── productImages.js  # Resolutor inteligente de fotos WebP por medicamento
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
