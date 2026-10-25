# Thermostat Card – Bosch BTH-RA

Variante de [Obs Thermostat Card](https://github.com/Obseb/Thermostat-Card) pour Home Assistant (entités `climate`), pensée pour les têtes thermostatiques type **Bosch BTH-RA**.

Mêmes fonctionnalités et même thème que la carte d'origine, mais une disposition compacte :

- **en haut à gauche** : badge rond (icône de l'entité, qui suit le mode) + nom de la pièce ; le badge est cliquable (action au choix) ;
- **en haut à droite** : interrupteur **Off ⇄ Chauffe**, dont la couleur change selon le mode (saumon en chauffe, gris quand c'est éteint, etc.), précédé d'une petite icône de batterie rouge clignotante si la batterie est faible ;
- **à gauche** : température actuelle en grand, colorée selon le mode ; entre les deux, une petite flamme avec la puissance de chauffe si elle est renseignée ;
- **à droite** : consigne avec chevrons ▲ / ▼ (envoi différé de 0,9 s pour éviter de spammer l'API).

Fonctions conservées de la carte d'origine, désactivées par défaut pour garder l'aspect compact :

- état en cours (Chauffe, Inactif, …) ;
- boutons de mode construits à partir des `hvac_modes` de l'entité ;
- mode `heat_cool` : deux consignes (basse / haute) ;
- éditeur visuel, textes en français ou anglais selon la langue de Home Assistant.

## Installation via HACS

1. HACS → ⋮ → **Dépôts personnalisés**.
2. Ajoute l'URL de ce dépôt, catégorie **Dashboard** (ou « Lovelace » selon la version).
3. Installe **Thermostat Card - Bosch BTH-RA**, puis recharge le navigateur (Ctrl+F5).

Si la ressource n'est pas ajoutée automatiquement : *Paramètres → Tableaux de bord → ⋮ → Ressources* → ajoute
`/hacsfiles/Thermostat-Card-Bosch-BTH-RA/thermostat-card-bosch-bth-ra.js` (type **Module JavaScript**).
Le dossier après `/hacsfiles/` porte le nom exact de ton dépôt GitHub.

## Installation manuelle

Copie `thermostat-card-bosch-bth-ra.js` dans `/config/www/` et ajoute la ressource `/local/thermostat-card-bosch-bth-ra.js` (Module JavaScript).

## Configuration

```yaml
type: custom:thermostat-card-bosch-bth-ra
entity: climate.cuisine
name: Cuisine
```

| Option                 | Type    | Défaut          | Description                                                            |
|------------------------|---------|-----------------|------------------------------------------------------------------------|
| `entity`               | string  | **requis**      | Entité `climate.xxx`                                                   |
| `name`                 | string  | nom de l'entité | Titre de la carte                                                      |
| `icon`                 | string  | icône de l'entité | Icône du badge. Par défaut : l'icône d'état de l'entité telle que Home Assistant l'affiche, qui varie avec le mode (flamme en chauffe, bouton power à l'arrêt, …) |
| `color`                | string ou [r, g, b] | saumon `#e8958a` | Couleur de surbrillance en mode chauffe (voir ci-dessous) |
| `tap_action`           | action  | `more-info`     | Action au clic sur le badge (voir ci-dessous)                          |
| `heating_power_entity` | string  | —               | Entité (`sensor`, `number`, `input_number`) qui donne la puissance de chauffe en % |
| `battery_low_entity`   | string  | —               | Entité de batterie faible (ex. `binary_sensor.vanne_cuisine_battery_low`) : une petite batterie rouge clignote à gauche de l'interrupteur quand elle est à `on` |
| `heat_mode`            | string  | `heat`          | Mode activé quand on allume l'interrupteur (si absent de l'entité, le premier mode ≠ `off` est utilisé) |
| `show_status`          | boolean | `false`         | Affiche l'état en cours (Chauffe, Inactif, …) sous le titre            |
| `step`                 | number  | auto            | Pas consigne de température (1 en °F, 0,5 en °C par défaut)           |
| `show_modes`           | boolean | `false`         | Affiche les boutons de mode                                            |
| `modes`                | liste   | tous            | Modes affichés, dans cet ordre (aussi dans l'éditeur visuel)           |

### L'interrupteur Off / Chauffe

- Interrupteur **à gauche** (éteint) : l'entité est en mode `off`, la consigne est grisée.
- Interrupteur **à droite** (allumé) : l'entité passe en mode `heat` (ou `heat_mode`).
- Sa couleur, comme celle du badge et de la température, suit le mode de l'entité : saumon en chauffe, bleu en refroidissement, jaune en auto, gris en `off`.

### Action au clic sur le badge

`tap_action` accepte les actions standard de Home Assistant :

| `action`         | Effet                                   | Paramètres                                  |
|------------------|-----------------------------------------|---------------------------------------------|
| `none`           | Ne rien faire                           | —                                           |
| `more-info`      | Ouvre la fenêtre « plus d'infos » (défaut) | —                                        |
| `navigate`       | Va vers une vue du tableau de bord      | `navigation_path`                           |
| `url`            | Ouvre une URL dans un nouvel onglet     | `url_path`                                  |
| `perform-action` | Exécute une action Home Assistant       | `perform_action`, `data`, `target`          |

```yaml
type: custom:thermostat-card-bosch-bth-ra
entity: climate.cuisine
tap_action:
  action: navigate
  navigation_path: /lovelace/chauffage
```

### Batterie faible

Renseigne `battery_low_entity` avec l'entité de batterie faible de ta vanne. Quand son état est `on` (ou `low`), une petite icône de batterie rouge clignote à gauche de l'interrupteur ; elle disparaît dès que l'état repasse à `off`. L'icône est placée hors de la mise en page : rien ne bouge dans la carte, qu'elle soit affichée ou non. Le clignotement est désactivé si le système demande de réduire les animations.

```yaml
type: custom:thermostat-card-bosch-bth-ra
entity: climate.cuisine
battery_low_entity: binary_sensor.vanne_cuisine_battery_low
```

### Puissance de chauffe

Renseigne `heating_power_entity` avec une entité dont l'état est un pourcentage (0 à 100). Quand la valeur est supérieure à 0, une petite flamme s'affiche entre la température actuelle et la consigne, avec le pourcentage à l'intérieur. À 0, elle disparaît.

```yaml
type: custom:thermostat-card-bosch-bth-ra
entity: climate.cuisine
heating_power_entity: sensor.cuisine_puissance_chauffe
```

### Taille et mise en page

La carte respecte la taille réglée dans l'onglet **Mise en page** (vue « sections ») : la hauteur choisie est conservée quand on élargit la carte, et le contenu s'adapte à la largeur et à la hauteur disponibles. Si la carte est plus haute que nécessaire, l'en-tête (badge, nom, interrupteur, flamme) reste en haut et la température avec la consigne se centrent dans l'espace restant. Par défaut : 6 colonnes × 4 lignes (5 lignes avec `show_modes`).

### Choisir les modes affichés

Dans l'éditeur visuel, coche les modes voulus (après avoir activé « Afficher les boutons de mode »). En YAML :

```yaml
type: custom:thermostat-card-bosch-bth-ra
entity: climate.cuisine
show_modes: true
modes:
  - heat
  - cool
  - "off"
```
> Pense aux guillemets autour de `"off"` en YAML (sinon il est lu comme `false`).

### Couleur de surbrillance

`color` remplace le saumon utilisé en mode chauffe : badge, contour et pastille de l'interrupteur, température actuelle, libellés et bouton de mode actif. Le fond sombre associé (derrière l'interrupteur et le bouton actif) est calculé automatiquement à partir de la couleur choisie. Les autres modes gardent leurs couleurs (gris à l'arrêt, bleu en refroidissement, jaune en auto).

Dans l'éditeur visuel, un sélecteur de couleur est proposé. En YAML, tout format CSS est accepté :

```yaml
type: custom:thermostat-card-bosch-bth-ra
entity: climate.cuisine
color: "#4fd1c5"          # ou rgb(79, 209, 197), ou var(--primary-color)
```

Supprime la ligne `color` du YAML pour revenir au saumon.

### Personnalisation du thème

Variables CSS utilisables (ex. avec card-mod) : `--htc-card-bg`, `--htc-tile-bg`.

## Publier sur GitHub pour HACS

Crée d'abord le dépôt vide `Thermostat-Card-Bosch-BTH-RA` sur GitHub (les noms de dépôt n'acceptent ni espaces ni « - » isolés), puis :

```bash
git init
git add .
git commit -m "Première version"
git branch -M main
git remote add origin https://github.com/<ton-user>/Thermostat-Card-Bosch-BTH-RA.git
git push -u origin main
```

Ajoute une **description** et des **topics** (`home-assistant`, `hacs`, `lovelace`) au dépôt, puis crée une **release** (ex. `v1.5.2`) : HACS s'en sert pour les versions. Le workflow `.github/workflows/validate.yml` vérifie la structure du dépôt.
