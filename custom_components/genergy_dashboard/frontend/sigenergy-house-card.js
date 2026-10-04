/**
 * Sigenergy House Card v3.17.0 — Lit Element Custom Card for Home Assistant
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
    ev_vehicle_auto: false,
    ev_vehicle_power_threshold: 100,
    two_ev_garage: false,
    heat_pump: false,
    grid: true,
    hide_cables: false,
    battery_runtime: true,
    interactive_house: true,
  },
  entities: {
    ev2_charger_power: "",
    ev2_charger_state: "",
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
    ev_plugged: "",
    ev2_plugged: "",
    ev_soc: "",
    ev_range: "",
    heat_pump_power: "",
    battery_capacity: "",
    battery_max_soc: "",
    battery_min_soc: "",
  },
  colors: {
    solar: "#F0D850",
    battery_charge: "#2ecc71",
    battery_discharge: "#e74c3c",
    grid_import: "#e74c3c",
    grid_export: "#2ecc71",
    home: "#3498db",
    ev: "#ff69b4",
    heat_pump: "#e67e22",
    cable_static: "#888888",
  },
  click_zones: {
    solar:    { x: 300, y: 0,   w: 350, h: 200, color: '#F0D850', label: 'SOLAR' },
    home:     { x: 500, y: 0,   w: 300, h: 200, color: '#3498db', label: 'HOME' },
    battery:  { x: 200, y: 650, w: 300, h: 280, color: '#2ecc71', label: 'BATTERY' },
    grid:     { x: 700, y: 550, w: 300, h: 280, color: '#e74c3c', label: 'GRID' },
    ev:       { x: 0,   y: 450, w: 200, h: 250, color: '#ff69b4', label: 'EV' },
    heatpump: { x: 850, y: 350, w: 250, h: 250, color: '#e67e22', label: 'HEAT PUMP' },
  },
  label_positions: {},
  swap_battery_colors: false,
  ev_charger_label: "",
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
  battery:    "M 490 570 L 492 785",
  // Grid: from wall junction through meter to ground
  grid:       "M 600 645 L 740 695 L 790 695 L 855 680 L 855 830",
  // EV/AC charger: charger wall → across garage → around car → to SigenStor
  ev:         "M 75 485 L 75 455 L 290 535 L 350 560 L 295 585 L 475 600",
  // EV 2 (two-garage scene only): default routed from the 2nd garage bay (~+170px right
  // of bay 1, measured from home_has_solar_has_2car.png) to the junction. Editable via the
  // cable editor like every other path — this is just a sensible starting point.
  ev2:        "M 250 490 L 250 455 L 420 550 L 490 605",
  // Solar animation: same as solar path
  solar_anim: "M 475 85 L 335 270 L 505 320 L 505 560",
  // Heat pump: from SigenStor area along bottom wall to right side
  heat_pump: "M 535 600 L 630 620 L 780 580 L 900 520",
};

// ─── Label positions (% of container) ────────────────────────────────────────
const LABELS = {
  solar:   { top: "2%",  left: "36%",  entity: "solar_power",      label: "SOLAR",     color: "solar" },
  home:    { top: "2%",  left: "55%",  entity: "load_power",       label: "HOME",      color: "home" },
  battery: { top: "72%", left: "28%",  entity: "battery_soc",      label: "BATTERY", color: "battery_discharge" },
  grid:    { top: "65%", left: "72%",  entity: "grid_import",      label: "GRID",      color: "grid_import" },
  ev:      { top: "54%", left: "1%",   entity: "ev_charger_power",   label: "EV",          color: "ev" },
  ev2:     { top: "64%", left: "18%",  entity: "ev2_charger_power",  label: "EV",          color: "ev" },
  ac:      { top: "33%", left: "1%",   entity: "ev_charger_power",   label: "AC CHARGER",   color: "ev" },
  heatpump:{ top: "43%", left: "78%",  entity: "heat_pump_power",    label: "HEAT PUMP",    color: "heat_pump" },
};

// ─── Card Class ──────────────────────────────────────────────────────────────
// Container width (px) at which heat-pump perspective values are interpreted
const HP_PERSPECTIVE_REF_W = 800;

class SigenergyHouseCard extends LitElement {

  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object, state: true },
      _editPaths: { type: Object, state: true },
      _dragging: { type: Object, state: true },
      _editRing: { type: Object, state: true },
      _hpDragging: { type: Object, state: true },
      _hiddenEditorPaths: { type: Object, state: true },
      _activePath: { type: String, state: true },
      _zoom: { type: Number, state: true },
      _panX: { type: Number, state: true },
      _panY: { type: Number, state: true },
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
      click_zones: { ...DEFAULT_CONFIG.click_zones, ...(config.click_zones || {}) },
      label_positions: { ...DEFAULT_CONFIG.label_positions, ...(config.label_positions || {}) },
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
    if (!this._hiddenEditorPaths) this._hiddenEditorPaths = new Set();
    const SKIP = new Set(['solar_anim']); // derived paths
    for (const [name, defaultD] of Object.entries(PATHS)) {
      if (SKIP.has(name)) continue;
      // EV 2 path only exists in two-garage mode — keep it out of the editor otherwise.
      if (name === 'ev2' && !this._twoEvGarage) continue;
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

  _defaultClickZones() {
    return {
      solar:    { x: 300, y: 0,   w: 350, h: 200, color: '#F0D850', label: 'SOLAR' },
      home:     { x: 500, y: 0,   w: 300, h: 200, color: '#3498db', label: 'HOME' },
      battery:  { x: 200, y: 650, w: 300, h: 280, color: '#2ecc71', label: 'BATTERY' },
      grid:     { x: 700, y: 550, w: 300, h: 280, color: '#e74c3c', label: 'GRID' },
      ev:       { x: 0,   y: 450, w: 200, h: 250, color: '#ff69b4', label: 'EV' },
      ev2:      { x: 290, y: 450, w: 200, h: 250, color: '#ff69b4', label: 'EV 2' },
      heatpump: { x: 850, y: 350, w: 250, h: 250, color: '#e67e22', label: 'HEAT PUMP' },
    };
  }

  get _isZoneEditMode() {
    return this._config.edit_zones === true;
  }

  get _isLabelEditMode() {
    return this._config.edit_labels === true;
  }

  get _isAssetEditMode() {
    return this._config.edit_assets === true;
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
    if (unit === "MW") return val * 1000000;
    if (unit === "kW" || unit === "KW") return val * 1000;
    if (unit === "kWh" || unit === "Wh" || unit === "MWh") return val; // energy sensor — pass through for display
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

  get _batteryDeadbandW() { return parseFloat(this._config.battery_deadband_w) || 0; }
  get _isCharging() { return this._batteryPower > this._batteryDeadbandW; }
  get _isDischarging() { return this._batteryPower < -this._batteryDeadbandW; }

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
    // Manual numeric override takes precedence
    if (this._config.battery_max_soc_pct != null) {
      const pct = parseFloat(this._config.battery_max_soc_pct);
      if (pct >= 50 && pct <= 100) return pct;
    }
    const entity = this._config.entities.battery_max_soc;
    if (entity) {
      const val = this._stateNum(entity);
      if (val > 0 && val <= 100) return val;
    }
    return 100;
  }

  get _batteryMinSoc() {
    // Manual numeric override takes precedence
    if (this._config.battery_min_soc_pct != null) {
      const pct = parseFloat(this._config.battery_min_soc_pct);
      if (pct >= 0 && pct < 100) return pct;
    }
    const entity = this._config.entities.battery_min_soc;
    if (entity) {
      const val = this._stateNum(entity);
      if (val >= 0 && val < 100) return val;
    }
    return 0;
  }

  get _batteryReservedSoc() {
    // Manual numeric override takes precedence
    if (this._config.battery_reserved_soc_pct != null) {
      const pct = parseFloat(this._config.battery_reserved_soc_pct);
      if (pct >= 0 && pct <= 100) return pct;
    }
    const entity = this._config.entities.battery_reserved_soc;
    if (entity) {
      const val = this._stateNum(entity);
      if (val >= 0 && val <= 100) return val;
    }
    return null; // null means not configured
  }

  get _batteryRuntime() {
    if (!this._config.features?.battery_runtime) return null;
    const capacity = this._batteryCapacityKwh;
    if (capacity <= 0) return null;
    const pwr = this._batteryPower; // positive = charging, negative = discharging
    const soc = this._batterySoc;
    const absPowerKw = Math.abs(pwr) / 1000;
    if (absPowerKw < 0.01) return null; // idle
    let remainingKwh, targetSoc, targetLabel;
    if (pwr > 0) { // charging → target is max SoC (charge cutoff)
      targetSoc = this._batteryMaxSoc;
      targetLabel = '';
      remainingKwh = (targetSoc - soc) / 100 * capacity;
    } else { // discharging → target is reserved SoC (backup) if set, else min SoC
      const reserved = this._batteryReservedSoc;
      if (reserved != null && reserved > this._batteryMinSoc && soc > reserved) {
        targetSoc = reserved;
        targetLabel = ' reserve';
      } else {
        targetSoc = this._batteryMinSoc;
        targetLabel = '';
      }
      remainingKwh = (soc - targetSoc) / 100 * capacity;
    }
    if (remainingKwh <= 0) return null;
    const hours = remainingKwh / absPowerKw;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return { timeStr, targetSoc, targetLabel, isCharging: pwr > 0 };
  }
  get _isImporting() { return this._gridPower > 1; }
  get _isExporting() { return this._gridPower < -1; }
  get _isSolarActive() { return this._solarPower > 5; }
  get _isEvCharging() { return this._evPower > 5; }
  get _isEvConsumingAboveThreshold() {
    const threshold = parseFloat(this._config.features.ev_vehicle_power_threshold);
    return this._evPower > (Number.isFinite(threshold) ? threshold : 100);
  }
  get _evConnectionState() {
    return this._stateStr(this._config.entities.ev_charger_state).toLowerCase().trim()
      .replace(/[\s-]+/g, '_');
  }
  // Pure state→connected classifier, shared by EV 1 and EV 2 so their logic never
  // diverges. `state` must already be lower-cased / underscore-normalised.
  _connectedByState(state) {
    const compactState = state.replace(/_/g, '');
    const disconnectedStates = new Set([
      '', '0', 'false', 'off', 'idle', 'available', 'unknown', 'unavailable',
      'disconnected', 'not_connected', 'unplugged', 'not_plugged', 'no_vehicle',
      'vehicle_not_connected', 'car_not_connected',
    ]);
    if (disconnectedStates.has(state) || state.includes('disconnected') || state.includes('unplugged')) {
      return false;
    }
    if (state.includes('not_charging') || state.includes('not_ready') || compactState.includes('notcharging') || compactState.includes('notready')) return false;
    if (['1', 'true', 'on'].includes(state)) return true;
    return /(connected|plugged|plugged_in|charging|charge_complete|ready|ready_to_charge|waiting|awaiting|preparing|paused|suspended|complete|completed|finished|finishing|stopped|no_power)/.test(state) ||
      /(pluggedin|chargecomplete|readytocharge|nopower)/.test(compactState);
  }
  // A dedicated plug sensor (ev_plugged), when configured, decides connected/disconnected;
  // otherwise the charger state entity does.
  _plugOrState(plugEid, state) {
    if (!plugEid) return this._connectedByState(state);
    return this._connectedByState(this._stateStr(plugEid).toLowerCase().trim().replace(/[\s-]+/g, '_'));
  }
  // Charger state explicitly reports charging (independent of the power reading)
  _stateSaysCharging(state) {
    return /charging/.test(state) && !/not_?charging|discharg/.test(state);
  }
  // Range label: sensor's unit, or converted to the configured ev_range_unit (km / mi)
  _formatRange(eid, val) {
    const u = String(this.hass?.states?.[eid]?.attributes?.unit_of_measurement || 'km').toLowerCase();
    const src = ['mi', 'mile', 'miles'].includes(u) ? 'mi' : 'km';
    const target = this._config.ev_range_unit || src;
    const v = src === 'km' && target === 'mi' ? val * 0.621371 : src === 'mi' && target === 'km' ? val * 1.609344 : val;
    return `${Math.round(v)} ${target}`;
  }
  get _isEvConnectedByState() { return this._plugOrState(this._config.entities.ev_plugged, this._evConnectionState); }

  // ── EV 2 (only used when features.two_ev_garage is on) ──────────────────────
  get _twoEvGarage() { return !!(this._config.features && this._config.features.two_ev_garage); }
  get _ev2Power() { return this._toWatts(this._config.entities.ev2_charger_power); }
  get _isEv2ConsumingAboveThreshold() {
    const threshold = parseFloat(this._config.features.ev_vehicle_power_threshold);
    return this._ev2Power > (Number.isFinite(threshold) ? threshold : 100);
  }
  get _ev2ConnectionState() {
    return this._stateStr(this._config.entities.ev2_charger_state).toLowerCase().trim()
      .replace(/[\s-]+/g, '_');
  }
  get _isEv2ConnectedByState() { return this._plugOrState(this._config.entities.ev2_plugged, this._ev2ConnectionState); }
  get _isEv2AutoActive() { return this._isEv2ConsumingAboveThreshold || this._isEv2ConnectedByState; }
  // Whether EV 2's car/gate should show. Auto mode → EV 2's own power/state; manual
  // mode → mirrors the single "Always Show EV Vehicle" toggle (both cars appear).
  get _showEv2Vehicle() {
    if (!this._twoEvGarage) return false;
    if (!this._config.features.ev_vehicle_auto) return !!this._config.features.ev_vehicle;
    return this._isEv2AutoActive;
  }
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

  // Improved code to also show negative values on card 
  _formatPower(val, entityId) {
      const abs = Math.abs(val);
      const sign = val < 0 ? '-' : '';
      // If entity reports in kWh/Wh, display as energy not power
      if (entityId) {
        const unit = this._stateUnit(entityId);
        if (unit === "kWh") return abs >= 100 ? `${sign}${abs.toFixed(0)} kWh` : `${sign}${abs.toFixed(1)} kWh`;
        if (unit === "Wh") return abs >= 1000 ? `${sign}${(abs / 1000).toFixed(1)} kWh` : `${sign}${abs.toFixed(0)} Wh`;
        if (unit === "MWh") return `${sign}${(abs * 1000).toFixed(1)} kWh`;
      }
      // Read user-configured auto-scale threshold (default 1000 W)
      let thresh = 1000;
      let dp = 2;
      try {
        if (SigConfigStore) {
          const cfg = SigConfigStore.getInstance().config;
          thresh = cfg?.display?.power_threshold ?? 1000;
          dp = cfg?.display?.decimal_places ?? 2;
        }
      } catch (_) {}
      if (abs >= thresh * 10) return `${sign}${(abs / 1000).toFixed(Math.min(dp, 1))} kW`;
      if (abs >= thresh) return `${sign}${(abs / 1000).toFixed(dp)} kW`;
      return `${sign}${abs.toFixed(0)} W`;
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
  get _isEvAutoActive() {
    return this._isEvConsumingAboveThreshold || this._isEvConnectedByState;
  }

  get _hasEv() {
    return this._showEvCharger || this._showEvVehicle;
  }

  get _showEvVehicle() {
    if (!this._config.features.ev_vehicle_auto) return !!this._config.features.ev_vehicle;
    return this._isEvAutoActive;
  }

  get _showEvCharger() {
    if (!this._config.features.ev_vehicle_auto) return !!this._config.features.ev_charger;
    return this._isEvAutoActive;
  }

  // ── Image URLs ───────────────────────────────────────────────────────────
  get _baseImage() {
    const base = this._config.image_path;
    // Two-garage mode: pick the composite scene by which car(s) are shown.
    // Two-garage mode: ALWAYS stay in the two-car garage scene and vary which bay holds a
    // car by which EV is connected. This keeps the garage layout fixed, so the AC chargers
    // and EV/EV2 cables (positioned for the two-bay garage) stay aligned in every state —
    // rather than snapping back to the single-car scene when one EV disconnects.
    //   EV1 = left bay, EV2 = right bay.
    //   both → home_has_solar_has_2car.png   |  EV1 only → …_has_2carL.png (left car)
    //   EV2 only → …_has_2carR.png (right car)  |  none → …_no_2car.png (empty two-car garage)
    // (Day-only for now; night variants are a documented future addition.)
    if (this._twoEvGarage) {
      const s1 = this._showEvVehicle, s2 = this._showEv2Vehicle;
      if (s1 && s2) return `${base}/home_has_solar_has_2car.png`;
      if (s1) return `${base}/home_has_solar_has_2carL.png`;
      if (s2) return `${base}/home_has_solar_has_2carR.png`;
      return `${base}/home_has_solar_no_2car.png`;
    }
    if (this._showEvVehicle) {
      return this._isNight ? `${base}/dark_home_has_solar_has_car.png` : `${base}/home_has_solar_has_car.png`;
    }
    // Gate closed, no car/charger (no dark variant available)
    return `${base}/home_has_solar_no_car.png`;
  }
  get _sigenstorImage() { return `${this._config.image_path}/sigenstor_home.png`; }
  get _ammeterImage() { return `${this._config.image_path}/ammeter_home.png`; }
  get _acChargerImage() { return `${this._config.image_path}/ac_charger_bg.png`; }
  get _heatPumpImage() {
    const style = this._config.hp_image_style || 'outdoor';
    if (style === 'split_ac') return `${this._config.image_path}/smart_load/air_conditioner_big.png`;
    if (style === 'original') return `${this._config.image_path}/smart_load/heat_pump_mid.png`;
    return `${this._config.image_path}/heatpump.png`; // outdoor (default)
  }

  // ── Render: SVG static cable backbones ───────────────────────────────────
  _renderStaticPaths() {
    if (this._config.features.hide_cables || this._isEditMode) return svg``;
    const color = this._config.colors.cable_static;
    const pathNames = ['solar', 'home', 'battery'];
    if (this._config.features.grid) {
      pathNames.push('grid');
    }
    if (this._showEvCharger) {
      pathNames.push('ev');
    }
    // EV 2 cable — two-garage scene only, and only when EV 2 is present.
    if (this._twoEvGarage && this._showEv2Vehicle) {
      pathNames.push('ev2');
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
          (this._config.swap_battery_colors ? (this._isCharging ? c.battery_discharge : c.battery_charge) : (this._isCharging ? c.battery_charge : c.battery_discharge)),
          Math.abs(this._batteryPower) > Math.max(5, this._batteryDeadbandW),
          this._isDischarging, 1.5)}
      ${this._config.features.grid ? this._renderComet(this._getEditPath('grid'),
          this._isImporting ? c.grid_import : c.grid_export,
          this._isImporting || this._isExporting,
          this._isImporting, 2.5) : ""}
      ${this._showEvCharger ? this._renderComet(this._getEditPath('ev'), c.ev, this._isEvCharging, true, 2.5) : ""}
      ${this._twoEvGarage && this._showEv2Vehicle ? this._renderComet(this._getEditPath('ev2'), c.ev, this._ev2Power > 5, true, 2.5) : ""}
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

  // True while ANY on-card editor is active (cables/zones/labels/assets). Used to
  // suppress the interactive-house modal + zone hit-testing so edit clicks/drags
  // aren't hijacked into opening element modals.
  get _isAnyEditMode() {
    return this._isEditMode || this._isZoneEditMode || this._isLabelEditMode || this._isAssetEditMode;
  }

  _toggleEditorPath(name) {
    const s = new Set(this._hiddenEditorPaths || []);
    if (s.has(name)) s.delete(name); else s.add(name);
    this._hiddenEditorPaths = s;
  }

  _renderEditor() {
    if (!this._isEditMode) return svg``;
    const pathColors = {
      solar: '#F0D850',
      home: '#3498db',
      battery: '#2ecc71',
      grid: '#e74c3c',
      ev: '#ff69b4',
      ev2: '#D4605A',
      heat_pump: '#e67e22',
    };
    const hidden = this._hiddenEditorPaths || new Set();

    const handles = [];
    const active = this._activePath;
    for (const [name, points] of Object.entries(this._editPaths)) {
      if (hidden.has(name)) continue;
      const color = pathColors[name] || '#fff';
      const isActive = name === active;
      const d = this._pointsToPath(points);
      handles.push(svg`
        <path d="${d}" stroke="${color}" stroke-width="${isActive ? 5 : 3}" fill="none"
              stroke-linecap="round" stroke-linejoin="round" opacity="${isActive ? 0.9 : 0.4}" />
      `);
      if (isActive) {
        points.forEach((pt, idx) => {
          handles.push(svg`
            <circle cx="${pt.x}" cy="${pt.y}" r="16"
                    fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2.5"
                    style="cursor: grab; pointer-events: all;"
                    data-path="${name}" data-idx="${idx}"
                    @pointerdown="${(e) => this._onDragStart(e, name, idx)}"
                    @contextmenu="${(e) => this._onPointRightClick(e, name, idx)}" />
            <text x="${pt.x + 14}" y="${pt.y - 6}"
                  fill="${color}" font-size="16" font-weight="bold"
                  style="pointer-events: none; user-select: none;"
                  >${idx}</text>
          `);
        });
      }
    }

    // ── SoC Ring editor handle ──────────────────────────────────────────────
    if (!hidden.has('soc_ring')) {
    const ring = this._editRing || { cx: 498, cy: 585, r: 32, skewX: 0, skewY: 0 };
    const ringColor = '#00d4b8';
    const skX = ring.skewX || 0;
    const skY = ring.skewY || 0;
    const ringTransform = (skX || skY)
      ? `translate(${ring.cx},${ring.cy}) skewX(${skX}) skewY(${skY}) translate(${-ring.cx},${-ring.cy})`
      : '';
    handles.push(svg`
      <g transform="${ringTransform}">
        <circle cx="${ring.cx}" cy="${ring.cy}" r="${ring.r}"
                fill="none" stroke="${ringColor}" stroke-width="3" opacity="0.7"
                stroke-dasharray="6 4" />
      </g>
    `);
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
    } // end soc_ring hidden check

    return svg`<g class="editor-handles">${handles}</g>`;
  }

  _svgPoint(e) {
    const svgEl = this.shadowRoot.querySelector('.flow-svg');
    if (!svgEl) return { x: 0, y: 0 };
    const rect = svgEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / rect.width * VB_W,
      y: (e.clientY - rect.top) / rect.height * VB_H,
    };
  }

  _onDragStart(e, pathName, pointIdx) {
    if (e.button !== 0) return;
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
      if (this._dragging) this._justDragged = true;
      this._dragging = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
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
    console.info('%c CABLE EDITOR — Current Paths:', 'color: #00d4b8; font-weight: bold;');
    console.info(JSON.stringify(result, null, 2));
    // Also build the YAML config snippet
    let yaml = 'paths:\n';
    for (const [name, d] of Object.entries(result)) {
      yaml += `  ${name}: "${d}"\n`;
    }
    // Include ring position
    const ring = this._editRing;
    yaml += `soc_ring_cx: ${Math.round(ring.cx)}\nsoc_ring_cy: ${Math.round(ring.cy)}\nsoc_ring_r: ${Math.round(ring.r)}\nsoc_ring_skew_x: ${(ring.skewX || 0).toFixed(1)}\nsoc_ring_skew_y: ${(ring.skewY || 0).toFixed(1)}\n`;
    console.info('%c YAML Config:', 'color: #F0D850; font-weight: bold;');
    console.info(yaml);
    console.info('%c SoC Ring Position:', 'color: #00d4b8; font-weight: bold;');
    console.info(JSON.stringify(ring));
  }

  _pathColor(name) {
    const c = {solar:'#F0D850',home:'#3498db',battery:'#2ecc71',grid:'#e74c3c',ev:'#ff69b4',ev2:'#D4605A',heat_pump:'#e67e22'};
    return c[name] || '#fff';
  }

  _setActivePath(name) {
    this._activePath = this._activePath === name ? null : name;
  }

  _onSvgClick(e) {
    if (!this._activePath || !this._editPaths[this._activePath]) return;
    if (this._justDragged) { this._justDragged = false; return; }
    if (this._justPanned) { this._justPanned = false; return; }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'circle' || tag === 'rect' || tag === 'text') return;
    const svgPt = this._svgPoint(e);
    const x = Math.round(svgPt.x / 5) * 5;
    const y = Math.round(svgPt.y / 5) * 5;
    const pts = [...this._editPaths[this._activePath], { x, y }];
    this._editPaths = { ...this._editPaths, [this._activePath]: pts };
    this._logPaths();
  }

  _onPointRightClick(e, name, idx) {
    e.preventDefault();
    e.stopPropagation();
    const pts = [...this._editPaths[name]];
    pts.splice(idx, 1);
    this._editPaths = { ...this._editPaths, [name]: pts };
    this._logPaths();
  }

  _onSvgRightClick(e) {
    e.preventDefault();
    if (!this._activePath || !this._editPaths[this._activePath]) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'circle') return;
    const svgPt = this._svgPoint(e);
    const pts = this._editPaths[this._activePath];
    if (!pts || pts.length === 0) return;
    let nearest = -1, minDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - svgPt.x, p.y - svgPt.y);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    if (nearest >= 0 && minDist < 60) {
      const newPts = [...pts];
      newPts.splice(nearest, 1);
      this._editPaths = { ...this._editPaths, [this._activePath]: newPts };
      this._logPaths();
    }
  }

  _boundWheel = null;

  updated(changedProps) {
    super.updated(changedProps);
    // Track the house container width so the heat-pump perspective scales with it
    const hcEl = this.shadowRoot?.querySelector('.house-container:not(.modal-house)') || this.shadowRoot?.querySelector('.house-container');
    if (hcEl && hcEl !== this._hpObserved) {
      this._hpRO?.disconnect();
      this._hpObserved = hcEl;
      this._hpRO = new ResizeObserver(([entry]) => {
        const w = Math.round(entry.contentRect.width);
        if (w && Math.abs(w - (this._hpContainerW || 0)) > 2) { this._hpContainerW = w; this.requestUpdate(); }
      });
      this._hpRO.observe(hcEl);
    }
    const shouldListen = this._isEditMode;
    if (shouldListen && !this._boundWheel) {
      this._boundWheel = (e) => {
        const container = this.shadowRoot?.querySelector('.modal-house');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right ||
            e.clientY < rect.top || e.clientY > rect.bottom) return;
        e.preventDefault();
        e.stopPropagation();
        const oldZ = this._zoom || 1;
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZ = Math.min(5, Math.max(0.5, oldZ + delta));
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        this._panX = (this._panX || 0) + mx * (1 - newZ / oldZ);
        this._panY = (this._panY || 0) + my * (1 - newZ / oldZ);
        if (newZ === 1) { this._panX = 0; this._panY = 0; }
        this._zoom = newZ;
      };
      document.addEventListener('wheel', this._boundWheel, { capture: true, passive: false });
    } else if (!shouldListen && this._boundWheel) {
      document.removeEventListener('wheel', this._boundWheel, { capture: true });
      this._boundWheel = null;
    }
  }

  _onSvgPanStart(e) {
    if (e.button !== 0) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'circle') return;
    const startX = e.clientX, startY = e.clientY;
    const startPanX = this._panX || 0, startPanY = this._panY || 0;
    let panning = false;
    const onMove = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!panning && Math.hypot(dx, dy) < 5) return;
      panning = true;
      this._panX = startPanX + dx;
      this._panY = startPanY + dy;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (panning) this._justPanned = true;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  _resetZoom() {
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
  }

  async _onCancelEditor() {
    try {
      const dashConfig = await this.hass.callWS({
        type: 'lovelace/config', url_path: 'dashboard-sigenergy',
      });
      if (this._patchHouseCard(dashConfig, { edit_paths: false })) {
        await this.hass.callWS({
          type: 'lovelace/config/save',
          url_path: 'dashboard-sigenergy',
          config: dashConfig,
        });
      }
    } catch (err) {
      this._config = { ...this._config, edit_paths: false };
      this._initEditPaths();
      this.requestUpdate();
    }
    this._activePath = null;
    this._resetZoom();
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
    if (pts.length > 0) {
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
        this._activePath = null;
        this._resetZoom();
        console.info('%c PATHS APPLIED & SAVED', 'color: #00d4b8; font-weight: bold;');
        return;
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
  _renderClickZones() {
    if (!this._config.features?.interactive_house) return svg``;
    const zones = Object.entries({ ...this._defaultClickZones(), ...(this._config.click_zones || {}) })
      .map(([key, z]) => ({ key, ...z }));

    return svg`
      <g class="click-zones">
        ${zones.filter(z => {
          if (z.key === 'ev' && !this._showEvVehicle && !this._showEvCharger) return false;
          if (z.key === 'ev2' && (!this._twoEvGarage || !this._showEv2Vehicle)) return false;
          if (z.key === 'heatpump' && !this._config.features.heat_pump) return false;
          if (z.key === 'grid' && !this._config.features.grid) return false;
          return true;
        }).map(z => svg`
          <rect
            x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"
            fill="${this._isZoneEditMode ? z.color : 'transparent'}"
            fill-opacity="${this._isZoneEditMode ? '0.12' : '0'}"
            stroke="${this._isZoneEditMode ? z.color : 'none'}"
            stroke-width="${this._isZoneEditMode ? '3' : '0'}"
            stroke-dasharray="${this._isZoneEditMode ? '10 8' : '0'}"
            style="cursor: ${this._isZoneEditMode ? 'move' : 'pointer'}; pointer-events: ${(this._isZoneEditMode || !this._isAnyEditMode) ? 'all' : 'none'};"
            @pointerdown="${(e) => this._isZoneEditMode && this._onZoneDragStart(e, z.key, 'move')}"
            @click="${(e) => {
              // In cable / label / asset editing, house clicks belong to that editor —
              // never open an element modal. (Zone-edit uses pointerdown drag, not click.)
              if (this._isAnyEditMode) return;
              e.stopPropagation();
              const def = this._defaultClickZones()[z.key] || {};
              this.dispatchEvent(new CustomEvent('genergy-modal', {
                bubbles: true,
                composed: true,
                detail: {
                  type: z.key,
                  label: def.label,
                  color: def.color,
                  config: this._config,
                  hass: this.hass,
                }
              }));
            }}"
          />
          ${this._isZoneEditMode ? svg`
            <circle cx="${z.x + z.w}" cy="${z.y + z.h}" r="16"
                    fill="${z.color}" fill-opacity="0.35" stroke="${z.color}" stroke-width="3"
                    style="cursor: nwse-resize; pointer-events: all;"
                    @pointerdown="${(e) => this._onZoneDragStart(e, z.key, 'resize')}" />
            <text x="${z.x + 10}" y="${z.y + 28}" fill="${z.color}" font-size="24" font-weight="700"
                  style="pointer-events:none;text-shadow:0 2px 4px rgba(0,0,0,.8);">${z.label || z.key}</text>
          ` : svg``}
        `)}
      </g>
    `;
  }

  _onZoneDragStart(e, key, mode) {
    e.preventDefault();
    e.stopPropagation();
    const start = this._svgPoint(e);
    const zones = { ...this._defaultClickZones(), ...(this._config.click_zones || {}) };
    const z = { ...(zones[key] || {}) };
    this._zoneDragging = { key, mode, start, original: z };
    const move = (ev) => this._onZoneDragMove(ev);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this._zoneDragging = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  _onZoneDragMove(e) {
    if (!this._zoneDragging) return;
    const now = this._svgPoint(e);
    const { key, mode, start, original } = this._zoneDragging;
    const dx = now.x - start.x;
    const dy = now.y - start.y;
    const next = { ...original };
    if (mode === 'resize') {
      next.w = Math.max(40, Math.round(original.w + dx));
      next.h = Math.max(40, Math.round(original.h + dy));
    } else {
      next.x = Math.max(0, Math.min(VB_W - next.w, Math.round(original.x + dx)));
      next.y = Math.max(0, Math.min(VB_H - next.h, Math.round(original.y + dy)));
    }
    this._config = {
      ...this._config,
      click_zones: { ...(this._config.click_zones || {}), [key]: next },
    };
    this.requestUpdate();
  }

  _onApplyZones() {
    this.dispatchEvent(new CustomEvent('genergy-zone-editor-save', {
      bubbles: true,
      composed: true,
      detail: { click_zones: this._config.click_zones || {}, hass: this.hass },
    }));
  }

  _onCopyZones() {
    const text = JSON.stringify(this._config.click_zones || {}, null, 2);
    navigator.clipboard?.writeText(text);
  }

  _onLabelDragStart(e, key) {
    if (!this._isLabelEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    const container = this.shadowRoot.querySelector('.house-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const current = this._config.label_positions?.[key] || LABELS[key] || {};
    const startLeft = parseFloat(current.left) || 0;
    const startTop = parseFloat(current.top) || 0;
    this._labelDragging = { key, rect, startX: e.clientX, startY: e.clientY, startLeft, startTop };
    const move = (ev) => this._onLabelDragMove(ev);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this._labelDragging = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  _onLabelDragMove(e) {
    if (!this._labelDragging) return;
    const d = this._labelDragging;
    const dxPct = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dyPct = ((e.clientY - d.startY) / d.rect.height) * 100;
    const left = Math.max(0, Math.min(94, d.startLeft + dxPct));
    const top = Math.max(0, Math.min(94, d.startTop + dyPct));
    this._config = {
      ...this._config,
      label_positions: {
        ...(this._config.label_positions || {}),
        [d.key]: { top: `${top.toFixed(1)}%`, left: `${left.toFixed(1)}%` },
      },
    };
    this.requestUpdate();
  }

  _onApplyLabels() {
    this.dispatchEvent(new CustomEvent('genergy-label-editor-save', {
      bubbles: true,
      composed: true,
      detail: { label_positions: this._config.label_positions || {}, hass: this.hass },
    }));
  }

  _onCopyLabels() {
    const text = JSON.stringify(this._config.label_positions || {}, null, 2);
    navigator.clipboard?.writeText(text);
  }

  // ── Heat pump asset position editor ──────────────────────────────────────

  // Perspective is a px length but the image width is a % of the card, so a fixed
  // perspective distorts more the wider the card gets — on wide cards the image's near
  // edge can reach the "camera" and the projection blows up to many times the card size.
  // Scale perspective with the container (values are interpreted at HP_PERSPECTIVE_REF_W)
  // and keep it safely beyond the image's maximum depth.
  _hpPerspective(p, widthPct, ry, rx) {
    const cw = this._hpContainerW || HP_PERSPECTIVE_REF_W;
    const scaled = p * cw / HP_PERSPECTIVE_REF_W;
    const wPx = (parseFloat(widthPct) || 10) / 100 * cw;
    const depth = wPx * Math.abs(Math.sin(ry * Math.PI / 180)) + wPx * Math.abs(Math.sin(rx * Math.PI / 180));
    return Math.max(scaled, depth * 2).toFixed(0);
  }

  _getHpInlineStyle() {
    const pos = this._config.heat_pump_position;
    if (!pos) {
      // Class defaults (see .heat-pump-img), with the perspective scaled to the card
      return `transform:perspective(${this._hpPerspective(700, 8.5, -24, 4)}px) rotateY(-24deg) rotateX(4deg) rotateZ(-2deg) skewY(-8deg);`;
    }
    const top = pos.top ?? '53%';
    const right = pos.right ?? '9%';
    const width = pos.width ?? '10%';
    const p = pos.perspective ?? 600;
    const ry = pos.rotateY ?? -42;
    const rx = pos.rotateX ?? 10;
    const rz = pos.rotateZ ?? -1;
    return `top:${top};right:${right};width:${width};transform:perspective(${this._hpPerspective(p, width, ry, rx)}px) rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg);transform-origin:bottom left;`;
  }

  _onHpDragStart(e) {
    if (!this._isAssetEditMode) return;
    e.preventDefault(); e.stopPropagation();
    const container = this.shadowRoot.querySelector('.house-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = this._config.heat_pump_position || {};
    const startRight = parseFloat(pos.right ?? 9);
    const startTop = parseFloat(pos.top ?? 53);
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const right = Math.max(0, Math.min(90, startRight - (dx / rect.width * 100)));
      const top = Math.max(0, Math.min(90, startTop + (dy / rect.height * 100)));
      this._config = { ...this._config, heat_pump_position: {
        ...(this._config.heat_pump_position || {}),
        right: right.toFixed(1) + '%',
        top: top.toFixed(1) + '%',
      }};
      this.requestUpdate();
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  // ── AC charger positioning (two-garage scene: one charger per bay) ─────────
  // ac_charger_bg.png is a full-canvas overlay with the charger baked at bay 1.
  // We render it twice and nudge each via a translate; positions are drag-editable
  // in the Asset editor and persist like heat_pump_position.
  _getChargerStyle(pos, def) {
    const p = pos || def || {};
    const tx = p.tx ?? (def && def.tx) ?? '0%';
    const ty = p.ty ?? (def && def.ty) ?? '0%';
    const sc = p.scale ?? 1;
    return `transform: translate(${tx}, ${ty}) scale(${sc}); transform-origin: center;`;
  }

  // Drag handle position = the charger's baked centroid in ac_charger_bg.png (~6.9%, 52%)
  // plus the applied translate, so the handle sits on the visible charger and follows it.
  _getChargerHandleStyle(pos, defTx = 0) {
    const tx = parseFloat((pos && pos.tx) ?? defTx) || 0;
    const ty = parseFloat((pos && pos.ty) ?? 0) || 0;
    return `left:${(6.9 + tx).toFixed(1)}%;top:${(52 + ty).toFixed(1)}%;`;
  }

  _onChargerDragStart(e, idx) {
    if (!this._isAssetEditMode) return;
    e.preventDefault(); e.stopPropagation();
    const container = this.shadowRoot.querySelector('.house-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const key = idx === 2 ? 'ev2_charger_position' : 'ev_charger_position';
    const cur = this._config[key] || (idx === 2 ? { tx: '14.5%' } : {});
    const startTx = parseFloat(cur.tx ?? (idx === 2 ? 14.5 : 0));
    const startTy = parseFloat(cur.ty ?? 0);
    const startX = e.clientX, startY = e.clientY;
    const onMove = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      this._config = { ...this._config, [key]: {
        ...(this._config[key] || {}),
        tx: (startTx + dx / rect.width * 100).toFixed(1) + '%',
        ty: (startTy + dy / rect.height * 100).toFixed(1) + '%',
      }};
      this.requestUpdate();
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  _onHpSlider(prop, value, unit) {
    const strVal = unit ? value + unit : parseFloat(value);
    this._config = { ...this._config, heat_pump_position: {
      ...(this._config.heat_pump_position || {}),
      [prop]: strVal,
    }};
    this.requestUpdate();
  }

  _onApplyAssets() {
    this.dispatchEvent(new CustomEvent('genergy-asset-position-save', {
      bubbles: true, composed: true,
      detail: {
        heat_pump_position: this._config.heat_pump_position || {},
        ev_charger_position: this._config.ev_charger_position || {},
        ev2_charger_position: this._config.ev2_charger_position || {},
        hass: this.hass,
      },
    }));
    const btn = this.shadowRoot.querySelector('.apply-asset-btn');
    if (btn) { btn.textContent = '✓ Saved!'; setTimeout(() => { btn.textContent = '✓ Save Position'; }, 1500); }
  }

  _onCopyAssets() {
    const pos = this._config.heat_pump_position || {};
    const text = JSON.stringify(pos, null, 2);
    const copyFallback = (s) => { const ta = document.createElement('textarea'); ta.value = s; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); };
    try { navigator.clipboard?.writeText(text).catch(() => copyFallback(text)); } catch(e) { copyFallback(text); }
    const btn = this.shadowRoot.querySelector('.copy-asset-btn');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy Config'; }, 1500); }
  }

  _renderLabel(key) {
    const def = LABELS[key];
    if (!def) return "";
    // User can hide the on-house EV labels (info still available in the EV Chargers panel).
    if ((key === "ev" || key === "ev2") && this._config.features?.ev_show_labels === false) return "";
    if (key === "ev" && !this._showEvVehicle) return "";
    if (key === "ev2" && (!this._twoEvGarage || !this._showEv2Vehicle)) return "";
    // AC-charger label is folded into the EV label when a vehicle is shown (see "ev" case);
    // only surface it standalone when the charger is present but no car.
    if (key === "ac" && (!this._showEvCharger || this._showEvVehicle)) return "";
    if (key === "heatpump" && !this._config.features.heat_pump) return "";

    let primary = "";
    let secondary = key === "ac" && this._config.ev_charger_label
      ? this._config.ev_charger_label
      : key === "battery" && this._config.battery_label
      ? this._config.battery_label
      : key === "heatpump" && this._config.heat_pump_label
      ? this._config.heat_pump_label
      : key === "solar" && this._config.solar_label
      ? this._config.solar_label
      : key === "home" && this._config.home_label
      ? this._config.home_label
      : key === "grid" && this._config.grid_label
      ? this._config.grid_label
      : def.label;
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
          if (rt) runtimeLine = `${rt.timeStr} to ${rt.targetSoc}%${rt.targetLabel || ''}`;
          color = this._config.swap_battery_colors ? this._config.colors.battery_charge : this._config.colors.battery_discharge;
        } else if (this._isCharging) {
          statusLine = "Charging";
          if (rt) runtimeLine = `${rt.timeStr} to ${rt.targetSoc}%${rt.targetLabel || ''}`;
          color = this._config.swap_battery_colors ? this._config.colors.battery_discharge : this._config.colors.battery_charge;
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
      case "ev": {
        // Consolidated single label: "EV 1 · 3.2 kW · 62%" (name · power · SoC). In two-garage
        // mode the name is "EV 1"; otherwise the configured charger label or "EV". The separate
        // AC-charger label is suppressed above so power isn't shown twice.
        const evSocVal = this._config.entities.ev_soc ? this._stateNum(this._config.entities.ev_soc) : null;
        const evRangeVal = this._config.entities.ev_range ? this._stateNum(this._config.entities.ev_range) : null;
        const evName = this._twoEvGarage ? 'EV 1' : (this._config.ev_charger_label || 'EV');
        const evPwr = this._formatPower(this._evPower, this._config.entities.ev_charger_power);
        const socPart = (evSocVal != null && !Number.isNaN(evSocVal)) ? ` · ${Math.round(evSocVal)}%` : '';
        primary = `${evName} · ${evPwr}${socPart}`;
        secondary = "";
        if (evRangeVal != null && !Number.isNaN(evRangeVal)) runtimeLine = this._formatRange(this._config.entities.ev_range, evRangeVal);
        if (this._isEvCharging || (this._isEvConnectedByState && this._stateSaysCharging(this._evConnectionState))) statusLine = "Charging";
        else if (this._isEvConnectedByState) statusLine = "Connected";
        break;
      }
      case "ev2": {
        const ev2Soc = this._config.entities.ev2_soc ? this._stateNum(this._config.entities.ev2_soc) : null;
        const ev2Range = this._config.entities.ev2_range ? this._stateNum(this._config.entities.ev2_range) : null;
        const ev2Name = this._config.ev2_charger_label || 'EV 2';
        const ev2Pwr = this._formatPower(this._ev2Power, this._config.entities.ev2_charger_power);
        const socPart = (ev2Soc != null && !Number.isNaN(ev2Soc)) ? ` · ${Math.round(ev2Soc)}%` : '';
        primary = `${ev2Name} · ${ev2Pwr}${socPart}`;
        secondary = "";
        if (ev2Range != null && !Number.isNaN(ev2Range)) runtimeLine = this._formatRange(this._config.entities.ev2_range, ev2Range);
        if (this._ev2Power > 5 || (this._isEv2ConnectedByState && this._stateSaysCharging(this._ev2ConnectionState))) statusLine = "Charging";
        else if (this._isEv2ConnectedByState) statusLine = "Connected";
        break;
      }
      case "ac":
        primary = this._formatPower(this._evPower, this._config.entities.ev_charger_power);
        if (this._isEvCharging) statusLine = "Charging";
        break;
      case "heatpump":
        primary = this._formatPower(this._heatPumpPower, this._config.entities.heat_pump_power);
        if (this._isHeatPumpActive) statusLine = "Active";
        break;
    }

    const labelPos = this._config.label_positions?.[key] || def;
    const _isInteractive = this._config.features?.interactive_house && !this._isAnyEditMode;
    const _clickHandler = _isInteractive ? (e) => {
      e.stopPropagation();
      this.dispatchEvent(new CustomEvent('genergy-modal', {
        bubbles: true,
        composed: true,
        detail: {
          type: key === 'ac' ? 'ev' : key,
          label: secondary,
          primary,
          statusLine,
          color,
          config: this._config,
          hass: this.hass,
        }
      }));
    } : null;

    return html`
      <div class="label ${_isInteractive ? 'interactive' : ''} ${this._isLabelEditMode ? 'label-editing' : ''}"
           style="top: ${labelPos.top || def.top}; left: ${labelPos.left || def.left};"
           @pointerdown="${(e) => this._onLabelDragStart(e, key)}"
           @click="${_clickHandler}">
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

    const _isModal = this._isEditMode;
    if (_isModal) { this.setAttribute('data-modal', ''); } else { this.removeAttribute('data-modal'); }
    const _hidden = this._hiddenEditorPaths || new Set();

    return html`
      <ha-card class="${_isModal ? 'editor-modal' : ''}">
        ${_isModal ? html`
          <div class="cable-editor-header">
            <span class="cable-editor-title">Cable Path Editor</span>
            <span class="cable-editor-hint">
              ${this._activePath
                ? html`Click to place points on <b style="color:${this._pathColor(this._activePath)}">${this._activePath}</b>. Right-click to delete point.`
                : 'Select a path below, then click to place points. Scroll to zoom, drag to pan.'}
            </span>
            <span class="zoom-controls">
              <button class="zoom-btn" @click="${() => { this._zoom = Math.min(5, (this._zoom || 1) + 0.25); }}">+</button>
              <button class="zoom-btn" @click="${this._resetZoom}">${Math.round((this._zoom || 1) * 100)}%</button>
              <button class="zoom-btn" @click="${() => { this._zoom = Math.max(0.5, (this._zoom || 1) - 0.25); }}">-</button>
            </span>
            <button class="cable-editor-close" @click="${this._onCancelEditor}">✕</button>
          </div>
        ` : ''}
        <div class="house-container${_isModal ? ' modal-house' : ''}"
             style="${_isModal ? `transform: translate(${this._panX || 0}px, ${this._panY || 0}px) scale(${this._zoom || 1}); transform-origin: 0 0;` : ''}">
          <img class="height-driver" src="${this._baseImage}"
               @error="${(e) => e.target.style.display = 'none'}" />

          <img class="layer-img" src="${this._baseImage}" />
          <img class="layer-img" src="${this._sigenstorImage}" />
          <img class="layer-img" src="${this._ammeterImage}" />
          ${this._showEvCharger && !this._twoEvGarage ? html`<img class="layer-img" src="${this._acChargerImage}" />` : ''}
          ${this._twoEvGarage && this._showEvCharger ? html`<img
            class="layer-img charger-img" src="${this._acChargerImage}"
            style="${this._getChargerStyle(this._config.ev_charger_position)}"
            @error="${(e) => e.target.style.display = 'none'}" />` : ''}
          ${this._twoEvGarage && this._showEv2Vehicle ? html`<img
            class="layer-img charger-img" src="${this._acChargerImage}"
            style="${this._getChargerStyle(this._config.ev2_charger_position, { tx: '14.5%' })}"
            @error="${(e) => e.target.style.display = 'none'}" />` : ''}
          ${this._isAssetEditMode && this._twoEvGarage && this._showEvCharger ? html`<div
            class="charger-handle" title="Drag EV 1 charger"
            style="${this._getChargerHandleStyle(this._config.ev_charger_position, 0)}"
            @pointerdown="${(e) => this._onChargerDragStart(e, 1)}">🔌</div>` : ''}
          ${this._isAssetEditMode && this._twoEvGarage && this._showEv2Vehicle ? html`<div
            class="charger-handle" title="Drag EV 2 charger"
            style="${this._getChargerHandleStyle(this._config.ev2_charger_position, 14.5)}"
            @pointerdown="${(e) => this._onChargerDragStart(e, 2)}">🔌</div>` : ''}
          ${this._config.features.heat_pump && (this._config.hp_image_style || 'outdoor') !== 'hidden' ? html`<img
            class="heat-pump-img${this._isAssetEditMode ? ' asset-editing' : ''}"
            src="${this._heatPumpImage}"
            style="${this._getHpInlineStyle()}"
            @error="${(e) => e.target.style.display = 'none'}"
            @pointerdown="${this._isAssetEditMode ? (e) => this._onHpDragStart(e) : null}" />` : ''}

          <svg class="flow-svg ${_isModal || this._isZoneEditMode ? 'edit-active' : ''}"
               viewBox="0 0 ${VB_W} ${VB_H}"
               preserveAspectRatio="xMidYMid meet"
               style="${_isModal ? (this._activePath ? 'cursor: crosshair;' : 'cursor: grab;') : ''}"
               @click="${_isModal ? (e) => this._onSvgClick(e) : null}"
               @pointerdown="${_isModal ? (e) => this._onSvgPanStart(e) : null}"
               @contextmenu="${_isModal ? (e) => this._onSvgRightClick(e) : null}">
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
            ${_isModal || this._isZoneEditMode ? svg`` : this._renderComets()}
            </g>
            ${_isModal ? svg`` : this._renderSocRing()}
            ${this._renderEditor()}
            ${this._renderClickZones()}
          </svg>

          ${!_isModal ? this._renderLabel("solar") : ''}
          ${!_isModal ? this._renderLabel("home") : ''}
          ${!_isModal ? this._renderLabel("battery") : ''}
          ${!_isModal ? this._renderLabel("grid") : ''}
          ${!_isModal ? this._renderLabel("ev") : ''}
          ${!_isModal ? this._renderLabel("ev2") : ''}
          ${!_isModal ? this._renderLabel("ac") : ''}
          ${!_isModal ? this._renderLabel("heatpump") : ''}
          ${!_isModal ? this._renderWeather() : ''}
        </div>
        ${_isModal ? html`
          <div class="editor-panel modal-editor-panel">
            <div class="editor-row">
              <div class="editor-section">
                <div class="editor-section-label">Show / Hide</div>
                <div class="editor-visibility">
                  ${Object.keys(this._editPaths).map(name => {
                    const c = this._pathColor(name);
                    const vis = !_hidden.has(name);
                    return html`
                      <button class="vis-btn ${vis ? '' : 'vis-off'}"
                              style="--vis-color: ${c}"
                              @click="${() => this._toggleEditorPath(name)}">
                        <span class="vis-dot" style="background: ${vis ? c : '#555'}"></span>
                        ${name}
                      </button>`;
                  })}
                  <button class="vis-btn ${!_hidden.has('soc_ring') ? '' : 'vis-off'}"
                          style="--vis-color: #00d4b8"
                          @click="${() => this._toggleEditorPath('soc_ring')}">
                    <span class="vis-dot" style="background: ${!_hidden.has('soc_ring') ? '#00d4b8' : '#555'}"></span>
                    soc_ring
                  </button>
                </div>
              </div>
              <div class="editor-section">
                <div class="editor-section-label">Draw Path <span class="editor-section-sub">(click to select, then click on image)</span></div>
                <div class="editor-visibility">
                  ${Object.keys(this._editPaths).filter(n => !_hidden.has(n)).map(name => {
                    const c = this._pathColor(name);
                    const active = this._activePath === name;
                    return html`
                      <button class="vis-btn draw-btn ${active ? 'draw-active' : ''}"
                              style="--vis-color: ${c}"
                              @click="${() => this._setActivePath(name)}">
                        <span class="vis-dot" style="background: ${c}"></span>
                        ${name}
                        ${active ? html`<span class="draw-indicator">✎</span>` : ''}
                      </button>`;
                  })}
                </div>
              </div>
            </div>
            <div class="editor-actions">
              <button class="apply-btn" @click="${this._onApplyPaths}">✓ Apply & Close</button>
              <button class="cancel-btn" @click="${this._onCancelEditor}">✕ Cancel</button>
              <button class="copy-btn" @click="${this._onCopyPaths}">Copy Paths</button>
              <span class="editor-sep"></span>
              ${Object.keys(this._editPaths).filter(n => !_hidden.has(n)).map(name => html`
                <span class="path-controls">
                  <span class="path-name" style="color: ${this._pathColor(name)}">${name}</span>
                  <button class="sm-btn" data-path="${name}" @click="${this._onAddPoint}">+pt</button>
                  <button class="sm-btn" data-path="${name}" @click="${this._onRemovePoint}">-pt</button>
                </span>
              `)}
            </div>
          </div>
        ` : ''}
          ${this._isLabelEditMode ? html`
          <div class="editor-panel">
            <div class="editor-title">Label Position Editor</div>
            <div class="editor-hint">Drag the Solar/Home/Battery/Grid/EV/Heat Pump text blocks to reposition labels and live values.</div>
            <div class="editor-actions">
              <button class="apply-btn" @click="${this._onApplyLabels}">✓ Save Labels</button>
              <button class="copy-btn" @click="${this._onCopyLabels}">Copy Labels</button>
            </div>
          </div>
        ` : this._isZoneEditMode ? html`
          <div class="editor-panel">
            <div class="editor-title">Clickable Zone Editor</div>
            <div class="editor-hint">Drag translucent rectangles to move click regions. Drag the round lower-right handle to resize.</div>
            <div class="editor-actions">
              <button class="apply-btn" @click="${this._onApplyZones}">✓ Save Zones</button>
              <button class="copy-btn" @click="${this._onCopyZones}">Copy Zones</button>
            </div>
          </div>
        ` : this._isAssetEditMode && this._config.features.heat_pump ? html`
          <div class="editor-panel">
            <div class="editor-title">Heat Pump Asset Editor</div>
            <div class="editor-hint">Drag the heat pump image to reposition. Sliders adjust size and perspective.</div>
            <div style="display:grid;gap:8px;margin:10px 0;">
              <label style="font-size:11px;color:#8892a4;display:flex;flex-direction:column;gap:2px;">
                Width: ${parseFloat(this._config.heat_pump_position?.width ?? 10).toFixed(1)}%
                <input type="range" min="3" max="25" step="0.5"
                  value="${parseFloat(this._config.heat_pump_position?.width ?? 10)}"
                  @input="${(e) => this._onHpSlider('width', e.target.value, '%')}" style="width:100%" />
              </label>
              <label style="font-size:11px;color:#8892a4;display:flex;flex-direction:column;gap:2px;">
                Perspective: ${this._config.heat_pump_position?.perspective ?? 600}px
                <input type="range" min="100" max="2000" step="50"
                  value="${this._config.heat_pump_position?.perspective ?? 600}"
                  @input="${(e) => this._onHpSlider('perspective', parseInt(e.target.value))}" style="width:100%" />
              </label>
              <label style="font-size:11px;color:#8892a4;display:flex;flex-direction:column;gap:2px;">
                RotateY (side angle): ${this._config.heat_pump_position?.rotateY ?? -30}°
                <input type="range" min="-90" max="90" step="1"
                  value="${this._config.heat_pump_position?.rotateY ?? -30}"
                  @input="${(e) => this._onHpSlider('rotateY', parseInt(e.target.value))}" style="width:100%" />
              </label>
              <label style="font-size:11px;color:#8892a4;display:flex;flex-direction:column;gap:2px;">
                RotateX (tilt): ${this._config.heat_pump_position?.rotateX ?? 5}°
                <input type="range" min="-45" max="45" step="1"
                  value="${this._config.heat_pump_position?.rotateX ?? 5}"
                  @input="${(e) => this._onHpSlider('rotateX', parseInt(e.target.value))}" style="width:100%" />
              </label>
              <label style="font-size:11px;color:#8892a4;display:flex;flex-direction:column;gap:2px;">
                RotateZ (rotation): ${this._config.heat_pump_position?.rotateZ ?? -1}°
                <input type="range" min="-30" max="30" step="1"
                  value="${this._config.heat_pump_position?.rotateZ ?? -1}"
                  @input="${(e) => this._onHpSlider('rotateZ', parseInt(e.target.value))}" style="width:100%" />
              </label>
            </div>
            <div class="editor-actions">
              <button class="apply-btn apply-asset-btn" @click="${this._onApplyAssets}">✓ Save Position</button>
              <button class="copy-btn copy-asset-btn" @click="${this._onCopyAssets}">Copy Config</button>
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
        width: 100%;
        max-width: none;
        align-self: flex-start;
        margin: 0;
        padding: 12px 0 0 0;
        box-sizing: border-box;
        overflow: hidden;
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
        right: 11.5%;
        top: 48%;
        width: 8.5%;
        height: auto;
        pointer-events: none;
        z-index: 6;
        transform: perspective(700px) rotateY(-24deg) rotateX(4deg) rotateZ(-2deg) skewY(-8deg);
        transform-origin: bottom left;
        filter: drop-shadow(3px 6px 8px rgba(0,0,0,0.6));
        opacity: 0.95;
      }

      .heat-pump-img.asset-editing {
        pointer-events: auto !important;
        cursor: grab !important;
        outline: 2px dashed #e67e22;
        outline-offset: 3px;
      }

      .charger-handle {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(230, 126, 34, 0.92);
        border: 2px solid #fff;
        border-radius: 50%;
        cursor: grab;
        pointer-events: auto;
        z-index: 12;
        font-size: 13px;
        line-height: 1;
        user-select: none;
        touch-action: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
      }
      .charger-handle:active { cursor: grabbing; }

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
        color: #00d4b8;
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
        background: #00d4b8;
        color: #1a1f2e;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .copy-btn:hover {
        background: #00d4b8;
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
        transition: background 0.2s;
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
        transition: background 0.2s;
      }

      .sm-btn:hover {
        background: #4a4f5e;
      }

      .editor-visibility {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 8px;
      }

      .vis-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(255,255,255,0.08);
        border: 1px solid var(--vis-color, #fff);
        color: #e0e4ec;
        padding: 3px 10px;
        border-radius: 14px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .vis-btn:hover {
        background: rgba(255,255,255,0.15);
      }

      .vis-btn.vis-off {
        opacity: 0.4;
        border-color: #555;
        text-decoration: line-through;
      }

      .vis-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      /* ── Modal Cable Editor ──────────────────────────────────────── */
      :host([data-modal]) {
        position: fixed !important;
        inset: 0 !important;
        z-index: 9999 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: none !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      ha-card.editor-modal {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        width: 100vw !important;
        height: 100vh !important;
        max-width: none !important;
        z-index: 9999;
        background: rgba(10, 14, 22, 0.97) !important;
        border-radius: 0 !important;
        display: flex;
        flex-direction: column;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        overflow: hidden;
      }

      .cable-editor-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        background: #1e2330;
        border-bottom: 1px solid #3a3f4e;
        flex-shrink: 0;
      }

      .cable-editor-title {
        font-size: 15px;
        font-weight: 700;
        color: #00d4b8;
        white-space: nowrap;
      }

      .cable-editor-hint {
        font-size: 12px;
        color: #8892a4;
        flex: 1;
      }

      .cable-editor-close {
        background: rgba(255,60,60,0.15);
        color: #ff6b6b;
        border: 1px solid rgba(255,60,60,0.3);
        width: 32px;
        height: 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.15s;
      }

      .cable-editor-close:hover {
        background: rgba(255,60,60,0.3);
      }

      .zoom-controls {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .zoom-btn {
        background: rgba(255,255,255,0.1);
        color: #cdd6e4;
        border: 1px solid #3a3f4e;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        min-width: 28px;
        text-align: center;
      }

      .zoom-btn:hover {
        background: rgba(255,255,255,0.2);
      }

      ha-card.editor-modal {
        align-items: center;
      }

      ha-card.editor-modal > .modal-editor-panel {
        width: 100%;
      }

      .modal-house {
        flex: 0 1 auto;
        width: fit-content !important;
        max-width: 95vw;
        margin: auto !important;
        overflow: visible;
      }

      ha-card.editor-modal .modal-house .height-driver {
        max-height: calc(100vh - 200px);
        max-width: 95vw;
        width: auto;
      }

      ha-card.editor-modal .modal-house .flow-svg {
        height: auto;
        aspect-ratio: 1170 / 1013;
      }

      .modal-editor-panel {
        flex-shrink: 0;
        max-height: 180px;
        overflow-y: auto;
      }

      .editor-row {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }

      .editor-section {
        flex: 1;
        min-width: 200px;
      }

      .editor-section-label {
        font-size: 11px;
        font-weight: 600;
        color: #8892a4;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .editor-section-sub {
        font-weight: 400;
        text-transform: none;
        letter-spacing: 0;
        color: #666;
      }

      .draw-btn.draw-active {
        background: rgba(255,255,255,0.18) !important;
        box-shadow: 0 0 0 2px var(--vis-color, #fff), 0 0 12px rgba(0,212,184,0.3);
      }

      .draw-indicator {
        font-size: 13px;
        margin-left: 2px;
      }

      .cancel-btn {
        background: rgba(255,60,60,0.15);
        color: #ff6b6b;
        border: 1px solid rgba(255,60,60,0.3);
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .cancel-btn:hover {
        background: rgba(255,60,60,0.3);
      }

      .editor-sep {
        width: 1px;
        height: 24px;
        background: #3a3f4e;
        flex-shrink: 0;
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

      .label.interactive {
        pointer-events: all;
        cursor: pointer;
        transition: transform 0.15s ease, filter 0.15s ease;
        border-radius: 8px;
        padding: 4px 6px;
        margin: -4px -6px;
      }

      .label.interactive:hover {
        transform: scale(1.08);
        filter: brightness(1.2);
        background: rgba(0, 212, 184, 0.08);
      }

      .label.interactive:active {
        transform: scale(0.96);
      }

      .label.label-editing {
        pointer-events: all;
        cursor: move;
        border-radius: 8px;
        padding: 4px 6px;
        margin: -4px -6px;
        outline: 1px dashed rgba(0, 212, 184, 0.65);
        background: rgba(0, 212, 184, 0.08);
        user-select: none;
      }

      .label.label-editing:hover {
        background: rgba(0, 212, 184, 0.16);
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

      @media (max-width: 800px) {
        :host {
          padding: 8px 4px 0 4px;
        }
      }

      @media (max-width: 500px) {
        .label-primary { font-size: 11px; }
        .label-secondary { font-size: 8px; }
        .label-status { font-size: 8px; }
        .label-runtime { font-size: 7px; }
        .label { min-width: 60px; }
        /* Compact weather badge so it clears the HOME label on phones */
        .weather-badge { top: 4px; right: 4px; gap: 4px; padding: 3px 8px; }
        .weather-icon { font-size: 14px; }
        .weather-temp { font-size: 11px; }
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
  "%c SIGENERGY-HOUSE-CARD %c v3.17.0 ",
  "color: white; background: #00d4b8; font-weight: bold; padding: 2px 6px; border-radius: 3px 0 0 3px;",
  "color: #00d4b8; background: #1a1f2e; font-weight: bold; padding: 2px 6px; border-radius: 0 3px 3px 0;"
);
