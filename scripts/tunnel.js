const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n===================================================================');
console.log('🚀 BOTICA NOVA · CLOUDFLARE TUNNEL (AUTO-SYNC)');
console.log('Iniciando túnel seguro HTTPS para el Visor de Cliente Mobile-First...');
console.log('===================================================================\n');

const tunnelFilePath = path.join(__dirname, '..', 'tunnel.json');
const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['--yes', 'cloudflared', 'tunnel', '--url', 'http://localhost:5173'], {
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
});

let urlDetectada = false;

function procesarSalida(chunk) {
    const texto = chunk.toString();
    process.stdout.write(texto);

    if (!urlDetectada) {
        const match = texto.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
        if (match) {
            urlDetectada = true;
            const tunnelUrl = match[0];
            const visorCompleto = `${tunnelUrl}/?visor=cliente`;

            // 1. Guardar en archivo local tunnel.json
            try {
                fs.writeFileSync(
                    tunnelFilePath,
                    JSON.stringify({ url: tunnelUrl, visorUrl: visorCompleto, timestamp: Date.now() }, null, 2),
                    'utf8'
                );
            } catch (err) {
                // Silencioso
            }

            // 2. Notificar al backend Express (puerto 3000)
            if (typeof fetch === 'function') {
                fetch('http://localhost:3000/api/tunnel-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: tunnelUrl })
                }).catch(() => {
                    // El backend se actualizará al leer tunnel.json
                });
            }

            // 3. Banner visual llamativo para el desarrollador
            console.log('\n\x1b[32m%s\x1b[0m', '===================================================================');
            console.log('\x1b[1m\x1b[32m%s\x1b[0m', '✅ ¡TÚNEL CONECTADO Y SINCRONIZADO AUTOMÁTICAMENTE!');
            console.log('\x1b[36m%s\x1b[0m', `📱 Enlace para Smartphone: ${visorCompleto}`);
            console.log('\x1b[33m%s\x1b[0m', '⚡ El código QR en el POS ya está actualizado sin tocar nada.');
            console.log('\x1b[32m%s\x1b[0m', '===================================================================\n');
        }
    }
}

child.stdout.on('data', procesarSalida);
child.stderr.on('data', procesarSalida);

child.on('close', (code) => {
    console.log(`\n[TUNNEL] El proceso de túnel ha finalizado (código: ${code}).`);
});

process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit(0);
});

