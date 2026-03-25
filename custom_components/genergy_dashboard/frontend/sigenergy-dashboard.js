/**
 * Sigenergy Dashboard v0.2.0 — Bundled Distribution
 * 
 * Self-contained Lit Element cards for Home Assistant.
 * No build step required — loads directly as an ES module.
 * 
 * Cards included:
 *   - sigenergy-settings-card (4-tab configuration)
 * 
 * Usage in HA resources:
 *   url: /local/sigenergy-dashboard/dist/sigenergy-dashboard.js
 *   type: module
 */

// Auto-detect base URL for HACS/manual install compatibility
const _SIGENERGY_SCRIPT_DIR = new URL('.', import.meta.url).pathname;

// Auto-load house card from same directory (HACS only registers one resource)
if (!customElements.get('sigenergy-house-card')) {
  import(new URL('sigenergy-house-card.js', import.meta.url).href).catch(() => {});
}

// ═══════════════════════════════════════════════════════════
// Config Store (singleton)
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'sigenergy-dashboard-config';

const DEFAULT_ENTITIES = {
  solar_power: 'sensor.deyeinvertermaster_pv_power',
  load_power: 'sensor.deyeinvertermaster_load_power',
  battery_power: 'sensor.deyeinvertermaster_battery_output_power',
  battery_soc: 'sensor.deyeinvertermaster_battery_soc',
  grid_power: 'sensor.deyeinvertermaster_grid_load_l1',
  solar_energy_today: 'sensor.deyeinvertermaster_summary_day_pv',
  load_energy_today: 'sensor.deyeinvertermaster_summary_day_load',
  battery_charge_today: 'sensor.deyeinvertermaster_summary_day_battery_charge',
  battery_discharge_today: 'sensor.deyeinvertermaster_summary_day_battery_discharge',
  grid_import_today: 'sensor.deyeinvertermaster_summary_day_grid_import_buy',
  grid_export_today: 'sensor.deyeinvertermaster_summary_day_grid_export_sell',
  weather: 'weather.forecast_home',
  ev_charger_power: '',
  ev_charger_state: '',
  ev_soc: '',
  ev_range: '',
  heat_pump_power: '',
  emhass_mode: 'sensor.emhass_current_mode',
  emhass_reason: 'sensor.emhass_decision_reason',
  mpc_battery: 'sensor.mpc_batt_power',
  mpc_grid: 'sensor.mpc_grid_power',
  mpc_pv: 'sensor.mpc_pv_power',
  buy_price: 'sensor.mpc_general_price',
  sell_price: 'sensor.mpc_feed_in_price',
  mpc_soc: 'sensor.mpc_batt_soc',
  mpc_load: 'sensor.mpc_load_power',
  mpc_optim_status: 'sensor.mpc_optim_status',
  emhass_savings_today: 'sensor.emhass_savings_today',
  emhass_net_cost_today: 'sensor.emhass_net_cost_today',
  emhass_battery_action: 'sensor.emhass_battery_action_summary',
  nordpool: 'sensor.nordpool_kwh_be_eur_3_10_0',
  battery_pack1_soc: 'sensor.battery_monitor_pack_01_view_soc',
  battery_pack2_soc: 'sensor.battery_monitor_pack_02_view_soc',
  battery_pack3_soc: 'sensor.battery_monitor_pack_03_view_soc',
  battery_pack4_soc: '',
  inverter_temp: 'sensor.deyeinvertermaster_temperature_dc_transformer',
  battery_temp: 'sensor.deyeinvertermaster_battery_temperature',
  grid_voltage: 'sensor.deyeinvertermaster_grid_voltage_l1',
  grid_frequency: 'sensor.deyeinvertermaster_grid_frequency',
  // Additional system entities
  grid_power_ct: 'sensor.deyeinvertermaster_grid_power_ct_clamp',
  grid_active_power: 'sensor.net_grid_power',
  emhass_enabled: 'input_boolean.emhass_enabled',
  // Device/inverter entities
  battery_voltage: 'sensor.deyeinvertermaster_battery_voltage',
  battery_current: 'sensor.deyeinvertermaster_battery_output_current',
  pv1_power: 'sensor.deyeinvertermaster_pv1_power',
  pv2_power: 'sensor.deyeinvertermaster_pv2_power',
  inverter_rated_power: 'sensor.deyeinvertermaster_inverter_rated_power',
  inverter_output_power: 'sensor.deyeinvertermaster_inverter_output_power',
  inverter_internal_temp: 'sensor.deyeinvertermaster_inverter_internal_temperature',
  rated_power: 'sensor.deyeinvertermaster_rated_power',
  // EMHASS financial entities
  emhass_net_cost_month: 'sensor.emhass_net_cost_this_month',
  emhass_savings_month: 'sensor.emhass_savings_monthly',
  emhass_projected_bill: 'sensor.emhass_projected_monthly_bill',
  emhass_projected_savings: 'sensor.emhass_projected_monthly_savings',
  emhass_last_decision: 'sensor.emhass_last_decision',
  // Automation entities
  automation_mpc_optimizer: 'automation.emhass_run_mpc_optimizer',
  automation_battery_control: 'automation.emhass_battery_control',
  // Solar forecast entities (Solcast / forecast.solar)
  solcast_today: '',
  solcast_tomorrow: '',
  solcast_remaining: '',
  forecast_solar_today: '',
  // EMHASS Deferrable Loads
  mpc_deferrable0: '',
  mpc_deferrable1: '',
  deferrable0_label: 'Heat Pump',
  deferrable1_label: 'Boiler',
  deferrable0_power: '',
  deferrable1_power: '',
  // MPC Cost
  mpc_cost_fun: '',
  // Actual price entities (live)
  current_import_price: '',
  current_export_price: '',
  // Additional EMHASS financial
  emhass_export_earnings_daily: '',
  emhass_import_cost_daily: '',
  emhass_grid_only_cost_daily: '',
  emhass_projected_bill_without_opt: '',
};

const DEFAULT_CONFIG = {
  entities: { ...DEFAULT_ENTITIES },
  features: {
    ev_charger: false,
    ev_vehicle: false,
    heat_pump: false,
    grid_connection: true,
    hide_cables: false,
    battery_packs: 2,
    emhass: true,
    emhass_forecasts: true,
    deferrable_loads: false,
    financial_tracking: true,
    solar_forecast: false,
    weather_widget: true,
    sunrise_sunset: false,
  },
  pricing: {
    source: 'nordpool',
    cheap_threshold: 0.10,
    expensive_threshold: 0.25,
    currency: '€',
    show_price_overlay: true,
    show_price_badge: true,
    show_color_coding: true,
  },
  display: {
    theme: 'dark',
    power_threshold: 1000,
    decimal_places: 1,
    chart_range: 'today',
    soc_ring_low: 40,
    soc_ring_high: 60,
  },
};

class SigConfigStore {
  constructor() {
    this._config = null;
    this._listeners = new Set();
    this._hass = null;
    this._haLoaded = false;
  }

  setHass(hass) {
    this._hass = hass;
    if (!this._haLoaded && hass) {
      this._haLoaded = true;
      this._loadFromHA().then(cfg => {
        if (cfg) {
          this._config = cfg;
          // Also update localStorage cache
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cfg, _version: 1, _saved: new Date().toISOString() })); } catch(e) {}
          this._notify();
        }
      });
    }
  }

  get() {
    if (!this._config) this._config = this._load();
    return this._config;
  }

  getEntity(key) {
    return this.get().entities?.[key] || DEFAULT_ENTITIES[key] || '';
  }

  getFeature(key) {
    return this.get().features?.[key] ?? DEFAULT_CONFIG.features[key];
  }

  getPricing(key) {
    return this.get().pricing?.[key] ?? DEFAULT_CONFIG.pricing[key];
  }

  getDisplay(key) {
    return this.get().display?.[key] ?? DEFAULT_CONFIG.display[key];
  }

  update(section, key, value) {
    const cfg = this.get();
    if (!cfg[section]) cfg[section] = {};
    cfg[section][key] = value;
    this._save(cfg);
    this._notify();
  }

  save(config) {
    this._save(config);
    this._notify();
  }

  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this._merge(DEFAULT_CONFIG, parsed);
      }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  async _loadFromHA() {
    if (!this._hass) return null;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const layout = config?.views?.find(v => v.path === 'overview')?.cards?.[0];
      const stored = layout?._sigenergy_config;
      if (stored) return this._merge(DEFAULT_CONFIG, stored);
    } catch (e) { console.warn('SigConfig: failed to load from HA', e); }
    return null;
  }

  _save(config) {
    this._config = config;
    // Write to localStorage (fast cache)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...config, _version: 1, _saved: new Date().toISOString(),
      }));
    } catch (e) { /* ignore */ }
    // Write to HA dashboard config (permanent storage)
    this._saveToHA(config);
  }

  async _saveToHA(config) {
    if (!this._hass) return;
    try {
      const dashConfig = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const view = dashConfig?.views?.find(v => v.path === 'overview');
      if (view?.cards?.[0]) {
        view.cards[0]._sigenergy_config = config;
        await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config: dashConfig });
      }
    } catch (e) { console.warn('SigConfig: failed to save to HA', e); }
  }

  _merge(defaults, overrides) {
    const result = {};
    for (const key of Object.keys(defaults)) {
      if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
        result[key] = { ...defaults[key], ...(overrides[key] || {}) };
      } else {
        result[key] = overrides[key] !== undefined ? overrides[key] : defaults[key];
      }
    }
    return result;
  }

  _notify() {
    for (const cb of this._listeners) {
      try { cb(this._config); } catch (e) { /* ignore */ }
    }
  }
}

window.SigenergyConfig = new SigConfigStore();

// ═══════════════════════════════════════════════════════════
// Settings Card (Lit Element)
// ═══════════════════════════════════════════════════════════

class SigenergySettingsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._activeTab = 0;
    this._config = {};
    this._hass = null;
    this._pathEditorOn = false;
    this._pathEditorChecked = false;
  }

  set hass(hass) {
    this._hass = hass;
    // Provide hass to the config store for permanent HA-based storage
    const store = window.SigenergyConfig;
    if (store && hass) {
      if (typeof store.setHass === 'function') {
        store.setHass(hass);
      } else {
        store._hass = hass;
      }
    }
    // Check path editor state once
    if (!this._pathEditorChecked && hass) {
      this._pathEditorChecked = true;
      this._checkPathEditorState();
    }
    // Don't re-render if user is actively editing an input — prevents flicker/deselect
    const active = this.shadowRoot?.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) {
      return;
    }
    this._render();
  }

  setConfig(config) {
    this._config = config;
  }

  static getConfigElement() { return document.createElement('div'); }
  static getStubConfig() { return {}; }
  getCardSize() { return 8; }

  _getState(entityId) {
    if (!this._hass || !entityId) return 'N/A';
    const s = this._hass.states[entityId];
    if (!s) return '❌ Not found';
    const u = s.attributes.unit_of_measurement || '';
    return `${s.state}${u ? ' ' + u : ''}`;
  }

  _storeGet() { return window.SigenergyConfig.get(); }

  _storeSave(data) {
    const store = window.SigenergyConfig;
    if (typeof store.save === 'function') { store.save(data); }
    else { store._save(data); store._notify(); }
  }

  _render() {
    const cfg = this._storeGet();
    const tab = this._activeTab;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        * { box-sizing: border-box; }
        .card {
          background: var(--ha-card-background, #22273a);
          border: 1px solid var(--divider-color, #2d3451);
          border-radius: 16px;
          padding: 16px;
          color: var(--primary-text-color, #fff);
          font-family: var(--ha-card-header-font-family, inherit);
        }
        h2 { margin: 0 0 12px; font-size: 18px; font-weight: 600; }
        .tabs {
          display: flex; gap: 2px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--divider-color, #2d3451);
          padding-bottom: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .tab {
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px; font-weight: 500;
          color: var(--secondary-text-color, #8892a4);
          border: none; background: none;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .tab:hover { color: var(--primary-text-color, #fff); background: rgba(0,212,184,0.08); }
        .tab.active { color: #00d4b8; border-bottom-color: #00d4b8; }
        .section { margin-bottom: 16px; }
        .section-title {
          font-size: 12px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.2px; color: #00d4b8;
          margin-bottom: 8px; padding-bottom: 4px;
          border-bottom: 1px solid rgba(0,212,184,0.2);
        }
        .row {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 6px; padding: 6px 8px;
          background: rgba(45,52,81,0.4); border-radius: 8px;
        }
        .row-label { min-width: 130px; font-size: 12px; color: var(--secondary-text-color, #8892a4); }
        .row-input {
          flex: 1; background: var(--card-background-color, #1a1f2e);
          border: 1px solid var(--divider-color, #2d3451);
          border-radius: 6px; padding: 6px 10px;
          color: var(--primary-text-color, #fff);
          font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .row-input:focus { outline: none; border-color: #00d4b8; }
        .row-state {
          min-width: 90px; text-align: right; font-size: 11px;
          font-weight: 600; color: #00d4b8;
        }
        .row-state.err { color: #e74c3c; }
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; background: rgba(45,52,81,0.4);
          border-radius: 8px; margin-bottom: 6px;
        }
        .toggle-text { flex: 1; }
        .toggle-name { font-size: 13px; color: var(--primary-text-color, #fff); }
        .toggle-desc { font-size: 11px; color: var(--secondary-text-color, #8892a4); margin-top: 2px; }
        .switch {
          width: 44px; height: 24px; border-radius: 12px;
          position: relative; cursor: pointer;
          transition: background 0.3s; flex-shrink: 0;
        }
        .switch.off { background: #3a4058; }
        .switch.on { background: #00d4b8; }
        .switch::after {
          content: ''; position: absolute;
          width: 20px; height: 20px; border-radius: 50%;
          background: white; top: 2px; left: 2px;
          transition: transform 0.3s;
        }
        .switch.on::after { transform: translateX(20px); }
        .price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
        .price-btn {
          padding: 12px 8px; border: 2px solid var(--divider-color, #2d3451);
          border-radius: 10px; background: var(--card-background-color, #1a1f2e);
          color: var(--primary-text-color, #fff);
          cursor: pointer; text-align: center; font-size: 13px;
          font-weight: 500; transition: all 0.2s;
        }
        .price-btn:hover { border-color: #00d4b8; }
        .price-btn.active { border-color: #00d4b8; background: rgba(0,212,184,0.12); }
        .save-btn {
          display: block; width: 100%; padding: 12px;
          margin-top: 14px; background: #00d4b8; color: #1a1f2e;
          border: none; border-radius: 8px; font-size: 14px;
          font-weight: 700; cursor: pointer; transition: opacity 0.2s;
          letter-spacing: 0.5px;
        }
        .save-btn:hover { opacity: 0.88; }
        select.row-input { cursor: pointer; }
        @media (max-width: 500px) {
          .row { flex-wrap: wrap; }
          .row-label { min-width: 100%; margin-bottom: 4px; }
          .row-state { min-width: 100%; text-align: left; margin-top: 4px; }
        }
      </style>

      <div class="card">
        <h2>⚙️ Sigenergy Settings</h2>
        <div class="tabs">
          <button class="tab ${tab===0?'active':''}" data-tab="0">⚡ Entities</button>
          <button class="tab ${tab===1?'active':''}" data-tab="1">🔧 Features</button>
          <button class="tab ${tab===2?'active':''}" data-tab="2">💰 Pricing</button>
          <button class="tab ${tab===3?'active':''}" data-tab="3">🎨 Display</button>
        </div>
        <div id="content"></div>
      </div>
    `;

    // Tab clicks
    this.shadowRoot.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._activeTab = parseInt(btn.dataset.tab);
        this._render();
      });
    });

    const content = this.shadowRoot.getElementById('content');
    if (tab === 0) this._renderEntities(content, cfg);
    else if (tab === 1) this._renderFeatures(content, cfg);
    else if (tab === 2) this._renderPricing(content, cfg);
    else if (tab === 3) this._renderDisplay(content, cfg);
  }

  _entityRow(label, key, entities) {
    const id = entities[key] || '';
    const state = this._getState(id);
    const isErr = state.startsWith('❌');
    return `
      <div class="row">
        <span class="row-label">${label}</span>
        <input class="row-input" value="${this._esc(id)}" placeholder="sensor.entity_id" data-key="${key}" />
        <span class="row-state ${isErr?'err':''}">${state}</span>
      </div>`;
  }

  _esc(str) { return (str||'').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  async _togglePathEditor(enable) {
    if (!this._hass) return;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const patch = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        if (obj.type === 'custom:sigenergy-house-card') {
          obj.edit_paths = enable;
          return true;
        }
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) {
            for (const item of v) { if (patch(item)) return true; }
          } else if (typeof v === 'object' && v !== null) {
            if (patch(v)) return true;
          }
        }
        return false;
      };
      if (patch(config)) {
        await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config });
        this._pathEditorOn = enable;
        this._render();
      }
    } catch (e) { console.error('Toggle path editor failed:', e); }
  }

  async _checkPathEditorState() {
    if (!this._hass) return;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const find = (obj) => {
        if (!obj || typeof obj !== 'object') return undefined;
        if (obj.type === 'custom:sigenergy-house-card') return obj.edit_paths === true;
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) {
            for (const item of v) { const r = find(item); if (r !== undefined) return r; }
          } else if (typeof v === 'object' && v !== null) {
            const r = find(v); if (r !== undefined) return r;
          }
        }
        return undefined;
      };
      const state = find(config);
      if (state !== undefined) {
        this._pathEditorOn = state;
        this._render();
      }
    } catch (e) { /* ignore */ }
  }

  // Features that should be synced to the house card's dashboard config
  static get SYNCED_FEATURES() {
    return { ev_charger: 'ev_charger', ev_vehicle: 'ev_vehicle', heat_pump: 'heat_pump', grid_connection: 'grid', hide_cables: 'hide_cables', emhass: 'emhass', solar_forecast: 'solar_forecast', emhass_forecasts: 'emhass_forecasts', deferrable_loads: 'deferrable_loads', financial_tracking: 'financial_tracking' };
  }

  async _syncFeatureToDashboard(settingsKey, value) {
    const cardKey = SigenergySettingsCard.SYNCED_FEATURES[settingsKey];
    if (!cardKey || !this._hass) return;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const patch = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        if (obj.type === 'custom:sigenergy-house-card') {
          if (!obj.features) obj.features = {};
          obj.features[cardKey] = value;
          return true;
        }
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) {
            for (const item of v) { if (patch(item)) return true; }
          } else if (typeof v === 'object' && v !== null) {
            if (patch(v)) return true;
          }
        }
        return false;
      };
      if (patch(config)) {
        await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config });
      }
    } catch (e) { console.error('Sync feature to dashboard failed:', e); }
  }

  async _syncEntityToDashboard(entityKey, entityId) {
    if (!this._hass) return;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const oldId = DEFAULT_ENTITIES[entityKey];
      let changed = false;

      // 1. Sync to house card entities
      const patchHouse = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        if (obj.type === 'custom:sigenergy-house-card') {
          if (!obj.entities) obj.entities = {};
          obj.entities[entityKey] = entityId;
          return true;
        }
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) {
            for (const item of v) { if (patchHouse(item)) return true; }
          } else if (typeof v === 'object' && v !== null) {
            if (patchHouse(v)) return true;
          }
        }
        return false;
      };
      if (patchHouse(config)) changed = true;

      // 2. Replace ALL occurrences of the old entity ID with the new one
      // This updates sankey charts, mushroom cards, apex charts, etc.
      if (oldId && entityId && oldId !== entityId) {
        const configStr = JSON.stringify(config);
        if (configStr.includes(oldId)) {
          const updatedStr = configStr.split(oldId).join(entityId);
          const updatedConfig = JSON.parse(updatedStr);
          Object.assign(config, updatedConfig);
          changed = true;
        }
      }

      if (changed) {
        await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config });
      }
    } catch (e) { console.error('Sync entity to dashboard failed:', e); }
  }

  _renderEntities(el, cfg) {
    const e = cfg.entities || {};
    const emhassOn = cfg.features?.emhass !== false;
    el.innerHTML = `
      <div class="section">
        <div class="section-title">☀️ Core Power</div>
        ${this._entityRow('Solar Power', 'solar_power', e)}
        ${this._entityRow('Home Load', 'load_power', e)}
        ${this._entityRow('Battery Power', 'battery_power', e)}
        ${this._entityRow('Battery SoC', 'battery_soc', e)}
        ${this._entityRow('Grid Power', 'grid_power', e)}
      </div>
      <div class="section">
        <div class="section-title">📊 Daily Energy</div>
        ${this._entityRow('Solar Today', 'solar_energy_today', e)}
        ${this._entityRow('Load Today', 'load_energy_today', e)}
        ${this._entityRow('Batt Charge', 'battery_charge_today', e)}
        ${this._entityRow('Batt Discharge', 'battery_discharge_today', e)}
        ${this._entityRow('Grid Import', 'grid_import_today', e)}
        ${this._entityRow('Grid Export', 'grid_export_today', e)}
      </div>
      <div class="section">
        <div class="section-title">💰 Price Entities</div>
        <div class="toggle-desc" style="margin-bottom:8px;color:#8892a4;font-size:11px;">Configure your buy and sell price entities. These are used for price charts, overlays, and color coding across the dashboard.</div>
        ${this._entityRow('Buy Price', 'buy_price', e)}
        ${this._entityRow('Sell Price', 'sell_price', e)}
        ${this._entityRow('Nordpool', 'nordpool', e)}
      </div>
      <div class="section" style="border:1px solid ${emhassOn ? '#00d4b8' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${emhassOn ? '12' : '0'}px;">
          <div>
            <div style="font-size:14px;font-weight:700;color:${emhassOn ? '#00d4b8' : '#8892a4'};">🤖 EMHASS Integration</div>
            <div style="font-size:11px;color:#8892a4;margin-top:2px;">Enable to configure EMHASS optimizer entities and unlock advanced features (forecasts, MPC targets, savings tracking)</div>
          </div>
          <div class="switch ${emhassOn ? 'on' : 'off'}" data-key="emhass_toggle" style="flex-shrink:0;margin-left:12px;"></div>
        </div>
        ${emhassOn ? `
          <div style="border-top:1px solid rgba(0,212,184,0.2);padding-top:10px;">
            <div class="section-title" style="font-size:11px;">MPC Forecast Entities</div>
            ${this._entityRow('MPC Battery', 'mpc_battery', e)}
            ${this._entityRow('MPC Grid', 'mpc_grid', e)}
            ${this._entityRow('MPC PV', 'mpc_pv', e)}
            ${this._entityRow('MPC SoC', 'mpc_soc', e)}
            ${this._entityRow('MPC Load', 'mpc_load', e)}
            ${this._entityRow('Optim Status', 'mpc_optim_status', e)}
          </div>
          <div style="margin-top:8px;">
            <div class="section-title" style="font-size:11px;">EMHASS Status</div>
            ${this._entityRow('Mode', 'emhass_mode', e)}
            ${this._entityRow('Reason', 'emhass_reason', e)}
            ${this._entityRow('Battery Action', 'emhass_battery_action', e)}
          </div>
          <div style="margin-top:8px;">
            <div class="section-title" style="font-size:11px;">EMHASS Financial</div>
            ${this._entityRow('Savings Today', 'emhass_savings_today', e)}
            ${this._entityRow('Net Cost Today', 'emhass_net_cost_today', e)}
            ${this._entityRow('Net Cost Month', 'emhass_net_cost_month', e)}
            ${this._entityRow('Savings Month', 'emhass_savings_month', e)}
            ${this._entityRow('Projected Bill', 'emhass_projected_bill', e)}
            ${this._entityRow('Projected Savings', 'emhass_projected_savings', e)}
            ${this._entityRow('Last Decision', 'emhass_last_decision', e)}
          </div>
          <div style="margin-top:8px;">
            <div class="section-title" style="font-size:11px;">EMHASS Automations</div>
            ${this._entityRow('MPC Optimizer', 'automation_mpc_optimizer', e)}
            ${this._entityRow('Battery Control', 'automation_battery_control', e)}
          </div>
          <div style="margin-top:8px;">
            <div class="section-title" style="font-size:11px;">Actual Price Entities</div>
            <div class="toggle-desc" style="margin-bottom:4px;color:#8892a4;font-size:10px;">Live electricity prices for chart overlays and cost tracking</div>
            ${this._entityRow('Import Price', 'current_import_price', e)}
            ${this._entityRow('Export Price', 'current_export_price', e)}
            ${this._entityRow('MPC Cost Fun', 'mpc_cost_fun', e)}
          </div>
          <div style="margin-top:8px;">
            <div class="section-title" style="font-size:11px;">Additional Financial</div>
            ${this._entityRow('Export Earn Daily', 'emhass_export_earnings_daily', e)}
            ${this._entityRow('Import Cost Daily', 'emhass_import_cost_daily', e)}
            ${this._entityRow('Grid-Only Cost', 'emhass_grid_only_cost_daily', e)}
            ${this._entityRow('Bill w/o Optim', 'emhass_projected_bill_without_opt', e)}
          </div>
          ${cfg.features?.deferrable_loads ? `
          <div style="margin-top:8px;">
            <div class="section-title" style="font-size:11px;">Deferrable Loads</div>
            <div class="toggle-desc" style="margin-bottom:4px;color:#8892a4;font-size:10px;">EMHASS deferrable load scheduling (heat pump, boiler, etc.)</div>
            ${this._entityRow('Deferrable 0', 'mpc_deferrable0', e)}
            <div class="row"><span class="row-label">Label 0</span><input class="row-input" value="${this._esc(e.deferrable0_label||'Heat Pump')}" data-key="deferrable0_label" /><span class="row-state" style="min-width:40px;"></span></div>
            ${this._entityRow('Actual Power 0', 'deferrable0_power', e)}
            ${this._entityRow('Deferrable 1', 'mpc_deferrable1', e)}
            <div class="row"><span class="row-label">Label 1</span><input class="row-input" value="${this._esc(e.deferrable1_label||'Boiler')}" data-key="deferrable1_label" /><span class="row-state" style="min-width:40px;"></span></div>
            ${this._entityRow('Actual Power 1', 'deferrable1_power', e)}
          </div>
          ` : ''}
        ` : ''}
      </div>
      <div class="section">
        <div class="section-title">🔌 EV / Charger</div>
        ${this._entityRow('Charger Power', 'ev_charger_power', e)}
        ${this._entityRow('Charger State', 'ev_charger_state', e)}
        ${this._entityRow('EV SoC', 'ev_soc', e)}
        ${this._entityRow('EV Range', 'ev_range', e)}
      </div>
      <div class="section">
        <div class="section-title">♨️ Heat Pump</div>
        ${this._entityRow('HP Power', 'heat_pump_power', e)}
      </div>
      <div class="section" style="border:1px solid ${cfg.features?.solar_forecast ? '#FFA500' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${cfg.features?.solar_forecast ? '12' : '0'}px;">
          <div>
            <div style="font-size:14px;font-weight:700;color:${cfg.features?.solar_forecast ? '#FFA500' : '#8892a4'};">☀️ Solar Forecasting</div>
            <div style="font-size:11px;color:#8892a4;margin-top:2px;">Enable for Solcast or forecast.solar integration (works without EMHASS)</div>
          </div>
          <div class="switch ${cfg.features?.solar_forecast ? 'on' : 'off'}" data-key="solar_forecast_toggle" style="flex-shrink:0;margin-left:12px;"></div>
        </div>
        ${cfg.features?.solar_forecast ? `
          <div style="border-top:1px solid rgba(255,165,0,0.2);padding-top:10px;">
            <div class="section-title" style="font-size:11px;">Solcast Entities</div>
            <div class="toggle-desc" style="margin-bottom:4px;color:#8892a4;font-size:10px;">Install the Solcast PV Forecast integration from HACS for these entities</div>
            ${this._entityRow('Today kWh', 'solcast_today', e)}
            ${this._entityRow('Tomorrow kWh', 'solcast_tomorrow', e)}
            ${this._entityRow('Remaining kWh', 'solcast_remaining', e)}
            <div style="margin-top:8px;"><div class="section-title" style="font-size:11px;">Forecast.Solar (alternative)</div></div>
            ${this._entityRow('Today kWh', 'forecast_solar_today', e)}
          </div>
        ` : ''}
      </div>
      <div class="section">
        <div class="section-title">🌡️ System</div>
        ${this._entityRow('Weather', 'weather', e)}
        ${this._entityRow('Inverter Temp', 'inverter_temp', e)}
        ${this._entityRow('Inv Internal Temp', 'inverter_internal_temp', e)}
        ${this._entityRow('Battery Temp', 'battery_temp', e)}
        ${this._entityRow('Grid Voltage', 'grid_voltage', e)}
        ${this._entityRow('Grid Frequency', 'grid_frequency', e)}
        ${this._entityRow('Grid CT Clamp', 'grid_power_ct', e)}
        ${this._entityRow('Net Grid Power', 'grid_active_power', e)}
        ${this._entityRow('EMHASS Enabled', 'emhass_enabled', e)}
      </div>
      <div class="section">
        <div class="section-title">🔌 Inverter & PV</div>
        ${this._entityRow('Inverter Output', 'inverter_output_power', e)}
        ${this._entityRow('Inverter Rated', 'inverter_rated_power', e)}
        ${this._entityRow('Rated Power', 'rated_power', e)}
        ${this._entityRow('PV1 Power', 'pv1_power', e)}
        ${this._entityRow('PV2 Power', 'pv2_power', e)}
        ${this._entityRow('Battery Voltage', 'battery_voltage', e)}
        ${this._entityRow('Battery Current', 'battery_current', e)}
      </div>
      <div class="section">
        <div class="section-title">🔋 Battery Pack SoC</div>
        <div class="toggle-desc" style="margin-bottom:8px;color:#8892a4;font-size:11px;">Individual SoC sensors for each battery pack. Leave blank to use the main Battery SoC entity as fallback.</div>
        ${this._entityRow('Pack 1 SoC', 'battery_pack1_soc', e)}
        ${this._entityRow('Pack 2 SoC', 'battery_pack2_soc', e)}
        ${this._entityRow('Pack 3 SoC', 'battery_pack3_soc', e)}
        ${this._entityRow('Pack 4 SoC', 'battery_pack4_soc', e)}
      </div>
    `;

    // Entity keys that should be synced to the house card dashboard config
    const SYNCED_ENTITIES = new Set([
      'solar_power', 'load_power', 'battery_power', 'battery_soc',
      'grid_power', 'grid_power_ct', 'grid_active_power',
      'grid_import', 'grid_export', 'grid_active',
      'sun', 'weather',
      'ev_charger_power', 'ev_charger_state', 'ev_soc', 'ev_range',
      'heat_pump_power',
    ]);

    // EMHASS toggle handler
    const emhassToggle = el.querySelector('[data-key="emhass_toggle"]');
    if (emhassToggle) {
      emhassToggle.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.features.emhass = !cfg2.features.emhass;
        this._storeSave(cfg2);
        this._syncFeatureToDashboard('emhass', cfg2.features.emhass);
        this._render();
      });
    }

    // Solar forecast toggle handler
    const solarToggle = el.querySelector('[data-key="solar_forecast_toggle"]');
    if (solarToggle) {
      solarToggle.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.features.solar_forecast = !cfg2.features.solar_forecast;
        this._storeSave(cfg2);
        this._render();
      });
    }

    // Bind entity input changes — update state badge inline, no full re-render
    el.querySelectorAll('.row-input').forEach(input => {
      input.addEventListener('change', () => {
        const key = input.dataset.key;
        const value = input.value.trim();
        const cfg2 = this._storeGet();
        cfg2.entities[key] = value;
        this._storeSave(cfg2);
        // Update state badge inline without destroying the DOM
        const stateEl = input.parentElement.querySelector('.row-state');
        if (stateEl) {
          const state = this._getState(value);
          stateEl.textContent = state;
          stateEl.className = 'row-state' + (state.startsWith('❌') ? ' err' : '');
        }
        // Sync entity to house card dashboard config
        if (SYNCED_ENTITIES.has(key)) {
          this._syncEntityToDashboard(key, value);
        }
      });
    });
  }

  _toggleHtml(label, desc, key, value) {
    return `
      <div class="toggle-row" data-key="${key}">
        <div class="toggle-text">
          <div class="toggle-name">${label}</div>
          <div class="toggle-desc">${desc}</div>
        </div>
        <div class="switch ${value ? 'on' : 'off'}" data-key="${key}"></div>
      </div>`;
  }

  _renderFeatures(el, cfg) {
    const f = cfg.features || {};
    el.innerHTML = `
      <div class="section">
        <div class="section-title">System Components</div>
        ${this._toggleHtml('Grid Connection', 'Disable for off-grid setups', 'grid_connection', f.grid_connection)}
        ${this._toggleHtml('EMHASS Integration', 'Show EMHASS optimizer stats', 'emhass', f.emhass)}
        ${this._toggleHtml('EMHASS Forecasts', 'Show MPC forecast overlays on graphs (requires EMHASS)', 'emhass_forecasts', f.emhass_forecasts)}
        ${this._toggleHtml('Deferrable Loads', 'Show heat pump/boiler schedules from EMHASS', 'deferrable_loads', f.deferrable_loads)}
        ${this._toggleHtml('Financial Tracking', 'Show EMHASS cost/savings cards', 'financial_tracking', f.financial_tracking)}
        ${this._toggleHtml('Solar Forecast', 'Solcast or forecast.solar integration', 'solar_forecast', f.solar_forecast)}
        ${this._toggleHtml('Weather Widget', 'Weather overlay on Overview', 'weather_widget', f.weather_widget)}
        ${this._toggleHtml('Hide Cable Lines', 'Show only flow animation, no static cable backbone', 'hide_cables', f.hide_cables)}
      </div>
      <div class="section">
        <div class="section-title">Optional Equipment</div>
        ${this._toggleHtml('EV Charger', 'Show EV charger + flow animation', 'ev_charger', f.ev_charger)}
        ${this._toggleHtml('EV Vehicle', 'Show car in garage layer', 'ev_vehicle', f.ev_vehicle)}
        ${this._toggleHtml('Heat Pump / HVAC', 'Show heat pump unit', 'heat_pump', f.heat_pump)}
      </div>
      <div class="section">
        <div class="section-title">Battery</div>
        <div class="row">
          <span class="row-label">Battery Packs</span>
          <input class="row-input" type="number" min="1" max="8" value="${f.battery_packs || 2}" data-key="battery_packs" />
        </div>
      </div>
      <div class="section">
        <div class="section-title">Charts</div>
        ${this._toggleHtml('Sunrise/Sunset Lines', 'Show day/night shading', 'sunrise_sunset', f.sunrise_sunset)}
      </div>
      <div class="section">
        <div class="section-title">\u{1F527} Developer</div>
        ${this._toggleHtml('Cable Path Editor', 'Drag-to-position cable routing overlay on house card', 'path_editor', this._pathEditorOn)}
      </div>
    `;

    // Bind toggles
    el.querySelectorAll('.switch').forEach(sw => {
      sw.addEventListener('click', () => {
        const key = sw.dataset.key;
        if (key === 'path_editor') {
          this._togglePathEditor(!this._pathEditorOn);
          return;
        }
        const cfg2 = this._storeGet();
        cfg2.features[key] = !cfg2.features[key];
        this._storeSave(cfg2);
        // Sync feature to house card's dashboard config
        if (SigenergySettingsCard.SYNCED_FEATURES[key]) {
          this._syncFeatureToDashboard(key, cfg2.features[key]);
        }
        // Always rebuild dashboard to apply feature changes (charts, cards, etc.)
        if (this._hass) {
          this._buildDashboard().then(ok => {
            if (ok) console.log('Dashboard rebuilt after toggling', key);
            this._render();
          }).catch(e => {
            console.error('Dashboard rebuild failed:', e);
            this._render();
          });
        } else {
          this._render();
        }
      });
    });

    // Bind battery packs input
    const bpInput = el.querySelector('input[data-key="battery_packs"]');
    if (bpInput) {
      bpInput.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        cfg2.features.battery_packs = parseInt(bpInput.value) || 2;
        this._storeSave(cfg2);
        this._render();
      });
    }
  }

  _renderPricing(el, cfg) {
    const p = cfg.pricing || {};
    el.innerHTML = `
      <div class="section">
        <div class="section-title">Price Source</div>
        <div class="price-grid">
          <div class="price-btn ${p.source==='tibber'?'active':''}" data-src="tibber">Tibber</div>
          <div class="price-btn ${p.source==='amber'?'active':''}" data-src="amber">Amber Electric</div>
          <div class="price-btn ${p.source==='nordpool'?'active':''}" data-src="nordpool">Nordpool</div>
          <div class="price-btn ${p.source==='custom'?'active':''}" data-src="custom">Custom / Manual</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Thresholds</div>
        <div class="row">
          <span class="row-label">Cheap (€/kWh)</span>
          <input class="row-input" type="number" step="0.01" value="${p.cheap_threshold||0.10}" data-key="cheap_threshold" />
        </div>
        <div class="row">
          <span class="row-label">Expensive (€/kWh)</span>
          <input class="row-input" type="number" step="0.01" value="${p.expensive_threshold||0.25}" data-key="expensive_threshold" />
        </div>
        <div class="row">
          <span class="row-label">Currency Symbol</span>
          <input class="row-input" type="text" maxlength="3" value="${this._esc(p.currency||'€')}" data-key="currency" />
        </div>
      </div>
      <div class="section">
        <div class="section-title">Overlays</div>
        ${this._toggleHtml('Price on Charts', 'Secondary Y-axis showing price', 'show_price_overlay', p.show_price_overlay)}
        ${this._toggleHtml('Price Badge', 'Current price on house card', 'show_price_badge', p.show_price_badge)}
        ${this._toggleHtml('Color Coding', 'Green/yellow/red bands', 'show_color_coding', p.show_color_coding)}
      </div>
    `;

    // Source buttons
    el.querySelectorAll('.price-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.pricing.source = btn.dataset.src;
        this._storeSave(cfg2);
        this._render();
      });
    });

    // Threshold inputs
    el.querySelectorAll('.row-input').forEach(input => {
      input.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const key = input.dataset.key;
        const val = input.type === 'number' ? parseFloat(input.value) : input.value;
        cfg2.pricing[key] = val;
        this._storeSave(cfg2);
      });
    });

    // Pricing toggles
    el.querySelectorAll('.switch').forEach(sw => {
      sw.addEventListener('click', () => {
        const key = sw.dataset.key;
        const cfg2 = this._storeGet();
        cfg2.pricing[key] = !cfg2.pricing[key];
        this._storeSave(cfg2);
        this._render();
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Dashboard Builder — generates conditional card config
  // ═══════════════════════════════════════════════════════════

  _buildApexSeries(e, features) {
    const series = [];
    // Always: actual solar
    series.push({
      entity: e.solar_power || 'sensor.solar_production',
      name: 'Solar', color: '#FF8F00', type: 'area', opacity: 0.35,
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: 'return x / 1000;',
      group_by: { func: 'avg', duration: '5min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: 1
    });
    // Always: actual battery
    series.push({
      entity: e.battery_power || 'sensor.battery_output_power',
      name: 'Battery', color: '#00C853', type: 'line',
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: 'return x / 1000;',
      group_by: { func: 'avg', duration: '5min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: 1
    });
    // Always: actual grid
    series.push({
      entity: e.grid_active_power || e.grid_power || 'sensor.net_grid_power',
      name: 'Grid', color: '#D32F2F', type: 'line',
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: 'return x / 1000;',
      group_by: { func: 'avg', duration: '5min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: 1
    });
    // Always: actual consumption (inverted)
    series.push({
      entity: e.load_power || 'sensor.home_consumption',
      name: 'Consumption', color: '#8E24AA', type: 'area', opacity: 0.08,
      stroke_width: 1.5, extend_to: false, unit: ' kW',
      transform: 'return x / 1000;',
      group_by: { func: 'avg', duration: '5min' },
      show: { in_header: 'raw', legend_value: true },
      yaxis_id: 'power', invert: true, float_precision: 1
    });

    // EMHASS Forecast overlays (conditional)
    if (features.emhass && features.emhass_forecasts && e.mpc_pv) {
      // PV forecast
      series.push({
        entity: e.mpc_pv, name: 'Solar (plan)', color: '#FFF59D',
        type: 'area', opacity: 0.06, curve: 'smooth', extend_to: false,
        unit: ' kW', float_precision: 1, stroke_width: 1, stroke_dash: 5,
        show: { in_header: false, legend_value: false },
        data_generator: "const data = entity.attributes.forecasts;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_pv_power) / 1000]);",
        yaxis_id: 'power', transform: 'return x / 1000;'
      });
      // Battery forecast
      if (e.mpc_battery) {
        series.push({
          entity: e.mpc_battery, name: 'Battery (plan)', color: '#A5D6A7',
          type: 'area', opacity: 0.06, curve: 'stepline', extend_to: false,
          unit: ' kW', stroke_width: 1, stroke_dash: 5,
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.battery_scheduled_power;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_batt_power) / 1000]);",
          yaxis_id: 'power', transform: 'return x / 1000;', float_precision: 0
        });
      }
      // Grid forecast
      if (e.mpc_grid) {
        series.push({
          entity: e.mpc_grid, name: 'Grid (plan)', color: '#EF5350',
          type: 'line', curve: 'stepline', stroke_width: 1, stroke_dash: 5,
          extend_to: false, unit: ' kW',
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.forecasts;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_grid_power) / 1000]);",
          yaxis_id: 'power', transform: 'return x / 1000;', float_precision: 0
        });
      }
      // Load forecast (inverted)
      if (e.mpc_load) {
        series.push({
          entity: e.mpc_load, name: 'Load (plan)', color: '#CE93D8',
          type: 'line', curve: 'smooth', extend_to: false, unit: ' kW',
          float_precision: 1, stroke_width: 1, stroke_dash: 4,
          show: { in_header: false, legend_value: false, in_chart: true },
          data_generator: "const data = entity.attributes.forecasts;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_load_power) / 1000]);",
          yaxis_id: 'power', invert: true, opacity: 0.6, transform: 'return x / 1000;'
        });
      }
      // SOC forecast (secondary axis)
      if (e.mpc_soc) {
        series.push({
          entity: e.mpc_soc, name: 'SOC (plan)', color: '#81C784',
          type: 'line', curve: 'stepline', stroke_width: 1, stroke_dash: 5,
          extend_to: false, unit: ' %',
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.battery_scheduled_soc;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_batt_soc)]);",
          yaxis_id: 'soc', float_precision: 1
        });
      }
      // Actual SOC
      if (e.battery_soc) {
        series.push({
          entity: e.battery_soc, name: 'SOC', color: '#2196F3',
          type: 'area', opacity: 0.2, stroke_width: 2.5,
          extend_to: false, unit: ' %',
          group_by: { func: 'avg', duration: '5min' },
          show: { in_header: true, legend_value: true },
          yaxis_id: 'soc', float_precision: 1
        });
      }
      // Price forecast overlays
      if (e.buy_price) {
        series.push({
          entity: e.buy_price, name: 'Import Price (plan)', color: '#EF9A9A',
          type: 'line', extend_to: false, unit: ' EUR/kWh',
          float_precision: 4, stroke_width: 1, opacity: 0.9,
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.unit_load_cost_forecasts;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_general_price)]);",
          yaxis_id: 'price', curve: 'stepline', stroke_dash: 4
        });
      }
      if (e.sell_price) {
        series.push({
          entity: e.sell_price, name: 'Export Price (plan)', color: '#90CAF9',
          type: 'line', extend_to: false, unit: ' EUR/kWh',
          float_precision: 4, stroke_width: 1, opacity: 0.9,
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.unit_prod_price_forecasts;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_feed_in_price)]);",
          yaxis_id: 'price', curve: 'stepline', stroke_dash: 4
        });
      }
      // Actual prices
      if (e.current_import_price) {
        series.push({
          entity: e.current_import_price, name: 'Import Price', color: '#EF5350',
          type: 'line', opacity: 0.55, stroke_width: 2, extend_to: false,
          unit: ' EUR/kWh', float_precision: 4,
          group_by: { func: 'avg', duration: '1h' },
          show: { in_header: false, legend_value: true },
          yaxis_id: 'price', curve: 'stepline'
        });
      }
      if (e.current_export_price) {
        series.push({
          entity: e.current_export_price, name: 'Export Price', color: '#42A5F5',
          type: 'line', opacity: 0.55, stroke_width: 2, extend_to: false,
          unit: ' EUR/kWh', float_precision: 4,
          group_by: { func: 'avg', duration: '1h' },
          show: { in_header: false, legend_value: true },
          yaxis_id: 'price', curve: 'stepline'
        });
      }
    }

    // Deferrable loads (conditional)
    if (features.emhass && features.deferrable_loads) {
      if (e.mpc_deferrable0) {
        series.push({
          entity: e.mpc_deferrable0, name: (e.deferrable0_label || 'Deferrable 0') + ' (plan)',
          color: '#FF6D00', type: 'area', opacity: 0.05, curve: 'stepline',
          extend_to: false, unit: ' kW', stroke_width: 0.8, stroke_dash: 4,
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.deferrables_schedule;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_deferrable0) / 1000]);",
          yaxis_id: 'power', invert: true, transform: 'return x / 1000;', float_precision: 0
        });
      }
      if (e.mpc_deferrable1) {
        series.push({
          entity: e.mpc_deferrable1, name: (e.deferrable1_label || 'Deferrable 1') + ' (plan)',
          color: '#26A69A', type: 'area', opacity: 0.05, curve: 'stepline',
          extend_to: false, unit: ' kW', stroke_width: 0.8, stroke_dash: 4,
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.deferrables_schedule;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_deferrable1) / 1000]);",
          yaxis_id: 'power', invert: true, transform: 'return x / 1000;', float_precision: 0
        });
      }
      // Actual deferrable power
      if (e.deferrable0_power) {
        series.push({
          entity: e.deferrable0_power, name: e.deferrable0_label || 'Deferrable 0',
          color: '#E65100', type: 'line', stroke_width: 1.5, extend_to: false,
          transform: 'return x / 1000;', unit: ' kW',
          group_by: { func: 'avg', duration: '5min' },
          show: { in_header: false, legend_value: false },
          yaxis_id: 'power', invert: true, opacity: 1, float_precision: 1
        });
      }
    }

    // EMHASS financial header (in chart header)
    if (features.emhass && features.financial_tracking) {
      if (e.emhass_net_cost_today) {
        series.push({
          entity: e.emhass_net_cost_today, name: 'Cost Today', unit: ' EUR',
          show: { legend_value: true, in_chart: false, in_header: true },
          float_precision: 2, yaxis_id: 'power'
        });
      }
      if (e.emhass_savings_today) {
        series.push({
          entity: e.emhass_savings_today, name: 'Savings Today', unit: ' EUR',
          color: '#4CAF50',
          show: { legend_value: true, in_chart: false, in_header: true },
          float_precision: 2, yaxis_id: 'power'
        });
      }
    }

    return series;
  }

  _buildYAxes(features) {
    const yaxis = [
      {
        id: 'power', min: 'auto', max: 'auto', decimals: 1,
        apex_config: {
          title: { text: 'Power (kW)', style: { fontSize: '12px' } },
          forceNiceScale: true, tickAmount: 6
        }
      }
    ];
    if (features.emhass && features.emhass_forecasts) {
      yaxis.push({
        id: 'soc', min: 0, max: 100, decimals: 0, show: false,
        apex_config: {
          title: { text: 'SOC (%)' }, opposite: true
        }
      });
      yaxis.push({
        id: 'price', min: 'auto', max: 'auto', decimals: 2, show: false,
        opposite: true,
        apex_config: {
          title: { text: 'Price (EUR/kWh)', style: { fontSize: '12px' } },
          forceNiceScale: true, tickAmount: 4
        }
      });
    }
    return yaxis;
  }

  async _buildDashboard() {
    if (!this._hass) return;
    const store = window.SigenergyConfig;
    const cfg = store.get();
    const e = cfg.entities || {};
    const f = cfg.features || {};

    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });

      // Build the apex chart with conditional series
      const series = this._buildApexSeries(e, f);
      const yaxis = this._buildYAxes(f);
      const hasForecasts = f.emhass && f.emhass_forecasts;

      const apexChart = {
        type: 'custom:apexcharts-card',
        card_mod: {
          style: 'ha-card { background: var(--ha-card-background, linear-gradient(135deg, rgba(30,33,40,0.95) 0%, rgba(40,44,52,0.98) 100%)) !important; border: 1px solid var(--divider-color, rgba(92,156,230,0.12)) !important; border-radius: var(--ha-card-border-radius, 16px) !important; color: var(--primary-text-color, #fff); }'
        },
        header: {
          show: true, show_states: true, colorize_states: true,
          title: hasForecasts ? 'Energy + EMHASS Forecast' : 'Energy Overview'
        },
        graph_span: hasForecasts ? '48h' : '24h',
        update_interval: '60s',
        apex_config: {
          chart: {
            height: hasForecasts ? '500px' : '350px',
            animations: { enabled: false },
            stacked: false,
            zoom: { enabled: true, type: 'x' },
            toolbar: {
              show: true,
              tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true }
            }
          },
          xaxis: {
            type: 'datetime',
            labels: {
              datetimeFormatter: { minute: 'HH:mm', hour: 'HH:00', day: 'dd MMM' },
              style: { fontSize: '10px' },
              rotateAlways: false, hideOverlappingLabels: true
            },
            tickAmount: hasForecasts ? 24 : 12
          },
          tooltip: { x: { format: 'HH:mm' }, shared: true, intersect: false },
          legend: {
            show: true, position: 'top', horizontalAlign: 'center',
            fontSize: '10px', itemMargin: { horizontal: 4, vertical: 1 },
            labels: { colors: 'rgba(255,255,255,0.7)' }
          },
          stroke: { curve: 'smooth' },
          grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3 },
          annotations: hasForecasts ? { yaxis: [{ y: 0, yAxisIndex: 0, borderColor: 'rgba(255,255,255,0.35)', strokeDashArray: 0 }] } : undefined
        },
        now: hasForecasts ? { show: true, label: 'Now' } : undefined,
        span: hasForecasts ? { start: 'hour', offset: '-6h' } : undefined,
        all_series_config: { stroke_width: 2 },
        yaxis: yaxis,
        series: series
      };

      // Build EMHASS status card (conditional)
      const emhassStatusCard = (f.emhass && e.emhass_mode) ? {
        type: 'conditional',
        conditions: [{ entity: e.emhass_mode, state_not: 'unavailable' }],
        card: {
          type: 'custom:mushroom-template-card',
          entity: e.emhass_mode,
          primary: "{{ states('" + e.emhass_mode + "') }}",
          secondary: e.emhass_reason ? "{{ states('" + e.emhass_reason + "')[:60] }}" : '',
          icon: "{% if states('" + e.emhass_mode + "') == 'CHARGE' %}mdi:battery-charging{% elif states('" + e.emhass_mode + "') == 'DISCHARGE' %}mdi:battery-arrow-down{% else %}mdi:battery-clock{% endif %}",
          icon_color: "{% if states('" + e.emhass_mode + "') == 'CHARGE' %}green{% elif states('" + e.emhass_mode + "') == 'DISCHARGE' %}orange{% else %}grey{% endif %}",
          fill_container: true, multiline_secondary: true,
          card_mod: { style: 'ha-card { background: linear-gradient(135deg, rgba(0,180,120,0.15), rgba(0,120,80,0.08)) !important; border: 1px solid rgba(0,180,120,0.25) !important; border-radius: 12px !important; } mushroom-state-info { --card-primary-font-size: 15px; --card-secondary-font-size: 11px; overflow: visible !important; white-space: normal !important; }' }
        }
      } : null;

      // Build sankey sections based on features
      const sankeyExclude = ['sensor.net_grid_power'];
      const sankeySections = [
        {
          entities: [{ entity_id: e.solar_power || 'sensor.solar_production', name: 'Solar' }],
          color: '#FFA500'
        },
        {
          entities: [{ entity_id: e.grid_active_power || e.grid_power || 'sensor.net_grid_power', name: 'Grid', children: [e.load_power || 'sensor.home_consumption'] }],
          color: '#9E9E9E'
        }
      ];

      // Build status mushroom cards
      const statusCards = [
        {
          type: 'custom:mushroom-template-card',
          entity: e.solar_power || 'sensor.solar_production',
          primary: 'Solar', icon: 'mdi:solar-power', icon_color: 'orange',
          secondary: "{{ states('" + (e.solar_power || 'sensor.solar_production') + "') | round(0) }} W",
          card_mod: { style: 'ha-card { background: rgba(30,35,54,0.94) !important; border: 1px solid #2d3451 !important; border-radius: 12px !important; } mushroom-state-info { --card-primary-font-size: 20px !important; font-weight: bold !important; --card-secondary-font-size: 11px; }' }
        },
        {
          type: 'custom:mushroom-template-card',
          entity: e.load_power || 'sensor.home_consumption',
          primary: 'Home', icon: 'mdi:home-lightning-bolt', icon_color: 'deep-purple',
          secondary: "{{ states('" + (e.load_power || 'sensor.home_consumption') + "') | round(0) }} W",
          card_mod: { style: 'ha-card { background: rgba(30,35,54,0.94) !important; border: 1px solid #2d3451 !important; border-radius: 12px !important; } mushroom-state-info { --card-primary-font-size: 20px !important; font-weight: bold !important; --card-secondary-font-size: 11px; }' }
        },
        {
          type: 'custom:mushroom-template-card',
          entity: e.battery_soc || 'sensor.battery_soc',
          primary: 'Battery', icon: 'mdi:battery', icon_color: 'green',
          secondary: "{{ states('" + (e.battery_soc || 'sensor.battery_soc') + "') | round(0) }}%",
          card_mod: { style: 'ha-card { background: rgba(30,35,54,0.94) !important; border: 1px solid #2d3451 !important; border-radius: 12px !important; } mushroom-state-info { --card-primary-font-size: 20px !important; font-weight: bold !important; --card-secondary-font-size: 11px; }' }
        },
        {
          type: 'custom:mushroom-template-card',
          entity: e.grid_active_power || e.grid_power || 'sensor.net_grid_power',
          primary: 'Grid', icon: 'mdi:transmission-tower', icon_color: 'red',
          secondary: "{{ states('" + (e.grid_active_power || e.grid_power || 'sensor.net_grid_power') + "') | round(0) }} W",
          card_mod: { style: 'ha-card { background: rgba(30,35,54,0.94) !important; border: 1px solid #2d3451 !important; border-radius: 12px !important; } mushroom-state-info { --card-primary-font-size: 20px !important; font-weight: bold !important; --card-secondary-font-size: 11px; }' }
        }
      ];

      // Build stat cards
      const statCards = [];
      const addStat = (entity, name, icon, color) => {
        if (!entity) return;
        statCards.push({
          type: 'custom:mushroom-template-card',
          entity: entity,
          primary: name, icon: icon, icon_color: color,
          secondary: "{{ states('" + entity + "') | round(1) }} kWh",
          card_mod: { style: 'ha-card { background: rgba(30,35,54,0.94) !important; border: 1px solid #2d3451 !important; border-radius: 12px !important; } mushroom-state-info { --card-primary-font-size: 20px !important; font-weight: bold !important; --card-secondary-font-size: 11px; }' }
        });
      };
      addStat(e.solar_energy_today, 'Solar', 'mdi:solar-power', 'orange');
      addStat(e.load_energy_today, 'Load', 'mdi:power-plug', 'purple');
      addStat(e.battery_charge_today, 'Charged', 'mdi:battery-arrow-up', 'green');
      addStat(e.battery_discharge_today, 'Discharged', 'mdi:battery-arrow-down', 'teal');
      addStat(e.grid_import_today, 'Imported', 'mdi:transmission-tower-import', 'red');
      addStat(e.grid_export_today, 'Exported', 'mdi:transmission-tower-export', 'blue');

      // Build self-sufficiency card
      const selfSuffCard = (e.solar_energy_today && e.load_energy_today) ? {
        type: 'custom:mushroom-template-card',
        entity: e.solar_energy_today,
        primary: 'Self-Sufficiency',
        secondary: "{% set solar = states('" + e.solar_energy_today + "') | float(0) %}{% set load = states('" + e.load_energy_today + "') | float(1) %}{{ ((solar / load) * 100) | round(1) if load > 0 else 0 }}%",
        icon: 'mdi:check-decagram', icon_color: 'green',
        card_mod: { style: 'ha-card { background: rgba(30,35,54,0.94) !important; border: 1px solid #2d3451 !important; border-radius: 12px !important; }' }
      } : null;

      // Build Solcast forecast card (conditional)
      const solcastCard = (f.solar_forecast && (e.solcast_today || e.forecast_solar_today)) ? {
        type: 'custom:mushroom-chips-card',
        alignment: 'center',
        chips: [
          ...(e.solcast_today ? [{ type: 'entity', entity: e.solcast_today, icon: 'mdi:weather-sunny', name: 'Today' }] : []),
          ...(e.solcast_tomorrow ? [{ type: 'entity', entity: e.solcast_tomorrow, icon: 'mdi:weather-sunny-alert', name: 'Tomorrow' }] : []),
          ...(e.solcast_remaining ? [{ type: 'entity', entity: e.solcast_remaining, icon: 'mdi:timelapse', name: 'Remaining' }] : []),
          ...(e.forecast_solar_today ? [{ type: 'entity', entity: e.forecast_solar_today, icon: 'mdi:solar-power-variant', name: 'FS Today' }] : [])
        ],
        card_mod: { style: 'ha-card { background: transparent !important; box-shadow: none !important; }' }
      } : null;

      // Now find the overview view and replace its cards
      const overviewView = config.views.find(v => v.path === 'overview');
      if (!overviewView) throw new Error('Overview view not found');

      // Get the layout card
      const mainLayout = overviewView.cards[0];
      if (!mainLayout || mainLayout.type !== 'custom:layout-card') throw new Error('Layout card not found');

      // Ensure responsive grid proportions — give battery card enough room
      if (mainLayout.layout && mainLayout.layout.mediaquery) {
        mainLayout.layout.mediaquery['(min-width: 1201px)'] = {
          'grid-template-columns': 'minmax(0, 4fr) minmax(0, 3.5fr) minmax(420px, 4.5fr)',
          'grid-template-rows': 'auto auto auto'
        };
      }

      // Build new cards array
      const newCards = [];

      // Card 0: House + optional EMHASS status
      // Get existing house card or create default, sync entities from store, and add min-height
      const houseCardOrig = mainLayout.cards[0]?.cards?.[0] || { type: 'custom:sigenergy-house-card' };
      houseCardOrig.entities = {
        solar_power: e.solar_power || '',
        load_power: e.load_power || '',
        battery_power: e.battery_power || '',
        battery_soc: e.battery_soc || '',
        grid_import: e.grid_power || '',
        grid_export: e.grid_power || '',
        grid_active: e.grid_power || '',
        grid_power: e.grid_power || '',
        sun: 'sun.sun',
        ev_charger_power: e.ev_charger_power || '',
        ev_charger_state: e.ev_charger_state || '',
        weather: e.weather || '',
        heat_pump_power: e.deferrable0_power || ''
      };
      // Sync ALL features from config store to house card
      if (!houseCardOrig.features) houseCardOrig.features = {};
      houseCardOrig.features.ev_charger = f.ev_charger || false;
      houseCardOrig.features.ev_vehicle = f.ev_vehicle || false;
      houseCardOrig.features.heat_pump = f.heat_pump || false;
      houseCardOrig.features.grid = f.grid_connection !== false;
      houseCardOrig.features.hide_cables = f.hide_cables || false;
      if (!houseCardOrig.card_mod) houseCardOrig.card_mod = {};
      houseCardOrig.card_mod.style = 'ha-card { overflow: hidden !important; }\n.house-container { width: 100% !important; overflow: hidden !important; }\n.house-container img { width: 100% !important; height: auto !important; }\n.house-container svg { width: 100% !important; height: auto !important; }';
      const houseStack = [houseCardOrig];
      if (emhassStatusCard) houseStack.push(emhassStatusCard);
      if (solcastCard) houseStack.push(solcastCard);
      newCards.push({ type: 'vertical-stack', cards: houseStack });

      // Card 1: Sankey (rebuild from store entities)
      const sankeyTitle = mainLayout.cards[1]?.cards?.[0] || {
        type: 'custom:mushroom-template-card',
        primary: 'Energy Flow Today', icon: 'mdi:chart-sankey-variant', icon_color: 'teal',
        card_mod: { style: { 'ha-tile-info$': '.primary { font-size: 20px !important; font-weight: bold !important; color: white !important; letter-spacing: 0.5px; }', '.': 'ha-card { background-color: transparent !important; border: none !important; }' } }
      };
      const sankeyOld = mainLayout.cards[1]?.cards?.[1] || {};
      const sankeyChart = {
        type: 'custom:sankey-chart',
        show_names: true, show_states: true, show_units: true, show_icons: false,
        round: 2, height: 480, wide: true,
        min_box_size: 50, min_box_distance: 8, unit_prefix: 'k',
        energy_date_selection: false,
        sections: [
          {
            entities: [
              { entity_id: e.battery_discharge_today, name: 'Battery', color: '#00d4b8', children: [e.grid_export_today, e.load_energy_today].filter(Boolean) },
              { entity_id: e.solar_energy_today, name: 'Solar', color: '#c8b84a', children: [e.battery_charge_today, e.grid_export_today, e.load_energy_today].filter(Boolean) },
              { entity_id: e.grid_import_today, name: 'Grid', color: '#6b7fd4', children: [e.load_energy_today].filter(Boolean) }
            ].filter(x => x.entity_id)
          },
          {
            entities: [
              { entity_id: e.load_energy_today, name: 'Load', color: '#e8337f' },
              { entity_id: e.battery_charge_today, name: 'Battery', color: '#00d4b8' },
              { entity_id: e.grid_export_today, name: 'Grid', color: '#7c5cbf' }
            ].filter(x => x.entity_id)
          }
        ],
        card_mod: sankeyOld.card_mod || {}
      };
      // Fix sankey CSS: narrower solid boxes, remove section width constraint
      if (sankeyChart.card_mod?.style?.['sankey-chart-base$']) {
        let css = sankeyChart.card_mod.style['sankey-chart-base$'];
        css = css.replace(/min-width:\s*140px\s*!important/g, 'min-width: 90px !important');
        css = css.replace(/min-width:\s*70px\s*!important/g, 'min-width: 90px !important');
        // Remove the entire .section:first-of-type block (may contain broken CSS or max-width:75%)
        css = css.replace(/\.section:first-of-type\s*\{[^}]*\}/g, '');
        css = css.replace(/min-width:\s*80px\s*!important/g, 'min-width: 65px !important');
        css = css.replace(/min-width:\s*55px\s*!important/g, 'min-width: 65px !important');
        // Remove any old destination/source section constraints
        css = css.replace(/\/\* Constrain destination[^*]*\*\/\n?/g, '');
        css = css.replace(/\/\* Balance source\/destination[^*]*\*\/\n?/g, '');
        css = css.replace(/\/\* Force section widths[^*]*\*\/\n?/g, '');
        css = css.replace(/\/\* Fill container[^*]*\*\/\n?/g, '');
        css = css.replace(/\/\* Sankey full-width[^*]*\*\/\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\{\s*max-width:\s*\d+%\s*!important;\s*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\.box\s*>\s*div:first-child\s*\{\s*max-width:\s*\d+px\s*!important;\s*\}\n?/g, '');
        css = css.replace(/\.section:first-of-type\s*\{[^}]*width[^}]*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\{[^}]*width[^}]*flex[^}]*\}\n?/g, '');
        css = css.replace(/\.section\s*\{\s*flex:[^}]*\}\n?/g, '');
        css = css.replace(/\.container\s*\{\s*position:[^}]*\}\n?/g, '');
        css = css.replace(/\.connectors\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.connectors\s*svg\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\.box\s*>\s*div:first-child\s*\{\s*width:\s*100%\s*!important;\s*\}\n?/g, '');
        // Sankey layout fix: compact dest section, connectors aligned with bar edges
        css = css.replace(/\/\* Sankey layout fix[^*]*\*\/\n?/g, '');
        css = css.replace(/\.section:first-of-type\s*\{[^}]*flex[^}]*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\{[^}]*flex[^}]*\}\n?/g, '');
        if (!css.includes('Sankey layout fix')) {
          css += '\n/* Sankey layout fix */\n';
          css += '.section:first-of-type { flex: 1 1 auto !important; max-width: none !important; }\n';
          css += '.section:last-of-type { flex: 0 0 auto !important; width: auto !important; max-width: none !important; position: relative !important; z-index: 2 !important; }\n';
          css += '.section:last-of-type .box { flex-direction: row-reverse !important; }\n';
          css += '.connectors { left: 90px !important; width: calc(100% - 88px) !important; overflow: visible !important; z-index: 1 !important; }\n';
          css += '.connectors svg { width: 100% !important; left: 0 !important; overflow: visible !important; }\n';
          css += '@media (max-width: 800px) { .connectors { left: 65px !important; width: calc(100% - 63px) !important; } }\n';
        }
        sankeyChart.card_mod.style['sankey-chart-base$'] = css;
      }
      newCards.push({ type: 'vertical-stack', cards: [sankeyTitle, sankeyChart] });

      // Card 2: Battery device card (keep existing)
      newCards.push(mainLayout.cards[2] || { type: 'vertical-stack', cards: [{ type: 'custom:sigenergy-device-card', battery_packs: f.battery_packs || 2 }] });

      // Card 3: Status mushrooms
      newCards.push({
        type: 'custom:layout-card',
        layout_type: 'custom:grid-layout',
        layout: { 'grid-template-columns': '1fr 1fr', 'grid-gap': '4px' },
        cards: statusCards
      });

      // Card 4: Energy stat mushrooms
      newCards.push({
        type: 'custom:layout-card',
        layout_type: 'custom:grid-layout',
        layout: { 'grid-template-columns': '1fr 1fr 1fr', 'grid-gap': '4px' },
        cards: statCards
      });

      // Card 5: Apex chart + self-sufficiency
      const chartStack = [apexChart];
      if (selfSuffCard) chartStack.push(selfSuffCard);
      newCards.push({ type: 'vertical-stack', cards: chartStack });

      // Preserve persistent config on the layout card
      const existingConfig = mainLayout._sigenergy_config;
      mainLayout.cards = newCards;
      if (existingConfig) mainLayout._sigenergy_config = existingConfig;

      await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config });

      return true;
    } catch (err) {
      console.error('Dashboard build failed:', err);
      return false;
    }
  }

  _renderDisplay(el, cfg) {
    const d = cfg.display || {};
    el.innerHTML = `
      <div class="section">
        <div class="section-title">Theme</div>
        <div class="price-grid">
          <div class="price-btn ${d.theme==='dark'?'active':''}" data-theme="dark">🌙 Dark</div>
          <div class="price-btn ${d.theme==='light'?'active':''}" data-theme="light">☀️ Light</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Formatting</div>
        <div class="row">
          <span class="row-label">Decimal Places</span>
          <select class="row-input" data-key="decimal_places">
            <option value="0" ${d.decimal_places===0?'selected':''}>0</option>
            <option value="1" ${d.decimal_places===1?'selected':''}>1</option>
            <option value="2" ${d.decimal_places===2?'selected':''}>2</option>
          </select>
        </div>
        <div class="row">
          <span class="row-label">Auto-scale Threshold</span>
          <input class="row-input" type="number" step="100" value="${d.power_threshold||1000}" data-key="power_threshold" />
          <span class="row-state">Below: W · Above: kW</span>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Charts</div>
        <div class="row">
          <span class="row-label">Default Range</span>
          <select class="row-input" data-key="chart_range">
            <option value="today" ${d.chart_range==='today'?'selected':''}>Today</option>
            <option value="24h" ${d.chart_range==='24h'?'selected':''}>Last 24h</option>
            <option value="7d" ${d.chart_range==='7d'?'selected':''}>Last 7 Days</option>
          </select>
        </div>
      </div>
      <button class="save-btn" id="save-btn">💾 Save All Settings</button>
      <button class="save-btn" id="apply-btn" style="margin-top:8px;background:#3F51B5;">🔄 Apply Settings to Dashboard</button>
      <div id="apply-status" style="text-align:center;margin-top:8px;font-size:12px;color:#8892a4;display:none;"></div>
      <div style="margin-top:12px;padding:12px;background:rgba(63,81,181,0.1);border:1px solid rgba(63,81,181,0.3);border-radius:8px;">
        <div style="font-size:12px;font-weight:600;color:#7986CB;margin-bottom:4px;">ℹ️ How "Apply Settings to Dashboard" works</div>
        <div style="font-size:11px;color:#8892a4;line-height:1.5;">
          This rebuilds the Overview cards using your current entity and feature settings:
          <br>• <b>EMHASS Forecasts</b>: Adds MPC forecast overlays (PV/Battery/Grid/Load/SOC/Prices) to the main chart
          <br>• <b>Deferrable Loads</b>: Shows heat pump/boiler schedule forecasts on the chart
          <br>• <b>Financial Tracking</b>: Adds cost/savings in chart header
          <br>• <b>Solar Forecast</b>: Shows Solcast/forecast.solar chips
          <br>• <b>EV / Heat Pump</b>: Conditional display based on enabled features
          <br>All entity IDs from Settings → Entities tab are used.
        </div>
      </div>
    `;

    // Theme buttons
    el.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.display.theme = btn.dataset.theme;
        this._storeSave(cfg2);
        this._render();
      });
    });

    // Input/select changes
    el.querySelectorAll('.row-input').forEach(input => {
      input.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const key = input.dataset.key;
        const val = input.type === 'number' || input.tagName === 'SELECT'
          ? parseInt(input.value) : input.value;
        cfg2.display[key] = val;
        this._storeSave(cfg2);
      });
    });

    // Apply to Dashboard button
    const applyBtn = el.querySelector('#apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        const statusEl = el.querySelector('#apply-status');
        statusEl.style.display = 'block';
        statusEl.textContent = '⏳ Rebuilding dashboard...';
        statusEl.style.color = '#FFA500';
        applyBtn.disabled = true;
        applyBtn.style.opacity = '0.5';
        try {
          const ok = await this._buildDashboard();
          if (ok) {
            statusEl.textContent = '✅ Dashboard rebuilt! Refresh the page to see changes.';
            statusEl.style.color = '#2ecc71';
            applyBtn.textContent = '✅ Applied!';
            applyBtn.style.background = '#2ecc71';
          } else {
            statusEl.textContent = '❌ Failed to rebuild dashboard. Check console.';
            statusEl.style.color = '#e74c3c';
          }
        } catch (err) {
          statusEl.textContent = '❌ Error: ' + err.message;
          statusEl.style.color = '#e74c3c';
        }
        applyBtn.disabled = false;
        applyBtn.style.opacity = '1';
        setTimeout(() => {
          applyBtn.textContent = '🔄 Apply Settings to Dashboard';
          applyBtn.style.background = '#3F51B5';
        }, 3000);
      });
    }

    // Save button
    el.querySelector('#save-btn').addEventListener('click', () => {
      // Force a full save + notify
      const cfg2 = this._storeGet();
      this._storeSave(cfg2);
      // Flash confirmation
      const btn = el.querySelector('#save-btn');
      btn.textContent = '✅ Saved!';
      btn.style.background = '#2ecc71';
      setTimeout(() => {
        btn.textContent = '💾 Save All Settings';
        btn.style.background = '#00d4b8';
      }, 2000);
    });
  }
}

if (!customElements.get('sigenergy-settings-card')) customElements.define('sigenergy-settings-card', SigenergySettingsCard);

// ═══════════════════════════════════════════════════════════
// Device Card — Battery Stack Visualization
// ═══════════════════════════════════════════════════════════

class SigenergyDeviceCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._expanded = {};  // track expanded state per device
    this._cardWidth = 999;
    this._ro = null;
  }

  connectedCallback() {
    if (!this._ro) {
      this._ro = new ResizeObserver(entries => {
        var w = entries[0]?.contentRect?.width || 999;
        if ((w < 380) !== (this._cardWidth < 380)) {
          this._cardWidth = w;
          this._render();
        } else {
          this._cardWidth = w;
        }
      });
      this._ro.observe(this);
    }
  }

  disconnectedCallback() {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) { this._config = config; }
  static getConfigElement() { return document.createElement('div'); }
  static getStubConfig() { return {}; }
  getCardSize() { return 8; }

  _getVal(entityId) {
    if (!this._hass || !entityId) return null;
    const s = this._hass.states[entityId];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;
    return parseFloat(s.state);
  }

  _fmtPower(w) {
    if (w === null) return '— W';
    const abs = Math.abs(w);
    return abs >= 1000 ? (abs / 1000).toFixed(2) + ' kW' : abs.toFixed(0) + ' W';
  }

  _socColor(soc) {
    if (soc === null) return '#8892a4';
    const store = window.SigenergyConfig;
    const highThreshold = store ? (store.getDisplay('soc_ring_high') ?? 60) : 60;
    const lowThreshold = store ? (store.getDisplay('soc_ring_low') ?? 40) : 40;
    if (soc >= highThreshold) return '#2ecc71';
    if (soc >= lowThreshold) return '#e67e22';
    return '#e74c3c';
  }

  _socRingColor(soc) {
    if (soc === null) return '#8892a4';
    const store = window.SigenergyConfig;
    const highThreshold = store ? (store.getDisplay('soc_ring_high') ?? 60) : 60;
    const lowThreshold = store ? (store.getDisplay('soc_ring_low') ?? 40) : 40;
    if (soc >= highThreshold) return '#2ecc71';
    if (soc >= lowThreshold) return '#e67e22';
    return '#e74c3c';
  }

  _socIcon(soc) {
    if (soc === null) return '🔋';
    if (soc > 80) return '🟢';
    if (soc > 50) return '🟢';
    if (soc > 20) return '🟠';
    return '🔴';
  }


  _render() {
    if (!this._hass) return;
    const store = window.SigenergyConfig;
    const packs = store ? store.getFeature('battery_packs') : (this._config.battery_packs || 2);
    const battSocEntity = store ? store.getEntity('battery_soc') : 'sensor.deyeinvertermaster_battery_soc';
    const invPowerEntity = this._config.inverter_power || (store ? store.getEntity('inverter_output_power') : null) || 'sensor.deyeinvertermaster_inverter_output_power';
    const invPower = this._getVal(invPowerEntity);
    const battSocFallback = this._getVal(battSocEntity);
    const packSocs = [];
    for (let p = 1; p <= packs; p++) {
      const packEntity = store ? store.getEntity('battery_pack' + p + '_soc') : null;
      const val = packEntity ? this._getVal(packEntity) : null;
      packSocs.push(val !== null ? val : battSocFallback);
    }
    const invFmt = this._fmtPower(invPower);

    /* ── Compact layout for narrow cards ── */
    if (this._cardWidth < 380) {
      var np = Math.max(1, Math.min(packs, 6));
      var imgSrc = _SIGENERGY_SCRIPT_DIR + 'images/1inverter' + np + 'battery.png';
      var html = '<style>:host{display:block}.card{background:#1a1f2e;border-radius:16px;padding:12px;overflow:hidden;text-align:center}.img{max-width:100%;height:auto;margin:0 auto 12px;display:block}.labels{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.pill{background:rgba(30,35,54,0.94);border:1px solid;border-radius:14px;padding:8px 14px;display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer}.pill-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}.pill-name{font-size:15px;font-weight:600;color:#e0e4ec;white-space:nowrap}.pill-val{font-size:16px;font-weight:700;color:#fff;white-space:nowrap}</style>';
      html += '<div class="card">';
      html += '<img class="img" src="' + imgSrc + '" alt="Battery System"/>';
      html += '<div class="labels">';
      html += '<div class="pill" style="border-color:rgba(46,204,113,0.35)"><span class="pill-dot" style="background:#2ecc71"></span><span class="pill-name">Inverter</span><span class="pill-val">' + invFmt + '</span></div>';
      for (var i = 1; i <= np; i++) {
        var soc = packSocs[i-1];
        var col = this._socColor(soc);
        var socTxt = soc !== null ? soc.toFixed(1) + '%' : '?';
        html += '<div class="pill" style="border-color:' + col + '35"><span class="pill-dot" style="background:' + col + '"></span><span class="pill-name">Batt ' + i + '</span><span class="pill-val">' + socTxt + '</span></div>';
      }
      html += '</div></div>';
      this.shadowRoot.innerHTML = html;
      return;
    }

    /* ── Layout constants (viewBox user-units) ── */
    var P = 4, PW = 150, PH = 58, PR = 16, CR = 28, CL = 8, G = 3;
    var IW = 300;  // image width in SVG units
    // Image pixel heights: 1=552, 2=750, 3=963, 4=1170, 5=1398, 6=1602 (all 795px wide)
    var imgHs = [342, 552, 750, 963, 1170, 1398, 1602];
    var np = Math.max(1, Math.min(packs, 6));
    var imgH = imgHs[np];
    var IH = IW * imgH / 795;
    var colW = P + PW + G + CR * 2 + G + CL;
    var IX = colW;
    var TW = colW + IW + CL + G + CR * 2 + G + PW + P;
    var TY = 5;
    var TH = IH + TY * 2;
    var imgSrc = _SIGENERGY_SCRIPT_DIR + 'images/1inverter' + np + 'battery.png';
    // Stack face edges (from image analysis: visible content at 13%-87%)
    var sLeft = IX + IW * 0.13;
    var sRight = IX + IW * 0.87;

    /* ── SVG body ── */
    var b = '';
    var self = this;
    // Product image
    b += '<image href="' + imgSrc + '" x="' + IX + '" y="' + TY + '" width="' + IW + '" height="' + IH + '"/>';

    /* ── Row: connector dot + line + chevron + label pill ── */
    var drawRow = function(cy, label, val, col, side, deviceKey) {
      var s = '';
      var isExp = self._expanded[deviceKey];
      var chevChar = isExp ? '\u2039' : '\u203A';
      if (side === 'left') {
        s += '<circle cx="' + sLeft + '" cy="' + cy + '" r="3" fill="' + col + '"/>';
        var le = IX - CL;
        s += '<line x1="' + sLeft + '" y1="' + cy + '" x2="' + (le + CR) + '" y2="' + cy + '" stroke="' + col + '" stroke-width="1.5" opacity="0.7"/>';
        var ccx = le - G - CR;
        s += '<g class="chevron" data-device="' + deviceKey + '" style="cursor:pointer">';
        s += '<circle cx="' + ccx + '" cy="' + cy + '" r="' + CR + '" fill="' + (isExp ? '#3a5e58' : '#2a2e38') + '" stroke="' + (isExp ? col : '#4a4e58') + '" stroke-width="1"/>';
        s += '<text x="' + ccx + '" y="' + (cy + 6) + '" text-anchor="middle" font-size="22" font-weight="700" fill="' + (isExp ? '#fff' : '#8892a4') + '">' + chevChar + '</text>';
        s += '</g>';
        var px = P, py = cy - PH / 2;
        s += '<rect x="' + px + '" y="' + py + '" width="' + PW + '" height="' + PH + '" rx="' + PR + '" fill="rgba(30,35,54,0.94)" stroke="' + col + '" stroke-opacity="0.35" stroke-width="1"/>';
        s += '<text x="' + (px + PW / 2) + '" y="' + (py + 22) + '" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="#e0e4ec">' + label + '</text>';
        s += '<circle cx="' + (px + 16) + '" cy="' + (py + 42) + '" r="5" fill="' + col + '"/>';
        s += '<text x="' + (px + 26) + '" y="' + (py + 47) + '" font-family="sans-serif" font-size="16" font-weight="700" fill="#fff">' + val + '</text>';
      } else {
        s += '<circle cx="' + sRight + '" cy="' + cy + '" r="3" fill="' + col + '"/>';
        var re = IX + IW + CL;
        s += '<line x1="' + sRight + '" y1="' + cy + '" x2="' + (re - CR) + '" y2="' + cy + '" stroke="' + col + '" stroke-width="1.5" opacity="0.7"/>';
        var ccx = re + G + CR;
        s += '<g class="chevron" data-device="' + deviceKey + '" style="cursor:pointer">';
        s += '<circle cx="' + ccx + '" cy="' + cy + '" r="' + CR + '" fill="' + (isExp ? '#3a5e58' : '#2a2e38') + '" stroke="' + (isExp ? col : '#4a4e58') + '" stroke-width="1"/>';
        s += '<text x="' + ccx + '" y="' + (cy + 6) + '" text-anchor="middle" font-size="22" font-weight="700" fill="' + (isExp ? '#fff' : '#8892a4') + '">' + chevChar + '</text>';
        s += '</g>';
        var px = TW - P - PW, py = cy - PH / 2;
        s += '<rect x="' + px + '" y="' + py + '" width="' + PW + '" height="' + PH + '" rx="' + PR + '" fill="rgba(30,35,54,0.94)" stroke="' + col + '" stroke-opacity="0.35" stroke-width="1"/>';
        s += '<text x="' + (px + PW / 2) + '" y="' + (py + 22) + '" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="#e0e4ec">' + label + '</text>';
        s += '<circle cx="' + (px + 16) + '" cy="' + (py + 42) + '" r="5" fill="' + col + '"/>';
        s += '<text x="' + (px + 26) + '" y="' + (py + 47) + '" font-family="sans-serif" font-size="16" font-weight="700" fill="#fff">' + val + '</text>';
      }
      return s;
    };

    // Proportional Y-positions: inverter takes imgHs[0] of total imgH
    var invImgH = imgHs[0];  // inverter-only pixel height
    var battModH = (imgH - invImgH) / np;  // each battery module pixel height
    var invFrac = invImgH / imgH;  // fraction of image for inverter
    var battFrac = battModH / imgH;  // fraction per battery module

    // Inverter row (left side) — centered in inverter portion
    var icy = TY + IH * (invFrac / 2);
    b += drawRow(icy, 'Inverter', invFmt, '#2ecc71', 'left', 'inverter');

    // Battery rows (alternate right/left) — centered in each module
    for (var i = 1; i <= np; i++) {
      var mcy = TY + IH * (invFrac + (i - 0.5) * battFrac);
      var packSoc = packSocs[i - 1];
      var soc = packSoc !== null ? packSoc.toFixed(1) : '?';
      var col = this._socColor(packSoc);
      var side = i % 2 === 1 ? 'right' : 'left';
      b += drawRow(mcy, 'Battery(' + i + ')', soc + '%', col, side, 'battery' + i);
    }

    /* ── Expansion panels ── */
    var panels = '';
    var panelStyle = 'background:rgba(30,35,54,0.96);border:1px solid #2d3451;border-radius:12px;padding:12px 16px;margin:8px 4px;';
    var statStyle = 'display:inline-block;text-align:center;padding:6px 10px;min-width:70px;';
    var statVal = 'font-size:16px;font-weight:700;color:#fff;display:block;';
    var statLbl = 'font-size:9px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;';
    var headerStyle = 'font-size:13px;font-weight:700;color:#e0e4ec;margin-bottom:8px;letter-spacing:1px;';

    var fmtEntity = function(eid, decimals, unit) {
      if (!self._hass || !eid) return '—';
      var s = self._hass.states[eid];
      if (!s || s.state === 'unavailable' || s.state === 'unknown') return '—';
      var v = parseFloat(s.state);
      if (isNaN(v)) return s.state;
      return v.toFixed(decimals !== undefined ? decimals : 1) + (unit || '');
    };

    if (this._expanded['inverter']) {
      // FIX(bug4): Read entity IDs from config store instead of hardcoding Deye names
      var invTemp = store ? store.getEntity('inverter_temp') : 'sensor.deyeinvertermaster_temperature_dc_transformer';
      var invIntTemp = store ? store.getEntity('inverter_internal_temp') : '';
      var invOutput = store ? store.getEntity('inverter_output_power') : 'sensor.deyeinvertermaster_inverter_output_power';
      var invRated = store ? store.getEntity('inverter_rated_power') : 'sensor.deyeinvertermaster_inverter_rated_power';
      var pvOne = store ? store.getEntity('pv1_power') : 'sensor.deyeinvertermaster_pv1_power';
      var pvTwo = store ? store.getEntity('pv2_power') : 'sensor.deyeinvertermaster_pv2_power';
      var gridV = store ? store.getEntity('grid_voltage') : 'sensor.deyeinvertermaster_grid_voltage_l1';
      var gridHz = store ? store.getEntity('grid_frequency') : 'sensor.deyeinvertermaster_grid_frequency';
      panels += '<div style="' + panelStyle + '">';
      panels += '<div style="' + headerStyle + '">⚡ Inverter Details</div>';
      panels += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(invTemp || invIntTemp, 1, '°C') + '</span><span style="' + statLbl + '">Temperature</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(invOutput, 0, 'W') + '</span><span style="' + statLbl + '">Output</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + (invRated && fmtEntity(invRated, 0, '') !== '—' ? (parseFloat(self._hass.states[invRated]?.state || 0) / 1000).toFixed(1) + 'kW' : '—') + '</span><span style="' + statLbl + '">Rated</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(pvOne, 0, 'W') + '</span><span style="' + statLbl + '">PV1</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(pvTwo, 0, 'W') + '</span><span style="' + statLbl + '">PV2</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridV, 1, 'V') + '</span><span style="' + statLbl + '">Grid V</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridHz, 1, 'Hz') + '</span><span style="' + statLbl + '">Grid Hz</span></div>';
      panels += '</div></div>';
    }

    for (var p = 1; p <= np; p++) {
      if (!this._expanded['battery' + p]) continue;
      var pad = p < 10 ? '0' + p : '' + p;
      var prefix = 'sensor.battery_monitor_pack_' + pad + '_view_';
      panels += '<div style="' + panelStyle + '">';
      panels += '<div style="' + headerStyle + '">🔋 Battery ' + p + ' Details</div>';
      panels += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'soc', 1, '%') + '</span><span style="' + statLbl + '">SoC</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'soh', 1, '%') + '</span><span style="' + statLbl + '">SoH</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'voltage', 1, 'V') + '</span><span style="' + statLbl + '">Voltage</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'current', 1, 'A') + '</span><span style="' + statLbl + '">Current</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'power', 0, 'W') + '</span><span style="' + statLbl + '">Power</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'cycle_number', 0, '') + '</span><span style="' + statLbl + '">Cycles</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'remain_capacity', 1, 'Ah') + '</span><span style="' + statLbl + '">Remain</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'full_capacity', 1, 'Ah') + '</span><span style="' + statLbl + '">Full Cap</span></div>';
      // Cell voltage spread (values are in mV, convert to V)
      var cellPrefix = 'sensor.battery_monitor_pack_' + pad + '_cell_voltage_';
      var fmtCellV = function(eid) {
        if (!self._hass || !eid) return '—';
        var s = self._hass.states[eid];
        if (!s || s.state === 'unavailable' || s.state === 'unknown') return '—';
        var v = parseFloat(s.state);
        if (isNaN(v)) return s.state;
        return (v / 1000).toFixed(3) + 'V';
      };
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtCellV(cellPrefix + 'min') + '</span><span style="' + statLbl + '">Cell Min</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtCellV(cellPrefix + 'max') + '</span><span style="' + statLbl + '">Cell Max</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(cellPrefix + 'diff', 0, 'mV') + '</span><span style="' + statLbl + '">Cell Diff</span></div>';
      // Temperature
      var temp1 = fmtEntity('sensor.battery_monitor_pack_' + pad + '_temperature_01', 1, '°C');
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + temp1 + '</span><span style="' + statLbl + '">Temp</span></div>';
      panels += '</div></div>';
    }

    this.shadowRoot.innerHTML =
      '<style>:host{display:block}.card{background:#1a1f2e;border-radius:16px;padding:12px 4px;overflow:hidden} .chevron{cursor:pointer;pointer-events:all;-webkit-tap-highlight-color:transparent;touch-action:manipulation} .chevron *{pointer-events:all} .chevron:hover circle,.chevron:active circle{fill:#3a3e48}</style>' +
      '<div class="card">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + TW + ' ' + TH + '" width="100%" style="display:block">' +
      b + '</svg>' + panels + '</div>';

    // Wire up click handlers for chevron buttons
    var svg = this.shadowRoot.querySelector('svg');
    if (svg) {
      var chevrons = svg.querySelectorAll('.chevron');
      for (var c = 0; c < chevrons.length; c++) {
        var handler = (function(el) {
          return function(e) {
            e.preventDefault();
            e.stopPropagation();
            var device = el.getAttribute('data-device');
            if (device) {
              self._expanded[device] = !self._expanded[device];
              self._render();
            }
          };
        })(chevrons[c]);
        chevrons[c].addEventListener('click', handler);
        chevrons[c].addEventListener('touchend', handler);
        chevrons[c].style.pointerEvents = 'all';
      }
    }
  }
}

if (!customElements.get('sigenergy-device-card')) customElements.define('sigenergy-device-card', SigenergyDeviceCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'sigenergy-settings-card',
  name: 'Sigenergy Settings',
  description: 'Dashboard configuration: entities, features, pricing, display preferences',
  preview: true,
  documentationURL: 'https://github.com/sigenergy-dashboard',
});
window.customCards.push({
  type: 'sigenergy-device-card',
  name: 'Sigenergy Device Card',
  description: 'Battery stack visualization with inverter and battery modules',
  preview: true,
});

console.info(
  '%c SIGENERGY-DASHBOARD %c v0.7.0 ',
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);

// ═══════════════════════════════════════════════════════════
// Responsive Grid Fix: inject CSS into grid-layout shadow DOM
// Mobile-first: default 1fr, JS adds desktop/tablet spans
// No setTimeout — injects immediately via MutationObserver
// ═══════════════════════════════════════════════════════════
(function() {
  var RESPONSIVE_CSS = [
    '/* Mobile: 1 column, all items stacked */',
    '@media (max-width: 800px) {',
    '  #root { grid-template-columns: 1fr !important; grid-template-rows: repeat(10, auto) !important; }',
    '  #root > * { grid-column: 1 !important; grid-row: auto !important; max-width: 100% !important; }',
    '}',
    '',
    '/* Tablet: 2 columns with explicit placement */',
    '@media (min-width: 801px) and (max-width: 1200px) {',
    '  #root { grid-template-columns: 1fr 1fr !important; grid-template-rows: repeat(6, auto) !important; }',
    '  #root > *:nth-child(1) { grid-column: 1 !important; grid-row: 1 !important; }',
    '  #root > *:nth-child(2) { grid-column: 2 !important; grid-row: 1 !important; }',
    '  #root > *:nth-child(3) { grid-column: 1 !important; grid-row: 2 !important; }',
    '  #root > *:nth-child(4) { grid-column: 1 !important; grid-row: 3 !important; }',
    '  #root > *:nth-child(5) { grid-column: 2 !important; grid-row: 2 / span 2 !important; }',
    '  #root > *:nth-child(6) { grid-column: 1 / -1 !important; grid-row: 4 !important; }',
    '}',
    '',
    '/* Desktop: 3 columns, add spans for stats and apex */',
    '@media (min-width: 1201px) {',
    '  #root > *:nth-child(5) { grid-column: span 2 !important; }',
    '  #root > *:nth-child(6) { grid-column: 1 / -1 !important; }',
    '}'
  ].join('\n');

  function injectResponsiveCSS() {
    function findDeep(root, tag) {
      var found = [];
      if (root.querySelectorAll) {
        found = Array.prototype.slice.call(root.querySelectorAll(tag));
        Array.prototype.slice.call(root.querySelectorAll('*')).forEach(function(el) {
          if (el.shadowRoot) found = found.concat(findDeep(el.shadowRoot, tag));
        });
      }
      return found;
    }

    var gridLayouts = findDeep(document, 'grid-layout');
    gridLayouts.forEach(function(gl) {
      if (gl.shadowRoot) {
        var existing = gl.shadowRoot.querySelector('#sigenergy-responsive-fix');
        if (existing) {
          existing.textContent = RESPONSIVE_CSS;
        } else {
          var style = document.createElement('style');
          style.id = 'sigenergy-responsive-fix';
          style.textContent = RESPONSIVE_CSS;
          gl.shadowRoot.appendChild(style);
        }
      }
    });
  }

  // Inject immediately on script load
  injectResponsiveCSS();

  // MutationObserver: re-inject on every DOM change (SPA navigation)
  var observer = new MutationObserver(function() {
    injectResponsiveCSS();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

// ═══════════════════════════════════════════════════════════
// Auto-provide hass to config store when HA main element loads
// This ensures persistence works even with cached old modules
// ═══════════════════════════════════════════════════════════
(function() {
  function provideHass() {
    var ha = document.querySelector('home-assistant');
    if (ha && ha.hass && window.SigenergyConfig) {
      var store = window.SigenergyConfig;
      if (typeof store.setHass === 'function') {
        store.setHass(ha.hass);
      } else {
        // Fallback: add HA persistence if method is missing (ES module cache)
        store._hass = ha.hass;
        if (!store._saveToHA) {
          store._saveToHA = async function(config) {
            if (!this._hass) return;
            try {
              var dc = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
              var v = dc && dc.views && dc.views.find(function(x) { return x.path === 'overview'; });
              if (v && v.cards && v.cards[0]) {
                v.cards[0]._sigenergy_config = config;
                await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config: dc });
              }
            } catch(e) { console.warn('SigConfig: HA save failed', e); }
          };
          // Patch _save to also write to HA
          var origSave = store._save;
          store._save = function(config) {
            this._config = config;
            try { localStorage.setItem('sigenergy-dashboard-config', JSON.stringify({ ...config, _version: 1, _saved: new Date().toISOString() })); } catch(e) {}
            this._saveToHA(config);
          };
          // Load from HA on first run
          (async function() {
            try {
              var dc = await store._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
              var v = dc && dc.views && dc.views.find(function(x) { return x.path === 'overview'; });
              var stored = v && v.cards && v.cards[0] && v.cards[0]._sigenergy_config;
              if (stored) {
                var merged = store._merge(store.get(), stored);
                store._config = merged;
                try { localStorage.setItem('sigenergy-dashboard-config', JSON.stringify({ ...merged, _version: 1, _saved: new Date().toISOString() })); } catch(e) {}
                store._notify();
              }
            } catch(e) {}
          })();
        }
      }
    }
  }
  // Try immediately and then observe for HA loading
  setTimeout(provideHass, 2000);
  setTimeout(provideHass, 5000);
  var hassObserver = new MutationObserver(function() { provideHass(); });
  hassObserver.observe(document.body, { childList: true, subtree: true });

  // === Sankey destination bar height auto-fix ===
  // Adjusts destination bars so they match the gradient flow height exactly,
  // preventing bars from extending beyond where the flows end.
  (function fixSankeyDestBars() {
    var sankeyObserver = null;
    var lastBaseSr = null;
    var patching = false;

    function findSankeyBase() {
      try {
        var ha = document.querySelector('home-assistant');
        if (!ha || !ha.shadowRoot) return null;
        var main = ha.shadowRoot.querySelector('home-assistant-main');
        if (!main || !main.shadowRoot) return null;
        var panel = main.shadowRoot.querySelector('ha-panel-lovelace');
        if (!panel || !panel.shadowRoot) return null;
        var huiRoot = panel.shadowRoot.querySelector('hui-root');
        if (!huiRoot || !huiRoot.shadowRoot) return null;
        var view = huiRoot.shadowRoot.querySelector('hui-view');
        if (!view) return null;
        var panelView = view.querySelector('hui-panel-view');
        if (!panelView || !panelView.shadowRoot) return null;
        var huiCard = panelView.shadowRoot.querySelector('hui-card');
        if (!huiCard) return null;
        var lc = huiCard.querySelector('layout-card');
        if (!lc || !lc.shadowRoot) return null;
        var gl = lc.shadowRoot.querySelector('grid-layout');
        if (!gl || !gl.shadowRoot) return null;
        var root = gl.shadowRoot.querySelector('#root');
        if (!root) return null;
        var stacks = root.querySelectorAll('hui-vertical-stack-card');
        for (var i = 0; i < stacks.length; i++) {
          var sr = stacks[i].shadowRoot;
          if (!sr) continue;
          var cards = sr.querySelectorAll('hui-card');
          for (var j = 0; j < cards.length; j++) {
            var sankey = cards[j].querySelector('sankey-chart');
            if (sankey && sankey.shadowRoot) {
              var base = sankey.shadowRoot.querySelector('sankey-chart-base');
              if (base && base.shadowRoot) return base;
            }
          }
        }
        return null;
      } catch(e) { return null; }
    }

    function patchDestBars(baseSr) {
      if (patching) return;
      patching = true;
      try {
        var sections = baseSr.querySelectorAll('.section');
        if (sections.length < 2) return;
        var lastSec = sections[sections.length - 1];
        var conns = baseSr.querySelectorAll('.connectors');
        if (!conns.length) return;

        // Parse SVG paths to find flow extents on destination side (x=100)
        var maxY = 0, minY = Infinity;
        for (var c = 0; c < conns.length; c++) {
          var svg = conns[c].querySelector('svg');
          if (!svg) continue;
          var paths = svg.querySelectorAll('path');
          for (var p = 0; p < paths.length; p++) {
            var d = paths[p].getAttribute('d');
            if (!d) continue;
            var matches = d.match(/100,(\d+\.?\d*)/g);
            if (!matches) continue;
            for (var m = 0; m < matches.length; m++) {
              var y = parseFloat(matches[m].split(',')[1]);
              if (y > maxY) maxY = y;
              if (y < minY) minY = y;
            }
          }
        }
        if (maxY <= 0 || minY >= maxY) return;

        // Map SVG coords to pixel coords
        var svg0 = conns[0].querySelector('svg');
        var vb = svg0 ? svg0.getAttribute('viewBox') : '';
        var parts = vb ? vb.split(/\s+/) : [];
        var svgH = parseFloat(parts[3]) || 480;
        var secH = lastSec.offsetHeight;
        var scale = secH / svgH;
        var flowTopPx = Math.round(minY * scale);
        var flowBottomPx = Math.round(maxY * scale);
        var flowHeightPx = flowBottomPx - flowTopPx;

        // Adjust destination boxes
        var boxes = lastSec.querySelectorAll(':scope > .box');
        if (boxes.length === 1) {
          var box = boxes[0];
          var div = box.querySelector(':scope > div:first-child');
          // Only adjust height — the sankey chart already positions the box top correctly
          box.style.height = flowHeightPx + 'px';
          box.style.marginTop = '';
          if (div) div.style.height = flowHeightPx + 'px';
        } else if (boxes.length > 1) {
          // Multiple destinations: adjust last box bottom to match flow bottom
          var lastBox = boxes[boxes.length - 1];
          var lastBoxRect = lastBox.getBoundingClientRect();
          var secRect = lastSec.getBoundingClientRect();
          var boxBottomInSec = lastBoxRect.bottom - secRect.top;
          var overshoot = boxBottomInSec - flowBottomPx;
          if (overshoot > 2) {
            var newH = Math.max(10, lastBox.offsetHeight - Math.round(overshoot));
            lastBox.style.height = newH + 'px';
            var div = lastBox.querySelector(':scope > div:first-child');
            if (div) div.style.height = newH + 'px';
          }
        }
      } finally {
        patching = false;
      }
    }

    function trySetup() {
      try {
        var base = findSankeyBase();
        if (!base || !base.shadowRoot) return;
        var baseSr = base.shadowRoot;

        // Patch immediately
        patchDestBars(baseSr);

        // If we already observe this exact shadowRoot, skip
        if (lastBaseSr === baseSr) return;
        lastBaseSr = baseSr;

        // Disconnect old observer if any
        if (sankeyObserver) sankeyObserver.disconnect();

        // Observe for future re-renders (debounced to avoid feedback loops)
        var debounceTimer = null;
        sankeyObserver = new MutationObserver(function() {
          if (patching) return;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(function() {
            patchDestBars(baseSr);
          }, 100);
        });
        sankeyObserver.observe(baseSr, { childList: true, subtree: true });
      } catch(e) {}
    }

    // Periodic check: find sankey, set up observer, re-patch if DOM changed
    setInterval(trySetup, 3000);
    // Also try quickly after page load
    setTimeout(trySetup, 1000);
    setTimeout(trySetup, 2000);
  })();
})();
