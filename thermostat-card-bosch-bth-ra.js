/*!
 * Thermostat Card – Bosch BTH-RA pour Home Assistant
 * Variante de « Obs Thermostat Card » : mêmes fonctionnalités et même thème,
 * mais une disposition compacte (badge + nom, interrupteur Off / Chauffe,
 * température actuelle à gauche, consigne avec chevrons à droite).
 */

const CARD_VERSION = "1.5.9";
const CARD_TAG = "thermostat-card-bosch-bth-ra";
const EDITOR_TAG = `${CARD_TAG}-editor`;

const MODE_ICONS = {
  heat: "mdi:fire",
  heat_cool: "mdi:autorenew",
  auto: "mdi:autorenew",
  cool: "mdi:snowflake",
  dry: "mdi:water-percent",
  fan_only: "mdi:fan",
  off: "mdi:power",
};
const DEFAULT_BADGE_ICON = "mdi:thermostat"; // repli ultime (entité indisponible, par exemple)
// Flamme pleine (puissance de chauffe) : le texte du pourcentage reste lisible dedans
const FLAME_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 0.67s0.74 2.65 0.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l0.03-0.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z"/></svg>`;
const MODE_ORDER = ["heat", "heat_cool", "auto", "cool", "dry", "fan_only", "off"];
const MODE_COLORS = {
  heat: "#e8958a",
  cool: "#6fb1f0",
  heat_cool: "#e6b450",
  auto: "#e6b450",
  dry: "#e6b450",
  fan_only: "#7fcfc4",
  off: "#9e9e9e",
};
const MODE_TILE_BG = {
  heat: "#48322f",
  cool: "#2b3b4c",
  heat_cool: "#463d29",
  auto: "#463d29",
  dry: "#463d29",
  fan_only: "#27403d",
  off: "#333333",
};

const I18N = {
  en: {
    heat: "HEAT",
    cool: "COOL",
    power: "Heating on / off",
    battery: "Low battery",
    notfound: "Entity not found",
    actions: { heating: "Heating", cooling: "Cooling", idle: "Idle", off: "Off", drying: "Drying", fan: "Fan", defrosting: "Defrosting" },
  },
  fr: {
    heat: "CHAUD",
    cool: "FROID",
    power: "Chauffage marche / arrêt",
    battery: "Batterie faible",
    notfound: "Entité introuvable",
    actions: { heating: "Chauffe", cooling: "Refroidissement", idle: "Inactif", off: "Éteint", drying: "Déshumidification", fan: "Ventilation", defrosting: "Dégivrage" },
  },
};

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Toujours une décimale (20.0), comme sur la maquette
const fmtTemp = (v) => {
  if (v === null || v === undefined || isNaN(v)) return "--";
  return (Math.round(Number(v) * 10) / 10).toFixed(1);
};

// Couleur personnalisée : tableau [r, g, b] (sélecteur de l'éditeur) ou chaîne CSS
// (#e8958a, rgb(...), hsl(...), nom, var(--primary-color)). Renvoie null si invalide.
const resolveColor = (v) => {
  let c = null;
  if (Array.isArray(v) && v.length >= 3 && v.slice(0, 3).every((n) => isFinite(n))) {
    c = `rgb(${v.slice(0, 3).map((n) => Math.round(Number(n))).join(", ")})`;
  } else if (typeof v === "string" && v.trim()) {
    c = v.trim();
  }
  if (!c) return null;
  try {
    if (typeof CSS !== "undefined" && CSS.supports && !CSS.supports("color", c)) return null;
  } catch (e) { /* ignore */ }
  return c;
};

// Toutes les tailles sont exprimées en « unités » : 1 unité = 1 % de la largeur
// de référence de référence de la carte (REF_W). La variable --u est recalculée en JS (_fit) pour que
// la carte tienne dans la largeur ET la hauteur données par la mise en page.
const PAD_X = 6.2; // marge intérieure horizontale (unités)
const PAD_Y = 7.0; // marge intérieure verticale (unités)
const REF_W = 100 + 2 * PAD_X; // largeur de référence de la carte, en unités
const U = (k) => `calc(var(--u, ${(100 / REF_W).toFixed(4)}cqw) * ${k})`;

