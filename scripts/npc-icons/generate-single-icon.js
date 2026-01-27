// ============================================================================
// SINGLE NPC ICON GENERATOR
// Genere une icone imprimable pour un NPC specifique (1.5cm x 3cm) et un PDF
// Usage: node generate-single-icon.js <nom_du_npc>
// ============================================================================

const fs = require('fs');
const path = require('path');

// Configuration
const NPC_DIR = path.join(__dirname, '..', '..', 'data', 'images', 'NPC');
const DPI = 300;
const ICON_WIDTH_CM = 1.5;
const ICON_HEIGHT_CM = 3;
const ICON_WIDTH_PX = Math.round(ICON_WIDTH_CM * DPI / 2.54);  // ~177px
const ICON_HEIGHT_PX = Math.round(ICON_HEIGHT_CM * DPI / 2.54); // ~354px
const COPIES_PER_NPC = 2;

// PDF settings (A4)
const PAGE_WIDTH_CM = 21;
const PAGE_HEIGHT_CM = 29.7;
const MARGIN_CM = 1;
const SPACING_CM = 0.5;

let Canvas, loadImage, PDFDocument;

async function checkDependencies() {
    try {
        const canvas = require('canvas');
        Canvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
    } catch (e) {
        console.log('Installation de canvas...');
        require('child_process').execSync('npm install canvas --save-dev', { stdio: 'inherit' });
        const canvas = require('canvas');
        Canvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
    }

    try {
        PDFDocument = require('pdfkit');
    } catch (e) {
        console.log('Installation de pdfkit...');
        require('child_process').execSync('npm install pdfkit --save-dev', { stdio: 'inherit' });
        PDFDocument = require('pdfkit');
    }
}

async function resizeImage(imagePath, width, height) {
    const buffer = fs.readFileSync(imagePath);
    const img = await loadImage(buffer);
    const canvas = Canvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);

    const imgRatio = img.width / img.height;
    const targetRatio = width / height;

    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

    if (imgRatio > targetRatio) {
        srcW = img.height * targetRatio;
        srcX = (img.width - srcW) / 2;
    } else {
        srcH = img.width / targetRatio;
        srcY = (img.height - srcH) / 2;
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);

    return canvas;
}

async function generateIcon(npcName) {
    const iconesDir = path.join(NPC_DIR, 'Icones');

    if (!fs.existsSync(iconesDir)) {
        fs.mkdirSync(iconesDir, { recursive: true });
    }

    // Chercher le fichier image
    const extensions = ['.png', '.jpg', '.jpeg'];
    let inputPath = null;

    for (const ext of extensions) {
        const testPath = path.join(NPC_DIR, npcName + ext);
        if (fs.existsSync(testPath)) {
            inputPath = testPath;
            break;
        }
    }

    if (!inputPath) {
        console.error(`Image non trouvee pour: ${npcName}`);
        console.log(`Fichiers disponibles dans ${NPC_DIR}:`);
        const files = fs.readdirSync(NPC_DIR).filter(f =>
            f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
        );
        files.forEach(f => console.log(`  - ${f}`));
        process.exit(1);
    }

    const outputPath = path.join(iconesDir, `${npcName}_icon.png`);

    console.log(`Redimensionnement: ${npcName}`);
    const canvas = await resizeImage(inputPath, ICON_WIDTH_PX, ICON_HEIGHT_PX);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`Icone creee: ${outputPath}`);

    return { name: npcName, path: outputPath };
}

async function generatePDF(icon, outputPath) {
    console.log('\nGeneration du PDF...');

    const doc = new PDFDocument({
        size: 'A4',
        margin: MARGIN_CM * 72 / 2.54
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const ptPerCm = 72 / 2.54;
    const iconWidth = ICON_WIDTH_CM * ptPerCm;
    const iconHeight = ICON_HEIGHT_CM * ptPerCm;
    const margin = MARGIN_CM * ptPerCm;
    const spacing = SPACING_CM * ptPerCm;

    // Lignes de decoupe en pointilles
    doc.strokeColor('#888888');
    doc.lineWidth(0.5);
    doc.dash(3, { space: 2 });

    let currentX = margin;
    let currentY = margin;

    for (let i = 0; i < COPIES_PER_NPC; i++) {
        // Dessiner l'icone
        doc.image(icon.path, currentX, currentY, {
            width: iconWidth,
            height: iconHeight
        });

        // Rectangle de decoupe autour de l'icone
        doc.rect(currentX, currentY, iconWidth, iconHeight).stroke();

        currentX += iconWidth + spacing;
    }

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            console.log(`PDF genere: ${outputPath}`);
            resolve();
        });
        stream.on('error', reject);
    });
}

async function main() {
    const npcName = process.argv[2];

    if (!npcName) {
        console.log('Usage: node generate-single-icon.js <nom_du_npc>');
        console.log('Exemple: node generate-single-icon.js Elmar');
        process.exit(1);
    }

    console.log('Generateur d\'icone NPC');
    console.log('======================\n');
    console.log(`NPC: ${npcName}`);
    console.log(`Taille: ${ICON_WIDTH_CM}cm x ${ICON_HEIGHT_CM}cm (${ICON_WIDTH_PX}x${ICON_HEIGHT_PX}px)`);
    console.log(`Copies: ${COPIES_PER_NPC}`);

    await checkDependencies();

    const icon = await generateIcon(npcName);

    const pdfPath = path.join(NPC_DIR, 'Icones', `${npcName}_decoupable.pdf`);
    await generatePDF(icon, pdfPath);

    console.log('\nTermine!');
}

main().catch(console.error);
