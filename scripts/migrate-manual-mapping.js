#!/usr/bin/env node
/**
 * Apply manual mapping of remaining ibb.co URLs to local paths.
 * Also fix false positives from the first automated run.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Manual mapping: ibb.co URL → local path
const MANUAL_MAPPING = {
  "https://i.ibb.co/QF9sT3DW/L-vitation.jpg": "data/images/Sorts/Enchanteur/Lévitation.png",
  "https://i.ibb.co/7dmDH3x6/Pr-tre.jpg": "data/images/Classes/Prêtre.png",
  "https://i.ibb.co/Y4mZHRFS/F-e.jpg": "data/images/Classes/Fée.png",
  "https://i.ibb.co/355WqrJP/F-e-M.jpg": "data/images/Classes/FéeM.png",
  "https://i.ibb.co/fGVdVssN/Volont-Fer.jpg": "data/images/Dons/guerrier/VolontéFer.png",
  "https://i.ibb.co/6cgWf15M/Elan-B-ni.jpg": "data/images/Dons/pretre/ElanBéni.png",
  "https://i.ibb.co/S404pgPr/Magie-Al-atoire.jpg": "data/images/Dons/Enchanteur/MagieAléatoire.png",
  "https://i.ibb.co/Z1FnQ4TH/Rapi-re-Elfique.png": "data/images/Objets/Armes/RapièreElfique.png",
  "https://i.ibb.co/XfVYGy2T/Sceptre-de-Durnak-dieu-de-la-terre.png": "data/images/Objets/Armes/Sceptre de Durnak, dieu de la terre.png",
  "https://i.ibb.co/4RXHVFTV/Monstre-For-t-Araign-e.jpg": "data/images/Monstres/foret/Monstre_Forêt_Araignée.png",
  "https://i.ibb.co/VYMmsHjz/Monstre-For-t-Crab.jpg": "data/images/Monstres/foret/Monstre_Forêt_Crab.png",
  "https://i.ibb.co/fYnRbfN5/Monstre-For-t-Groink.jpg": "data/images/Monstres/foret/Monstre_Forêt_Groink.png",
  "https://i.ibb.co/p6T7TFyv/Monstre-For-t-Groink-Chaman.jpg": "data/images/Monstres/foret/Monstre_Forêt_Groink_Chaman.png",
  "https://i.ibb.co/Dg5VvJt1/Monstre-For-t-Guepe-Geante.jpg": "data/images/Monstres/foret/Monstre_Forêt_GuepeGeante.png",
  "https://i.ibb.co/cKgvqSRH/Monstre-For-t-Ours.jpg": "data/images/Monstres/foret/Monstre_Forêt_Ours.png",
  "https://i.ibb.co/qFNVtvzc/Monstre-For-t-Poulpe.jpg": "data/images/Monstres/foret/Monstre_Forêt_Poulpe.png",
  "https://i.ibb.co/twGXwX6s/Monstre-For-t-Serpent.jpg": "data/images/Monstres/foret/Monstre_Forêt_Serpent.png",
  "https://i.ibb.co/kLVhZSh/Monstre-For-t-Scarabe-Geant.jpg": "data/images/Monstres/foret/Monstre_Forêt_ScarabeGeant.png",
  "https://i.ibb.co/gMY5xjgs/Monstre-For-t-Boss.jpg": "data/images/Monstres/foret/Monstre_Forêt_Boss.png",
  "https://i.ibb.co/RG7PnZk1/Isara-C-ur-de-Roc.jpg": "data/images/NPC/Isara Cœur-de-Roc.png",
  "https://i.ibb.co/G3Cvm1HX/Lyrielle-Vent-d-Aurore.jpg": "data/images/NPC/Lyrielle Vent-d'Aurore.png",
  "https://i.ibb.co/qMQ86Sy0/mal-fique.png": "data/images/Autre/elements/maléfique.png",
  "https://i.ibb.co/rG0FDrx6/Ma-tre-d-armes.jpg": "data/images/Classes/Maître d'armes.png",
  "https://i.ibb.co/C5F7ghMg/Ma-tre-d-armes-F.jpg": "data/images/Classes/Maître d'armesF.png",
  "https://i.ibb.co/JWVQDBwT/F-e.jpg": "data/images/Classes/Fée.png",
  "https://i.ibb.co/mrrtwDxP/F-e-M.jpg": "data/images/Classes/FéeM.png",
  "https://i.ibb.co/8DsN1Zr5/Ma-tre-d-armes.jpg": "data/images/Classes/Maître d'armes.png",
  "https://i.ibb.co/SXpnbRdb/Ma-tre-d-armes-F.jpg": "data/images/Classes/Maître d'armesF.png",
  "https://i.ibb.co/VcDc8Gtm/Magie-Al-atoire.jpg": "data/images/Dons/Enchanteur/MagieAléatoire.png",
  "https://i.ibb.co/Qj7v744H/Volont-Fer.jpg": "data/images/Dons/guerrier/VolontéFer.png",
  "https://i.ibb.co/gbzRBPC2/Elan-B-ni.jpg": "data/images/Dons/pretre/ElanBéni.png",
  "https://i.ibb.co/fzTjZLfh/m-cr-ant.png": "data/images/Dons/pretre/mécréant.png",
  "https://i.ibb.co/SH5jcyv/Armure-El-mentaire1.png": "data/images/Sorts/Enchanteur/ArmureElémentaire1.png",
  "https://i.ibb.co/jP9RKzdq/Armure-El-mentaire2.png": "data/images/Sorts/Enchanteur/ArmureElémentaire2.png",
  "https://i.ibb.co/ynj3C5nj/Malediction-2.jpg": "data/images/Sorts/Pretre/Malediction (2).png",
  "https://i.ibb.co/SXRVQt8c/Vol-e-Glace.jpg": "data/images/Sorts/Mage/VoléeGlace.png",
  "https://i.ibb.co/qLsbhkY3/Armure-l-gere.jpg": "data/images/Dons/Generaux/Armure légere.png",
  "https://i.ibb.co/dsCNR25V/Malediction-2.jpg": "data/images/Sorts/Pretre/Malediction (2).png",
  "https://i.ibb.co/JwFzZq33/Port-e-Vent.jpg": "data/images/Dons/Elements/PortéeVent.png",
  "https://i.ibb.co/0RK9cSc4/Monstre-For-t-Araign-e-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_Araignée_icon.png",
  "https://i.ibb.co/nsPPYc44/Monstre-For-t-Boss-boss-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_Boss_boss_icon.png",
  "https://i.ibb.co/1fnsrVcq/Monstre-For-t-Crab-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_Crab_icon.png",
  "https://i.ibb.co/9HgtrVPq/Monstre-For-t-Groink-Chaman-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_Groink_Chaman_icon.png",
  "https://i.ibb.co/vnqpvfc/Monstre-For-t-Groink-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_Groink_icon.png",
  "https://i.ibb.co/kVJyVYjT/Monstre-For-t-Guepe-Geante-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_GuepeGeante_icon.png",
  "https://i.ibb.co/jcckDvz/Monstre-For-t-Ours-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_Ours_icon.png",
  "https://i.ibb.co/7qDBH1P/Monstre-For-t-Poulpe-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_Poulpe_icon.png",
  "https://i.ibb.co/SXmZRHRf/Monstre-For-t-Scarabe-Geant-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_ScarabeGeant_icon.png",
  "https://i.ibb.co/20Fgv6rv/Monstre-For-t-Serpent-icon.png": "data/images/Monstres/foret/Icones/Monstre_Forêt_Serpent_icon.png",
  "https://i.ibb.co/8gfH7m57/Monstre-For-t-Araign-e.jpg": "data/images/Monstres/foret/Monstre_Forêt_Araignée.png",
  "https://i.ibb.co/yFmLpvQz/Monstre-For-t-Boss.jpg": "data/images/Monstres/foret/Monstre_Forêt_Boss.png",
  "https://i.ibb.co/fdrvs81y/Monstre-For-t-Crab.jpg": "data/images/Monstres/foret/Monstre_Forêt_Crab.png",
  "https://i.ibb.co/QFCBZLHR/Monstre-For-t-Groink.jpg": "data/images/Monstres/foret/Monstre_Forêt_Groink.png",
  "https://i.ibb.co/mrKjKW8C/Monstre-For-t-Groink-Chaman.jpg": "data/images/Monstres/foret/Monstre_Forêt_Groink_Chaman.png",
  "https://i.ibb.co/R4zvsF9g/Monstre-For-t-Guepe-Geante.jpg": "data/images/Monstres/foret/Monstre_Forêt_GuepeGeante.png",
  "https://i.ibb.co/vCwB96fG/Monstre-For-t-Ours.jpg": "data/images/Monstres/foret/Monstre_Forêt_Ours.png",
  "https://i.ibb.co/2YvHDTwC/Monstre-For-t-Poulpe.jpg": "data/images/Monstres/foret/Monstre_Forêt_Poulpe.png",
  "https://i.ibb.co/HcLrZHr/Monstre-For-t-Scarabe-Geant.jpg": "data/images/Monstres/foret/Monstre_Forêt_ScarabeGeant.png",
  "https://i.ibb.co/qLS5L58s/Monstre-For-t-Serpent.jpg": "data/images/Monstres/foret/Monstre_Forêt_Serpent.png",
  "https://i.ibb.co/zWwyJ7S2/Isara-C-ur-de-Roc-icon.png": "data/images/NPC/Icones/Isara Cœur-de-Roc_icon.png",
  "https://i.ibb.co/zT0Z93sP/Lyrielle-Vent-d-Aurore-icon.png": "data/images/NPC/Icones/Lyrielle Vent-d'Aurore_icon.png",
  "https://i.ibb.co/YTf7gK06/Lyrielle-Vent-d-Aurore.jpg": "data/images/NPC/Lyrielle Vent-d'Aurore.png",
  "https://i.ibb.co/fdqBQsVD/Rapi-re-Elfique.jpg": "data/images/Objets/Armes/RapièreElfique.png",
  "https://i.ibb.co/SWMnfQ2/Armure-l-gere.jpg": "data/images/Dons/Generaux/Armure légere.png",
  "https://i.ibb.co/23cGYFvZ/stat-Force.png": "data/images/Autre/stats/Force.png",
  "https://i.ibb.co/Ng9TzjZL/stat-Agilit.png": "data/images/Autre/stats/Agilité.png",
  "https://i.ibb.co/67ZW01Q7/stat-Endurance.png": "data/images/Autre/stats/Endurance.png",
  "https://i.ibb.co/9mcP0Y0Y/stat-Intelligence.png": "data/images/Autre/stats/Intelligence.png",
  "https://i.ibb.co/B2BCGP6T/stat-Volont.png": "data/images/Autre/stats/Volonté.png",
  "https://i.ibb.co/HfthhzSF/stat-Chance.png": "data/images/Autre/stats/Chance.png",
  "https://i.ibb.co/VWfKvNCL/element-Feu.png": "data/images/Elements/Feu.png",
  "https://i.ibb.co/bMVKwNQP/element-Eau.png": "data/images/Elements/Eau.png",
  "https://i.ibb.co/W484kM90/element-Air.png": "data/images/Elements/Air.png",
  "https://i.ibb.co/gLxnsvfg/element-Terre.png": "data/images/Elements/Terre.png",
  "https://i.ibb.co/pjmcYV72/element-Lumi-re.png": "data/images/Elements/Lumière.png",
  "https://i.ibb.co/b5qK7czM/element-Nuit.png": "data/images/Elements/Nuit.png",
  "https://i.ibb.co/rKYgZ4Yp/element-Divin.png": "data/images/Elements/Divin.png",
  "https://i.ibb.co/SDD5KX34/element-Mal-fique.png": "data/images/Elements/Maléfique.png",
  "https://i.ibb.co/HpgHnJFD/4a7af38b09c7.png": "data/images/Autre/stats/éclats.png",
  "https://i.ibb.co/KjMVHR0b/All-Heroes.png": "data/images/Autre/Illustrations/AllHeroes.png",
  "https://i.ibb.co/KjGHFGqz/ee17068cdcd5.png": "data/images/Autre/stats/éclats.png",
  "https://i.ibb.co/0RNQqzm6/Tobin-compressed.jpg": "data/images/NPC/Tobin.png",
  "https://i.ibb.co/Fb6g1jHs/Nara-compressed.jpg": "data/images/NPC/Nara.png",
  "https://i.ibb.co/99Yyp34v/Dieu-Mal-fique-Myrin.jpg": "data/images/Autre/Dieux/Dieu-Maléfique-Myrin.jpg",
  "https://i.ibb.co/v6gPd8S3/Dieu-Eau-Nerha-l.jpg": "data/images/Autre/Dieux/Dieu-Eau-Nerhaël.jpg",
  "https://i.ibb.co/6RbVDHLV/Coup-Maitre-small.png": "data/images/Autre/Iconeheros/Guerrier.png",
  "https://i.ibb.co/Rpt6CMnG/Repos.jpg": "data/images/Campagne/Auberge/auberge1.jpg",
  "https://i.ibb.co/zHsG6h87/0ed55a04fcad.jpg": "data/images/Campagne/Auberge/auberge1.jpg",
  "https://i.ibb.co/6Kk6Svm/28225038a687.png": "data/images/Objets/Armes/BatonRodeur.png",
  "https://i.ibb.co/7t7SpC6X/Cartes-Destin2.png": "data/images/Autre/Illustrations/CartesDestin.png",
  "https://i.ibb.co/rKD1dRvp/Cartes-Destin.jpg": "data/images/Autre/Illustrations/CartesDestin.png"
};

// Files to process
const FILES = [
  'data/images.json',
  'data/classes.json',
  'data/dons.json',
  'data/creation.json',
  'data/elements.json',
  'data/element_urls.json',
  'data/stats.json',
  'data/stat_urls.json',
  'data/objets.json',
  'data/campagne.json',
  'data/combat.json',
  'data/competences-tests.json',
  'data/dieux.json',
  'data/gestion-des-ressources.json',
  'data/histoire.json',
  'data/npcs.json',
  'data/monstres.json',
  'js/config/contentTypes.js',
  'js/storage.js',
  'index.html',
  'dev.html'
];

function main() {
  // Step 1: Verify all local paths exist
  console.log('🔍 Verifying local file paths...');
  let missingCount = 0;
  for (const [url, localPath] of Object.entries(MANUAL_MAPPING)) {
    const fullPath = path.join(ROOT, localPath);
    if (!fs.existsSync(fullPath)) {
      console.log(`   ❌ Missing: ${localPath}`);
      missingCount++;
    }
  }
  if (missingCount > 0) {
    console.log(`\n⚠️  ${missingCount} local files not found. Continuing anyway (those URLs will be left as-is).`);
  } else {
    console.log('   ✅ All local files exist!');
  }

  // Step 2: Apply replacements
  console.log('\n📝 Applying manual mapping...');
  let totalReplaced = 0;

  for (const relFile of FILES) {
    const filePath = path.join(ROOT, relFile);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf-8');
    let fileReplacements = 0;

    for (const [ibbUrl, localPath] of Object.entries(MANUAL_MAPPING)) {
      const fullLocalPath = path.join(ROOT, localPath);
      if (!fs.existsSync(fullLocalPath)) continue;

      // Count and replace
      const count = (content.split(ibbUrl).length - 1);
      if (count > 0) {
        content = content.split(ibbUrl).join(localPath);
        fileReplacements += count;
      }
    }

    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`   ✅ ${relFile}: ${fileReplacements} URLs replaced`);
      totalReplaced += fileReplacements;
    }
  }

  // Step 3: Count remaining ibb.co URLs
  console.log('\n📊 Checking remaining ibb.co URLs...');
  let totalRemaining = 0;
  for (const relFile of FILES) {
    const filePath = path.join(ROOT, relFile);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(/https?:\/\/i\.ibb\.co\/[^\s"',)]+/g);
    if (matches) {
      const unique = [...new Set(matches)];
      console.log(`   ${relFile}: ${unique.length} remaining`);
      totalRemaining += unique.length;
    }
  }

  console.log(`\n✅ Total replaced: ${totalReplaced}`);
  console.log(`📊 Total remaining ibb.co URLs: ${totalRemaining}`);
}

main();