const STYLE = `
  :host { display: block; height: 100%; }
  ha-card {
    container-type: inline-size;
    display: flex; flex-direction: column; justify-content: flex-start;
    height: 100%; box-sizing: border-box; overflow: hidden;
    background: var(--htc-card-bg, var(--ha-card-background, var(--card-background-color, #1c1c1c)));
    color: var(--primary-text-color, #fff);
    border-radius: var(--ha-card-border-radius, 24px);
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
    --htc-tile: var(--htc-tile-bg, var(--secondary-background-color, #2a2a2a));
    --htc-muted: var(--secondary-text-color, #8a8a8a);
    --htc-accent: #e8958a;
    --htc-accent-bg: #48322f;
  }
  .content {
    flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
    box-sizing: border-box; padding: ${U(PAD_Y)} ${U(PAD_X)};
  }
  .header { flex: 0 0 auto; }
  /* Corps (température + consigne + modes) : centré verticalement dans l'espace sous l'en-tête */
  .body { flex: 1 1 auto; min-height: 0; margin-top: ${U(7)}; display: flex; flex-direction: column; justify-content: center; }
  .bodyinner { flex: 0 0 auto; }

  /* --- En-tête : badge + nom | puissance + interrupteur ---------------- */
  .header { display: flex; justify-content: space-between; align-items: center; gap: ${U(3)}; }
  .id { display: flex; align-items: center; gap: ${U(4)}; min-width: 0; margin-right: ${U(11.6)}; }
  .badge {
    flex: 0 0 auto; box-sizing: border-box; margin: 0; padding: 0; border: none; font: inherit;
    width: ${U(15.3)}; height: ${U(15.3)}; border-radius: 50%;
    background: var(--htc-accent); color: var(--htc-accent-bg);
    display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: ${U(8.6)};
    cursor: default; -webkit-tap-highlight-color: transparent;
    transition: background .3s, color .3s, filter .15s, transform .1s;
  }
  .badge.clickable { cursor: pointer; }
  .badge.clickable:hover { filter: brightness(1.12); }
  .badge.clickable:active { transform: scale(0.94); }
  .badge:focus-visible { outline: 2px solid var(--htc-accent); outline-offset: 3px; }
  .txt { min-width: 0; }
  .title {
    font-size: ${U(6.7)}; font-weight: 500; line-height: 1.2;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .status { font-size: ${U(4.6)}; font-weight: 500; color: var(--htc-muted); margin-top: 2px; }

  .right { position: relative; display: flex; align-items: center; gap: ${U(3)}; flex: 0 0 auto; }
  /* Batterie faible : à gauche de l'interrupteur, hors flux (n'influe pas sur la mise en page) */
  .batt {
    position: absolute; right: calc(100% + ${U(3)}); top: 50%; transform: translateY(-50%);
    --mdc-icon-size: ${U(8.6)}; color: var(--error-color, #f44336);
    animation: htc-blink 1.2s ease-in-out infinite;
  }
  @keyframes htc-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
  @media (prefers-reduced-motion: reduce) { .batt { animation: none; } }

  /* Puissance de chauffe : petite flamme avec le pourcentage dedans,
     centrée entre la température actuelle et la consigne */
  .power {
    flex: 0 0 auto; position: relative;
    display: flex; align-items: center; justify-content: center;
    width: ${U(14.5)}; height: ${U(14.5)}; margin: ${U(-0.55)}; /* marges négatives : même encombrement que l'icône thermomètre (13.4u), rien ne bouge */
    color: var(--htc-accent); transition: color .3s;
  }
  .power svg { width: 100%; height: 100%; fill: currentColor; }
  .power span {
    position: absolute; left: 0; right: 0; top: 68%; transform: translateY(-50%);
    text-align: center; font-size: ${U(4.2)}; font-weight: 700; line-height: 1; letter-spacing: -0.04em;
    color: #fff;
  }

  /* Interrupteur Off / Chauffe : sa couleur suit le mode (--htc-accent) */
  .switch {
    --sw-h: ${U(9.2)};
    --sw-w: calc(var(--sw-h) * 2);
    --knob: calc(var(--sw-h) - ${U(3.84)});
    position: relative; flex: 0 0 auto; box-sizing: border-box; padding: 0; cursor: pointer;
    width: var(--sw-w); height: var(--sw-h); border-radius: 999px;
    border: ${U(0.77)} solid var(--htc-accent); background: var(--htc-accent-bg);
    transition: background .3s, border-color .3s;
  }
  .switch .knob {
    position: absolute; top: ${U(1.15)}; left: ${U(1.15)}; width: var(--knob); height: var(--knob);
    border-radius: 50%; background: var(--htc-accent);
    transition: transform .25s ease, background .3s;
  }
  .switch.on .knob { transform: translateX(calc(var(--sw-w) - ${U(3.84)} - var(--knob))); }
  .switch:disabled { opacity: .4; cursor: default; }
  .switch:focus-visible { outline: 2px solid var(--htc-accent); outline-offset: 3px; }

  /* --- Corps : température actuelle | consigne ------------------------ */
  .main { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: ${U(3)}; }
  .main .current { grid-column: 1; }
  .main .targets { grid-column: 3; }
  .current {
    display: flex; align-items: center; gap: ${U(3)}; min-width: 0; white-space: nowrap;
    color: var(--htc-muted); transition: color .3s;
  }
  /* Température actuelle en rouge uniquement quand la flamme est affichée */
  .current.heating .num, .current.heating .unit { color: var(--htc-hot, #ff4d4d); }
  .current .thermo { color: var(--htc-muted); --mdc-icon-size: ${U(13.4)}; flex: 0 0 auto; }
  .current .num { font-size: ${U(17.5)}; font-weight: 400; line-height: 1; letter-spacing: -0.02em; }
  .current .unit { align-self: flex-start; margin-top: ${U(1.2)}; font-size: ${U(7.7)}; font-weight: 400; line-height: 1; }
  .main.dual .current .num { font-size: ${U(12)}; }
  .main.dual .current .unit { font-size: ${U(5.7)}; margin-top: ${U(0.8)}; }

  .targets { display: flex; align-items: stretch; gap: ${U(2)}; }
  .target { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: ${U(24)}; }
  .target .label { font-size: ${U(3.2)}; font-weight: 500; letter-spacing: 0.03em; color: var(--htc-accent); }
  .arrow {
    box-sizing: border-box; width: ${U(20)}; height: ${U(18.4)};
    padding: 0; border: none; border-radius: ${U(5.4)}; background: none;
    color: var(--primary-text-color); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: ${U(15.3)};
    transition: background .15s, transform .1s;
  }
  .arrow:hover { background: var(--htc-tile); }
  .arrow:active { transform: scale(0.92); }
  .arrow:disabled { opacity: .35; cursor: default; background: none; transform: none; }
  .target .val {
    display: flex; align-items: flex-start; gap: 2px; padding: ${U(1.5)} 0;
    font-size: ${U(9.5)}; font-weight: 500; line-height: 1.2; white-space: nowrap;
  }
  .target .val small { font-size: 0.62em; font-weight: 400; color: var(--htc-muted); margin-top: 0.05em; }
  .targets.dual .target { min-width: ${U(16)}; }
  .targets.dual .val { font-size: ${U(6)}; }
  .targets.dual .arrow { width: ${U(15.3)}; }

  /* --- Boutons de mode (optionnels, comme la carte d'origine) ---------- */
  .modes-block { margin-top: ${U(5.4)}; }
  .modes { display: grid; gap: ${U(4.6)}; }
  .mode {
    height: ${U(20)}; border: none; border-radius: ${U(6.9)};
    background: var(--htc-tile); color: var(--primary-text-color); cursor: pointer;
    display: flex; align-items: center; justify-content: center; --mdc-icon-size: ${U(10)};
    transition: filter .15s, background .2s;
  }
  .mode ha-icon { --mdc-icon-size: ${U(10)}; }
  .mode:hover { filter: brightness(1.25); }
  .mode.active { color: var(--c); background: var(--bg); }

  .error { padding: 16px; color: var(--error-color, #db4437); }
  [hidden] { display: none !important; }
`;

