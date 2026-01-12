// ============================================================================
// GENERATE TOBIN ICON PDF - PRINTABLE FORMAT
// ============================================================================

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const fetch = require('node-fetch');

/**
 * Generates a printable PDF with Tobin's icon
 * Dimensions: 3cm height × 2cm width (actual size for printing)
 */
async function generateTobinIconPDF() {
  console.log('📄 Generating Tobin Icon PDF...');

  const outputDir = path.resolve(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'Tobin_Icon_Print.pdf');

  // Image URL from npcs.json
  const imageUrl = 'https://i.ibb.co/0RNQqzm6/Tobin-compressed.jpg';

  console.log('⬇️  Downloading Tobin image...');

  try {
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.buffer();
    console.log('✓ Image downloaded successfully');

    // Convert cm to points (1 cm = 28.35 points in PDF)
    const cmToPoints = 28.35;
    const widthCm = 2;  // 2cm wide
    const heightCm = 3; // 3cm high

    const widthPoints = widthCm * cmToPoints;   // ~56.7 points
    const heightPoints = heightCm * cmToPoints; // ~85.05 points

    // Create PDF with A4 size (210mm × 297mm)
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Pipe to file
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Add title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Tobin - Character Icon', { align: 'center' });

    doc.moveDown(0.5);

    // Add dimensions info
    doc.fontSize(10)
       .font('Helvetica')
       .text('Print size: 3cm (height) × 2cm (width)', { align: 'center' });

    doc.moveDown(1);

    // Center the image horizontally
    const pageWidth = doc.page.width;
    const xPosition = (pageWidth - widthPoints) / 2;
    const yPosition = doc.y;

    // Add the image with exact dimensions
    doc.image(imageBuffer, xPosition, yPosition, {
      width: widthPoints,
      height: heightPoints,
      fit: [widthPoints, heightPoints],
      align: 'center'
    });

    doc.moveDown(8);

    // Add a second copy for convenience
    doc.addPage();
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Tobin - Character Icon (Copy 2)', { align: 'center' });

    doc.moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .text('Print size: 3cm (height) × 2cm (width)', { align: 'center' });

    doc.moveDown(1);

    const xPosition2 = (pageWidth - widthPoints) / 2;
    const yPosition2 = doc.y;

    doc.image(imageBuffer, xPosition2, yPosition2, {
      width: widthPoints,
      height: heightPoints,
      fit: [widthPoints, heightPoints],
      align: 'center'
    });

    // Add cutting guide
    doc.moveDown(8);
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .fillColor('#666666')
       .text('Print at 100% scale (no scaling) for accurate dimensions', { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);

    console.log('✅ PDF generated successfully!');
    console.log(`📄 Output: ${outputPath}`);
    console.log(`📊 Size: ${fileSizeKB} KB`);
    console.log('🖨️  Print at 100% scale for accurate 3cm × 2cm dimensions');

  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateTobinIconPDF()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = generateTobinIconPDF;
