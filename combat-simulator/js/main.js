/**
 * main.js
 * Point d'entree principal du simulateur de combat
 */

// Attendre que le DOM soit charge
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Simulateur de Combat Foresia - Initialisation...');

  try {
    // Creer l'interface utilisateur
    const ui = new CombatUI();
    await ui.init();

    // Exposer pour les callbacks inline
    window.combatUI = ui;

    console.log('Simulateur de Combat pret!');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    alert('Erreur lors du chargement du simulateur. Verifiez la console pour plus de details.');
  }
});
