// ============================================================================
// NPC ICONS GENERATOR
// Génère des icônes imprimables de NPCs (1.5cm x 3cm) et un PDF
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
const SPACING_CM = 0.2;

// Check dependencies
let Canvas, loadImage, PDFDocument;

async function checkDependencies() {
    try {
        const canvas = require('canvas');
        Canvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
    } catch (e) {
        console.log('📦 Installation de canvas...');
        require('child_process').execSync('npm install canvas --save-dev', { stdio: 'inherit' });
        const canvas = require('canvas');
        Canvas = canvas.createCanvas;
        loadImage = canvas.loadImage;
    }

    try {
        PDFDocument = require('pdfkit');
    } catch (e) {
        console.log('📦 Installation de pdfkit...');
        require('child_process').execSync('npm install pdfkit --save-dev', { stdio: 'inherit' });
        PDFDocument = require('pdfkit');
    }
}

// Redimensionne une image en conservant les proportions et en remplissant l'espace
async function resizeImage(imagePath, width, height) {
    // Lire le fichier en buffer pour éviter les problèmes d'encodage
    const buffer = fs.readFileSync(imagePath);
    const img = await loadImage(buffer);
    const canvas = Canvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fond transparent
    ctx.clearRect(0, 0, width, height);

    // Calculer le ratio pour remplir tout l'espace (cover)
    const imgRatio = img.width / img.height;
    const targetRatio = width / height;

    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

    if (imgRatio > targetRatio) {
        // Image plus large, on coupe sur les côtés
        srcW = img.height * targetRatio;
        srcX = (img.width - srcW) / 2;
    } else {
        // Image plus haute, on coupe en haut/bas
        srcH = img.width / targetRatio;
        srcY = (img.height - srcH) / 2;
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);

    return canvas;
}

// Génère les icônes pour les NPCs
async function generateIcons() {
    const iconesDir = path.join(NPC_DIR, 'Icones');

    // Créer le dossier Icones s'il n'existe pas
    if (!fs.existsSync(iconesDir)) {
        fs.mkdirSync(iconesDir, { recursive: true });
    }

    const files = fs.readdirSync(NPC_DIR).filter(f =>
        (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')) &&
        !f.includes('_icon')
    );

    const icons = [];

    console.log(`\n🗂️  Traitement de ${files.length} NPCs...`);

    for (const file of files) {
        const inputPath = path.join(NPC_DIR, file);
        const outputName = file.replace(/\.(png|jpg|jpeg)$/i, '_icon.png');
        const outputPath = path.join(iconesDir, outputName);

        try {
            console.log(`  📐 Redimensionnement: ${file}`);
            const canvas = await resizeImage(inputPath, ICON_WIDTH_PX, ICON_HEIGHT_PX);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);

            icons.push({
                name: file.replace(/\.(png|jpg|jpeg)$/i, ''),
                path: outputPath
            });
        } catch (error) {
            console.error(`  ❌ Erreur: ${file} - ${error.message}`);
        }
    }

    console.log(`  ✅ ${icons.length} icônes créées dans NPC/Icones/`);

    return icons;
}

// Génère le PDF avec toutes les icônes
async function generatePDF(allIcons, outputPath) {
    console.log('\n📄 Génération du PDF...');

    const doc = new PDFDocument({
        size: 'A4',
        margin: MARGIN_CM * 72 / 2.54
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Dimensions en points (72 points = 1 inch)
    const ptPerCm = 72 / 2.54;
    const iconWidth = ICON_WIDTH_CM * ptPerCm;
    const iconHeight = ICON_HEIGHT_CM * ptPerCm;
    const margin = MARGIN_CM * ptPerCm;
    const spacing = SPACING_CM * ptPerCm;

    const pageWidth = PAGE_WIDTH_CM * ptPerCm;
    const pageHeight = PAGE_HEIGHT_CM * ptPerCm;

    const iconsPerRow = Math.floor((pageWidth - 2 * margin + spacing) / (iconWidth + spacing));

    // Créer la liste complète avec répétitions (x2 par NPC)
    const iconsToPrint = [];
    for (const icon of allIcons) {
        for (let i = 0; i < COPIES_PER_NPC; i++) {
            iconsToPrint.push(icon);
        }
    }

    console.log(`  📊 ${allIcons.length} NPCs uniques`);
    console.log(`  📊 ${iconsToPrint.length} icônes à imprimer (x${COPIES_PER_NPC} par NPC)`);
    console.log(`  📊 ${iconsPerRow} icônes par ligne`);

    let currentX = margin;
    let currentY = margin;
    let iconsOnCurrentRow = 0;

    const needsNewPage = (height) => {
        return currentY + height > pageHeight - margin;
    };

    const nextRow = () => {
        currentX = margin;
        currentY += iconHeight + spacing;
        iconsOnCurrentRow = 0;
    };

    for (const icon of iconsToPrint) {
        if (needsNewPage(iconHeight)) {
            doc.addPage();
            currentX = margin;
            currentY = margin;
            iconsOnCurrentRow = 0;
        }

        try {
            doc.image(icon.path, currentX, currentY, {
                width: iconWidth,
                height: iconHeight
            });
        } catch (error) {
            console.error(`  ⚠️ Impossible d'ajouter: ${icon.name}`);
        }

        currentX += iconWidth + spacing;
        iconsOnCurrentRow++;

        if (iconsOnCurrentRow >= iconsPerRow) {
            nextRow();
        }
    }

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            console.log(`  ✅ PDF généré: ${outputPath}`);
            resolve();
        });
        stream.on('error', reject);
    });
}

// Main
async function main() {
    console.log('👥 Générateur d\'icônes de NPCs');
    console.log('==============================\n');
    console.log(`📏 Taille des icônes: ${ICON_WIDTH_CM}cm x ${ICON_HEIGHT_CM}cm (${ICON_WIDTH_PX}x${ICON_HEIGHT_PX}px à ${DPI} DPI)`);
    console.log(`📋 Copies par NPC: ${COPIES_PER_NPC}`);

    await checkDependencies();

    if (!fs.existsSync(NPC_DIR)) {
        console.error(`❌ Dossier non trouvé: ${NPC_DIR}`);
        process.exit(1);
    }

    const icons = await generateIcons();

    if (icons.length > 0) {
        const pdfPath = path.join(NPC_DIR, 'Icones_NPCs.pdf');
        await generatePDF(icons, pdfPath);
    }

    console.log('\n✨ Terminé!');
}

main().catch(console.error);
