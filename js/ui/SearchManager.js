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
          const searchDons = (dons) => {
            if (!dons || !Array.isArray(dons)) return;
            dons.forEach(don => {
              if (this.matchesSearch(don, normalizedQuery)) {
                results.push({
                  type: 'don',
                  category: category.nom,
                  data: don,
                  summary: this.generateDonSummary(don)
                });
              }
            });
          };
          searchDons(category.dons);
          if (category.subgroups) {
            category.subgroups.forEach(sg => searchDons(sg.dons));
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

      // Search in états (individual condition cards)
      if (window.STATIC_PAGES) {
        const etatsPage = window.STATIC_PAGES['etats'];
        if (etatsPage && etatsPage.sections) {
          etatsPage.sections.forEach(section => {
            if (section.type === 'card' && section.title) {
              const etatItem = { nom: section.title, description: section.content || '' };
              if (this.matchesSearch(etatItem, normalizedQuery)) {
                results.push({
                  type: 'etat',
                  category: 'États',
                  data: section,
                  summary: this.generateEtatSummary(section)
                });
              }
            }
          });
        }
      }

      // Search in static pages (règles, etc.)
      if (window.STATIC_PAGES) {
        Object.entries(window.STATIC_PAGES).forEach(([pageId, pageData]) => {
          if (pageId === 'etats') return; // Already searched individually above
          if (pageData && this.matchesSearch(pageData, normalizedQuery)) {
            results.push({
              type: 'static-page',
              category: 'Règles',
              data: pageData,
              pageId: pageId,
              summary: this.generateStaticPageSummary(pageData)
            });
          }
        });
      }

      // GM-mode only searches: objets, monstres, NPCs, tables de loot
      const isMJ = window.JdrApp && window.JdrApp.state && window.JdrApp.state.isMJ;

      if (isMJ) {
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

        // Search in monstres
        if (window.MONSTRES && Array.isArray(window.MONSTRES)) {
          window.MONSTRES.forEach(monstre => {
            if (this.matchesSearch(monstre, normalizedQuery)) {
              results.push({
                type: 'monstre',
                category: 'Monstres',
                data: monstre,
                summary: this.generateMonstreSummary(monstre)
              });
            }
          });
        }

        // Search in NPCs
        if (window.NPCS && Array.isArray(window.NPCS)) {
          window.NPCS.forEach(npc => {
            if (this.matchesSearch(npc, normalizedQuery)) {
              results.push({
                type: 'npc',
                category: 'NPCs',
                data: npc,
                summary: this.generateNPCSummary(npc)
              });
            }
          });
        }

        // Search in tables de loot
        if (window.TABLES_TRESORS && window.TABLES_TRESORS.tables && Array.isArray(window.TABLES_TRESORS.tables)) {
          window.TABLES_TRESORS.tables.forEach(table => {
            if (this.matchesSearch(table, normalizedQuery)) {
              results.push({
                type: 'table-loot',
                category: 'Tables de loot',
                data: table,
                summary: this.generateTableLootSummary(table)
              });
            }
          });
        }
      }

      this.displaySearchResults(results, query);
    },

    /**
     * Check if item matches search query
     */
    // Remove accents for search matching (é→e, à→a, etc.)
    normalizeAccents(text) {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

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
        item.abilites, item.butin,

        // Champs des NPCs
        item.interactions,

        // Champs des tables de loot
        item.fourchettes ? item.fourchettes.map(f => f.objet ? f.objet.nom : '').join(' ') : null,
        
        // Champs des sections de pages statiques
        processArray(item.sections),
        
        // Sous-classes
        processArray(item.sousClasses),
        
        // Meta-données
        item.author, item.source, item.version
      ];

      // Joindre tous les champs en un seul texte de recherche (sans accents)
      const searchText = this.normalizeAccents(
        searchFields
          .filter(field => field !== null && field !== undefined)
          .map(field => stripHtml(field))
          .join(' ')
          .toLowerCase()
      );

      // Chercher chaque mot de la requête (sans accents)
      const queryWords = this.normalizeAccents(query.toLowerCase()).split(/\s+/).filter(word => word.length > 0);
      return queryWords.every(word => searchText.includes(word));
    },

    /**
     * Display search results
     */
    displaySearchResults(results, query) {
      // Save current hash before showing search results
      const currentHash = window.location.hash;
      if (currentHash && currentHash !== '#/' && currentHash !== '#/search') {
        this._lastPageHash = currentHash;
      }

      if (results.length === 0) {
        this.showNoResults(query);
        return;
      }

      // Group results by type
      const groupedResults = {};
      results.forEach(result => {
        if (!groupedResults[result.type]) groupedResults[result.type] = [];
        groupedResults[result.type].push(result);
      });

      let resultsHTML = `
        <div class="search-page">
          <div class="search-page-header">
            <div class="search-page-title">
              <span class="search-page-icon">🔍</span>
              <span>Résultats pour "<strong>${query}</strong>"</span>
            </div>
            <div class="search-page-meta">
              <span class="search-page-count">${results.length} résultat${results.length > 1 ? 's' : ''}</span>
              <button class="btn small search-back-btn" onclick="JdrApp.modules.ui.clearMainSearchResults()">← Retour</button>
            </div>
          </div>
      `;

      Object.entries(groupedResults).forEach(([type, typeResults]) => {
        const typeLabel = this.getTypeLabel(type);
        resultsHTML += `
          <div class="search-page-section">
            <h3 class="search-section-title">${typeLabel} <span class="search-section-count">(${typeResults.length})</span></h3>
            <div class="search-results-grid">
        `;
        typeResults.forEach(result => {
          resultsHTML += this.generateResultCard(result);
        });
        resultsHTML += `</div></div>`;
      });

      resultsHTML += `</div>`;
      this._injectSearchPage(resultsHTML);
    },

    showNoResults(query) {
      // Save current hash
      const currentHash = window.location.hash;
      if (currentHash && currentHash !== '#/' && currentHash !== '#/search') {
        this._lastPageHash = currentHash;
      }

      const html = `
        <div class="search-page">
          <div class="search-page-header">
            <div class="search-page-title">
              <span class="search-page-icon">🔍</span>
              <span>Aucun résultat pour "<strong>${query}</strong>"</span>
            </div>
            <div class="search-page-meta">
              <span class="search-page-hint">Essayez d'autres mots-clés ou vérifiez l'orthographe.</span>
              <button class="btn small search-back-btn" onclick="JdrApp.modules.ui.clearMainSearchResults()">← Retour</button>
            </div>
          </div>
        </div>
      `;
      this._injectSearchPage(html);
    },

    _injectSearchPage(html) {
      const views = document.getElementById('views');
      if (!views) return;
      views.querySelectorAll('article').forEach(a => {
        a.classList.remove('active');
        a.style.display = 'none';
      });
      const oldResults = views.querySelector('#search-results-page');
      if (oldResults) oldResults.remove();
      const article = document.createElement('article');
      article.id = 'search-results-page';
      article.classList.add('active');
      article.style.display = 'block';
      article.innerHTML = html;
      views.appendChild(article);
    },

    clearMainSearchResults() {
      // Remove search results page
      const oldResults = document.querySelector('#search-results-page');
      if (oldResults) oldResults.remove();

      // Restore inline display on all articles (we set display:none in _injectSearchPage)
      const views = document.getElementById('views');
      if (views) {
        views.querySelectorAll('article').forEach(a => {
          a.style.display = '';
        });
      }

      // Navigate back to the last visited page
      const lastHash = this._lastPageHash;
      if (lastHash && lastHash !== '#/') {
        window.location.hash = lastHash;
      } else if (!window.location.hash || window.location.hash === '#/') {
        window.location.hash = '#/creation';
      }

      // Force router to re-render (parseRoute, not handleRoute which doesn't exist)
      if (JdrApp.modules.router && JdrApp.modules.router.parseRoute) {
        JdrApp.modules.router.parseRoute();
      }

      const searchInput = document.querySelector('#search');
      if (searchInput) searchInput.value = '';
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
      return `📜 ${UIUtilities.stripHtml(pageData.title)} - ${UIUtilities.stripHtml(pageData.description || 'Page de règles')}`;
    },

    generateEtatSummary(section) {
      const desc = section.content ? UIUtilities.stripHtml(section.content).substring(0, 80) : '';
      return `🩹 ${UIUtilities.stripHtml(section.title)}${desc ? ' - ' + desc + '…' : ''}`;
    },

    generateMonstreSummary(monstre) {
      const tags = monstre.tags && Array.isArray(monstre.tags) ? monstre.tags.join(', ') : '';
      const pv = monstre.pointsDeVie ? `${monstre.pointsDeVie} PV` : '';
      return `👹 ${UIUtilities.stripHtml(monstre.nom)}${tags ? ' - ' + tags : ''}${pv ? ' | ' + pv : ''}`;
    },

    generateNPCSummary(npc) {
      const desc = npc.description ? UIUtilities.stripHtml(npc.description).substring(0, 80) : '';
      return `🧑 ${UIUtilities.stripHtml(npc.nom)}${desc ? ' - ' + desc : ''}`;
    },

    generateTableLootSummary(table) {
      const tags = table.tags && Array.isArray(table.tags) ? table.tags.join(', ') : '';
      return `🎲 ${UIUtilities.stripHtml(table.nom)}${tags ? ' - ' + tags : ''}`;
    },

    getTypeLabel(type) {
      const typeLabels = {
        'spell': '🔮 Sorts',
        'don': '🏆 Dons',
        'class': '⚔️ Classes',
        'subclass': '⚡ Sous-classes',
        'etat': '🩹 États',
        'static-page': '📜 Règles',
        'objet': '🗡️ Objets',
        'monstre': '👹 Monstres',
        'npc': '🧑 NPCs',
        'table-loot': '🎲 Tables de loot'
      };
      return typeLabels[type] || type;
    },

    generateResultCard(result) {
      const linkHash = this.generateLinkHash(result);
      const itemName = (result.data.nom || result.data.title || result.data.name || '').replace(/'/g, "\\'");
      const itemNumero = result.data.numero || '';
      const resultType = result.type;

      return `
        <div class="search-result-card" onclick="SearchManager.navigateToResult('${linkHash}', '${resultType}', '${itemName}', '${itemNumero}')">
          <div class="search-result-content">
            <div class="search-result-summary">${result.summary}</div>
            <div class="search-result-category">${result.category}</div>
          </div>
        </div>
      `;
    },

    // Navigate to page then scroll to the specific card
    navigateToResult(hash, type, itemName, itemNumero) {
      // Remove search results first
      const oldResults = document.querySelector('#search-results-page');
      if (oldResults) oldResults.remove();

      // Navigate
      window.location.hash = hash;

      // For objects, show only the targeted object by numero
      if (type === 'objet' && itemNumero) {
        const tryShowObject = (attempts) => {
          if (attempts <= 0) return;
          const container = document.querySelector('#objets-container');
          if (container && JdrApp.modules.ui?.showOnlyObjectById) {
            JdrApp.modules.ui.showOnlyObjectById(itemNumero);
          } else {
            setTimeout(() => tryShowObject(attempts - 1), 200);
          }
        };
        setTimeout(() => tryShowObject(15), 300);
        return;
      }

      // For monsters/tables-loot: show ALL tags so every card is visible, then scroll
      if (type === 'monstre' || type === 'table-loot') {
        this._showAllFiltersAndScroll(type, itemName);
        return;
      }

      // For other types, scroll to the matching card
      const dataAttr = this.getDataAttrSelector(type);
      if (!dataAttr || !itemName) return;
      this._scrollToElement(dataAttr, itemName);
    },

    _showAllFiltersAndScroll(type, itemName) {
      const dataAttr = type === 'monstre' ? 'data-monster-name' : 'data-table-tresor-name';

      const tryActivate = (attempts) => {
        if (attempts <= 0) return;

        if (type === 'monstre') {
          // Enable ALL monster tags so every monster card is visible
          const config = window.ContentTypes?.monster;
          const allTags = config?.filterConfig?.availableTags ||
                          window.MONSTRES?._metadata?.availableTags || [];
          if (allTags.length > 0) {
            window.MONSTRES_FILTER_STATE = { visibleTags: [...allTags] };
            if (window.MonsterFilters?.regenerateMonstersPage) {
              window.MonsterFilters.regenerateMonstersPage();
            }
          }
        } else if (type === 'table-loot') {
          // Clear ALL table-loot tags (empty = show all tables)
          window.TABLES_TRESORS_FILTER_STATE = { visibleTags: [] };
          if (window.TableTresorFilters?.regenerateTablesTresorPage) {
            window.TableTresorFilters.regenerateTablesTresorPage();
          }
        }

        // Now scroll to the element
        setTimeout(() => this._scrollToElement(dataAttr, itemName), 300);
      };

      // Wait for page to render first
      setTimeout(() => tryActivate(5), 500);
    },

    _scrollToElement(dataAttr, itemName) {
      const tryScroll = (attempts) => {
        if (attempts <= 0) return;
        const el = document.querySelector(`[${dataAttr}="${itemName}"]`);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.outline = '2px solid var(--accent, #c8a050)';
            el.style.outlineOffset = '4px';
            setTimeout(() => {
              el.style.outline = '';
              el.style.outlineOffset = '';
            }, 2000);
          }, 100);
        } else {
          setTimeout(() => tryScroll(attempts - 1), 200);
        }
      };
      tryScroll(15);
    },

    getDataAttrSelector(type) {
      switch (type) {
        case 'spell': return 'data-spell-name';
        case 'don': return 'data-don-name';
        case 'subclass': return 'data-subclass-name';
        case 'monstre': return 'data-monster-name';
        case 'npc': return 'data-npc-name';
        case 'table-loot': return 'data-table-tresor-name';
        default: return '';
      }
    },

    generateLinkHash(result) {
      const sid = (s) => JdrApp.utils.data.sanitizeId(s);
      switch (result.type) {
        case 'spell':
          return `#/sorts-${sid(result.category)}`;
        case 'don':
          return `#/dons-${sid(result.category)}`;
        case 'class':
          return `#/${sid(result.data.nom)}`;
        case 'subclass':
          return `#/${sid(result.category)}`;
        case 'etat':
          return `#/etats`;
        case 'objet':
          return `#/objets`;
        case 'monstre':
          return `#/monstres`;
        case 'npc':
          return `#/npcs`;
        case 'table-loot':
          return `#/tables-tresors`;
        case 'static-page':
          return `#/${result.pageId}`;
        default:
          return '#/creation';
      }
    }
  };

})();