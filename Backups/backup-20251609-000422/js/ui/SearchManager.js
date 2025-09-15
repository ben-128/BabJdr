// ============================================================================
// JDR-BAB APPLICATION - SEARCH MANAGER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // SEARCH MANAGER - SEARCH FUNCTIONALITY
  // ========================================
  window.SearchManager = {

    /**
     * Perform search across all content types
     */
    performSearch(query) {
      const normalizedQuery = query.toLowerCase().trim();
      
      if (!normalizedQuery) {
        this.clearMainSearchResults();
        return;
      }

      const results = [];
      
      // Search in spells
      if (window.SORTS && Array.isArray(window.SORTS)) {
        window.SORTS.forEach(category => {
          if (category.sorts && Array.isArray(category.sorts)) {
            category.sorts.forEach(spell => {
              if (this.matchesSearch(spell, normalizedQuery)) {
                results.push({
                  type: 'spell',
                  category: category.nom,
                  data: spell,
                  summary: this.generateSpellSummary(spell)
                });
              }
            });
          }
        });
      }

      // Search in dons
      if (window.DONS && Array.isArray(window.DONS)) {
        window.DONS.forEach(category => {
          if (category.dons && Array.isArray(category.dons)) {
            category.dons.forEach(don => {
              if (this.matchesSearch(don, normalizedQuery)) {
                results.push({
                  type: 'don',
                  category: category.nom,
                  data: don,
                  summary: this.generateDonSummary(don)
                });
              }
            });
          }
        });
      }

      // Search in classes
      if (window.CLASSES && Array.isArray(window.CLASSES)) {
        window.CLASSES.forEach(classe => {
          if (this.matchesSearch(classe, normalizedQuery)) {
            results.push({
              type: 'class',
              category: 'Classes',
              data: classe,
              summary: this.generateClassSummary(classe)
            });
          }
          
          // Search in subclasses
          if (classe.sousClasses && Array.isArray(classe.sousClasses)) {
            classe.sousClasses.forEach(sousClasse => {
              if (this.matchesSearch(sousClasse, normalizedQuery)) {
                results.push({
                  type: 'subclass',
                  category: classe.nom,
                  data: sousClasse,
                  summary: this.generateSubclassSummary(sousClasse, classe.nom)
                });
              }
            });
          }
        });
      }

      // Search in objects
      if (window.OBJETS && window.OBJETS.objets && Array.isArray(window.OBJETS.objets)) {
        window.OBJETS.objets.forEach(objet => {
          if (this.matchesSearch(objet, normalizedQuery)) {
            results.push({
              type: 'objet',
              category: 'Objets',
              data: objet,
              summary: this.generateObjetSummary(objet)
            });
          }
        });
      }

      // Search in static pages
      if (window.STATIC_PAGES) {
        Object.entries(window.STATIC_PAGES).forEach(([pageId, pageData]) => {
          if (pageData && this.matchesSearch(pageData, normalizedQuery)) {
            results.push({
              type: 'static-page',
              category: 'Pages',
              data: pageData,
              pageId: pageId,
              summary: this.generateStaticPageSummary(pageData)
            });
          }
        });
      }

      this.displaySearchResults(results, query);
    },

    /**
     * Check if item matches search query
     */
    matchesSearch(item, query) {
      // Fonction pour nettoyer le HTML et extraire le texte
      const stripHtml = (text) => {
        if (!text) return '';
        if (typeof text !== 'string') text = String(text);
        return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      };

      const processArray = (arr) => {
        if (!arr) return '';
        if (Array.isArray(arr)) {
          return arr.map(item => stripHtml(item)).join(' ');
        }
        return stripHtml(arr);
      };

      // Collecter TOUS les champs textuels possibles
      const searchFields = [
        // Champs communs
        item.nom, item.name, item.title, item.titre,
        item.description, item.resume, item.content,
        item.prerequis, item.coutMana, item.cout, item.temps,
        item.distance, item.duree, item.damage, item.effet,
        item.capacites, item.competences, item.avantages,
        item.inconvenients, item.cout_creation,
        
        // Champs spécifiques aux classes
        item.caracteristiques, item.competencesPrincipales,
        item.progression, item.equipementDeBase,
        
        // Champs des objets et monstres  
        item.type, item.tags, item.element, item.numero,
        item.pointsDeVie, item.armure, item.dommages,
        
        // Champs des sections de pages statiques
        processArray(item.sections),
        
        // Sous-classes
        processArray(item.sousClasses),
        
        // Meta-données
        item.author, item.source, item.version
      ];

      // Joindre tous les champs en un seul texte de recherche
      const searchText = searchFields
        .filter(field => field !== null && field !== undefined)
        .map(field => stripHtml(field))
        .join(' ')
        .toLowerCase();
      
      // Chercher chaque mot de la requête
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      return queryWords.every(word => searchText.includes(word));
    },

    /**
     * Display search results
     */
    displaySearchResults(results, query) {
      if (results.length === 0) {
        this.showNoResults(query);
        return;
      }

      // Group results by type for better organization
      const groupedResults = {};
      results.forEach(result => {
        const type = result.type;
        if (!groupedResults[type]) {
          groupedResults[type] = [];
        }
        groupedResults[type].push(result);
      });

      // Generate HTML for results
      let resultsHTML = `
        <div class="search-results-header">
          <h2>🔍 Résultats de recherche pour "${query}"</h2>
          <p>${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}</p>
          <button class="btn small" onclick="JdrApp.modules.ui.clearMainSearchResults()">
            ← Retour au sommaire
          </button>
        </div>
        <div class="search-results-content">
      `;

      // Add results by type
      Object.entries(groupedResults).forEach(([type, typeResults]) => {
        const typeLabel = this.getTypeLabel(type);
        resultsHTML += `
          <div class="search-results-section">
            <h3>${typeLabel} (${typeResults.length})</h3>
            <div class="search-results-grid">
        `;
        
        typeResults.forEach(result => {
          resultsHTML += this.generateResultCard(result);
        });
        
        resultsHTML += `
            </div>
          </div>
        `;
      });

      resultsHTML += `</div>`;
      
      // Replace main content with search results
      const main = document.querySelector('main .content');
      if (main) {
        main.innerHTML = resultsHTML;
      }
    },

    /**
     * Show no results message
     */
    showNoResults(query) {
      const noResultsHTML = `
        <div class="search-results-header">
          <h2>🔍 Aucun résultat pour "${query}"</h2>
          <p>Essayez avec d'autres mots-clés ou vérifiez l'orthographe.</p>
          <button class="btn small" onclick="JdrApp.modules.ui.clearMainSearchResults()">
            ← Retour au sommaire
          </button>
        </div>
      `;
      
      const main = document.querySelector('main .content');
      if (main) {
        main.innerHTML = noResultsHTML;
      }
    },

    /**
     * Clear search results and return to normal view
     */
    clearMainSearchResults() {
      // Reload the current page or go back to homepage
      if (window.location.hash && window.location.hash !== '#/') {
        // Reload current page
        if (JdrApp.modules.router && JdrApp.modules.router.handleRoute) {
          JdrApp.modules.router.handleRoute();
        }
      } else {
        // Go to homepage
        window.location.hash = '#/creation';
      }
      
      // Clear search input
      const searchInput = document.querySelector('#search');
      if (searchInput) {
        searchInput.value = '';
      }
    },

    // Summary generators
    generateSpellSummary(spell) {
      return `🔮 ${UIUtilities.stripHtml(spell.nom)} - ${UIUtilities.stripHtml(spell.prerequis || 'Aucun prérequis')} | ${UIUtilities.stripHtml(spell.coutMana || 'Coût inconnu')}`;
    },

    generateDonSummary(don) {
      return `🏆 ${UIUtilities.stripHtml(don.nom)} - ${UIUtilities.stripHtml(don.prerequis || 'Aucun prérequis')} | ${UIUtilities.stripHtml(don.cout || 'Coût inconnu')}`;
    },

    generateClassSummary(classe) {
      return `⚔️ ${UIUtilities.stripHtml(classe.nom)} - ${UIUtilities.stripHtml(classe.resume || 'Classe de combat')}`;
    },

    generateSubclassSummary(sousClasse, parentClass) {
      return `⚡ ${UIUtilities.stripHtml(sousClasse.nom)} (${UIUtilities.stripHtml(parentClass)}) - Sous-classe spécialisée`;
    },

    generateObjetSummary(objet) {
      const tags = objet.tags && Array.isArray(objet.tags) ? objet.tags.join(', ') : '';
      const numero = objet.numero ? `#${objet.numero}` : '';
      return `⚔️ ${UIUtilities.stripHtml(objet.nom)} ${numero} - ${UIUtilities.stripHtml(tags)} | ${UIUtilities.stripHtml(objet.prix || 'Prix non défini')}`;
    },

    generateStaticPageSummary(pageData) {
      return `📄 ${UIUtilities.stripHtml(pageData.title)} - ${UIUtilities.stripHtml(pageData.description || 'Page d\'information du jeu')}`;
    },

    getTypeLabel(type) {
      const typeLabels = {
        'spell': '🔮 Sorts',
        'don': '🏆 Dons',
        'class': '⚔️ Classes',
        'subclass': '⚡ Sous-classes',
        'objet': '⚔️ Objets',
        'static-page': '📄 Pages'
      };
      return typeLabels[type] || type;
    },

    generateResultCard(result) {
      const linkHash = this.generateLinkHash(result);
      
      return `
        <div class="search-result-card" onclick="window.location.hash='${linkHash}'">
          <div class="search-result-content">
            <div class="search-result-summary">${result.summary}</div>
            <div class="search-result-category">${result.category}</div>
          </div>
        </div>
      `;
    },

    generateLinkHash(result) {
      switch (result.type) {
        case 'spell':
          return `#/sorts-${UIUtilities.slugify(result.category)}`;
        case 'don':
          return `#/dons-${UIUtilities.slugify(result.category)}`;
        case 'class':
          return `#/${UIUtilities.slugify(result.data.nom)}`;
        case 'subclass':
          return `#/${UIUtilities.slugify(result.category)}`;
        case 'objet':
          return `#/objets`;
        case 'static-page':
          return `#/${result.pageId}`;
        default:
          return '#/creation';
      }
    }
  };

})();