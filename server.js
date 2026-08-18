const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PRODUCTS_JSON_PATH = path.join(ROOT, 'website', 'data', 'products.json');

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.vcf': 'text/vcard',
    '.txt': 'text/plain',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function createServer() {
    return http.createServer((req, res) => {
        // Enable CORS for all requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        let pathname = decodeURIComponent(parsedUrl.pathname);

        // 🚀 Real-time Permanent Data API for Admin Updates
        if ((pathname === '/api/products' || pathname === '/data/products.json') && (req.method === 'POST' || req.method === 'PUT')) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    let data = JSON.parse(body);
                    let products = Array.isArray(data) ? data : (data.products || []);
                    if (!Array.isArray(products) || products.length === 0) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid products array' }));
                        return;
                    }
                    // Write directly to disk
                    fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(products, null, 2), 'utf8');
                    console.log(`[API] Saved ${products.length} products to ${PRODUCTS_JSON_PATH}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, count: products.length, timestamp: Date.now() }));
                } catch (err) {
                    console.error('[API Error]', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        // GET /api/products
        if (pathname === '/api/products' && req.method === 'GET') {
            if (fs.existsSync(PRODUCTS_JSON_PATH)) {
                const content = fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8');
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end(content);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'products.json not found' }));
            }
            return;
        }

        let candidatePaths = [];

        if (pathname === '/' || pathname === '/index.html') {
            candidatePaths.push(path.join(ROOT, 'website', 'index.html'));
        } else if (pathname === '/admin' || pathname === '/admin.html') {
            candidatePaths.push(path.join(ROOT, 'website', 'admin.html'));
        } else {
            candidatePaths.push(path.join(ROOT, pathname));
            candidatePaths.push(path.join(ROOT, 'website', pathname));
            candidatePaths.push(path.join(ROOT, pathname, 'index.html'));
            candidatePaths.push(path.join(ROOT, 'website', pathname, 'index.html'));
        }

        let filePath = null;
        for (const candidate of candidatePaths) {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                filePath = candidate;
                break;
            }
        }

        if (!filePath) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>404 - Not Found</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; background: #120c18; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                        h1 { color: #d31f26; font-size: 2.5rem; margin-bottom: 0.5rem; }
                        p { color: #aaa; margin-bottom: 2rem; }
                        a { color: #fff; background: #d31f26; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 0.5rem; display: inline-block; }
                        a:hover { opacity: 0.9; }
                    </style>
                </head>
                <body>
                    <h1>404 - Page Not Found</h1>
                    <p>The requested URL <code>${pathname}</code> was not found.</p>
                    <div>
                        <a href="/">Main Website</a>
                        <a href="/admin.html">Admin Panel</a>
                        <a href="/Branding-Tool/">Branding Tool</a>
                        <a href="/Photo-Enhancer/">Photo Enhancer</a>
                    </div>
                </body>
                </html>
            `);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        const stat = fs.statSync(filePath);
        const range = req.headers.range;

        if (range && (ext === '.mp4' || ext === '.webm')) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
            });
            file.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': stat.size,
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    });
}

function tryPort(port, callback) {
    const srv = createServer();
    srv.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying port ${port + 1}...`);
            tryPort(port + 1, callback);
        } else {
            console.error('Server error:', err);
        }
    });
    srv.once('listening', () => {
        callback(srv, port);
    });
    srv.listen(port);
}

const initialPort = parseInt(process.env.PORT, 10) || 3000;
tryPort(initialPort, (server, port) => {
    console.log(`====================================================`);
    console.log(`  RS Ply & Decor is LIVE on Localhost!`);
    console.log(`====================================================`);
    console.log(`  Main Website:     http://localhost:${port}/`);
    console.log(`  Admin Panel:      http://localhost:${port}/admin.html`);
    console.log(`  Branding Tool:    http://localhost:${port}/Branding-Tool/`);
    console.log(`  Photo Enhancer:   http://localhost:${port}/Photo-Enhancer/`);
    console.log(`====================================================`);
});
