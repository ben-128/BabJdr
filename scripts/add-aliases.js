/**
 * Script to add aliases for dons and sorts that have different names
 * between the data files and image files
 */
const fs = require('fs');
const path = require('path');

const IMAGES_JSON_PATH = path.join(__dirname, '..', 'data', 'images.json');

const data = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, 'utf8'));
const images = data.images;

// Don aliases - map data names to uploaded image keys
const donAliases = {
  'don:Maîtrise de la dague': 'don:Dague',
  'don:Maîtrise de l\'arc': 'don:Arc',
  'don:Chanceux': 'don:Chance',
  'don:Statistiques': 'don:Dons',
  'don:Premier soin': 'don:PremierSoins',
  'don:Attaque délayée': 'don:AttaqueDelay',
  'don:Second souffle': 'don:SecondSouffle',
  'don:Cri intimidant': 'don:CriIntimidant',
  'don:Porteur de charge lourde': 'don:PorteurLourd',
  'don:Croche-patte': 'don:CrochePattes',
  'don:Point faible': 'don:PointFaible',
  'don:Réflexes surhumains': 'don:ReflexesSurhum',
  'don:Exposer l\'armure': 'don:ExposerArmure',
  'don:Éventail de couteaux': 'don:Eventail de couteaux',
  'don:Mécréants': 'don:mécréant',
  // Rôdeur additional
  'don:Acrobate': 'don:Acrobate',
  'don:Adrénaline': 'don:Adrenaline',
  'don:Combo': 'don:Combo',
};

// Sort aliases - use fancy apostrophe where needed
const sortAliases = {
  'sort:Sorts de Mage:Téléportation': 'sort:teleportation',
  'sort:Sorts de Prêtre:Châtiment': 'sort:ChatimentSacré',
  'sort:Sorts de Prêtre:Refermer les blessures': 'sort:SoinMineur',
  'sort:Sorts de Prêtre:Guérison physique': 'sort:PurifiPhysique',
  'sort:Sorts d\'Enchanteur:Armure élémentaire Feu Terre Nuit': 'sort:ArmureElémentaire1',
  'sort:Sorts d\'Enchanteur:Armure élémentaire Eau Air Lumière': 'sort:ArmureElémentaire2',
  'sort:Sorts de Monstres:Soin mineur': 'sort:SoinMineur',
  // With fancy apostrophe (U+2019)
  'sort:Sorts de Prêtre:Putréfaction de l\u2019âme': 'sort:Malediction',
};

let added = 0;

// Add don aliases
for (const [targetKey, sourceKey] of Object.entries(donAliases)) {
  if (images[sourceKey] && !images[targetKey]) {
    images[targetKey] = images[sourceKey];
    console.log('Added don alias:', targetKey);
    added++;
  }
}

// Add sort aliases
for (const [targetKey, sourceKey] of Object.entries(sortAliases)) {
  if (images[sourceKey] && !images[targetKey]) {
    images[targetKey] = images[sourceKey];
    console.log('Added sort alias:', targetKey);
    added++;
  }
}

// Save
data.images = images;
data.meta.total_images = Object.keys(images).length;
data.meta.last_updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(data, null, 2));

console.log('\nAdded', added, 'aliases');
console.log('Total images:', Object.keys(images).length);
