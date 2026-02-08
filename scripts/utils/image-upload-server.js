const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const { exec } = require('child_process');

const PORT = 3000;
const IMAGES_JSON_PATH = path.join(__dirname, '..', '..', 'data', 'images.json');

// Configuration ImgBB
const IMGBB_API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';

function uploadToImgBB(base64Image) {
    return new Promise((resolve, reject) => {
        const formData = `key=${IMGBB_API_KEY}&image=${encodeURIComponent(base64Image)}`;

        const options = {
            hostname: 'api.imgbb.com',
            port: 443,
            path: '/1/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(formData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.success) {
                        resolve(response.data.url);
                    } else {
                        reject(new Error(response.error?.message || 'Upload failed'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(formData);
        req.end();
    });
}

function updateImagesJson(key, url) {
    return new Promise((resolve, reject) => {
        fs.readFile(IMAGES_JSON_PATH, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                const imagesData = JSON.parse(data);

                // Ajouter la nouvelle image
                imagesData.images[key] = url;

                // Mettre à jour les métadonnées
                imagesData.meta.total_images = Object.keys(imagesData.images).length;
                imagesData.meta.exported_date = new Date().toISOString().split('T')[0];

                // Sauvegarder avec indentation
                fs.writeFile(IMAGES_JSON_PATH, JSON.stringify(imagesData, null, 2), 'utf8', (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { key, image } = data;

                if (!key || !image) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing key or image' }));
                    return;
                }

                // Vérifier la clé API
                if (IMGBB_API_KEY === 'VOTRE_CLE_API_IMGBB') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'ImgBB API key not configured. Please edit image-upload-server.js and add your API key.'
                    }));
                    return;
                }

                console.log(`📤 Upload de l'image pour: ${key}`);

                // Upload vers ImgBB
                const imageUrl = await uploadToImgBB(image);
                console.log(`✅ Image uploadée: ${imageUrl}`);

                // Mettre à jour images.json
                await updateImagesJson(key, imageUrl);
                console.log(`💾 images.json mis à jour`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    url: imageUrl,
                    key: key
                }));

            } catch (error) {
                console.error('❌ Erreur:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/update-lore') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { type, categorie, nom, lore } = data;

                if (!type || !nom || !lore) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing type, nom, or lore' }));
                    return;
                }

                let fileName;
                if (type === 'sort') {
                    fileName = 'sorts.json';
                } else if (type === 'don') {
                    fileName = 'dons.json';
                } else if (type === 'objet') {
                    fileName = 'objets.json';
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid type. Must be sort, don, or objet' }));
                    return;
                }

                const filePath = path.join(__dirname, '..', '..', 'data', fileName);

                fs.readFile(filePath, 'utf8', (err, fileData) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read file: ' + err.message }));
                        return;
                    }

                    try {
                        let jsonData = JSON.parse(fileData);
                        let found = false;

                        if (type === 'objet') {
                            // Les objets ont une structure différente
                            const objet = jsonData.objets.find(obj => obj.nom === nom);
                            if (objet) {
                                objet.description = lore;
                                found = true;
                            }
                        } else {
                            // Pour les sorts et dons, ils sont organisés par catégories
                            for (const category of jsonData) {
                                const items = type === 'sort' ? category.sorts : category.dons;
                                const item = items.find(i => i.nom === nom);
                                if (item) {
                                    item.description = lore;
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if (!found) {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: `${type} "${nom}" not found` }));
                            return;
                        }

                        // Sauvegarder le fichier
                        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
                            if (writeErr) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Failed to write file: ' + writeErr.message }));
                                return;
                            }

                            console.log(`✅ Lore ajouté à "${nom}" dans ${fileName}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: true,
                                file: fileName,
                                nom: nom,
                                lore: lore
                            }));
                        });

                    } catch (parseError) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to parse JSON: ' + parseError.message }));
                    }
                });

            } catch (error) {
                console.error('❌ Erreur:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            apiConfigured: true
        }));
    } else if (req.method === 'GET' && url.parse(req.url).pathname.startsWith('/data/') && url.parse(req.url).pathname.endsWith('.json')) {
        // Servir les fichiers JSON du dossier data (uniquement .json)
        const pathname = url.parse(req.url).pathname;
        const fileName = pathname.replace('/data/', '');
        const filePath = path.join(__dirname, '..', '..', 'data', fileName);

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'File not found' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    } else if (req.method === 'GET') {
        // Servir les fichiers statiques (HTML, CSS, JS, images, etc.)
        const parsedUrl = url.parse(req.url);
        let filePath = '.' + parsedUrl.pathname;
        if (filePath === './') filePath = './index.html';

        const extname = path.extname(filePath);
        let contentType = 'text/html';

        switch(extname) {
            case '.js': contentType = 'text/javascript'; break;
            case '.css': contentType = 'text/css'; break;
            case '.json': contentType = 'application/json'; break;
            case '.png': contentType = 'image/png'; break;
            case '.jpg': contentType = 'image/jpeg'; break;
            case '.jpeg': contentType = 'image/jpeg'; break;
            case '.gif': contentType = 'image/gif'; break;
            case '.svg': contentType = 'image/svg+xml'; break;
            case '.ico': contentType = 'image/x-icon'; break;
            case '.pdf': contentType = 'application/pdf'; break;
            case '.mp3': contentType = 'audio/mpeg'; break;
            case '.html': contentType = 'text/html'; break;
        }

        // Résoudre le chemin relatif à la racine du projet (2 niveaux au-dessus de scripts/utils)
        const fullPath = path.join(__dirname, '..', '..', filePath);

        fs.readFile(fullPath, (err, content) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  🖼️  Serveur d'Upload d'Images - BabJdr                    ║
╚════════════════════════════════════════════════════════════╝

✅ Serveur démarré sur http://localhost:${PORT}

${IMGBB_API_KEY === 'VOTRE_CLE_API_IMGBB' ? `
⚠️  CONFIGURATION REQUISE:
   1. Obtenez une clé API gratuite sur https://api.imgbb.com/
   2. Éditez le fichier scripts/utils/image-upload-server.js
   3. Remplacez 'VOTRE_CLE_API_IMGBB' par votre clé
   4. Redémarrez le serveur
` : `
✅ API ImgBB configurée
`}

📂 Fichier de destination: ${IMAGES_JSON_PATH}

🔧 Endpoints disponibles:
   - GET  /status      : État du serveur
   - POST /upload      : Upload d'image
   - POST /update-lore : Ajouter lore/flavor au JSON
   - GET  /data/*.json : Servir les fichiers JSON
   - GET  /*           : Servir fichiers statiques (HTML, CSS, JS)

Pour arrêter le serveur: Ctrl+C
    `);

    // Open browser automatically on Windows
    if (process.platform === 'win32') {
        exec(`start http://localhost:${PORT}`);
    }
});
