// ============================================================================
// MONSTER ICONS GENERATOR
// Génère des icônes imprimables de monstres (1.5cm x 3cm) et un PDF
// ============================================================================

const fs = require('fs');
const path = require('path');

// Configuration
const MONSTERS_DIR = path.join(__dirname, '..', '..', 'data', 'images', 'Monstres');
const DPI = 300;
const ICON_WIDTH_CM = 1.5;
const ICON_HEIGHT_CM = 3;
const ICON_WIDTH_PX = Math.round(ICON_WIDTH_CM * DPI / 2.54);  // ~177px
const ICON_HEIGHT_PX = Math.round(ICON_HEIGHT_CM * DPI / 2.54); // ~354px

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

// Vérifie si c'est un boss
function isBoss(filename) {
    const lower = filename.toLowerCase();
    return lower.includes('boss') || lower.includes('chef') || lower.includes('elite');
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

// Génère les icônes pour un dossier de monstres
async function generateIconsForFolder(folderPath, folderName) {
    const iconesDir = path.join(folderPath, 'Icones');

    // Créer le dossier Icones s'il n'existe pas
    if (!fs.existsSync(iconesDir)) {
        fs.mkdirSync(iconesDir, { recursive: true });
    }

    const files = fs.readdirSync(folderPath).filter(f =>
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
    );

    const icons = [];

    for (const file of files) {
        const inputPath = path.join(folderPath, file);
        const isMonsterBoss = isBoss(file);

        // Boss = double taille
        const width = isMonsterBoss ? ICON_WIDTH_PX * 2 : ICON_WIDTH_PX;
        const height = isMonsterBoss ? ICON_HEIGHT_PX * 2 : ICON_HEIGHT_PX;
        const suffix = isMonsterBoss ? '_boss_icon.png' : '_icon.png';

        const outputName = file.replace(/\.(png|jpg|jpeg)$/i, suffix);
        const outputPath = path.join(iconesDir, outputName);

        try {
            const sizeLabel = isMonsterBoss ? '(BOSS x2)' : '';
            console.log(`  📐 Redimensionnement: ${file} ${sizeLabel}`);
            const canvas = await resizeImage(inputPath, width, height);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);

            icons.push({
                name: file.replace(/\.(png|jpg|jpeg)$/i, ''),
                path: outputPath,
                isBoss: isMonsterBoss,
                folder: folderName,
                width: width,
                height: height
            });
        } catch (error) {
            console.error(`  ❌ Erreur: ${file} - ${error.message}`);
        }
    }

    return icons;
}

