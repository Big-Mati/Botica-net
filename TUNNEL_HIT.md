# 🌐 TUNNEL HIT — Guía Técnica y Conceptual de Cloudflare Tunnel
### Arquitectura de Conectividad Inversa, Cero Bloqueos y Sincronización Automática para Botica Nova

---

## 🎯 ¿Qué es y qué problema resuelve?

En una sustentación o demostración de software, el reto más grande al conectar un smartphone con una PC local es la **infraestructura de red**:

1. **Firewall del Sistema Operativo:** Windows bloquea por defecto las conexiones entrantes en puertos de desarrollo (`5173`, `3000`) en redes públicas o móviles.
2. **Aislamiento de Clientes (Client Isolation):** En redes Wi-Fi universitarias o corporativas, los dispositivos conectados no pueden "verse" entre sí por políticas de seguridad.
3. **CGNAT y Routers:** Las conexiones móviles 4G/5G y los routers hogareños no permiten enrutar peticiones directas hacia una IP local privada (`192.168.x.x` o `10.x.x.x`).

> **Cloudflare Tunnel** elimina todos estos obstáculos creando un **Túnel Inverso Seguro (Reverse Tunnel)**. No requiere abrir puertos en el router, no necesita permisos de Administrador en Windows y funciona a través de cualquier red Wi-Fi o datos móviles 4G/5G.

---

## 🏗️ Arquitectura: ¿Cómo funciona técnicamente?

### ❌ 1. Conexión Tradicional Directa (Falla frecuentemente)
```
[ Smartphone del Cliente ] ────❌ (Bloqueado por Firewall / CGNAT) ────▶ [ PC / Puerto 5173 ]
```
*Problema:* El smartphone intenta ingresar desde afuera. El Firewall de Windows o la red del aula detecta una petición entrante desconocida y la descarta.

---

###  2. Conexión mediante Cloudflare Tunnel (100% Exitosa)
```
┌────────────────────────┐                   ┌─────────────────────────────┐
│  PC Local (Botica Nova) │                   │  Red Anycast de Cloudflare  │
│                        │                   │                             │
│  [Vite POS :5173]      │                   │  [Edge Server Global]       │
│  [Express API :3000]   │                   │  (Certificado SSL / HTTPS)  │
│           │            │                   │              ▲              │
│           ▼            │                   │              │              │
│     cloudflared        │                   │              │              │
│   (Proceso Local)      │── Conexión ──────▶│              │              │
│                        │   Saliente QUIC   │              │              │
└────────────────────────┘   (Puerto 443)    └──────────────┼──────────────┘
                                                            │
                                                     Petición HTTPS Segura
                                                            │
                                                            ▼
                                              ┌───────────────────────────┐
                                              │   Smartphone del Cliente  │
                                              │   (Navegador Chrome/Safari│
                                              │    vía 4G/5G o Wi-Fi)     │
                                              └───────────────────────────┘
```

### 🔑 Puntos Clave del Flujo Técnico:
1. **Conexión Saliente (Outbound-Only):**
   - El proceso `cloudflared` en tu PC no "espera" visitas. En su lugar, **él mismo abre una conexión hacia afuera** contra los servidores globales de Cloudflare usando protocolos modernos (**HTTP/2 o QUIC sobre UDP/TCP 443**).
   - Como es tráfico *saliente*, los Firewalls de Windows y las redes universitarias lo tratan exactamente igual que navegar por una página web ordinaria (tráfico legítimo autorizado).
2. **Dominio Público Cifrado:**
   - Cloudflare genera una URL pública oficial con certificado SSL válido (`https://xxxx.trycloudflare.com`).
3. **Enrutamiento Multipunto:**
   - Cuando el celular escanea el QR y pide esa URL, Cloudflare recibe la petición en su nodo más cercano (Edge Datacenter en Lima o Santiago) y la envía de vuelta por el túnel que tu PC ya dejó abierto.
