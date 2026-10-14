# Thermostat Card – Bosch BTH-RA

Variante de [Obs Thermostat Card](https://github.com/Obseb/Thermostat-Card) pour Home Assistant (entités `climate`), pensée pour les têtes thermostatiques type **Bosch BTH-RA**.

Mêmes fonctionnalités et même thème que la carte d'origine, mais une disposition compacte :

- **en haut à gauche** : badge rond (flamme) + nom de la pièce ;
- **en haut à droite** : interrupteur **Off ⇄ Chauffe**, dont la couleur change selon le mode (saumon en chauffe, gris quand c'est éteint, etc.) ;
- **à gauche** : température actuelle en grand, colorée selon le mode ;
- **à droite** : consigne avec chevrons ▲ / ▼ (envoi différé de 0,9 s pour éviter de spammer l'API).

Fonctions conservées de la carte d'origine, désactivées par défaut pour garder l'aspect compact :

- état en cours (Chauffe, Inactif, …) ;
- boutons de mode construits à partir des `hvac_modes` de l'entité ;
- menu déroulant des préréglages (`preset_modes`) ;
- mode `heat_cool` : deux consignes (basse / haute) ;
- icône ⚙ qui ouvre la fenêtre « plus d'infos » ;
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

| Option          | Type    | Défaut          | Description                                                            |
|-----------------|---------|-----------------|------------------------------------------------------------------------|
| `entity`        | string  | **requis**      | Entité `climate.xxx`                                                   |
| `name`          | string  | nom de l'entité | Titre de la carte                                                      |
| `icon`          | string  | selon le mode   | Icône du badge (ex. `mdi:fire`). Par défaut : flamme, flamme barrée si éteint |
| `heat_mode`     | string  | `heat`          | Mode activé quand on allume l'interrupteur (si absent de l'entité, le premier mode ≠ `off` est utilisé) |
| `show_subtitle` | boolean | `false`         | Affiche « Température actuelle » sous le titre                         |
| `show_status`   | boolean | `false`         | Affiche l'état en cours (Chauffe, Inactif, …) sous le titre            |
| `step`          | number  | auto            | Pas de la consigne (1 en °F, 0,5 en °C par défaut)                     |
| `show_modes`    | boolean | `false`         | Affiche les boutons de mode                                            |
| `show_mode_title` | boolean | `false`       | Affiche le titre « Mode » au-dessus des boutons                        |
| `modes`         | liste   | tous            | Modes affichés, dans cet ordre (aussi dans l'éditeur visuel)           |
| `show_presets`  | boolean | `false`         | Affiche le menu de préréglages                                         |
| `show_settings` | boolean | `false`         | Affiche l'icône ⚙ à gauche de l'interrupteur                           |

### L'interrupteur Off / Chauffe

- Interrupteur **à gauche** (éteint) : l'entité est en mode `off`, la consigne est grisée.
- Interrupteur **à droite** (allumé) : l'entité passe en mode `heat` (ou `heat_mode`).
- Sa couleur, comme celle du badge et de la température, suit le mode de l'entité : saumon en chauffe, bleu en refroidissement, jaune en auto, gris en `off`.

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

Ajoute une **description** et des **topics** (`home-assistant`, `hacs`, `lovelace`) au dépôt, puis crée une **release** (ex. `v1.0.0`) : HACS s'en sert pour les versions. Le workflow `.github/workflows/validate.yml` vérifie la structure du dépôt.
