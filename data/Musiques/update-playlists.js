// ============================================================================
// MUSIC FOLDER SCANNER - Génère automatiquement les playlists
// ============================================================================

const fs = require('fs');
const path = require('path');

// Configuration des icônes par dossier
const FOLDER_ICONS = {
  'Auberge': '🍺',
  'Creation': '🎭',
  'Foret': '🌲',
  'Mine': '⛏️',
  'Voyage': '🚶',
  'Autre': '🎼'
};

// Dossiers qui utilisent le shuffle
const SHUFFLE_FOLDERS = ['Auberge', 'Voyage', 'Autre'];

function scanMusicFolder(musicPath) {
  const folderStructure = {};
  
  try {
    const folders = fs.readdirSync(musicPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    folders.forEach(folder => {
      const folderPath = path.join(musicPath, folder);
      const files = [];
      
      // Scanner récursivement pour inclure les sous-dossiers
      function scanRecursive(currentPath, relativePath = '') {
        const items = fs.readdirSync(currentPath, { withFileTypes: true });
        
        items.forEach(item => {
          if (item.isFile() && item.name.endsWith('.mp3')) {
            const filePath = relativePath ? `${relativePath}/${item.name}` : item.name;
            files.push(filePath);
          } else if (item.isDirectory()) {
            const subPath = path.join(currentPath, item.name);
            const subRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
            scanRecursive(subPath, subRelativePath);
          }
        });
      }
      
      scanRecursive(folderPath);
      
      if (files.length > 0) {
        folderStructure[folder] = files.sort();
        
        // Créer des playlists séparées pour les sous-dossiers Boss
        const bossFiles = files.filter(f => f.includes('Boss'));
        const regularFiles = files.filter(f => !f.includes('Boss'));
        
        if (bossFiles.length > 0 && regularFiles.length > 0) {
          // Playlist principale sans les boss
          folderStructure[folder] = regularFiles;
          
          // Playlist séparée pour les boss
          folderStructure[`${folder}Boss`] = bossFiles;
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur lors du scan:', error);
  }
  
  return folderStructure;
}

function generatePlaylistConfig(folderStructure) {
  console.log('\n🎵 STRUCTURE DES PLAYLISTS GÉNÉRÉE:');
  console.log('=====================================');
  
  Object.entries(folderStructure).forEach(([folder, files]) => {
    const playlistId = folder.toLowerCase();
    const folderName = folder.endsWith('Boss') ? 
      `Boss ${folder.replace('Boss', '')}` : folder;
    
    console.log(`\n'${folder}': [${files.map(f => `'${f}'`).join(', ')}],`);
  });
  
  console.log('\n🎯 CODE À COPIER DANS audio.js:');
  console.log('================================');
  console.log('const folderStructure = {');
  
  Object.entries(folderStructure).forEach(([folder, files]) => {
    console.log(`  '${folder}': [${files.map(f => `'${f}'`).join(', ')}],`);
  });
  
  console.log('};');
  
  return folderStructure;
}

// Exécution du script
const musicPath = __dirname;
console.log('📁 Scanning music folder:', musicPath);
console.log('🔍 Recherche des fichiers .mp3...\n');

const structure = scanMusicFolder(musicPath);
generatePlaylistConfig(structure);

console.log('\n✅ Scan terminé ! Copiez la structure générée dans js/modules/audio.js');
console.log('📍 Ligne à modifier: generatePlaylistsFromFolders() → folderStructure');
console.log('\n📋 INSTRUCTIONS:');
console.log('================');
console.log('1. Copiez le code "const folderStructure = {...}" ci-dessus');
console.log('2. Ouvrez js/modules/audio.js');
console.log('3. Remplacez la structure ligne ~60-68 dans generatePlaylistsFromFolders()');
console.log('4. Sauvegardez et rechargez la page audio');
console.log('\n🔄 QUAND UTILISER:');
console.log('- Après avoir ajouté/supprimé des fichiers .mp3');
console.log('- Après avoir créé/modifié des dossiers dans data/Musiques/');
console.log('- Après avoir déplacé des fichiers entre dossiers');
console.log('\n💡 UTILISATION: node update-playlists.js (dans le dossier Musiques)');