4. **Proxy Interno:**
   - En tu PC, Vite recibe la petición, consulta al backend en el puerto `3000` vía proxy interno `/api` y devuelve la pantalla del cliente con latencia casi imperceptible (**< 40 ms**).

---

## ⚡ ¿Cómo se logró la Sincronización 100% Automática en Botica Nova?

Uno de los mayores problemas al usar túneles gratuitos es que cada vez que se inician generan una URL aleatoria distinta. En Botica Nova desarrollamos una arquitectura de sincronización desatendida mediante **3 componentes integrados**:

```
[ npm run tunnel ] ➔ [ scripts/tunnel.js ] ➔ [ POST /api/tunnel-url ] ➔ [ VisorModal.jsx ] ➔ [ QR SVG en Vivo ]
```

1. **El Orquestador (`scripts/tunnel.js`):**
   - Lanza el binario de Cloudflare de forma no invasiva (`npx --yes cloudflared tunnel --url http://localhost:5173`).
   - Monitorea el flujo de salida en tiempo real mediante expresiones regulares hasta interceptar la URL generada:
     ```js
     const match = texto.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
     ```
2. **Registro en Caliente y Persistencia:**
   - Guarda la URL en un archivo local `tunnel.json`.
   - Envía un webhook interno al backend Express (`POST /api/tunnel-url`), actualizando la memoria RAM del servidor.
3. **Renderizado React Reactivo (`VisorModal.jsx`):**
   - El modal del Visor consulta `/api/tunnel-url` al abrirse.
   - Si detecta un túnel activo, actualiza el estado `tunnelBase` de forma transparente.
   - El componente de código QR (`qrLocalMatrix.js`) recalcula la matriz matemática SVG inmediatamente.
   - **Resultado:** El usuario y el profesor solo ven el código QR listo para escanear, sin haber tenido que copiar ni pegar ninguna dirección.

---

## 🎤 Guión Verbal para el Instructor / Jurado (Pitch de 45 Segundos)

Si el profesor o jurado te pregunta:
> *"¿Cómo lograste conectar el celular si estamos en la red de la universidad y no tienes acceso al router ni a permisos de administrador?"*

**Tu respuesta técnica estructurada:**

> *"Para la sincronización en tiempo real del Visor de Cliente implementamos un **Túnel Inverso mediante la infraestructura de borde de Cloudflare**.*
>
> *En lugar de depender de una IP local que suele ser bloqueada por el Firewall de Windows o por las políticas de aislamiento de clientes de la universidad, nuestro sistema levanta un proceso ligero que establece una **conexión saliente cifrada vía QUIC/HTTP2 por el puerto 443** hacia la red Anycast de Cloudflare.*
>
> *Esto nos entrega un endpoint público seguro con **certificado SSL/HTTPS**, permitiendo que cualquier smartphone con Wi-Fi o datos móviles 4G/5G se comunique con nuestra aplicación local con latencia mínima.*
>
> *Además, desarrollamos un script en Node.js que **captura la URL asignada al vuelo y la sincroniza automáticamente con nuestro backend y con el componente QR de React**, logrando que la vinculación del smartphone sea 100% desatendida y a prueba de fallos."*

---

## 🛡️ Tabla Comparativa de Soluciones de Conectividad

| Característica | Red Local / Wi-Fi Común | Zona Móvil (Hotspot) | Cloudflare Tunnel (Implementado) |
| :--- | :---: | :---: | :---: |
| **Requiere misma red Wi-Fi** | Sí (estricto) | Sí (estricto) | ❌ **No (Funciona con 4G/5G o cualquier Wi-Fi)** |
| **Requiere permisos de Admin** | Sí (para abrir Firewall) | No | ❌ **No requiere Admin** |
| **Certificado SSL / HTTPS** | No (HTTP plano) | No (HTTP plano) | ✅ **Sí (HTTPS Oficial)** |
| **Tolerancia a bloqueos de red** | Baja | Media | ✅ **Máxima (Tráfico estándar 443)** |
| **Sincronización de QR** | Manual por IP | Manual por IP | ✅ **100% Automática vía script** |

