/*!
 * Thermostat Card – Bosch BTH-RA pour Home Assistant
 * Variante de « Obs Thermostat Card » : mêmes fonctionnalités et même thème,
 * mais une disposition compacte (badge + nom, interrupteur Off / Chauffe,
 * température actuelle à gauche, consigne avec chevrons à droite).
 */

const CARD_VERSION = "1.2.2";
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
// Icône du badge en haut à gauche (la flamme barrée quand le chauffage est éteint)
const BADGE_ICONS = { ...MODE_ICONS, off: "mdi:fire-off" };
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
    mode: "Mode",
    heat: "HEAT",
    cool: "COOL",
    power: "Heating on / off",
    settings: "Settings",
    notfound: "Entity not found",
    actions: { heating: "Heating", cooling: "Cooling", idle: "Idle", off: "Off", drying: "Drying", fan: "Fan", defrosting: "Defrosting" },
  },
  fr: {
    mode: "Mode",
    heat: "CHAUD",
    cool: "FROID",
    power: "Chauffage marche / arrêt",
    settings: "Réglages",
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

const STYLE = `
  :host { display: block; }
  ha-card {
    container-type: inline-size;
    padding: 24px 22px;
    background: var(--htc-card-bg, var(--ha-card-background, var(--card-background-color, #1c1c1c)));
    color: var(--primary-text-color, #fff);
    border-radius: var(--ha-card-border-radius, 24px);
    box-sizing: border-box;
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
    --htc-tile: var(--htc-tile-bg, var(--secondary-background-color, #2a2a2a));
    --htc-muted: var(--secondary-text-color, #8a8a8a);
    --htc-accent: #e8958a;
    --htc-accent-bg: #48322f;
  }

  /* --- En-tête : badge + nom | interrupteur --------------------------- */
  .header { display: flex; justify-content: space-between; align-items: center; gap: 3cqw; }
  .id { display: flex; align-items: center; gap: 4cqw; min-width: 0; }
  .badge {
    flex: 0 0 auto; box-sizing: border-box;
    width: 15cqw; height: 15cqw; min-width: 40px; min-height: 40px; max-width: 56px; max-height: 56px;
    border-radius: 50%; background: var(--htc-accent); color: var(--htc-accent-bg);
    display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: clamp(22px, 7.5cqw, 30px);
    transition: background .3s, color .3s;
  }
  .txt { min-width: 0; }
  .title {
    font-size: clamp(22px, 9cqw, 33px); font-weight: 500; line-height: 1.2;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .status { font-size: clamp(12px, 4cqw, 16px); font-weight: 500; color: var(--htc-muted); margin-top: 2px; }

  .right { display: flex; align-items: center; gap: 2cqw; flex: 0 0 auto; }
  .gear {
    background: none; border: none; color: var(--htc-muted); cursor: pointer;
    padding: 4px; border-radius: 50%; --mdc-icon-size: 24px; display: flex;
  }
  .gear:hover { color: var(--primary-text-color); }

  /* Interrupteur Off / Chauffe : sa couleur suit le mode (--htc-accent) */
  .switch {
    --sw-h: clamp(24px, 9cqw, 34px);
    --sw-w: calc(var(--sw-h) * 2);
    --knob: calc(var(--sw-h) - 10px);
    position: relative; flex: 0 0 auto; box-sizing: border-box; padding: 0; cursor: pointer;
    width: var(--sw-w); height: var(--sw-h); border-radius: 999px;
    border: 2px solid var(--htc-accent); background: var(--htc-accent-bg);
    transition: background .3s, border-color .3s;
  }
  .switch .knob {
    position: absolute; top: 3px; left: 3px; width: var(--knob); height: var(--knob);
    border-radius: 50%; background: var(--htc-accent);
    transition: transform .25s ease, background .3s;
  }
  .switch.on .knob { transform: translateX(calc(var(--sw-w) - 10px - var(--knob))); }
  .switch:disabled { opacity: .4; cursor: default; }
  .switch:focus-visible { outline: 2px solid var(--htc-accent); outline-offset: 3px; }

  /* --- Corps : température actuelle | consigne ------------------------ */
  .main { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 3cqw; margin-top: 7cqw; }
  .current {
    display: flex; align-items: center; gap: 3cqw; min-width: 0; white-space: nowrap;
    color: var(--htc-accent); transition: color .3s;
  }
  .current .thermo { color: var(--htc-muted); --mdc-icon-size: clamp(35px, 12.2cqw, 53px); flex: 0 0 auto; }
  .current .num { font-size: 17.5cqw; font-weight: 400; line-height: 1; letter-spacing: -0.02em; }
  .current .unit { align-self: flex-start; margin-top: 1.2cqw; font-size: 7.7cqw; font-weight: 400; line-height: 1; }
  .main.dual .current .num { font-size: 12cqw; }
  .main.dual .current .unit { font-size: 5.7cqw; margin-top: 0.8cqw; }

  .targets { display: flex; align-items: stretch; gap: 2cqw; }
  .target { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 24cqw; }
  .target .label { font-size: 3.2cqw; font-weight: 500; letter-spacing: 0.03em; color: var(--htc-accent); }
  .arrow {
    box-sizing: border-box; width: 20cqw; height: 18cqw; max-width: 84px; max-height: 72px; min-width: 52px; min-height: 48px;
    padding: 0; border: none; border-radius: 14px; background: none;
    color: var(--primary-text-color); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: clamp(40px, 15cqw, 60px);
    transition: background .15s, transform .1s;
  }
  .arrow:hover { background: var(--htc-tile); }
  .arrow:active { transform: scale(0.92); }
  .arrow:disabled { opacity: .35; cursor: default; background: none; transform: none; }
  .target .val {
    display: flex; align-items: flex-start; gap: 2px; padding: 1.5cqw 0;
    font-size: clamp(22px, 9.5cqw, 34px); font-weight: 500; line-height: 1.2; white-space: nowrap;
  }
  .target .val small { font-size: 0.62em; font-weight: 400; color: var(--htc-muted); margin-top: 0.05em; }
  .targets.dual .target { min-width: 16cqw; }
  .targets.dual .val { font-size: clamp(15px, 6cqw, 22px); }
  .targets.dual .arrow { width: 14cqw; min-width: 40px; }

  /* --- Boutons de mode (optionnels, comme la carte d'origine) ---------- */
  .section-title { font-size: 4.2cqw; font-weight: 500; color: var(--htc-muted); margin: 20px 0 10px; }
  .modes-block { margin-top: 14px; }
  .modes-block .section-title { margin-top: 0; }
  .modes { display: grid; gap: 12px; }
  .mode {
    height: 14cqw; max-height: 74px; min-height: 52px; border: none; border-radius: 18px;
    background: var(--htc-tile); color: var(--primary-text-color); cursor: pointer;
    display: flex; align-items: center; justify-content: center; --mdc-icon-size: 7cqw;
    transition: filter .15s, background .2s;
  }
  .mode ha-icon { --mdc-icon-size: clamp(26px, 7cqw, 40px); }
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
      show_mode_title: false,
      show_settings: false,
      ...config,
    };
    this._build();
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  getCardSize() {
    const c = this._config || {};
    return 4 + (c.show_modes ? 1 : 0);
  }

  getGridOptions() {
    const c = this._config || {};
    const rows = 4 + (c.show_modes ? 1 : 0);
    return { columns: 6, rows, min_columns: 4, min_rows: 3 };
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
              <div class="badge"><ha-icon icon="mdi:fire"></ha-icon></div>
              <div class="txt">
                <div class="title"></div>
                <div class="status"></div>
              </div>
            </div>
            <div class="right">
              <button class="gear" data-act="more-info" aria-label="Settings"><ha-icon icon="mdi:cog"></ha-icon></button>
              <button class="switch" role="switch" aria-checked="false" data-act="toggle"><span class="knob"></span></button>
            </div>
          </div>
          <div class="main">
            <div class="current">
              <ha-icon class="thermo" icon="mdi:thermometer"></ha-icon>
              <span class="num"></span><span class="unit"></span>
            </div>
            <div class="targets"></div>
          </div>
          <div class="modes-block">
            <div class="section-title mode-title"></div>
            <div class="modes"></div>
          </div>
        </div>
      </ha-card>`;
    const r = this.shadowRoot;
    this._els = {
      error: r.querySelector(".error"),
      content: r.querySelector(".content"),
      card: r.querySelector("ha-card"),
      badgeIcon: r.querySelector(".badge ha-icon"),
      title: r.querySelector(".title"),
      status: r.querySelector(".status"),
      gear: r.querySelector(".gear"),
      sw: r.querySelector(".switch"),
      main: r.querySelector(".main"),
      num: r.querySelector(".num"),
      unit: r.querySelector(".unit"),
      targets: r.querySelector(".targets"),
      modesBlock: r.querySelector(".modes-block"),
      modeTitle: r.querySelector(".mode-title"),
      modes: r.querySelector(".modes"),
    };
    r.addEventListener("click", (e) => this._onClick(e));
    this._cache = {};
    this._built = true;
  }

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
    if (el.dataset.act === "more-info") {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId: this._config.entity },
        })
      );
    } else if (el.dataset.act === "toggle") {
      this._toggle();
    } else if (el.dataset.act === "inc" || el.dataset.act === "dec") {
      this._step(el.dataset.key, el.dataset.act === "inc" ? 1 : -1);
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
    this._clearTimer = setTimeout(() => {
      this._pending = {};
      this._update();
    }, 5000);
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
      if (a[k] === this._pending[k]) delete this._pending[k];
    }

    // En-tête
    this._setText(E.title, "title", this._config.name || a.friendly_name || this._config.entity);
    const status = this._config.show_status ? this._actionLabel(s) : "";
    E.status.hidden = !status;
    this._setText(E.status, "status", status);
    E.gear.hidden = !this._config.show_settings;
    E.gear.setAttribute("aria-label", t.settings);

    // Couleurs selon le mode (identiques à la carte d'origine)
    const color = MODE_COLORS[key] || MODE_COLORS.heat;
    const bg = MODE_TILE_BG[key] || MODE_TILE_BG.heat;
    E.card.style.setProperty("--htc-accent", color);
    E.card.style.setProperty("--htc-accent-bg", bg);

    // Badge + interrupteur
    const icon = this._config.icon || BADGE_ICONS[key] || "mdi:thermostat";
    if (this._cache.badge !== icon) {
      E.badgeIcon.setAttribute("icon", icon);
      this._cache.badge = icon;
    }
    E.sw.classList.toggle("on", on);
    E.sw.setAttribute("aria-checked", String(on));
    E.sw.setAttribute("aria-label", t.power);
    E.sw.disabled = unavailable;

    // Température actuelle
    this._setText(E.num, "cur", fmtTemp(a.current_temperature));
    this._setText(E.unit, "unit", unit);

    this._renderTargets(s);
    this._renderModes(s);
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
    E.modeTitle.hidden = !this._config.show_mode_title;
    this._setText(E.modeTitle, "modeTitle", this._t.mode);
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
        return `<button class="mode ${active ? "active" : ""}" data-mode="${esc(m)}" title="${esc(label)}"
          style="--c:${MODE_COLORS[m] || "#e8958a"};--bg:${MODE_TILE_BG[m] || "#48322f"}"><ha-icon icon="${icon}"></ha-icon></button>`;
      })
      .join("");
    this._setHtml(E.modes, "modes", html);
  }

}

