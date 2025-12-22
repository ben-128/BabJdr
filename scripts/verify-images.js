const dons = require('../data/dons.json');
const sorts = require('../data/sorts.json');
const images = require('../data/images.json').images;

// Check dons
const allDons = [];
dons.forEach(cat => {
  if (cat.dons) cat.dons.forEach(d => allDons.push({name: d.nom, category: cat.nom}));
});
const missingDons = allDons.filter(d => {
  const key = 'don:' + d.name;
  return images[key] === undefined;
});

// Check sorts
const allSorts = [];
sorts.forEach(cat => {
  if (cat.sorts) cat.sorts.forEach(s => allSorts.push({name: s.nom, category: cat.nom}));
});
const missingSorts = allSorts.filter(s => {
  const key = 'sort:' + s.category + ':' + s.name;
  return images[key] === undefined;
});

console.log('=== Verification ===');
console.log('Dons:', allDons.length, '| Missing:', missingDons.length);
console.log('Sorts:', allSorts.length, '| Missing:', missingSorts.length);
console.log('Total mappings:', Object.keys(images).length);

if (missingDons.length > 0) {
  console.log('\nMissing dons:');
  missingDons.forEach(d => console.log('  -', d.name, '(' + d.category + ')'));
}
if (missingSorts.length > 0) {
  console.log('\nMissing sorts:');
  missingSorts.forEach(s => console.log('  -', s.name, '(' + s.category + ')'));
}
