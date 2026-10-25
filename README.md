# Thermostat Card – Bosch BTH-RA

Variante de [Obs Thermostat Card](https://github.com/Obseb/Thermostat-Card) pour Home Assistant (entités `climate`), pensée pour les têtes thermostatiques type **Bosch BTH-RA**.

Mêmes fonctionnalités et même thème que la carte d'origine, mais une disposition compacte :

- **en haut à gauche** : badge rond (icône de l'entité, qui suit le mode) + nom de la pièce ; le badge est cliquable (action au choix) ;
- **en haut à droite** : interrupteur **Off ⇄ Chauffe**, dont la couleur change selon le mode (saumon en chauffe, gris quand c'est éteint, etc.), précédé d'une petite flamme avec la puissance de chauffe si elle est renseignée ;
- **à gauche** : température actuelle en grand, colorée selon le mode ;
- **à droite** : consigne avec chevrons ▲ / ▼ (envoi différé de 0,9 s pour éviter de spammer l'API).

Fonctions conservées de la carte d'origine, désactivées par défaut pour garder l'aspect compact :

- état en cours (Chauffe, Inactif, …) ;
- boutons de mode construits à partir des `hvac_modes` de l'entité ;
- graphique de suivi de la température et de la consigne sur une durée paramétrable ;
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
| `tap_action`           | action  | `more-info`     | Action au clic sur le badge (voir ci-dessous)                          |
| `heating_power_entity` | string  | —               | Entité (`sensor`, `number`, `input_number`) qui donne la puissance de chauffe en % |
| `heat_mode`            | string  | `heat`          | Mode activé quand on allume l'interrupteur (si absent de l'entité, le premier mode ≠ `off` est utilisé) |
| `show_status`          | boolean | `false`         | Affiche l'état en cours (Chauffe, Inactif, …) sous le titre            |
| `step`                 | number  | auto            | Pas consigne de température (1 en °F, 0,5 en °C par défaut)           |
| `show_modes`           | boolean | `false`         | Affiche les boutons de mode                                            |
| `modes`                | liste   | tous            | Modes affichés, dans cet ordre (aussi dans l'éditeur visuel)           |
| `show_graph`           | boolean | `false`         | Affiche le graphique de température et de consigne en bas de la carte  |
| `graph_hours`          | number  | `24`            | Durée du graphique, en heures (1 à 720)                                |

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

### Puissance de chauffe

Renseigne `heating_power_entity` avec une entité dont l'état est un pourcentage (0 à 100). Quand la valeur est supérieure à 0, une petite flamme s'affiche à gauche de l'interrupteur avec le pourcentage à l'intérieur. À 0, elle disparaît.

```yaml
type: custom:thermostat-card-bosch-bth-ra
entity: climate.cuisine
heating_power_entity: sensor.cuisine_puissance_chauffe
```

### Graphique de température et de consigne

Active `show_graph` pour afficher, en bas de la carte, un graphique de la même hauteur que les boutons de mode :

- **courbe pleine** : la température actuelle (`current_temperature`), lissée, avec un dégradé et un point lumineux sur la valeur du moment ;
- **courbe en pointillés** : la consigne (`temperature`), en escalier ; elle s'interrompt quand le thermostat est éteint ;
- **mini-repères** en haut et en bas à gauche : température maximale et minimale de la période ;
- **au survol ou au toucher** : un curseur affiche la température, la consigne et l'heure (avec le jour si la durée dépasse 24 h).

Les couleurs suivent le mode de l'entité, comme le reste de la carte.

```yaml
type: custom:thermostat-card-bosch-bth-ra
entity: climate.cuisine
show_graph: true
graph_hours: 48
```

Le graphique lit l'historique de l'entité `climate` via Home Assistant : il n'a besoin d'aucune autre carte (apexcharts-card n'est pas nécessaire) et utilise l'historique du *recorder*, qui doit donc conserver l'entité. Les données sont rechargées toutes les 5 minutes, et la courbe avance chaque minute.

### Taille et mise en page

La carte respecte la taille réglée dans l'onglet **Mise en page** (vue « sections ») : la hauteur choisie est conservée quand on élargit la carte, et le contenu s'adapte à la largeur et à la hauteur disponibles. Par défaut : 6 colonnes × 4 lignes, avec une ligne de plus pour `show_modes` et une autre pour `show_graph`.

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

Ajoute une **description** et des **topics** (`home-assistant`, `hacs`, `lovelace`) au dépôt, puis crée une **release** (ex. `v1.4.0`) : HACS s'en sert pour les versions. Le workflow `.github/workflows/validate.yml` vérifie la structure du dépôt.
