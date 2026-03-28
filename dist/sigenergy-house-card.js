/**
 * Sigenergy House Card v3.16.1 — Lit Element Custom Card for Home Assistant
 * Replaces YAML button-card approach with proper SVG-based energy flow visualization.
 *
 * Architecture:
 *   Layer 0: Background fill (#1a1f2e)
 *   Layer 1: House composite images (base + overlays)
 *   Layer 2: SVG flow animation overlay (viewBox 1170x1013)
 *   Layer 3: Text labels with live entity values
 *
 * v3.0.0 — Complete rewrite of cable routing and comet animation:
 *   - Cable paths follow wall surfaces (matching Sigen app physical routing)
 *   - Junction hub at cable entry level (y~570) not device base (y~695)
 *   - Comet animation: single bright segment traveling along each cable
 *   - pathLength normalization for consistent animation across all paths
 *   - Thinner cables (2px backbone, 3.5px comets) matching Sigen app style
 */

import {
  LitElement,
  html,
  css,
  svg,
} from "https://unpkg.com/lit-element@3.3.3/lit-element.js?module";

// Auto-detect base URL for HACS/manual install compatibility
// JS may be served from /js/ endpoint but images live under /frontend/
const _HOUSE_CARD_RAW_DIR = new URL('.', import.meta.url).pathname;
const _HOUSE_CARD_DIR = _HOUSE_CARD_RAW_DIR.replace('/js/', '/frontend/');

// ─── Import shared config store for SoC ring thresholds ──────────────────────
let SigConfigStore = null;
if (window.SigenergyConfig) {
  // Wrap global config store with getInstance() shim for house card compatibility
  SigConfigStore = { getInstance() { return { config: window.SigenergyConfig.get() }; } };
} else {
  try {
    const mod = await import(new URL('../src/utils/config-store.js', import.meta.url).href);
    SigConfigStore = mod.SigConfigStore || mod.default;
  } catch (_) { /* standalone usage without config store */ }
}

// ─── Default Configuration ───────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  image_path: _HOUSE_CARD_DIR + "images",
  soc_ring_cx: 498,
  soc_ring_cy: 585,
  soc_ring_r: 32,
  soc_ring_skew_x: 0,
  soc_ring_skew_y: 0,
  features: {
    ev_charger: false,
    ev_vehicle: false,
    heat_pump: false,
    grid: true,
    hide_cables: false,
    battery_runtime: true,
  },
  entities: {
    solar_power: "sensor.deyeinvertermaster_pv_power",
    load_power: "sensor.deyeinvertermaster_load_power",
    battery_power: "sensor.deyeinvertermaster_battery_output_power",
    battery_soc: "sensor.deyeinvertermaster_battery_soc",
    grid_import: "sensor.deyeinvertermaster_grid_power_ct_clamp",
    grid_export: "sensor.deyeinvertermaster_grid_power_ct_clamp",
    grid_active: "sensor.net_grid_power",
    sun: "sun.sun",
    weather: "weather.forecast_home",
    ev_charger_power: "",
    ev_charger_state: "",
    ev_soc: "",
    ev_range: "",
    heat_pump_power: "",
    battery_capacity: "",
    battery_max_soc: "",
    battery_min_soc: "",
  },
  colors: {
    solar: "#f5c542",
    battery_charge: "#e74c3c",
    battery_discharge: "#2ecc71",
    grid_import: "#e74c3c",
    grid_export: "#2ecc71",
    home: "#3498db",
    ev: "#ff69b4",
    heat_pump: "#e67e22",
    cable_static: "#888888",
  },
};

// ─── SVG ViewBox matches home_has_solar_has_car.png native dimensions ────────
const VB_W = 1170;
const VB_H = 1013;

// ─── Flow cable path definitions ─────────────────────────────────────────────
// Coordinates in viewBox 1170x1013, calibrated from composite overlay at native res.
//
// Cable routing follows wall surfaces of the isometric house, matching the
// Sigenergy app physical cable visualization:
//
//   Component positions (measured from composite image with grid overlay):
//     Solar panel center:    (540, 190)   — center of roof panel array
//     SigenStor conn. dot:   (475, 565)   — teal dot on SigenStor unit
//     Ammeter center:        (590, 605)   — small gray gateway box
//     AC charger:            (58, 475)    — wall-mounted on garage
//     Grid meter:            (870, 640)   — white box on right wall
//   Red-line trace from reference image 140 (pixel-accurate centerlines):
//   SOLAR follows left roof edge then wall; HOME follows right roof edge then wall.
//   Two SEPARATE vertical wall sections, not joined.

const PATHS = {
  // Solar: roof edge diagonal → bottom of panels → vertical wall down to SigenStor
  // Coordinates from user editor session (image 141)
  solar:      "M 475 85 L 335 270 L 505 320 L 505 560",
  // Home: SigenStor wall → up wall → across right wall → along roof edge → roof peak → chimney area
  // 6-point polyline tracing house architecture
  home:       "M 535 570 L 535 330 L 640 360 L 840 420 L 990 200 L 750 140",
  // Battery: vertical line below SigenStor
  battery:    "M 350 760 L 350 870",
  // Grid: from wall junction through meter to ground
  grid:       "M 600 645 L 740 695 L 790 695 L 855 680 L 855 830",
  // EV/AC charger: charger wall → across garage → around car → to SigenStor
  ev:         "M 75 485 L 75 455 L 290 535 L 350 560 L 295 585 L 475 600",
  // Solar animation: same as solar path
  solar_anim: "M 475 85 L 335 270 L 505 320 L 505 560",
  // Heat pump: from SigenStor area along bottom wall to right side
  heat_pump: "M 535 600 L 630 620 L 780 580 L 900 520",
};

