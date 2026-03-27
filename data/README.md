# Data Structure and Content Management

This directory contains all JSON data files and multimedia assets for the JDR-BAB application. The content system is fully configuration-driven and supports universal CRUD operations through the UnifiedEditor system.

## 📁 Complete Data Files Overview (27 JSON Files)

### 🎮 Core Game Content
- **`sorts.json`** - Spell system (11 spells across 3 categories)
  - Categories: Sorts de Mage (4), Sorts de Prêtre (7), Sorts d'Enchanteur (3)
  - Fields: nom, description, prerequisites, effet, coutMana, element
- **`classes.json`** - Character class system (5 main classes + 10 subclasses)
  - Main Classes: Guerrier, Mage, Prêtre, Rôdeur, Enchanteur
  - Complete subclass system with specialized abilities and dual-image support
- **`dons.json`** - Comprehensive feat system (24+ feats across 5 categories)
  - Categories: Generaux, Guerrier, Rôdeur, Mage, Prêtre, Enchanteur
  - Prerequisites, costs, and detailed mechanical effects
- **`objets.json`** - Equipment system (41+ items with advanced filtering)
  - Categories: Armes, Armures, Boucliers, Consommables, Accessoires, Composants
  - Advanced tag system with AND/OR filter logic
- **`monstres.json`** - Monster bestiary (10 creatures with full RPG stats)
  - Complete stat blocks, elemental armor, resistances, special abilities
  - Organized by environment (forêt) with boss variants
- **`tables-tresors.json`** - **TREASURE TABLE SYSTEM** with fourchettes
  - Random loot generation with dice ranges
  - HTML link generation for easy GM reference

### 🎲 Game Mechanics & Systems
- **`elements.json`** - Elemental system (8 elements with 4 opposing pairs)
- **`stats.json`** - Character statistics and modifiers
- **`etats.json`** - Status effects and conditions
- **`combat.json`** - Combat mechanics and rules
- **`competences-tests.json`** - Skill system and tests
- **`collections.json`** - Character creation collections
- **`traumas.json`** - Trauma and injury system

### 🌍 World Building & Lore
- **`creation.json`** - Character creation rules and guides
- **`dieux.json`** - Pantheon and divine entities
- **`geographie.json`** - World geography and locations
- **`histoire.json`** - World history and lore
- **`campagne.json`** - Campaign management tools
- **`gestion-des-ressources.json`** - Resource management rules



### ⚙️ Configuration & Navigation
- **`static-pages-config.json`** - Static page definitions (13 pages)
- **`toc-structure.json`** - Navigation structure (5 main sections)
- **`custom-page-descriptions.json`** - Custom page content
- **`monstres-page-desc.json`** - Monster page descriptions
- **`tables-tresors-page-desc.json`** - Treasure table page descriptions
- **`images.json`** - Asset management system (105+ images)

## 🖼️ Asset Organization

### Character Portraits (`/images/Classes/`) - 22+ Images
```
5 MAIN CLASSES (Male/Female variants):
├── Guerrier: 4 subclasses (Nain des montagnes, Berserker, Aventurier, Maître d'armes)
├── Mage: 2 subclasses (Érudit, Elfe)
├── Prêtre: 2 subclasses (Inquisiteur, Clerc Divin)
├── Rôdeur: 2 subclasses (Voleur, Chasseur)
└── Enchanteur: 2 subclasses (Esprit de la grande Fée, Lutin)

10 SUBCLASSES with specialized portraits:
├── All with male/female variants where appropriate
├── Racial variants (Elfe, Nain, Fée, Lutin)
└── Dual-image support for complex subclasses
```

### Spell Icons (`/images/Sorts/`) - 13+ Images
```
OFFENSIVE SPELLS:
├── BouleDeFeu.png, Eclair.png, VoleePierre.png, Vague.png

DEFENSIVE & HEALING:
├── Protection.png, SoinMineur.png

DIVINE MAGIC:
├── ChatimentSacré.png, ArmeLum.png
├── RevelationMineure.png, RevelationMajeure.png, RevelationUltime.png

UTILITY EFFECTS:
└── Acceleration.png, Sleep.png, AccrocheTerre.png
```

### Equipment Assets (`/images/Equipements/`) - 40+ Images
```
Armes/              # Weapons (6 images)
├── Arc1.png, Epee1.png, Epee2M1.png
├── Dague1.png, Baton1.png, Baton2.png

Armures/            # Armor (6 images)
├── ArmureCuir1.png, ArmureLourde1.png
├── ArmureLourde2.png, Robe1.png
├── Robe2.png, Robe3.png

Bouclier/           # Shields (1 image)
├── Bouclier1.png

Consumables/        # Consumable items (27+ images)
├── Herbs/          # Herbal remedies (8 images)
│   ├── Herb1.png through Herb8.png
├── Pots/           # Potions (2 images)
│   ├── Pot1.png, Pot2.png
└── SpellCasting/   # Magical wands (8+ images)
    ├── Wand1.png through Wand8.png (elemental variants)
    └── Additional magical implements
```