// Génère le PDF avec toutes les icônes
async function generatePDF(allIcons, outputPath) {
    console.log('\n📄 Génération du PDF...');

    const doc = new PDFDocument({
        size: 'A4',
        margin: MARGIN_CM * 72 / 2.54 // Convert cm to points
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Dimensions en points (72 points = 1 inch)
    const ptPerCm = 72 / 2.54;
    const iconWidth = ICON_WIDTH_CM * ptPerCm;
    const iconHeight = ICON_HEIGHT_CM * ptPerCm;
    const bossWidth = ICON_WIDTH_CM * 2 * ptPerCm;
    const bossHeight = ICON_HEIGHT_CM * 2 * ptPerCm;
    const margin = MARGIN_CM * ptPerCm;
    const spacing = SPACING_CM * ptPerCm;

    const pageWidth = PAGE_WIDTH_CM * ptPerCm;
    const pageHeight = PAGE_HEIGHT_CM * ptPerCm;

    const iconsPerRow = Math.floor((pageWidth - 2 * margin + spacing) / (iconWidth + spacing));

    // Séparer monstres normaux et boss
    const normalMonsters = allIcons.filter(i => !i.isBoss);
    const bossMonsters = allIcons.filter(i => i.isBoss);

    // Créer la liste complète avec répétitions (normaux x6, boss x2)
    const iconsToPrint = [];
    for (const icon of normalMonsters) {
        for (let i = 0; i < 6; i++) {
            iconsToPrint.push({ ...icon, printWidth: iconWidth, printHeight: iconHeight });
        }
    }

    // Boss x2
    const bossToPrint = [];
    for (const boss of bossMonsters) {
        for (let i = 0; i < 2; i++) {
            bossToPrint.push(boss);
        }
    }

    const normalCount = iconsToPrint.length;
    console.log(`  📊 ${normalMonsters.length} monstres normaux (x6 = ${normalCount} icônes)`);
    console.log(`  📊 ${bossMonsters.length} boss (x2 = ${bossToPrint.length}, taille double)`);
    console.log(`  📊 ${iconsPerRow} icônes normales par ligne`);

    let currentX = margin;
    let currentY = margin;
    let iconsOnCurrentRow = 0;

    // Fonction pour vérifier si on a besoin d'une nouvelle page
    const needsNewPage = (height) => {
        return currentY + height > pageHeight - margin;
    };

    // Fonction pour aller à la ligne
    const nextRow = (height) => {
        currentX = margin;
        currentY += height + spacing;
        iconsOnCurrentRow = 0;
    };

    // Imprimer les monstres normaux
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
            nextRow(iconHeight);
        }
    }

    // Nouvelle page pour les boss si nécessaire
    if (bossToPrint.length > 0) {
        // Aller à la ligne si on est au milieu d'une ligne
        if (iconsOnCurrentRow > 0) {
            nextRow(iconHeight);
        }

        // Nouvelle page si pas assez de place pour un boss
        if (needsNewPage(bossHeight)) {
            doc.addPage();
            currentX = margin;
            currentY = margin;
        }

        const bossPerRow = Math.floor((pageWidth - 2 * margin + spacing) / (bossWidth + spacing));

        for (const boss of bossToPrint) {
            if (needsNewPage(bossHeight)) {
                doc.addPage();
                currentX = margin;
                currentY = margin;
                iconsOnCurrentRow = 0;
            }

            try {
                doc.image(boss.path, currentX, currentY, {
                    width: bossWidth,
                    height: bossHeight
                });
            } catch (error) {
                console.error(`  ⚠️ Impossible d'ajouter boss: ${boss.name}`);
            }

            currentX += bossWidth + spacing;
            iconsOnCurrentRow++;

            if (iconsOnCurrentRow >= bossPerRow) {
                currentX = margin;
                currentY += bossHeight + spacing;
                iconsOnCurrentRow = 0;
            }
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
    console.log('🎮 Générateur d\'icônes de monstres');
    console.log('================================\n');
    console.log(`📏 Taille des icônes: ${ICON_WIDTH_CM}cm x ${ICON_HEIGHT_CM}cm (${ICON_WIDTH_PX}x${ICON_HEIGHT_PX}px à ${DPI} DPI)\n`);

    await checkDependencies();

    if (!fs.existsSync(MONSTERS_DIR)) {
        console.error(`❌ Dossier non trouvé: ${MONSTERS_DIR}`);
        process.exit(1);
    }

    const subfolders = fs.readdirSync(MONSTERS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== 'Icones')
        .map(d => d.name);

    if (subfolders.length === 0) {
        console.log('⚠️ Aucun sous-dossier de monstres trouvé.');
        process.exit(0);
    }

    console.log(`📂 Dossiers trouvés: ${subfolders.join(', ')}\n`);

    const allIcons = [];

    for (const folder of subfolders) {
        const folderPath = path.join(MONSTERS_DIR, folder);
        console.log(`\n🗂️  Traitement: ${folder}/`);

        const icons = await generateIconsForFolder(folderPath, folder);
        allIcons.push(...icons);

        console.log(`  ✅ ${icons.length} icônes créées dans ${folder}/Icones/`);

        const bosses = icons.filter(i => i.isBoss);
        if (bosses.length > 0) {
            console.log(`  👑 Boss détectés: ${bosses.map(b => b.name).join(', ')}`);
        }
    }

    if (allIcons.length > 0) {
        const pdfPath = path.join(MONSTERS_DIR, 'Icones_Monstres.pdf');
        await generatePDF(allIcons, pdfPath);
    }

    console.log('\n✨ Terminé!');
}

main().catch(console.error);