class ThermostatCardBoschBthRa extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._pending = {};
    this._built = false;
    this._cache = {};
    this._u = null;
  }

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig(hass) {
    const entity = hass && Object.keys(hass.states).find((id) => id.startsWith("climate."));
    return { entity: entity || "climate.thermostat" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Veuillez définir une entité `entity` (climate.xxx).");
    this._config = {
      show_status: false,
      show_modes: false,
      ...config,
    };
    this._build();
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  connectedCallback() {
    if (!this._ro && typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this._scheduleFit());
    }
    if (this._ro) this._ro.observe(this);
    this._scheduleFit();
  }

  disconnectedCallback() {
    if (this._ro) this._ro.disconnect();
    cancelAnimationFrame(this._fitRaf);
  }

  getCardSize() {
    const c = this._config || {};
    return 4 + (c.show_modes ? 1 : 0);
  }

  // Taille par défaut dans la vue « sections » ; l'utilisateur peut la
  // modifier dans l'onglet « Mise en page » : la carte s'y adapte.
  getGridOptions() {
    const c = this._config || {};
    const rows = 4 + (c.show_modes ? 1 : 0);
    return { columns: 6, rows, min_columns: 3, min_rows: 2 };
  }

  get _t() {
    const lang = ((this._hass && this._hass.language) || "en").slice(0, 2);
    return I18N[lang] || I18N.en;
  }

  _build() {
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <ha-card>
        <div class="error" hidden></div>
        <div class="content">
          <div class="header">
            <div class="id">
              <button class="badge" data-act="badge"><ha-icon icon="${DEFAULT_BADGE_ICON}"></ha-icon></button>
              <div class="txt">
                <div class="title"></div>
                <div class="status"></div>
              </div>
            </div>
            <div class="right">
              <ha-icon class="batt" icon="mdi:battery-alert-variant-outline" role="img" hidden></ha-icon>
              <button class="switch" role="switch" aria-checked="false" data-act="toggle"><span class="knob"></span></button>
            </div>
          </div>
          <div class="body"><div class="bodyinner">
          <div class="main">
            <div class="current">
              <div class="power" hidden>${FLAME_SVG}<span></span></div>
              <ha-icon class="thermo" icon="mdi:thermometer"></ha-icon>
              <span class="num"></span><span class="unit"></span>
            </div>
            <div class="targets"></div>
          </div>
          <div class="modes-block">
            <div class="modes"></div>
          </div>
          </div></div>
        </div>
      </ha-card>`;
    const r = this.shadowRoot;
    this._els = {
      error: r.querySelector(".error"),
      content: r.querySelector(".content"),
      header: r.querySelector(".header"),
      body: r.querySelector(".body"),
      bodyInner: r.querySelector(".bodyinner"),
      card: r.querySelector("ha-card"),
      badge: r.querySelector(".badge"),
      batt: r.querySelector(".batt"),
      title: r.querySelector(".title"),
      status: r.querySelector(".status"),
      sw: r.querySelector(".switch"),
      power: r.querySelector(".power"),
      thermo: r.querySelector(".thermo"),
      current: r.querySelector(".current"),
      powerTxt: r.querySelector(".power span"),
      main: r.querySelector(".main"),
      num: r.querySelector(".num"),
      unit: r.querySelector(".unit"),
      targets: r.querySelector(".targets"),
      modesBlock: r.querySelector(".modes-block"),
      modes: r.querySelector(".modes"),
    };
    r.addEventListener("click", (e) => this._onClick(e));
    this._cache = {};
    if (this._u) this._els.content.style.setProperty("--u", `${this._u}px`);
    this._built = true;
    this._scheduleFit();
  }

  // --- adaptation à la mise en page ---------------------------------------
  // La hauteur donnée par la grille est respectée : on choisit la plus grande
  // échelle pour laquelle le contenu tient en largeur ET en hauteur. Agrandir
  // la carte en largeur n'augmente donc plus sa hauteur.

  _scheduleFit() {
    cancelAnimationFrame(this._fitRaf);
    this._fitRaf = requestAnimationFrame(() => this._fit());
  }

  _fit() {
    const E = this._els;
    if (!this._built || !E || E.content.hidden) return;
    const w = E.card.clientWidth;
    const h = E.card.clientHeight;
    if (!w || !h) return;
    const cur = this._u || w / REF_W;
    const cs = getComputedStyle(E.content);
    const padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const gap = parseFloat(getComputedStyle(E.body).marginTop) || 0;
    const contentH = padV + E.header.offsetHeight + gap + E.bodyInner.offsetHeight;
    if (!E.header.offsetHeight || !E.bodyInner.offsetHeight) return;
    const heightInUnits = contentH / cur;
    const u = Math.round(Math.min(w / REF_W, h / heightInUnits) * 100) / 100;
    if (!isFinite(u) || u <= 0) return;
    if (this._u === null || Math.abs(u - this._u) > 0.01) {
      this._u = u;
      E.content.style.setProperty("--u", `${u}px`);
    }
  }

  // --- actions ------------------------------------------------------------

  _onClick(e) {
    const el = e.target.closest("[data-act],[data-mode]");
    if (!el || el.disabled) return;
    if (el.dataset.mode) {
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: this._config.entity,
        hvac_mode: el.dataset.mode,
      });
      return;
    }
    if (el.dataset.act === "badge") {
      this._tap();
    } else if (el.dataset.act === "toggle") {
      this._toggle();
    } else if (el.dataset.act === "inc" || el.dataset.act === "dec") {
      this._step(el.dataset.key, el.dataset.act === "inc" ? 1 : -1);
    }
  }

  get _tapAction() {
    return this._config.tap_action && this._config.tap_action.action
      ? this._config.tap_action
      : { action: "more-info" };
  }

  // Action au clic sur le badge : none / more-info / navigate / url / perform-action
  _tap() {
    const cfg = this._tapAction;
    switch (cfg.action) {
      case "none":
        return;
      case "more-info":
        this.dispatchEvent(
          new CustomEvent("hass-more-info", {
            bubbles: true,
            composed: true,
            detail: { entityId: cfg.entity || this._config.entity },
          })
        );
        return;
      case "navigate": {
        const path = cfg.navigation_path;
        if (!path) return;
        if (cfg.navigation_replace) window.history.replaceState(window.history.state?.root ? { root: true } : null, "", path);
        else window.history.pushState(null, "", path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: !!cfg.navigation_replace } }));
        return;
      }
      case "url":
        if (cfg.url_path) window.open(cfg.url_path, "_blank", "noopener");
        return;
      case "perform-action":
      case "call-service": {
        const svc = cfg.perform_action || cfg.service;
        if (!svc || !svc.includes(".")) return;
        const [domain, service] = svc.split(".");
        this._hass.callService(domain, service, cfg.data || cfg.service_data || {}, cfg.target);
        return;
      }
      default:
        return;
    }
  }

  // --- données ---------------------------------------------------------

  get _stateObj() {
    return this._hass && this._hass.states[this._config.entity];
  }

  _stepSize(a, unit) {
    if (this._config.step) return Number(this._config.step);
    if (a.target_temp_step) return Number(a.target_temp_step);
    return unit === "°F" ? 1 : 0.5;
  }

  _val(key) {
    const s = this._stateObj;
    if (this._pending[key] !== undefined) return this._pending[key];
    return s ? s.attributes[key] : undefined;
  }

  _isDual(s) {
    const a = s.attributes;
    return a.target_temp_low != null && a.target_temp_high != null && (s.state === "heat_cool" || a.temperature == null);
  }

  // Interrupteur : Off ⇄ mode de chauffe (`heat` par défaut, option `heat_mode`)
  _toggle() {
    const s = this._stateObj;
    if (!s) return;
    const supported = s.attributes.hvac_modes || [];
    let target;
    if (s.state === "off") {
      const wanted = this._config.heat_mode || "heat";
      target = supported.includes(wanted) ? wanted : supported.find((m) => m !== "off");
    } else {
      target = "off";
    }
    if (!target) return;
    this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this._config.entity,
      hvac_mode: target,
    });
  }

  _step(key, dir) {
    const s = this._stateObj;
    if (!s) return;
    const a = s.attributes;
    const unit = this._hass.config.unit_system.temperature;
    const step = this._stepSize(a, unit);
    let v = this._val(key);
    if (v == null) return;
    v = Number(((Math.round(v / step) * step) + dir * step).toFixed(2));
    const min = a.min_temp != null ? a.min_temp : -Infinity;
    const max = a.max_temp != null ? a.max_temp : Infinity;
    v = Math.min(max, Math.max(min, v));
    if (key === "target_temp_low") v = Math.min(v, this._val("target_temp_high") - step);
    if (key === "target_temp_high") v = Math.max(v, this._val("target_temp_low") + step);
    this._pending[key] = v;
    this._renderTargets(s);
    clearTimeout(this._sendTimer);
    this._sendTimer = setTimeout(() => this._send(), 900);
  }

  _send() {
    const s = this._stateObj;
    if (!s) return;
    const data = { entity_id: this._config.entity };
    if (this._isDual(s)) {
      data.target_temp_low = this._val("target_temp_low");
      data.target_temp_high = this._val("target_temp_high");
    } else {
      data.temperature = this._val("temperature");
    }
    this._hass.callService("climate", "set_temperature", data);
    clearTimeout(this._clearTimer);
    // Une vanne (Zigbee / Bosch) peut mettre longtemps à confirmer la nouvelle consigne :
    // on garde la valeur saisie affichée jusqu'à ce que l'entité la confirme
    // (voir _update), avec un délai de sécurité de 30 secondes.
    this._clearTimer = setTimeout(() => {
      this._pending = {};
      this._update();
    }, 30000);
  }

  // --- rendu -----------------------------------------------------------

  _setText(el, key, value) {
    if (this._cache[key] !== value) {
      el.textContent = value;
      this._cache[key] = value;
    }
  }

  _setHtml(el, key, html) {
    if (this._cache[key] !== html) {
      el.innerHTML = html;
      this._cache[key] = html;
    }
  }

  _update() {
    if (!this._built || !this._hass) return;
    const E = this._els;
    const t = this._t;
    const s = this._stateObj;
    if (!s) {
      E.error.hidden = false;
      E.content.hidden = true;
      E.error.textContent = `${t.notfound}: ${this._config.entity}`;
      return;
    }
    E.error.hidden = true;
    E.content.hidden = false;

    const a = s.attributes;
    const unit = this._hass.config.unit_system.temperature;
    const mode = s.state;
    const unavailable = mode === "unavailable" || mode === "unknown";
    const on = !unavailable && mode !== "off";
    const key = unavailable ? "off" : mode;

    // Synchronise les valeurs en attente avec l'état réel
    for (const k of Object.keys(this._pending)) {
      if (Math.abs(Number(a[k]) - this._pending[k]) < 0.01) delete this._pending[k];
    }

    // En-tête
    const name = this._config.name || a.friendly_name || this._config.entity;
    this._setText(E.title, "title", name);
    E.badge.setAttribute("aria-label", name);
    const low = this._batteryLow();
    E.batt.hidden = !low;
    if (low) {
      E.batt.setAttribute("title", t.battery);
      E.batt.setAttribute("aria-label", t.battery);
    }
    const clickable = this._tapAction.action !== "none";
    E.badge.classList.toggle("clickable", clickable);
    E.badge.tabIndex = clickable ? 0 : -1;
    const status = this._config.show_status ? this._actionLabel(s) : "";
    E.status.hidden = !status;
    this._setText(E.status, "status", status);

    // Couleurs selon le mode (identiques à la carte d'origine, `color` remplace celle du mode chauffe)
    const [color, bg] = this._modeColors(key);
    E.card.style.setProperty("--htc-accent", color);
    E.card.style.setProperty("--htc-accent-bg", bg);

    this._renderBadgeIcon(s);

    // Interrupteur
    E.sw.classList.toggle("on", on);
    E.sw.setAttribute("aria-checked", String(on));
    E.sw.setAttribute("aria-label", t.power);
    E.sw.disabled = unavailable;

    // Puissance de chauffe (flamme + % si l'entité est renseignée et > 0)
    const p = this._heatingPower();
    E.power.hidden = p === null;
    E.thermo.hidden = p !== null;
    E.current.classList.toggle("heating", p !== null);
    if (p !== null) this._setText(E.powerTxt, "power", `${p}`);

    // Température actuelle
    this._setText(E.num, "cur", fmtTemp(a.current_temperature));
    this._setText(E.unit, "unit", unit);

    this._renderTargets(s);
    this._renderModes(s);
    this._scheduleFit();
  }

  // Icône du badge : `icon` de la config si présent, sinon l'icône d'état de
  // l'entité telle que Home Assistant l'affiche (elle varie avec le mode).
  // Repli si <ha-state-icon> n'existe pas : attribut `icon`, puis icône du mode.
  _renderBadgeIcon(s) {
    const E = this._els;
    const cfgIcon = this._config.icon;
    const useState = !cfgIcon && !!customElements.get("ha-state-icon");
    const kind = cfgIcon ? "cfg" : useState ? "state" : "fallback";
    if (this._cache.badgeKind !== kind) {
      E.badge.innerHTML = "";
      E.badge.appendChild(document.createElement(kind === "state" ? "ha-state-icon" : "ha-icon"));
      this._cache.badgeKind = kind;
      this._cache.badgeIcon = null;
    }
    const el = E.badge.firstElementChild;
    if (kind === "state") {
      el.hass = this._hass;
      el.stateObj = s;
      return;
    }
    const icon = cfgIcon || s.attributes.icon || MODE_ICONS[s.state] || DEFAULT_BADGE_ICON;
    if (this._cache.badgeIcon !== icon) {
      el.setAttribute("icon", icon);
      this._cache.badgeIcon = icon;
    }
  }

  // [couleur, fond sombre] d'un mode. Pour le mode chauffe, `color` (si défini)
  // remplace le saumon ; le fond sombre est dérivé automatiquement (32 % de la couleur sur noir,
  // ce qui redonne le fond d'origine pour le saumon).
  _modeColors(mode) {
    let color = MODE_COLORS[mode] || MODE_COLORS.heat;
    let bg = MODE_TILE_BG[mode] || MODE_TILE_BG.heat;
    if (mode === "heat") {
      const custom = resolveColor(this._config.color);
      if (custom) {
        color = custom;
        const mix = `color-mix(in srgb, ${custom} 32%, black)`;
        if (typeof CSS === "undefined" || !CSS.supports || CSS.supports("color", mix)) bg = mix;
      }
    }
    return [color, bg];
  }

  // Batterie faible : l'entité renseignée (ex. binary_sensor.xxx_battery_low) est à « on » (ou « low »)
  _batteryLow() {
    const id = this._config.battery_low_entity;
    if (!id || !this._hass) return false;
    const st = this._hass.states[id];
    return !!st && ["on", "low"].includes(String(st.state).toLowerCase());
  }

  _heatingPower() {
    const id = this._config.heating_power_entity;
    if (!id || !this._hass) return null;
    const st = this._hass.states[id];
    if (!st) return null;
    const v = parseFloat(st.state);
    if (!isFinite(v) || v <= 0) return null;
    return Math.min(100, Math.round(v));
  }

  _actionLabel(s) {
    const t = this._t;
    const action = s.attributes.hvac_action;
    if (!action) return s.state === "off" ? t.actions.off : "";
    try {
      if (this._hass.formatEntityAttributeValue) {
        return this._hass.formatEntityAttributeValue(s, "hvac_action");
      }
    } catch (e) { /* ignore */ }
    return t.actions[action] || action;
  }

  _renderTargets(s) {
    const t = this._t;
    const unit = this._hass.config.unit_system.temperature;
    const mode = s.state;
    const off = mode === "off" || mode === "unavailable" || mode === "unknown";
    const dual = !off && this._isDual(s);
    const targets = dual
      ? [
          { key: "target_temp_low", label: t.heat },
          { key: "target_temp_high", label: t.cool },
        ]
      : [{ key: "temperature", label: "" }];
    const html = targets
      .map((tg) => {
        const v = off ? null : this._val(tg.key);
        const dis = off || v == null ? "disabled" : "";
        const label = dual ? `<div class="label">${esc(tg.label)}</div>` : "";
        const value = v == null ? "--" : `${fmtTemp(v)}<small>${esc(unit)}</small>`;
        return `<div class="target">
          ${label}
          <button class="arrow" data-act="inc" data-key="${tg.key}" ${dis} aria-label="+"><ha-icon icon="mdi:chevron-up"></ha-icon></button>
          <div class="val">${value}</div>
          <button class="arrow" data-act="dec" data-key="${tg.key}" ${dis} aria-label="-"><ha-icon icon="mdi:chevron-down"></ha-icon></button>
        </div>`;
      })
      .join("");
    this._els.targets.classList.toggle("dual", dual);
    this._els.main.classList.toggle("dual", dual);
    this._setHtml(this._els.targets, "targets", html);
  }

  _renderModes(s) {
    const E = this._els;
    E.modesBlock.hidden = !this._config.show_modes;
    if (!this._config.show_modes) return;
    const supported = s.attributes.hvac_modes || [];
    const known = MODE_ORDER.filter((m) => supported.includes(m));
    const unknown = supported.filter((m) => !MODE_ORDER.includes(m));
    const wanted = Array.isArray(this._config.modes) && this._config.modes.length ? this._config.modes : null;
    const modes = wanted ? wanted.filter((m) => supported.includes(m)) : [...known, ...unknown];
    E.modes.style.gridTemplateColumns = `repeat(${Math.max(modes.length, 1)}, 1fr)`;
    const html = modes
      .map((m) => {
        const active = s.state === m;
        const icon = MODE_ICONS[m] || "mdi:thermostat";
        let label = m;
        try {
          label = this._hass.localize(`component.climate.entity_component._.state.${m}`) || m;
        } catch (e) { /* ignore */ }
        const [mc, mbg] = this._modeColors(m);
        return `<button class="mode ${active ? "active" : ""}" data-mode="${esc(m)}" title="${esc(label)}"
          style="--c:${esc(mc)};--bg:${esc(mbg)}"><ha-icon icon="${icon}"></ha-icon></button>`;
      })
      .join("");
    this._setHtml(E.modes, "modes", html);
  }
}

// --- Éditeur visuel ------------------------------------------------------

const TAP_ACTIONS = ["none", "more-info", "navigate", "url", "perform-action"];

const buildEditorSchema = (hass, entityId) => {
  const st = hass && entityId ? hass.states[entityId] : null;
  const supported = (st && st.attributes.hvac_modes) || MODE_ORDER;
  const ordered = [
    ...MODE_ORDER.filter((m) => supported.includes(m)),
    ...supported.filter((m) => !MODE_ORDER.includes(m)),
  ];
  const options = ordered.map((m) => {
    let label = m;
    try {
      label = (hass && hass.localize(`component.climate.entity_component._.state.${m}`)) || m;
    } catch (e) { /* ignore */ }
    return { value: m, label };
  });
  const heatOptions = options.filter((o) => o.value !== "off");
  return [
    { name: "entity", required: true, selector: { entity: { domain: "climate" } } },
    { name: "name", selector: { text: {} } },
    { name: "icon", selector: { icon: {} } },
    { name: "color", selector: { color_rgb: {} } },
    { name: "tap_action", selector: { ui_action: { default_action: "more-info", actions: TAP_ACTIONS } } },
    { name: "heating_power_entity", selector: { entity: { domain: ["sensor", "number", "input_number"] } } },
    { name: "battery_low_entity", selector: { entity: { domain: ["binary_sensor", "sensor"] } } },
    { name: "heat_mode", selector: { select: { mode: "dropdown", options: heatOptions } } },
    { name: "show_status", selector: { boolean: {} } },
    { name: "step", selector: { number: { min: 0.1, max: 5, step: 0.1, mode: "box" } } },
    { name: "show_modes", selector: { boolean: {} } },
    { name: "modes", selector: { select: { multiple: true, mode: "list", options } } },
  ];
};

const EDITOR_LABELS = {
  entity: "Entité (climate)",
  name: "Nom (optionnel)",
  icon: "Icône du badge (optionnel)",
  color: "Couleur de surbrillance en chauffe (optionnel, défaut : saumon)",
  tap_action: "Action au clic sur l'icône",
  heating_power_entity: "Puissance de chauffe (entité en %, optionnel)",
  battery_low_entity: "Batterie faible (ex. binary_sensor …_battery_low, optionnel)",
  heat_mode: "Mode activé par l'interrupteur (défaut : heat)",
  show_status: "Afficher l'état (Chauffe, Inactif…)",
  step: "Pas consigne de température (optionnel)",
  show_modes: "Afficher les boutons de mode",
  modes: "Modes affichés (vide = tous)",
};

class ThermostatCardBoschBthRaEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    if (first && this._config) this._render();
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const value = { ...ev.detail.value };
        if (Array.isArray(value.modes) && value.modes.length === 0) delete value.modes;
        for (const k of ["name", "icon", "color", "heat_mode", "heating_power_entity", "battery_low_entity"]) {
          if (value[k] === "" || value[k] == null) delete value[k];
        }
        this._config = value;
        this.dispatchEvent(
          new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })
        );
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    const schema = buildEditorSchema(this._hass, this._config && this._config.entity);
    const key = JSON.stringify(schema);
    if (key !== this._schemaKey) {
      this._schemaKey = key;
      this._form.schema = schema;
    }
    this._form.data = {
      show_status: false,
      show_modes: false,
      ...this._config,
    };
  }
}

customElements.define(CARD_TAG, ThermostatCardBoschBthRa);
customElements.define(EDITOR_TAG, ThermostatCardBoschBthRaEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Thermostat Card – Bosch BTH-RA",
  description: "Carte thermostat compacte avec interrupteur Off / Chauffe, température actuelle et consigne à chevrons.",
  preview: true,
});

console.info(
  `%c THERMOSTAT-CARD-BOSCH-BTH-RA %c v${CARD_VERSION} `,
  "color:#fff;background:#e8958a;font-weight:700",
  "color:#e8958a;background:#333"
);