// ─── Label positions (% of container) ────────────────────────────────────────
const LABELS = {
  solar:   { top: "2%",  left: "36%",  entity: "solar_power",      label: "SOLAR",     color: "solar" },
  home:    { top: "2%",  left: "55%",  entity: "load_power",       label: "HOME",      color: "home" },
  battery: { top: "72%", left: "28%",  entity: "battery_soc",      label: "SigenStor", color: "battery_discharge" },
  grid:    { top: "65%", left: "72%",  entity: "grid_import",      label: "GRID",      color: "grid_import" },
  ev:      { top: "54%", left: "1%",   entity: "ev_charger_power",   label: "EV",          color: "ev" },
  ac:      { top: "33%", left: "1%",   entity: "ev_charger_power",   label: "AC CHARGER",   color: "ev" },
  heatpump:{ top: "43%", left: "78%",  entity: "heat_pump_power",    label: "HEAT PUMP",    color: "heat_pump" },
};

// ─── Card Class ──────────────────────────────────────────────────────────────
class SigenergyHouseCard extends LitElement {

  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object, state: true },
      _editPaths: { type: Object, state: true },
      _dragging: { type: Object, state: true },
      _editRing: { type: Object, state: true },
    };
  }

  static getConfigElement() {
    return document.createElement("div");
  }

  static getStubConfig() {
    return {
      entities: { ...DEFAULT_CONFIG.entities },
      features: { ...DEFAULT_CONFIG.features },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = {
      ...DEFAULT_CONFIG,
      ...config,
      features: { ...DEFAULT_CONFIG.features, ...(config.features || {}) },
      entities: { ...DEFAULT_CONFIG.entities, ...(config.entities || {}) },
      colors: { ...DEFAULT_CONFIG.colors, ...(config.colors || {}) },
    };
    // Initialize editable paths from config overrides or defaults
    this._initEditPaths();
    // Initialize editable ring from config
    this._editRing = {
      cx: this._config.soc_ring_cx || 498,
      cy: this._config.soc_ring_cy || 585,
      r: this._config.soc_ring_r || 32,
      skewX: this._config.soc_ring_skew_x || 0,
      skewY: this._config.soc_ring_skew_y || 0,
    };
  }

  _initEditPaths() {
    // Parse path strings into arrays of {x,y} points for the editor
    const configPaths = this._config.paths || {};
    this._editPaths = {};
    const SKIP = new Set(['solar_anim']); // derived paths
    for (const [name, defaultD] of Object.entries(PATHS)) {
      if (SKIP.has(name)) continue;
      const d = configPaths[name] || defaultD;
      this._editPaths[name] = this._parsePath(d);
    }
    this._dragging = null;
  }

  _parsePath(d) {
    // Parse "M x y L x y L x y ..." into [{x, y}, ...]
    const parts = d.trim().split(/\s+/);
    const points = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'M' || parts[i] === 'L') {
        points.push({ x: parseFloat(parts[i+1]), y: parseFloat(parts[i+2]) });
        i += 2;
      }
    }
    return points;
  }

  _pointsToPath(points) {
    if (!points || points.length === 0) return "";
    return points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${Math.round(p.x)} ${Math.round(p.y)}`
    ).join(' ');
  }

  _getEditPath(name) {
    if (this._editPaths && this._editPaths[name]) {
      return this._pointsToPath(this._editPaths[name]);
    }
    return PATHS[name];
  }

  _getEditSolarAnim() {
    // solar_anim is the same as solar in the current design
    return this._getEditPath('solar');
  }

  getCardSize() {
    return 6;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  _stateNum(entityId) {
    if (!entityId || !this.hass) return 0;
    const state = this.hass.states[entityId];
    if (!state || state.state === "unavailable" || state.state === "unknown") return 0;
    return parseFloat(state.state) || 0;
  }

  _stateStr(entityId) {
    if (!entityId || !this.hass) return "";
    const state = this.hass.states[entityId];
    if (!state) return "";
    return state.state;
  }

  _stateUnit(entityId) {
    if (!entityId || !this.hass) return "W";
    const state = this.hass.states[entityId];
    if (!state || !state.attributes) return "W";
    return state.attributes.unit_of_measurement || "W";
  }

  _toWatts(entityId) {
    const val = this._stateNum(entityId);
    const unit = this._stateUnit(entityId);
    if (unit === "kW" || unit === "KW") return val * 1000;
    if (unit === "kWh" || unit === "Wh") return val; // energy sensor — pass through for display
    return val;
  }

  // ── Computed values ─────────────────────────────────────────────────────
  get _solarPower() { return this._toWatts(this._config.entities.solar_power); }
  get _loadPower() { return this._toWatts(this._config.entities.load_power); }
  get _batteryPowerRaw() { return this._toWatts(this._config.entities.battery_power); }
  get _batterySoc() { return this._stateNum(this._config.entities.battery_soc); }
  get _gridImport() { return this._toWatts(this._config.entities.grid_import); }
  get _gridExport() { return this._toWatts(this._config.entities.grid_export); }
  get _evPower() { return this._toWatts(this._config.entities.ev_charger_power); }
  get _isNight() { return this._stateStr(this._config.entities.sun) === "below_horizon"; }

  get _batteryPower() {
    const raw = this._batteryPowerRaw;
    if (this._config.battery_positive_charging) return raw;
    return -raw;
  }

  get _gridPower() {
    // Prefer grid_active sensor (net_grid_power) which gives signed value:
    // positive = importing, negative = exporting
    const activeEntity = this._config.entities.grid_active;
    if (activeEntity && this.hass && this.hass.states[activeEntity]) {
      return this._toWatts(activeEntity);
    }
    // Fallback: try import/export separately
    const imp = this._gridImport;
    const exp = this._gridExport;
    if (imp > 0) return imp;
    if (exp > 0) return -exp;
    return 0;
  }

  get _isCharging() { return this._batteryPower > 0; }
  get _isDischarging() { return this._batteryPower < 0; }

  get _batteryCapacityKwh() {
    // Manual capacity override takes precedence
    const manual = parseFloat(this._config.battery_capacity_kwh);
    if (manual > 0) return manual;
    const entity = this._config.entities.battery_capacity;
    if (!entity) return 0;
    const val = this._stateNum(entity);
    if (val <= 0) return 0;
    const unit = this._stateUnit(entity);
    if (unit === 'Wh') return val / 1000;
    if (unit === 'Ah') {
      // Convert Ah to kWh using nominal voltage (51.2V typical for LFP battery banks)
      const nomVolt = parseFloat(this._config.battery_nominal_voltage) || 51.2;
      return (val * nomVolt) / 1000;
    }
    return val; // assume kWh
  }

  get _batteryMaxSoc() {
    const entity = this._config.entities.battery_max_soc;
    if (entity) {
      const val = this._stateNum(entity);
      if (val > 0 && val <= 100) return val;
    }
    return 100;
  }

  get _batteryMinSoc() {
    const entity = this._config.entities.battery_min_soc;
    if (entity) {
      const val = this._stateNum(entity);
      if (val >= 0 && val < 100) return val;
    }
    return 0;
  }

  get _batteryRuntime() {
    if (!this._config.features?.battery_runtime) return null;
    const capacity = this._batteryCapacityKwh;
    if (capacity <= 0) return null;
    const pwr = this._batteryPower; // positive = charging, negative = discharging
    const soc = this._batterySoc;
    const absPowerKw = Math.abs(pwr) / 1000;
    if (absPowerKw < 0.01) return null; // idle
    let remainingKwh, targetSoc;
    if (pwr > 0) { // charging → target is max SoC (charge cutoff)
      targetSoc = this._batteryMaxSoc;
      remainingKwh = (targetSoc - soc) / 100 * capacity;
    } else { // discharging → target is min SoC (reserve/discharge cutoff)
      targetSoc = this._batteryMinSoc;
      remainingKwh = (soc - targetSoc) / 100 * capacity;
    }
    if (remainingKwh <= 0) return null;
    const hours = remainingKwh / absPowerKw;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return { timeStr, targetSoc, isCharging: pwr > 0 };
  }
  get _isImporting() { return this._gridPower > 1; }
  get _isExporting() { return this._gridPower < -1; }
  get _isSolarActive() { return this._solarPower > 5; }
  get _isEvCharging() { return this._evPower > 5; }
  get _heatPumpPower() { return this._toWatts(this._config.entities.heat_pump_power); }
  get _isHeatPumpActive() { return this._heatPumpPower > 5; }

  // ── Weather ──────────────────────────────────────────────────────────────
  get _weatherEntity() {
    const id = this._config.entities.weather;
    if (!id || !this.hass) return null;
    return this.hass.states[id] || null;
  }

  get _weatherCondition() {
    return this._weatherEntity?.state || "";
  }

  get _weatherTemp() {
    return this._weatherEntity?.attributes?.temperature ?? null;
  }

  get _weatherTempUnit() {
    return this._weatherEntity?.attributes?.temperature_unit || "°C";
  }

  _weatherIcon(condition) {
    // Map HA weather conditions to emoji icons
    const map = {
      'clear-night': '🌙',
      'cloudy': '☁️',
      'fog': '🌫️',
      'hail': '🌨️',
      'lightning': '⚡',
      'lightning-rainy': '⛈️',
      'partlycloudy': '⛅',
      'pouring': '🌧️',
      'rainy': '🌧️',
      'snowy': '❄️',
      'snowy-rainy': '🌨️',
      'sunny': '☀️',
      'windy': '💨',
      'windy-variant': '💨',
      'exceptional': '⚠️',
    };
    return map[condition] || '🌤️';
  }

  _formatPower(val, entityId) {
    const abs = Math.abs(val);
    // If entity reports in kWh/Wh, display as energy not power
    if (entityId) {
      const unit = this._stateUnit(entityId);
      if (unit === "kWh") return abs >= 100 ? `${abs.toFixed(0)} kWh` : `${abs.toFixed(1)} kWh`;
      if (unit === "Wh") return abs >= 1000 ? `${(abs / 1000).toFixed(1)} kWh` : `${abs.toFixed(0)} Wh`;
    }
    if (abs >= 10000) return `${(abs / 1000).toFixed(1)} kW`;
    if (abs >= 1000) return `${(abs / 1000).toFixed(2)} kW`;
    return `${abs.toFixed(0)} W`;
  }

  // ── SoC ring color (configurable via SigConfigStore) ────────────────────
  _socRingColor(soc) {
    if (soc == null || isNaN(soc)) return '#555';  // unknown
    let lo = 40, hi = 60;
    try {
      if (SigConfigStore) {
        const cfg = SigConfigStore.getInstance().config;
        if (cfg && cfg.display) {
          lo = cfg.display.soc_ring_low ?? lo;
          hi = cfg.display.soc_ring_high ?? hi;
        }
      }
    } catch (_) { /* ignore config store errors */ }
    if (soc < lo) return '#e74c3c';  // red
    if (soc < hi) return '#f39c12';  // orange
    return '#2ecc71';                 // green
  }

  // ── Feature helpers ──────────────────────────────────────────────────────
  get _hasEv() {
    return this._config.features.ev_charger || this._config.features.ev_vehicle;
  }

  // ── Image URLs ───────────────────────────────────────────────────────────
  get _baseImage() {
    const base = this._config.image_path;
    if (this._hasEv) {
      return this._isNight ? `${base}/dark_home_has_solar_has_car.png` : `${base}/home_has_solar_has_car.png`;
    }
    // Gate closed, no car/charger (no dark variant available)
    return `${base}/home_has_solar_no_car.png`;
  }
  get _sigenstorImage() { return `${this._config.image_path}/sigenstor_home.png`; }
  get _ammeterImage() { return `${this._config.image_path}/ammeter_home.png`; }
  get _acChargerImage() { return `${this._config.image_path}/ac_charger_bg.png`; }
  get _heatPumpImage() { return `${this._config.image_path}/device_heat_pump.png`; }

  // ── Render: SVG static cable backbones ───────────────────────────────────
  _renderStaticPaths() {
    if (this._config.features.hide_cables) return svg``;
    const color = this._config.colors.cable_static;
    const pathNames = ['solar', 'home', 'battery'];
    if (this._config.features.grid) {
      pathNames.push('grid');
    }
    if (this._config.features.ev_charger) {
      pathNames.push('ev');
    }
    if (this._config.features.heat_pump) {
      pathNames.push('heat_pump');
    }

    return pathNames.map(name => {
      const d = this._getEditPath(name);
      return svg`
        <path d="${d}" stroke="${color}" stroke-width="4" fill="none"
              stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />
      `;
    });
  }

  // Estimate SVG path length from M/L command coordinates
  _estimatePathLength(d) {
    const nums = d.match(/[\d.]+/g)?.map(Number) || [];
    let total = 0;
    for (let i = 2; i < nums.length; i += 2) {
      const dx = nums[i] - nums[i - 2];
      const dy = nums[i + 1] - nums[i - 1];
      total += Math.sqrt(dx * dx + dy * dy);
    }
    return total;
  }

  // ── Render: animated comet on a cable ────────────────────────────────────
  // Uses SVG <animate> for reliable animation across all browsers/shadow DOM.
  // pathLength="100" normalizes so any cable gets a consistent comet.
  // Adaptive dash size: targets ~30 SVG units so short cables still show a visible dot.
  _renderComet(d, color, active, reverse = false, duration = 2.5) {
    if (!active) return svg``;
    const from = reverse ? "0" : "100";
    const to = reverse ? "100" : "0";
    const pathLen = this._estimatePathLength(d);
    const dashPct = Math.max(6, Math.min(25, (30 / Math.max(pathLen, 1)) * 100));
    const gapPct = 100 - dashPct;
    return svg`
      <path d="${d}"
            pathLength="100"
            stroke="${color}"
            stroke-width="6"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="${dashPct} ${gapPct}"
            stroke-dashoffset="${from}"
            opacity="1.0"
            filter="url(#cometGlow)">
        <animate attributeName="stroke-dashoffset"
                 from="${from}" to="${to}"
                 dur="${duration}s"
                 repeatCount="indefinite" />
      </path>
    `;
  }

  // ── Render: all animated comets ──────────────────────────────────────────
  _renderComets() {
    const c = this._config.colors;
    return svg`
      ${this._renderComet(this._getEditSolarAnim(), c.solar, this._isSolarActive, false, 2.5)}
      ${this._renderComet(this._getEditPath('home'), c.home, this._loadPower > 5, false, 2.0)}
      ${this._renderComet(this._getEditPath('battery'),
          this._isCharging ? c.battery_charge : c.battery_discharge,
          Math.abs(this._batteryPower) > 5,
          this._isDischarging, 1.5)}
      ${this._config.features.grid ? this._renderComet(this._getEditPath('grid'),
          this._isImporting ? c.grid_import : c.grid_export,
          this._isImporting || this._isExporting,
          this._isImporting, 2.5) : ""}
      ${this._config.features.ev_charger ? this._renderComet(this._getEditPath('ev'), c.ev, this._isEvCharging, true, 2.5) : ""}
      ${this._config.features.heat_pump ? this._renderComet(this._getEditPath('heat_pump'), c.heat_pump, this._isHeatPumpActive, false, 2.5) : ""}
    `;
  }

  // ── Render: SoC pulsing ring on the battery circle ────────────────────────
  // Uses SVG <animate> for Safari/WebKit compatibility (CSS animations on SVG
  // elements inside shadow DOM are unreliable in WebKit).
  _renderSocRing() {
    const soc = this._batterySoc;
    const color = this._socRingColor(soc);
    const cx = this._config.soc_ring_cx || 505;
    const cy = this._config.soc_ring_cy || 615;
    const r = this._config.soc_ring_r || 28;
    const skewX = this._config.soc_ring_skew_x || 0;
    const skewY = this._config.soc_ring_skew_y || 0;
    const transform = (skewX || skewY)
      ? `translate(${cx},${cy}) skewX(${skewX}) skewY(${skewY}) translate(${-cx},${-cy})`
      : '';
    return svg`
      <g transform="${transform}">
      <circle cx="${cx}" cy="${cy}" r="${r}"
              fill="none" stroke="${color}" stroke-width="2.5" opacity="0.4">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s"
                 repeatCount="indefinite" calcMode="spline"
                 keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
        <animate attributeName="r" values="${r};${r * 1.15};${r}" dur="2s"
                 repeatCount="indefinite" calcMode="spline"
                 keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
        <animate attributeName="stroke-width" values="2.5;3.5;2.5" dur="2s"
                 repeatCount="indefinite" calcMode="spline"
                 keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
      </circle>
      <circle cx="${cx}" cy="${cy}" r="${r + 6}"
              fill="none" stroke="${color}" stroke-width="1" opacity="0">
        <animate attributeName="opacity" values="0;0.5;0" dur="2s"
                 repeatCount="indefinite" calcMode="spline"
                 keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
        <animate attributeName="r" values="${r + 4};${r + 10};${r + 4}" dur="2s"
                 repeatCount="indefinite" calcMode="spline"
                 keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
      </circle>
      </g>
    `;
  }

  // ── Path Editor: interactive drag-to-position cable points ────────────────
  get _isEditMode() {
    return this._config.edit_paths === true;
  }

  _renderEditor() {
    if (!this._isEditMode) return svg``;
    const pathColors = {
      solar: '#f5c542',
      home: '#3498db',
      battery: '#2ecc71',
      grid: '#e74c3c',
      ev: '#ff69b4',
      heat_pump: '#e67e22',
    };

    const handles = [];
    for (const [name, points] of Object.entries(this._editPaths)) {
      const color = pathColors[name] || '#fff';
      // Render the path with bright color in edit mode
      const d = this._pointsToPath(points);
      handles.push(svg`
        <path d="${d}" stroke="${color}" stroke-width="5" fill="none"
              stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />
      `);
      // Render each control point as a draggable circle
      points.forEach((pt, idx) => {
        handles.push(svg`
          <circle cx="${pt.x}" cy="${pt.y}" r="16"
                  fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="3"
                  style="cursor: grab; pointer-events: all;"
                  data-path="${name}" data-idx="${idx}"
                  @pointerdown="${(e) => this._onDragStart(e, name, idx)}" />
          <text x="${pt.x + 20}" y="${pt.y - 10}"
                fill="${color}" font-size="22" font-weight="bold"
                style="pointer-events: none; user-select: none;"
                >${name}[${idx}]</text>
          <text x="${pt.x + 20}" y="${pt.y + 14}"
                fill="#fff" font-size="20" font-weight="bold"
                style="pointer-events: none; user-select: none;"
                >(${Math.round(pt.x)}, ${Math.round(pt.y)})</text>
        `);
      });
    }

    // ── SoC Ring editor handle ──────────────────────────────────────────────
    const ring = this._editRing || { cx: 498, cy: 585, r: 32, skewX: 0, skewY: 0 };
    const ringColor = '#00d4aa';
    const skX = ring.skewX || 0;
    const skY = ring.skewY || 0;
    const ringTransform = (skX || skY)
      ? `translate(${ring.cx},${ring.cy}) skewX(${skX}) skewY(${skY}) translate(${-ring.cx},${-ring.cy})`
      : '';
    // Show the ring outline (with skew applied)
    handles.push(svg`
      <g transform="${ringTransform}">
        <circle cx="${ring.cx}" cy="${ring.cy}" r="${ring.r}"
                fill="none" stroke="${ringColor}" stroke-width="3" opacity="0.7"
                stroke-dasharray="6 4" />
      </g>
    `);
    // Center drag handle (move cx/cy)
    handles.push(svg`
      <circle cx="${ring.cx}" cy="${ring.cy}" r="14"
              fill="${ringColor}" fill-opacity="0.4" stroke="${ringColor}" stroke-width="3"
              style="cursor: grab; pointer-events: all;"
              @pointerdown="${(e) => this._onRingDragStart(e, 'center')}" />
      <text x="${ring.cx + 20}" y="${ring.cy - 22}"
            fill="${ringColor}" font-size="22" font-weight="bold"
            style="pointer-events: none; user-select: none;"
            >SoC Ring</text>
      <text x="${ring.cx + 20}" y="${ring.cy}"
            fill="#fff" font-size="18" font-weight="bold"
            style="pointer-events: none; user-select: none;"
            >(${Math.round(ring.cx)}, ${Math.round(ring.cy)}) r=${Math.round(ring.r)}</text>
      <text x="${ring.cx + 20}" y="${ring.cy + 18}"
            fill="#ff9" font-size="16"
            style="pointer-events: none; user-select: none;"
            >skew(${skX.toFixed(1)}, ${skY.toFixed(1)})</text>
    `);
    // Edge drag handle (resize radius) — placed at 3 o'clock (cx+r, cy)
    handles.push(svg`
      <circle cx="${ring.cx + ring.r}" cy="${ring.cy}" r="10"
              fill="#fff" fill-opacity="0.3" stroke="${ringColor}" stroke-width="2"
              style="cursor: ew-resize; pointer-events: all;"
              @pointerdown="${(e) => this._onRingDragStart(e, 'radius')}" />
      <text x="${ring.cx + ring.r + 14}" y="${ring.cy + 5}"
            fill="#fff" font-size="16"
            style="pointer-events: none; user-select: none;"
            >r</text>
    `);
    // Skew X handle — placed at 12 o'clock (cx, cy-r-20), drag horizontally to change skewX
    handles.push(svg`
      <rect x="${ring.cx - 12}" y="${ring.cy - ring.r - 28}" width="24" height="16" rx="4"
            fill="#ff9" fill-opacity="0.3" stroke="#ff9" stroke-width="2"
            style="cursor: ew-resize; pointer-events: all;"
            @pointerdown="${(e) => this._onRingDragStart(e, 'skewX')}" />
      <text x="${ring.cx - 8}" y="${ring.cy - ring.r - 16}"
            fill="#ff9" font-size="12" font-weight="bold"
            style="pointer-events: none; user-select: none;"
            >sX</text>
    `);
    // Skew Y handle — placed at 9 o'clock (cx-r-20, cy), drag vertically to change skewY
    handles.push(svg`
      <rect x="${ring.cx - ring.r - 36}" y="${ring.cy - 8}" width="24" height="16" rx="4"
            fill="#9ff" fill-opacity="0.3" stroke="#9ff" stroke-width="2"
            style="cursor: ns-resize; pointer-events: all;"
            @pointerdown="${(e) => this._onRingDragStart(e, 'skewY')}" />
      <text x="${ring.cx - ring.r - 32}" y="${ring.cy + 6}"
            fill="#9ff" font-size="12" font-weight="bold"
            style="pointer-events: none; user-select: none;"
            >sY</text>
    `);

    return svg`<g class="editor-handles">${handles}</g>`;
  }

  _svgPoint(e) {
    // Convert screen coordinates to SVG viewBox coordinates
    const svgEl = this.shadowRoot.querySelector('.flow-svg');
    if (!svgEl) return { x: 0, y: 0 };
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  _onDragStart(e, pathName, pointIdx) {
    e.preventDefault();
    e.stopPropagation();
    this._dragging = { pathName, pointIdx };

    const onMove = (ev) => {
      if (!this._dragging) return;
      const svgPt = this._svgPoint(ev);
      // Snap to grid of 5
      const x = Math.round(svgPt.x / 5) * 5;
      const y = Math.round(svgPt.y / 5) * 5;
      const pts = [...this._editPaths[this._dragging.pathName]];
      pts[this._dragging.pointIdx] = { x, y };
      this._editPaths = { ...this._editPaths, [this._dragging.pathName]: pts };
    };

    const onUp = () => {
      this._dragging = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // Log current paths to console for easy copy
      this._logPaths();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  _onRingDragStart(e, mode) {
    e.preventDefault();
    e.stopPropagation();
    const startPt = this._svgPoint(e);
    const startRing = { ...this._editRing };

    const onMove = (ev) => {
      const svgPt = this._svgPoint(ev);
      if (mode === 'center') {
        // Move the ring center
        const x = Math.round(svgPt.x / 5) * 5;
        const y = Math.round(svgPt.y / 5) * 5;
        this._editRing = { ...this._editRing, cx: x, cy: y };
      } else if (mode === 'radius') {
        // Resize: distance from center to cursor
        const dx = svgPt.x - this._editRing.cx;
        const dy = svgPt.y - this._editRing.cy;
        const r = Math.max(10, Math.round(Math.sqrt(dx*dx + dy*dy) / 5) * 5);
        this._editRing = { ...this._editRing, r };
      } else if (mode === 'skewX') {
        // Horizontal drag changes skewX (1 degree per 3 SVG units)
        const delta = (svgPt.x - startPt.x) / 3;
        const skewX = Math.round((startRing.skewX + delta) * 2) / 2; // snap to 0.5
        this._editRing = { ...this._editRing, skewX: Math.max(-45, Math.min(45, skewX)) };
      } else if (mode === 'skewY') {
        // Vertical drag changes skewY (1 degree per 3 SVG units)
        const delta = (svgPt.y - startPt.y) / 3;
        const skewY = Math.round((startRing.skewY + delta) * 2) / 2; // snap to 0.5
        this._editRing = { ...this._editRing, skewY: Math.max(-45, Math.min(45, skewY)) };
      }
      this.requestUpdate();
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      this._logPaths();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  _logPaths() {
    const result = {};
    for (const [name, points] of Object.entries(this._editPaths)) {
      result[name] = this._pointsToPath(points);
    }
    console.info('%c CABLE EDITOR — Current Paths:', 'color: #00d4aa; font-weight: bold;');
    console.info(JSON.stringify(result, null, 2));
    // Also build the YAML config snippet
    let yaml = 'paths:\n';
    for (const [name, d] of Object.entries(result)) {
      yaml += `  ${name}: "${d}"\n`;
    }
    // Include ring position
    const ring = this._editRing;
    yaml += `soc_ring_cx: ${Math.round(ring.cx)}\nsoc_ring_cy: ${Math.round(ring.cy)}\nsoc_ring_r: ${Math.round(ring.r)}\nsoc_ring_skew_x: ${(ring.skewX || 0).toFixed(1)}\nsoc_ring_skew_y: ${(ring.skewY || 0).toFixed(1)}\n`;
    console.info('%c YAML Config:', 'color: #f5c542; font-weight: bold;');
    console.info(yaml);
    console.info('%c SoC Ring Position:', 'color: #00d4aa; font-weight: bold;');
    console.info(JSON.stringify(ring));
  }

  _onCopyPaths() {
    const result = {};
    for (const [name, points] of Object.entries(this._editPaths)) {
      result[name] = this._pointsToPath(points);
    }
    // Include ring position in the copy
    const ring = this._editRing;
    result.soc_ring_cx = Math.round(ring.cx);
    result.soc_ring_cy = Math.round(ring.cy);
    result.soc_ring_r = Math.round(ring.r);
    result.soc_ring_skew_x = Math.round((ring.skewX || 0) * 2) / 2;
    result.soc_ring_skew_y = Math.round((ring.skewY || 0) * 2) / 2;
    const text = JSON.stringify(result, null, 2);
    // Try clipboard API, fall back to textarea method for HA iframes
    const copyFallback = (str) => {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => copyFallback(text));
      } else {
        copyFallback(text);
      }
    } catch (e) {
      copyFallback(text);
    }
    console.info('Paths copied to clipboard!');
    console.info(text);
    const btn = this.shadowRoot.querySelector('.copy-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy Paths'; }, 1500);
    }
  }

  _onAddPoint(e) {
    const name = e.target.dataset.path;
    if (!name || !this._editPaths[name]) return;
    const pts = [...this._editPaths[name]];
    // Add a new point at the midpoint between the last two points
    if (pts.length >= 2) {
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pts.splice(pts.length - 1, 0, mid);
    } else {
      pts.push({ x: 500, y: 500 });
    }
    this._editPaths = { ...this._editPaths, [name]: pts };
  }

  _onRemovePoint(e) {
    const name = e.target.dataset.path;
    if (!name || !this._editPaths[name]) return;
    const pts = [...this._editPaths[name]];
    if (pts.length > 2) {
      pts.pop();
      this._editPaths = { ...this._editPaths, [name]: pts };
    }
  }

  // ── Apply & Save: persist edited paths to the HA dashboard config ─────
  async _onApplyPaths() {
    const paths = {};
    for (const [name, points] of Object.entries(this._editPaths)) {
      paths[name] = this._pointsToPath(points);
    }
    const ring = this._editRing;
    const updates = {
      paths,
      edit_paths: false,
      soc_ring_cx: Math.round(ring.cx),
      soc_ring_cy: Math.round(ring.cy),
      soc_ring_r: Math.round(ring.r),
      soc_ring_skew_x: Math.round((ring.skewX || 0) * 2) / 2,
      soc_ring_skew_y: Math.round((ring.skewY || 0) * 2) / 2,
    };
    const btn = this.shadowRoot.querySelector('.apply-btn');
    if (btn) btn.textContent = 'Saving...';
    try {
      const dashConfig = await this.hass.callWS({
        type: 'lovelace/config', url_path: 'dashboard-sigenergy',
      });
      if (this._patchHouseCard(dashConfig, updates)) {
        await this.hass.callWS({
          type: 'lovelace/config/save',
          url_path: 'dashboard-sigenergy',
          config: dashConfig,
        });
        console.info('%c PATHS APPLIED & SAVED', 'color: #00d4aa; font-weight: bold;');
        return; // HA will rebuild the card with new config
      }
    } catch (err) {
      console.error('Failed to save paths:', err);
    }
    // Fallback: apply locally if WS API fails
    this._config = { ...this._config, ...updates, edit_paths: false };
    this._initEditPaths();
    this.requestUpdate();
    if (btn) btn.textContent = '\u2713 Applied (local)';
  }

  _patchHouseCard(obj, updates) {
    if (!obj || typeof obj !== 'object') return false;
    if (obj.type === 'custom:sigenergy-house-card') {
      Object.assign(obj, updates);
      return true;
    }
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) {
        for (const item of v) {
          if (this._patchHouseCard(item, updates)) return true;
        }
      } else if (typeof v === 'object' && v !== null) {
        if (this._patchHouseCard(v, updates)) return true;
      }
    }
    return false;
  }

  // ── Render: labels ───────────────────────────────────────────────────────
  _renderLabel(key) {
    const def = LABELS[key];
    if (!def) return "";
    if ((key === "ev" || key === "ac") && !this._config.features.ev_charger) return "";
    if (key === "heatpump" && !this._config.features.heat_pump) return "";

    let primary = "";
    let secondary = def.label;
    let statusLine = "";
    let runtimeLine = "";
    let color = this._config.colors[def.color] || "#fff";

    switch (key) {
      case "solar":
        primary = this._formatPower(this._solarPower, this._config.entities.solar_power);
        break;
      case "home":
        primary = this._formatPower(this._loadPower, this._config.entities.load_power);
        break;
      case "battery": {
        const soc = this._batterySoc;
        const pwr = this._batteryPower;
        if (Math.abs(pwr) > 5) {
          primary = `${this._formatPower(Math.abs(pwr), this._config.entities.battery_power)} \u00b7 ${soc.toFixed(0)}%`;
        } else {
          primary = `${soc.toFixed(0)}%`;
        }
        const rt = this._batteryRuntime;
        if (this._isDischarging) {
          statusLine = "Discharging";
          if (rt) runtimeLine = `${rt.timeStr} to ${rt.targetSoc}%`;
          color = this._config.colors.battery_discharge;
        } else if (this._isCharging) {
          statusLine = "Charging";
          if (rt) runtimeLine = `${rt.timeStr} to ${rt.targetSoc}%`;
          color = this._config.colors.battery_charge;
        }
        break;
      }
      case "grid": {
        const gp = this._gridPower;
        primary = this._formatPower(gp, this._config.entities.grid_active || this._config.entities.grid_import);
        if (this._isImporting) {
          statusLine = "Importing";
          color = this._config.colors.grid_import;
        } else if (this._isExporting) {
          statusLine = "Exporting";
          color = this._config.colors.grid_export;
        }
        break;
      }
      case "ev":
      case "ac":
        primary = this._formatPower(this._evPower, this._config.entities.ev_charger_power);
        if (this._isEvCharging) statusLine = "Charging";
        break;
      case "heatpump":
        primary = this._formatPower(this._heatPumpPower, this._config.entities.heat_pump_power);
        if (this._isHeatPumpActive) statusLine = "Active";
        break;
    }

    return html`
      <div class="label" style="top: ${def.top}; left: ${def.left};">
        <div class="label-primary" style="color: ${color}">${primary}</div>
        <div class="label-secondary">${secondary}</div>
        ${statusLine ? html`<div class="label-status" style="color: ${color}">${statusLine}</div>` : ""}
        ${runtimeLine ? html`<div class="label-runtime" style="color: ${color}">${runtimeLine}</div>` : ""}
      </div>
    `;
  }

  // ── Render: weather badge ─────────────────────────────────────────────────
  _renderWeather() {
    const entity = this._weatherEntity;
    if (!entity || !this._config.entities.weather) return html``;
    const condition = this._weatherCondition;
    const temp = this._weatherTemp;
    const unit = this._weatherTempUnit;
    const icon = this._weatherIcon(condition);
    return html`
      <div class="weather-badge">
        <span class="weather-icon">${icon}</span>
        ${temp !== null ? html`<span class="weather-temp">${temp}${unit}</span>` : ''}
      </div>
    `;
  }

  // ── Main render ──────────────────────────────────────────────────────────
  render() {
    if (!this._config || !this.hass) {
      return html`<ha-card><div class="loading">Loading...</div></ha-card>`;
    }

    return html`
      <ha-card>
        <div class="house-container">
          <img class="height-driver" src="${this._baseImage}"
               @error="${(e) => e.target.style.display = 'none'}" />

          <img class="layer-img" src="${this._baseImage}" />
          <img class="layer-img" src="${this._sigenstorImage}" />
          <img class="layer-img" src="${this._ammeterImage}" />
          ${this._hasEv ? html`<img class="layer-img" src="${this._acChargerImage}" />` : ''}

          <svg class="flow-svg ${this._isEditMode ? 'edit-active' : ''}"
               viewBox="0 0 ${VB_W} ${VB_H}"
               preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="cometGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            ${this._renderStaticPaths()}
            <g>
              ${this._isEditMode ? svg`` : this._renderComets()}
            </g>
            ${this._isEditMode ? svg`` : this._renderSocRing()}
            ${this._renderEditor()}
          </svg>

          ${this._renderLabel("solar")}
          ${this._renderLabel("home")}
          ${this._renderLabel("battery")}
          ${this._renderLabel("grid")}
          ${this._renderLabel("ev")}
          ${this._renderLabel("ac")}
          ${this._renderLabel("heatpump")}
          ${this._renderWeather()}
        </div>
        ${this._isEditMode ? html`
          <div class="editor-panel">
            <div class="editor-title">Cable Path Editor</div>
            <div class="editor-hint">Drag circles to reposition cable points. Coordinates snap to grid of 5.</div>
            <div class="editor-actions">
              <button class="apply-btn" @click="${this._onApplyPaths}">\u2713 Apply & Close</button>
              <button class="copy-btn" @click="${this._onCopyPaths}">Copy Paths</button>
              ${Object.keys(this._editPaths).map(name => html`
                <span class="path-controls">
                  <span class="path-name" style="color: ${{solar:'#f5c542',home:'#3498db',battery:'#2ecc71',grid:'#e74c3c',ev:'#ff69b4'}[name]||'#fff'}">${name}</span>
                  <button class="sm-btn" data-path="${name}" @click="${this._onAddPoint}">+pt</button>
                  <button class="sm-btn" data-path="${name}" @click="${this._onRemovePoint}">-pt</button>
                </span>
              `)}
            </div>
          </div>
        ` : html``}
      </ha-card>
    `;
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  static get styles() {
    return css`
      :host {
        display: block;
        max-width: 680px;
        align-self: flex-start;
        margin-right: auto;
        padding: 16px 8px 0 32px;
        box-sizing: border-box;
      }

      ha-card {
        background: transparent;
        border: none;
        box-shadow: none;
        overflow: hidden;
      }

      .house-container {
        position: relative;
        width: 100%;
        overflow: hidden;
        background: transparent;
        border-radius: 12px;
      }

      .loading {
        padding: 20px;
        text-align: center;
        color: #888;
      }

      .height-driver {
        display: block;
        width: 100%;
        height: auto;
        visibility: hidden;
      }

      .layer-img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: auto;
        display: block;
        pointer-events: none;
      }

      .heat-pump-img {
        position: absolute;
        right: 16%;
        top: 30%;
        width: 6%;
        height: auto;
        pointer-events: none;
        z-index: 5;
        transform: perspective(800px) rotateY(-15deg) skewY(-12deg);
        transform-origin: bottom center;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));
        opacity: 0.92;
      }

      .flow-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      }

      .flow-svg.edit-active {
        pointer-events: all;
        z-index: 30;
      }

      /* Editor panel below the card */
      .editor-panel {
        background: #2a2f3e;
        padding: 12px 16px;
        border-top: 1px solid #3a3f4e;
      }

      .editor-title {
        font-size: 14px;
        font-weight: 700;
        color: #00d4aa;
        margin-bottom: 4px;
      }

      .editor-hint {
        font-size: 11px;
        color: #888;
        margin-bottom: 8px;
      }

      .editor-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .copy-btn {
        background: #00d4aa;
        color: #1a1f2e;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
      }

      .copy-btn:hover {
        background: #00f0c0;
      }

      .apply-btn {
        background: #2ecc71;
        color: #fff;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
      }

      .apply-btn:hover {
        background: #27ae60;
      }

      .path-controls {
        display: flex;
        align-items: center;
        gap: 3px;
      }

      .path-name {
        font-size: 11px;
        font-weight: 600;
      }

      .sm-btn {
        background: #3a3f4e;
        color: #ccc;
        border: 1px solid #555;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        cursor: pointer;
      }

      .sm-btn:hover {
        background: #4a4f5e;
      }

      /* Comet animation: pathLength=100, dasharray=8 92
       * Creates a short bright 8% segment traveling the full cable length.
       * Forward: source→destination, Reverse: destination→source
       */
      .comet-forward {
        animation: comet-fwd 2.5s linear infinite;
      }
      .comet-reverse {
        animation: comet-rev 2.5s linear infinite;
      }

      @keyframes comet-fwd {
        from { stroke-dashoffset: 100; }
        to   { stroke-dashoffset: 0; }
      }

      @keyframes comet-rev {
        from { stroke-dashoffset: 0; }
        to   { stroke-dashoffset: 100; }
      }

      .label {
        position: absolute;
        z-index: 20;
        pointer-events: none;
        min-width: 80px;
      }

      .label-primary {
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        letter-spacing: -0.2px;
        line-height: 1.2;
      }

      .label-secondary {
        font-size: 10px;
        color: #999;
        text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        letter-spacing: -0.1px;
        line-height: 1.3;
      }

      .label-status {
        font-size: 10px;
        font-weight: 600;
        text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        line-height: 1.3;
      }

      .label-runtime {
        font-size: 9px;
        font-weight: 500;
        opacity: 0.85;
        text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        line-height: 1.3;
      }

      .weather-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(26, 31, 46, 0.75);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.1);
        pointer-events: none;
      }

      .weather-icon {
        font-size: 20px;
        line-height: 1;
      }

      .weather-temp {
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        letter-spacing: -0.3px;
      }

      @media (max-width: 500px) {
        .label-primary { font-size: 11px; }
        .label-secondary { font-size: 8px; }
        .label-status { font-size: 8px; }
        .label-runtime { font-size: 7px; }
        .label { min-width: 60px; }
      }
    `;
  }
}

// ── Register ─────────────────────────────────────────────────────────────────
// Store class reference for resilient re-registration
if (!window.__sigCardClasses) window.__sigCardClasses = {};
window.__sigCardClasses['sigenergy-house-card'] = SigenergyHouseCard;
if (!customElements.get("sigenergy-house-card")) {
  try { customElements.define("sigenergy-house-card", SigenergyHouseCard); }
  catch(e) { /* ignore */ }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "sigenergy-house-card",
  name: "Sigenergy House Card",
  description: "Animated energy flow visualization replicating the Sigenergy app",
  preview: true,
});

console.info(
  "%c SIGENERGY-HOUSE-CARD %c v3.16.1 ",
  "color: white; background: #00d4aa; font-weight: bold; padding: 2px 6px; border-radius: 3px 0 0 3px;",
  "color: #00d4aa; background: #1a1f2e; font-weight: bold; padding: 2px 6px; border-radius: 0 3px 3px 0;"
);
