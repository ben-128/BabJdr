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

function updateAudioJsFile(folderStructure) {
  const audioJsPath = path.join(__dirname, '../../js/modules/audio.js');
  
  try {
    let audioContent = fs.readFileSync(audioJsPath, 'utf8');
    
    // Générer la nouvelle structure
    const newStructure = Object.entries(folderStructure)
      .map(([folder, files]) => {
        const fileList = files.map(f => `'${f}'`).join(', ');
        return `        '${folder}': [${fileList}]`;
      })
      .join(',\n');
    
    // Remplacer la structure existante
    const regex = /const folderStructure = \{[\s\S]*?\};/;
    const newFolderStructure = `const folderStructure = {\n${newStructure}\n        };`;
    
    if (regex.test(audioContent)) {
      audioContent = audioContent.replace(regex, newFolderStructure);
      fs.writeFileSync(audioJsPath, audioContent, 'utf8');
      console.log('✅ Fichier audio.js mis à jour automatiquement !');
      return true;
    } else {
      console.log('❌ Structure non trouvée dans audio.js');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    return false;
  }
}

// Exécution du script
const musicPath = __dirname;
console.log('📁 Scanning music folder:', musicPath);
console.log('🔍 Recherche des fichiers .mp3...\n');

const structure = scanMusicFolder(musicPath);

console.log('🎵 PLAYLISTS DÉTECTÉES:');
console.log('=======================');
Object.entries(structure).forEach(([folder, files]) => {
  const icon = FOLDER_ICONS[folder.replace('Boss', '')] || '🎵';
  const name = folder.endsWith('Boss') ? `Boss ${folder.replace('Boss', '')}` : folder;
  console.log(`${icon} ${name}: ${files.length} fichier(s)`);
});

console.log('\n🔧 Mise à jour du fichier audio.js...');
const success = updateAudioJsFile(structure);

if (success) {
  console.log('\n✅ MISE À JOUR TERMINÉE !');
  console.log('📍 Rechargez simplement la page audio pour voir les changements');
} else {
  console.log('\n❌ MISE À JOUR MANUELLE REQUISE:');
  generatePlaylistConfig(structure);
}