### Monster Gallery (`/images/Monstres/foret/`) - 10+ Images
```
FOREST CREATURES (matching monstres.json entries):
├── Monstre_Forêt_Araignée.png        # Araignée Géante
├── Monstre_Forêt_Crabe.png           # Crabe des Bois
├── Monstre_Forêt_Groink.png          # Groink (male)
├── Monstre_Forêt_Groinka.png         # Groinka (female)
├── Monstre_Forêt_Guepe.png           # Guêpe Géante
├── Monstre_Forêt_Ours.png            # Ours des Bois
├── Monstre_Forêt_Pouple.png          # Pouple de la forêt
├── Monstre_Forêt_Serpent.png         # Serpent de la forêt
├── Monstre_Forêt_ScarabeGeant.png    # Scarabée géant
└── Monstre_Forêt_Boss.png            # Boss Forêt (elite encounter)
```

## 🔧 Content Type System

All content types are defined in `/js/config/contentTypes.js` with:

### Field Schema Types
- **text** - Single-line text input
- **textarea** - Multi-line text input  
- **richtext** - HTML-formatted content
- **select** - Dropdown selection
- **number** - Numeric input
- **tags** - Tag-based filtering system

### Universal Content Format
**CRITICAL**: All content must be stored as HTML strings:

```json
// ✅ CORRECT Format
{
  "description": "<strong>Effect:</strong> Description with <em>formatting</em>",
  "capacites": "<ul><li><em>Ability:</em> Description.</li></ul>"
}

// ❌ WRONG Format  
{
  "description": ["item1", "item2"],           // Arrays not supported
  "capacites": { "type": "grid", "items": [] } // Complex objects not supported
}
```

## 🖼️ Image Management System

### URL Structure
- **Development**: External URLs (ibb.co hosting)
- **Production**: Local asset paths
- **Naming Convention**: `type:category:name` or `type:category:name:index`

### Dual-Image Support
Subclasses can have multiple images:
```json
{
  "nom": "Subclass Name",
  "image1": "subclass:class:name:1",
  "image2": "subclass:class:name:2"
}
```

### Responsive Display
- CSS `object-fit: contain` for optimal scaling
- Automatic sizing based on content type
- Mobile-friendly responsive design

## 📊 Data Statistics (Current Verified Counts)

### Content Volume
- **Spells**: 11 spells across 3 spell schools (Mage, Prêtre, Enchanteur)
- **Classes**: 5 main classes with 10 specialized subclasses
- **Feats**: 24+ feats across 5 categories with prerequisites
- **Equipment**: 41+ items with comprehensive tag system
- **Monsters**: 10 creatures with full RPG stat blocks
- **Treasure Tables**: Advanced fourchette system for loot generation
- **Images**: 105+ multimedia assets (characters, spells, equipment, monsters)
- **Total Content Items**: 200+ individual pieces of game content

### File Sizes (Approximate)
- `tables-tresors.json`: ~20-25KB (largest due to fourchette system)
- `sorts.json`: ~8-12KB (spell system)
- `classes.json`: ~15-20KB (class/subclass data)
- `monstres.json`: ~12-18KB (monster stat blocks)
- `objets.json`: ~15-25KB (equipment with tags)
- Image assets: ~5-8MB total (105+ images)

## 🔍 Development Guidelines

### Adding New Content Types
1. **Define in `contentTypes.js` FIRST**
2. **Add to `ContentFactory.js` initialization**
3. **System automatically handles via UnifiedEditor**:
   - Card generation via CardBuilder
   - Page generation via PageBuilder
   - CRUD operations via ContentFactory
   - Content editing via UnifiedEditor
   - UI interactions via generic handlers

### Advanced Features
- **Treasure Table System**: HTML link generation for GM tools
- **Campaign Tools**: Multi-level content organization
- **Tag-Based Filtering**: AND/OR logic for equipment and spell filtering
- **Dual-Image Support**: Multiple images per subclass
- **Dev Toolbox Integration**: Direct access to treasure table HTML links

### Data Validation Rules
- All text content as HTML strings
- Required fields enforced by configuration
- Type checking via field schemas
- Default values provided for new items

### Asset Management
- Images stored in organized subdirectories
- Metadata tracked in `images.json`
- Dual-mode URLs for dev/production
- Automatic responsive sizing

This data structure supports the universal content management system, enabling easy expansion and modification without code changes.