// --- Éditeur visuel ------------------------------------------------------

const EDITOR_SCHEMA_TAIL = [
  { name: "show_mode_title", selector: { boolean: {} } },
  { name: "show_settings", selector: { boolean: {} } },
];

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
    { name: "heat_mode", selector: { select: { mode: "dropdown", options: heatOptions } } },
    { name: "show_status", selector: { boolean: {} } },
    { name: "step", selector: { number: { min: 0.1, max: 5, step: 0.1, mode: "box" } } },
    { name: "show_modes", selector: { boolean: {} } },
    { name: "modes", selector: { select: { multiple: true, mode: "list", options } } },
    ...EDITOR_SCHEMA_TAIL,
  ];
};

const EDITOR_LABELS = {
  entity: "Entité (climate)",
  name: "Nom (optionnel)",
  icon: "Icône du badge (optionnel)",
  heat_mode: "Mode activé par l'interrupteur (défaut : heat)",
  show_status: "Afficher l'état (Chauffe, Inactif…)",
  step: "Pas de température (optionnel)",
  show_modes: "Afficher les boutons de mode",
  modes: "Modes affichés (vide = tous)",
  show_mode_title: "Afficher le titre « Mode »",
  show_settings: "Afficher l'icône réglages",
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
        for (const k of ["name", "icon", "heat_mode"]) {
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
      show_mode_title: false,
      show_settings: false,
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
