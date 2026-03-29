/**
 * Genergy Dashboard v2.8.0 — Bundled Distribution
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
const _SIGENERGY_SCRIPT_URL = import.meta.url;
// JS may be served from /js/ endpoint but images live under /frontend/
const _SIGENERGY_SCRIPT_DIR = new URL('.', _SIGENERGY_SCRIPT_URL).pathname.replace('/js/', '/frontend/');

// House card auto-load is deferred until after SigConfigStore is initialised (see below)

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
  grid_import_high_tariff: '',
  grid_import_low_tariff: '',
  grid_export_high_tariff: '',
  grid_export_low_tariff: '',
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
  battery_pack5_soc: '',
  battery_pack6_soc: '',
  battery_pack7_soc: '',
  battery_pack8_soc: '',
  inverter_temp: 'sensor.deyeinvertermaster_temperature_dc_transformer',
  battery_temp: 'sensor.deyeinvertermaster_battery_temperature',
  grid_voltage: 'sensor.deyeinvertermaster_grid_voltage_l1',
  grid_voltage_l2: '',
  grid_voltage_l3: '',
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
  pv3_power: '',
  pv4_power: '',
  pv5_power: '',
  pv6_power: '',
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
  solcast_forecast_power: '',
  forecast_solar_today: '',
  // Battery capacity & SoC limits (for runtime estimate)
  battery_capacity: '',
  battery_max_soc: '',
  battery_min_soc: '',
  battery_reserved_soc: '',
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
  // HAEO (Home Assistant Energy Optimizer) entities
  haeo_battery_charge: '',
  haeo_battery_discharge: '',
  haeo_battery_soc: '',
  haeo_grid_power: '',
  haeo_solar_power: '',
  haeo_load_power: '',
  haeo_optim_status: '',
  haeo_optim_cost: '',
  haeo_optim_duration: '',
  // EV / Heat Pump daily energy (for Sankey)
  ev_energy_today: '',
  heat_pump_energy_today: '',
  // Utility meter entities (auto-created for cumulative sensors)
  ev_energy_daily_meter: '',
  hp_energy_daily_meter: '',
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
    ems_provider: 'emhass',
    haeo_forecasts: true,
    financial_tracking: true,
    solar_forecast: false,
    weather_widget: true,
    sunrise_sunset: false,
    three_phase: false,
    dual_tariff: false,
    show_ev_in_sankey: false,
    show_hp_in_sankey: false,
    ev_energy_is_cumulative: false,
    hp_energy_is_cumulative: false,
    battery_positive_charging: true,
    battery_runtime: true,
    pv_strings: 2,
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
          // Only overwrite if HA config is newer than localStorage config
          const localTs = this._config?._ts || 0;
          const haTs = cfg._ts || 0;
          if (haTs >= localTs) {
            this._config = cfg;
            // Also update localStorage cache
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cfg, _version: 1, _saved: new Date().toISOString() })); } catch(e) {}
            this._notify();
          }
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
    // Stamp config with a timestamp for conflict resolution
    config._ts = Date.now();
    this._config = config;
    // Write to localStorage (fast cache)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...config, _version: 1, _saved: new Date().toISOString(),
      }));
    } catch (e) { /* ignore */ }
    // Write to HA dashboard config (permanent storage) — awaited to prevent stale reads on refresh
    this._saveToHAPromise = this._saveToHA(config);
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
    // Backward compat: migrate old boolean emhass flag to ems_provider
    if (result.features && result.features.ems_provider === undefined) {
      result.features.ems_provider = result.features.emhass !== false ? 'emhass' : 'none';
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

// Auto-load house card from same directory (after ConfigStore is available)
if (!customElements.get('sigenergy-house-card')) {
  const _hcUrl = new URL('sigenergy-house-card.js', _SIGENERGY_SCRIPT_URL);
  // Forward cache-buster from parent module URL (set by __init__.py)
  const _parentV = new URL(_SIGENERGY_SCRIPT_URL).searchParams.get('v');
  if (_parentV) _hcUrl.searchParams.set('v', _parentV);
  import(_hcUrl.href).catch(() => {});
}

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
    const firstHass = !this._hass;
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
    // First hass → full render. Subsequent hass updates → only update state badges inline.
    // This prevents full DOM teardown/rebuild on every HA state push, which was
    // destroying event listeners mid-click and causing sluggish/missed toggles.
    if (firstHass) {
      this._render();
    } else {
      this._updateStateBadges();
    }
  }

  _updateStateBadges() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.row-state[data-entity]').forEach(badge => {
      const entityId = badge.dataset.entity;
      const state = this._getState(entityId);
      if (badge.textContent !== state) {
        badge.textContent = state;
        badge.className = 'row-state' + (state.startsWith('❌') ? ' err' : '');
      }
    });
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
    // Round numeric values to reasonable precision for the settings view
    const raw = s.state;
    const num = parseFloat(raw);
    if (!isNaN(num) && isFinite(num) && String(num) === raw.trim()) {
      let decimals;
      if (u === 'V' || u === 'W' || u === 'VA') decimals = 1;
      else if (u === 'kW' || u === 'kWh' || u === 'MWh') decimals = 2;
      else if (u === '%') decimals = 0;
      else if (u === '°C' || u === '°F') decimals = 1;
      else decimals = Math.abs(num) >= 100 ? 1 : 2;
      return `${num.toFixed(decimals)}${u ? ' ' + u : ''}`;
    }
    return `${raw}${u ? ' ' + u : ''}`;
  }

  _storeGet() { return window.SigenergyConfig.get(); }

  _storeSave(data) {
    const store = window.SigenergyConfig;
    if (typeof store.save === 'function') { store.save(data); }
    else { store._save(data); store._notify(); }
  }

  /**
   * Check if an entity is cumulative (total_increasing with large state),
   * and if so, create a daily utility_meter helper via HA config flow API.
   * Returns { isCumulative, dailyEntity } where dailyEntity is the utility meter entity_id.
   */
  async _ensureDailyMeter(sourceEntityId, meterName) {
    if (!this._hass || !sourceEntityId) return { isCumulative: false, dailyEntity: sourceEntityId };

    const stateObj = this._hass.states[sourceEntityId];
    if (!stateObj) return { isCumulative: false, dailyEntity: sourceEntityId };

    const stateClass = stateObj.attributes?.state_class;
    const stateVal = parseFloat(stateObj.state);
    const unit = stateObj.attributes?.unit_of_measurement;
    const entityLower = sourceEntityId.toLowerCase();

    // Skip entities that are already daily-resetting (name contains daily/today/day)
    const looksDaily = entityLower.includes('daily') || entityLower.includes('_today') || entityLower.includes('summary_day');
    if (looksDaily) return { isCumulative: false, dailyEntity: sourceEntityId };

    // Act on cumulative energy sensors: state_class 'total_increasing' or 'total'
    // with energy unit (kWh/MWh/Wh) and a cumulative value > 50 kWh (or equivalent)
    const isEnergyUnit = unit === 'kWh' || unit === 'MWh' || unit === 'Wh';
    const valInKwh = unit === 'MWh' ? stateVal * 1000 : unit === 'Wh' ? stateVal / 1000 : stateVal;
    const isCumulative = (stateClass === 'total_increasing' || stateClass === 'total') && isEnergyUnit && valInKwh > 50;

    if (!isCumulative) return { isCumulative: false, dailyEntity: sourceEntityId };

    // Check if a daily utility meter already exists for this source
    const expectedPrefix = 'sensor.genergy_' + meterName + '_daily';
    const existingMeter = Object.keys(this._hass.states).find(k => k.startsWith(expectedPrefix) || k === expectedPrefix);
    if (existingMeter) {
      return { isCumulative: true, dailyEntity: existingMeter };
    }

    // Create utility_meter via config_entries flow (HA helper, using REST API)
    try {
      const friendlyName = 'Genergy ' + meterName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Daily';

      // Step 1: Start the config flow for utility_meter
      const flowResult = await this._hass.callApi('POST', 'config/config_entries/flow', {
        handler: 'utility_meter',
        show_advanced_options: false
      });

      if (flowResult && flowResult.flow_id) {
        // Step 2: Submit the form with utility meter config
        const createResult = await this._hass.callApi('POST', 'config/config_entries/flow/' + flowResult.flow_id, {
          name: friendlyName,
          source: sourceEntityId,
          cycle: 'daily',
          offset: 0,
          net_consumption: false,
          tariffs: [],
          always_available: true,
          periodically_resetting: false,
        });

        if (createResult && createResult.type === 'create_entry') {
          console.log('Created utility meter:', friendlyName, 'from', sourceEntityId);
          // Wait a moment for HA to register the new entity
          await new Promise(r => setTimeout(r, 3000));
          // Find the newly created entity
          const newMeter = Object.keys(this._hass.states).find(k =>
            k.includes('genergy_' + meterName) && k.includes('daily')
          );
          return { isCumulative: true, dailyEntity: newMeter || expectedPrefix };
        }
      }
    } catch (err) {
      console.warn('Failed to create utility meter for', sourceEntityId, err);
    }

    // Fallback: return the source entity with cumulative flag
    return { isCumulative: true, dailyEntity: sourceEntityId };
  }

  /**
   * Check which required HACS frontend cards are missing.
   * Returns an array of { name, tag, hacs, purpose } objects for missing cards.
   */
  _checkPrerequisites() {
    const REQUIRED_CARDS = [
      { name: 'Layout Card', tag: 'layout-card', hacs: 'layout-card', repo: 'thomasloven/lovelace-layout-card', hacsId: '156434866', owner: 'thomasloven', repository: 'lovelace-layout-card', purpose: 'Responsive grid layout' },
      { name: 'ApexCharts Card', tag: 'apexcharts-card', hacs: 'apexcharts-card', repo: 'RomRider/apexcharts-card', hacsId: '331701152', owner: 'RomRider', repository: 'apexcharts-card', purpose: 'Energy time-series charts' },
      { name: 'Sankey Chart Card', tag: 'sankey-chart', hacs: 'ha-sankey-chart', repo: 'MindFreeze/ha-sankey-chart', hacsId: '455846088', owner: 'MindFreeze', repository: 'ha-sankey-chart', purpose: 'Energy flow diagram' },
      { name: 'Mushroom Cards', tag: 'mushroom-template-card', hacs: 'mushroom', repo: 'piitaya/lovelace-mushroom', hacsId: '444350375', owner: 'piitaya', repository: 'lovelace-mushroom', purpose: 'Status pills and cards' },
      { name: 'Card Mod', tag: 'mod-card', hacs: 'lovelace-card-mod', repo: 'thomasloven/lovelace-card-mod', hacsId: '190927524', owner: 'thomasloven', repository: 'lovelace-card-mod', purpose: 'CSS styling injection' },
    ];
    const missing = [];
    for (const card of REQUIRED_CARDS) {
      if (!customElements.get(card.tag)) {
        missing.push(card);
      }
    }
    return missing;
  }

  _render() {
    const cfg = this._storeGet();
    const tab = this._activeTab;

    // Check prerequisites on first render
    const missingCards = this._checkPrerequisites();
    const prereqDismissed = localStorage.getItem('genergy_prereq_dismissed') === 'true';
    const showPrereqBanner = missingCards.length > 0 && !prereqDismissed;

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
        .row-label { min-width: 110px; max-width: 130px; font-size: 12px; color: var(--secondary-text-color, #8892a4); white-space: nowrap; }
        .row-input {
          flex: 1; min-width: 0; background: var(--card-background-color, #1a1f2e);
          border: 1px solid var(--divider-color, #2d3451);
          border-radius: 6px; padding: 6px 10px;
          color: var(--primary-text-color, #fff);
          font-size: 11px; font-family: 'SF Mono', 'Fira Code', monospace;
          text-overflow: ellipsis;
        }
        .row-input:focus { outline: none; border-color: #00d4b8; }
        .row-state {
          min-width: 80px; text-align: right; font-size: 11px;
          font-weight: 600; color: #00d4b8; white-space: nowrap;
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
        .entity-input-wrap { position: relative; flex: 1; min-width: 0; }
        .entity-dropdown {
          position: absolute; left: 0; right: 0; top: 100%;
          background: var(--card-background-color, #1a1f2e);
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 4px; max-height: 200px; overflow-y: auto;
          z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: none;
        }
        .entity-dropdown.open { display: block; }
        .entity-dropdown-item {
          padding: 6px 8px; cursor: pointer; font-size: 12px;
          border-bottom: 1px solid var(--divider-color, #2d3451);
        }
        .entity-dropdown-item:hover { background: var(--primary-color, #03a9f4); color: #fff; }
        .entity-dropdown-item .entity-name { font-weight: 500; }
        .entity-dropdown-item .entity-state { opacity: 0.6; font-size: 11px; margin-left: 6px; }
        .section-detect-btn {
          background: none; border: 1px solid rgba(0,212,184,0.3); border-radius: 4px;
          color: #00d4b8; cursor: pointer; font-size: 11px; padding: 2px 6px;
          margin-left: 8px; transition: all 0.2s;
        }
        .section-detect-btn:hover { background: rgba(0,212,184,0.15); border-color: #00d4b8; }
        .candidate-picker {
          margin-top: 4px; padding: 6px; background: rgba(0,212,184,0.05);
          border: 1px solid rgba(0,212,184,0.2); border-radius: 6px; font-size: 11px;
        }
        .candidate-picker .cp-header { color: #00d4b8; font-weight: 600; margin-bottom: 4px; }
        .candidate-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 4px 6px; margin: 2px 0; cursor: pointer; border-radius: 4px;
          background: rgba(255,255,255,0.03); border: 1px solid transparent;
          transition: all 0.15s;
        }
        .candidate-item:hover { border-color: #00d4b8; background: rgba(0,212,184,0.1); cursor: pointer; }
        .candidate-item.cand-disabled { opacity: 0.5; cursor: help; }
        .candidate-item .ci-id { font-family: monospace; font-size: 10px; }
        .candidate-item .ci-fn { font-family: sans-serif; color: #8892a4; font-style: italic; }
        .candidate-item .ci-val { font-size: 10px; color: #8892a4; }
        .candidate-item .ci-badge {
          font-size: 9px; padding: 1px 4px; border-radius: 3px;
          background: rgba(230,126,34,0.2); color: #e67e22;
        }
        @media (max-width: 500px) {
          .row { flex-wrap: wrap; }
          .row-label { min-width: 100%; margin-bottom: 4px; }
          .row-state { min-width: 100%; text-align: left; margin-top: 4px; }
        }
        .prereq-banner {
          background: rgba(231,76,60,0.12);
          border: 1px solid rgba(231,76,60,0.4);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 14px;
        }
        .prereq-banner h3 {
          margin: 0 0 8px; font-size: 14px; font-weight: 700;
          color: #e74c3c; display: flex; align-items: center; gap: 6px;
        }
        .prereq-banner p {
          margin: 0 0 10px; font-size: 12px; color: var(--secondary-text-color, #8892a4);
        }
        .prereq-list { list-style: none; padding: 0; margin: 0 0 10px; }
        .prereq-list li {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 8px; margin-bottom: 4px;
          background: rgba(45,52,81,0.4); border-radius: 6px;
          font-size: 12px;
        }
        .prereq-list .card-name { font-weight: 600; color: #e74c3c; min-width: 130px; }
        .prereq-list .card-purpose { flex: 1; color: var(--secondary-text-color, #8892a4); }
        .prereq-list .card-link {
          color: #00d4b8; text-decoration: none; font-weight: 600; font-size: 11px;
          padding: 3px 8px; border: 1px solid rgba(0,212,184,0.4);
          border-radius: 4px; white-space: nowrap;
        }
        .prereq-list .card-link:hover { background: rgba(0,212,184,0.15); }
        .prereq-dismiss {
          background: none; border: 1px solid rgba(231,76,60,0.4);
          color: var(--secondary-text-color, #8892a4); font-size: 11px;
          padding: 4px 10px; border-radius: 4px; cursor: pointer;
        }
        .prereq-dismiss:hover { background: rgba(231,76,60,0.1); }
        .prereq-refresh {
          background: none; border: 1px solid rgba(0,212,184,0.4);
          color: #00d4b8; font-size: 11px;
          padding: 4px 10px; border-radius: 4px; cursor: pointer; margin-left: 6px;
        }
        .prereq-refresh:hover { background: rgba(0,212,184,0.1); }
      </style>

      <div class="card">
        <h2>⚙️ Genergy Settings</h2>
        ${showPrereqBanner ? `
        <div class="prereq-banner">
          <h3>⚠️ Missing Required Cards</h3>
          <p>The following HACS frontend plugins are required for the dashboard to work properly. Install them, then hard-refresh your browser (Ctrl+Shift+R).</p>
          <ul class="prereq-list">
            ${missingCards.map(c => `
              <li>
                <span class="card-name">${c.name}</span>
                <span class="card-purpose">${c.purpose}</span>
                <a class="card-link" href="https://my.home-assistant.io/redirect/hacs_repository/?owner=${c.owner}&repository=${c.repository}" target="_blank" rel="noopener">Install via HACS</a>
              </li>
            `).join('')}
          </ul>
          <p style="font-size:11px;color:var(--secondary-text-color,#8892a4);margin:0 0 10px;">
            Or open <a href="/hacs/integrations" target="_top" style="color:#00d4b8">HACS</a> and search for: ${missingCards.map(c => '<b>' + c.hacs + '</b>').join(', ')}
          </p>
          <button class="prereq-dismiss" id="prereq-dismiss">Dismiss</button>
          <button class="prereq-refresh" id="prereq-recheck">Re-check</button>
        </div>
        ` : ''}
        <div class="tabs">
          <button class="tab ${tab===0?'active':''}" data-tab="0">⚡ Entities</button>
          <button class="tab ${tab===1?'active':''}" data-tab="1">🔧 Features</button>
          <button class="tab ${tab===2?'active':''}" data-tab="2">💰 Pricing</button>
          <button class="tab ${tab===3?'active':''}" data-tab="3">🎨 Display</button>
        </div>
        <div id="content"></div>
        <div id="action-bar" style="margin-top:16px;padding-top:14px;border-top:2px solid rgba(0,212,184,0.3);">
          <div style="background:rgba(255,165,0,0.1);border:1px solid rgba(255,165,0,0.4);border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">⚠️</span>
            <div>
              <div style="font-size:12px;font-weight:700;color:#FFA500;">Don't forget to Apply!</div>
              <div style="font-size:11px;color:#8892a4;line-height:1.4;">After changing entities or features, click <b>Apply Settings to Dashboard</b> below to rebuild the dashboard with your new settings. Changes are saved automatically, but the dashboard only updates when you Apply.</div>
            </div>
          </div>
          <button class="save-btn" id="global-save-btn">💾 Save All Settings</button>
          <button class="save-btn" id="global-apply-btn" style="margin-top:8px;background:#3F51B5;">🔄 Apply Settings to Dashboard</button>
          <div id="global-apply-status" style="text-align:center;margin-top:8px;font-size:12px;color:#8892a4;display:none;"></div>
        </div>
      </div>
    `;

    // Tab clicks
    this.shadowRoot.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._activeTab = parseInt(btn.dataset.tab);
        this._render();
      });
    });

    // Prerequisite banner buttons
    const dismissBtn = this.shadowRoot.getElementById('prereq-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        localStorage.setItem('genergy_prereq_dismissed', 'true');
        this._render();
      });
    }
    const recheckBtn = this.shadowRoot.getElementById('prereq-recheck');
    if (recheckBtn) {
      recheckBtn.addEventListener('click', () => {
        localStorage.removeItem('genergy_prereq_dismissed');
        this._render();
      });
    }

    const content = this.shadowRoot.getElementById('content');
    if (tab === 0) this._renderEntities(content, cfg);
    else if (tab === 1) this._renderFeatures(content, cfg);
    else if (tab === 2) this._renderPricing(content, cfg);
    else if (tab === 3) this._renderDisplay(content, cfg);

    // Global Save button
    const globalSaveBtn = this.shadowRoot.getElementById('global-save-btn');
    if (globalSaveBtn) {
      globalSaveBtn.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        this._storeSave(cfg2);
        globalSaveBtn.textContent = '✅ Saved!';
        globalSaveBtn.style.background = '#2ecc71';
        setTimeout(() => {
          globalSaveBtn.textContent = '💾 Save All Settings';
          globalSaveBtn.style.background = '#00d4b8';
        }, 2000);
      });
    }

    // Global Apply to Dashboard button
    const globalApplyBtn = this.shadowRoot.getElementById('global-apply-btn');
    if (globalApplyBtn) {
      globalApplyBtn.addEventListener('click', async () => {
        const statusEl = this.shadowRoot.getElementById('global-apply-status');
        statusEl.style.display = 'block';
        statusEl.textContent = '⏳ Rebuilding dashboard...';
        statusEl.style.color = '#FFA500';
        globalApplyBtn.disabled = true;
        globalApplyBtn.style.opacity = '0.5';
        try {
          const ok = await this._buildDashboard();
          if (ok) {
            statusEl.textContent = '✅ Dashboard rebuilt! Refresh the page to see changes.';
            statusEl.style.color = '#2ecc71';
            globalApplyBtn.textContent = '✅ Applied!';
            globalApplyBtn.style.background = '#2ecc71';
          } else {
            statusEl.textContent = '❌ Failed to rebuild dashboard. Check console.';
            statusEl.style.color = '#e74c3c';
          }
        } catch (err) {
          statusEl.textContent = '❌ Error: ' + err.message;
          statusEl.style.color = '#e74c3c';
        }
        globalApplyBtn.disabled = false;
        globalApplyBtn.style.opacity = '1';
        setTimeout(() => {
          globalApplyBtn.textContent = '🔄 Apply Settings to Dashboard';
          globalApplyBtn.style.background = '#3F51B5';
        }, 3000);
      });
    }
  }

  _entityRow(label, key, entities) {
    const id = entities[key] || '';
    const state = this._getState(id);
    const isErr = state.startsWith('❌');
    const candidates = this._candidates && this._candidates[key] ? this._candidates[key] : [];
    const candidateHTML = candidates.length > 1 || (candidates.length > 0 && !id) ? `
      <div class="candidate-picker" data-cand-key="${key}">
        <div class="cp-header">Choose entity:</div>
        ${candidates.map(c => `<div class="candidate-item${c.disabled ? ' cand-disabled' : ''}" data-cand-id="${this._esc(c.id)}"><span class="ci-id">${this._esc(c.id)}${c.friendly_name ? ' <span class="ci-fn">(' + this._esc(c.friendly_name) + ')</span>' : ''}</span><span class="ci-val">= ${this._esc(String(c.value))}</span>${c.disabled ? '<span class="ci-badge">disabled</span>' : ''}</div>`).join('')}
      </div>` : '';
    return `
      <div class="row">
        <span class="row-label">${label}</span>
        <div class="entity-input-wrap">
          <input class="row-input entity-ac-input" value="${this._esc(id)}" placeholder="sensor.entity_id" data-key="${key}" autocomplete="off" />
          <div class="entity-dropdown" data-dropdown-for="${key}"></div>
          ${candidateHTML}
        </div>
        <span class="row-state ${isErr?'err':''}" data-entity="${this._esc(id)}">${state}</span>
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
    return { ev_charger: 'ev_charger', ev_vehicle: 'ev_vehicle', heat_pump: 'heat_pump', grid_connection: 'grid', hide_cables: 'hide_cables', emhass: 'emhass', solar_forecast: 'solar_forecast', emhass_forecasts: 'emhass_forecasts', deferrable_loads: 'deferrable_loads', financial_tracking: 'financial_tracking', battery_runtime: 'battery_runtime', ems_provider: 'ems_provider', haeo_forecasts: 'haeo_forecasts' };
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

  async _syncEntityToDashboard(entityKey, entityId, previousEntityId) {
    if (!this._hass) return;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      // Use the previous stored value for find-and-replace, falling back to default
      const oldId = previousEntityId || DEFAULT_ENTITIES[entityKey];
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
    const emsProvider = cfg.features?.ems_provider || (cfg.features?.emhass !== false ? 'emhass' : 'none');
    const emhassOn = emsProvider === 'emhass';
    const haeoOn = emsProvider === 'haeo';
    el.innerHTML = `
      <div style="margin-bottom:16px;padding:12px;background:rgba(0,212,184,0.08);border:1px solid rgba(0,212,184,0.25);border-radius:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:13px;font-weight:600;color:#00d4b8;">🔍 Auto-Detect from HA Energy Dashboard</div>
            <div style="font-size:11px;color:#8892a4;margin-top:2px;">Automatically detect energy sources, solar forecasts (Solcast/forecast.solar), EV chargers, and heat pumps from your HA configuration</div>
            <div style="font-size:10px;color:#e67e22;margin-top:3px;">⚠️ This will overwrite any manually configured entities. Use the per-section 🔍 buttons below to detect only specific sections.</div>
          </div>
          <button class="auto-detect-btn" data-key="auto_detect_energy" style="flex-shrink:0;margin-left:12px;padding:8px 16px;background:#00d4b8;color:#1a1f2e;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">Detect All</button>
        </div>
        <div class="auto-detect-status" style="margin-top:6px;font-size:11px;color:#8892a4;display:none;"></div>
      </div>
      <div class="section">
        <div class="section-title" style="display:flex;align-items:center;">☀️ Core Power <button class="section-detect-btn" data-section="core_power" title="Auto-detect core power entities">🔍</button></div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Real-time power sensors in <b>W</b> or <b>kW</b>. Auto-detected by the Detect button above.</div>
        ${this._entityRow('Solar Power', 'solar_power', e)}
        ${this._entityRow('Home Load', 'load_power', e)}
        ${this._entityRow('Battery Power', 'battery_power', e)}
        ${this._entityRow('Battery SoC', 'battery_soc', e)}
        ${this._entityRow('Battery Capacity', 'battery_capacity', e)}
        <div style="font-size:10px;color:#666;padding:0 0 4px 4px;">Rated capacity sensor (<b>kWh</b>, <b>Wh</b>, or <b>Ah</b>). Used for runtime estimation. Leave blank if you set manual capacity on Features tab.</div>
        ${this._entityRow('Max SoC Entity', 'battery_max_soc', e)}
        ${this._entityRow('Min SoC Entity', 'battery_min_soc', e)}
        ${this._entityRow('Reserved SoC Entity', 'battery_reserved_soc', e)}
        <div style="font-size:10px;color:#666;padding:0 0 4px 4px;">SoC limit entities (typically <b>number.*</b> domain). Max = charge cutoff, Min = discharge cutoff, Reserved = backup reserve for outages. Auto-detected or set manually on the Features → Battery section.</div>
        ${this._entityRow('Grid Power', 'grid_power', e)}
      </div>
      <div class="section">
        <div class="section-title" style="display:flex;align-items:center;">📊 Daily Energy <button class="section-detect-btn" data-section="daily_energy" title="Auto-detect daily energy entities">🔍</button></div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Daily energy counters in <b>kWh</b>. Found in <i>HA → Settings → Devices → [Your Inverter]</i>.</div>
        ${this._entityRow('Solar Energy Today', 'solar_energy_today', e)}
        ${this._entityRow('Load Energy Today', 'load_energy_today', e)}
        ${this._entityRow('Battery Charge Today', 'battery_charge_today', e)}
        ${this._entityRow('Battery Discharge Today', 'battery_discharge_today', e)}
      </div>
      <div class="section" style="border:1px solid ${cfg.features?.dual_tariff ? '#6b7fd4' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${cfg.features?.dual_tariff ? '12' : '0'}px;">
          <div>
            <div style="font-size:14px;font-weight:700;color:${cfg.features?.dual_tariff ? '#6b7fd4' : '#8892a4'};">⚡ Grid Energy Metering</div>
            <div style="font-size:11px;color:#8892a4;margin-top:2px;">Toggle dual tariff if your smart meter reports separate high/low tariff readings</div>
          </div>
          <div class="switch ${cfg.features?.dual_tariff ? 'on' : 'off'}" data-key="dual_tariff_toggle" style="flex-shrink:0;margin-left:12px;"></div>
        </div>
        ${cfg.features?.dual_tariff ? `
          <div style="border-top:1px solid rgba(107,127,212,0.2);padding-top:10px;">
            <div class="toggle-desc" style="margin-bottom:8px;color:#8892a4;font-size:11px;">Your smart meter provides separate high and low tariff counters. The dashboard will automatically sum them for daily totals.</div>
            <div class="section-title" style="font-size:11px;">Import (Grid → Home)</div>
            ${this._entityRow('Import High Tariff', 'grid_import_high_tariff', e)}
            ${this._entityRow('Import Low Tariff', 'grid_import_low_tariff', e)}
            <div class="section-title" style="font-size:11px;margin-top:8px;">Export (Home → Grid)</div>
            ${this._entityRow('Export High Tariff', 'grid_export_high_tariff', e)}
            ${this._entityRow('Export Low Tariff', 'grid_export_low_tariff', e)}
          </div>
        ` : `
          <div style="border-top:1px solid rgba(45,52,81,0.5);padding-top:10px;">
            <div class="toggle-desc" style="margin-bottom:8px;color:#8892a4;font-size:11px;">Single entity for daily grid import and export totals.</div>
            ${this._entityRow('Grid Import Today', 'grid_import_today', e)}
            ${this._entityRow('Grid Export Today', 'grid_export_today', e)}
          </div>
        `}
      </div>
      <div class="section">
        <div class="section-title" style="display:flex;align-items:center;">💰 Price Entities <button class="section-detect-btn" data-section="prices" title="Auto-detect price entities">🔍</button></div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Electricity price sensors in <b>${this._esc((cfg.pricing?.currency || '€') + '/kWh')}</b> (or your local currency). Configure source integration on the Pricing tab.</div>
        ${this._entityRow('Buy Price', 'buy_price', e)}
        ${this._entityRow('Sell Price', 'sell_price', e)}
        ${this._entityRow('Nordpool', 'nordpool', e)}
      </div>
      <div class="section" style="border:1px solid ${emhassOn ? '#00d4b8' : haeoOn ? '#7c4dff' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div style="margin-bottom:${emhassOn || haeoOn ? '12' : '0'}px;">
          <div style="font-size:14px;font-weight:700;color:${emhassOn ? '#00d4b8' : haeoOn ? '#7c4dff' : '#8892a4'};display:flex;align-items:center;">🤖 Energy Management System (EMS) <button class="section-detect-btn" data-section="ems" title="Auto-detect EMS/HAEO/EMHASS entities" style="margin-left:8px;">🔍</button></div>
          <div style="font-size:11px;color:#8892a4;margin-top:2px;">Select your energy optimizer. Configure entities below after selecting a provider.</div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="ems-btn ${emsProvider === 'none' ? 'active' : ''}" data-ems="none" style="flex:1;padding:8px 6px;border:1px solid ${emsProvider === 'none' ? '#8892a4' : '#2d3451'};background:${emsProvider === 'none' ? 'rgba(136,146,164,0.15)' : 'transparent'};color:${emsProvider === 'none' ? '#fff' : '#8892a4'};border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">None</button>
            <button class="ems-btn ${emhassOn ? 'active' : ''}" data-ems="emhass" style="flex:1;padding:8px 6px;border:1px solid ${emhassOn ? '#00d4b8' : '#2d3451'};background:${emhassOn ? 'rgba(0,212,184,0.15)' : 'transparent'};color:${emhassOn ? '#00d4b8' : '#8892a4'};border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">EMHASS</button>
            <button class="ems-btn ${haeoOn ? 'active' : ''}" data-ems="haeo" style="flex:1;padding:8px 6px;border:1px solid ${haeoOn ? '#7c4dff' : '#2d3451'};background:${haeoOn ? 'rgba(124,77,255,0.15)' : 'transparent'};color:${haeoOn ? '#7c4dff' : '#8892a4'};border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">HAEO</button>
          </div>
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
        ${haeoOn ? `
          <div style="border-top:1px solid rgba(124,77,255,0.2);padding-top:10px;">
            <div style="font-size:10px;color:#666;margin-bottom:8px;">Requires the <a href="https://github.com/hass-energy/haeo" target="_blank" style="color:#7c4dff;">HAEO integration</a> (HACS). Sensors are named <b>sensor.{element_name}_{type}</b>.</div>
            <div class="section-title" style="font-size:11px;">HAEO Schedule Entities</div>
            <div class="toggle-desc" style="margin-bottom:4px;color:#8892a4;font-size:10px;">Optimization output sensors — each includes a <code>forecast</code> attribute with future schedule</div>
            ${this._entityRow('Battery Charge', 'haeo_battery_charge', e)}
            <div style="font-size:9px;color:#666;padding:0 0 4px 4px;">sensor.{battery_name}_power_consumed — optimal charge power (kW)</div>
            ${this._entityRow('Battery Discharge', 'haeo_battery_discharge', e)}
            <div style="font-size:9px;color:#666;padding:0 0 4px 4px;">sensor.{battery_name}_power_produced — optimal discharge power (kW)</div>
            ${this._entityRow('Battery SoC', 'haeo_battery_soc', e)}
            <div style="font-size:9px;color:#666;padding:0 0 4px 4px;">sensor.{battery_name}_soc — planned state of charge (%)</div>
            ${this._entityRow('Grid Power', 'haeo_grid_power', e)}
            ${this._entityRow('Solar Power', 'haeo_solar_power', e)}
            ${this._entityRow('Load Power', 'haeo_load_power', e)}
          </div>
          <div style="margin-top:8px;">
            <div class="section-title" style="font-size:11px;">HAEO Network Status</div>
            ${this._entityRow('Optim Status', 'haeo_optim_status', e)}
            <div style="font-size:9px;color:#666;padding:0 0 4px 4px;">sensor.{network_name}_network_optimization_status — success / failed / pending</div>
            ${this._entityRow('Optim Cost', 'haeo_optim_cost', e)}
            ${this._entityRow('Optim Duration', 'haeo_optim_duration', e)}
          </div>
          <div style="margin-top:8px;">
            <div class="section-title" style="font-size:11px;">Price Entities</div>
            <div class="toggle-desc" style="margin-bottom:4px;color:#8892a4;font-size:10px;">Live electricity prices for chart overlays (shared with EMHASS)</div>
            ${this._entityRow('Import Price', 'current_import_price', e)}
            ${this._entityRow('Export Price', 'current_export_price', e)}
          </div>
        ` : ''}
      </div>
      <div class="section" style="border:1px solid ${cfg.features?.show_ev_in_sankey ? '#ff69b4' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div class="section-title">🔌 EV / Charger</div>
        ${this._entityRow('Charger Power', 'ev_charger_power', e)}
        ${this._entityRow('Charger State', 'ev_charger_state', e)}
        ${this._entityRow('EV SoC', 'ev_soc', e)}
        ${this._entityRow('EV Range', 'ev_range', e)}
        <div style="margin-top:8px;border-top:1px solid rgba(155,89,182,0.2);padding-top:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:12px;font-weight:600;color:${cfg.features?.show_ev_in_sankey ? '#ff69b4' : '#8892a4'};">📊 Show EV in Sankey Graph</div>
              <div style="font-size:10px;color:#8892a4;margin-top:1px;">Add EV consumption as a destination node in the energy flow chart</div>
            </div>
            <div class="switch ${cfg.features?.show_ev_in_sankey ? 'on' : 'off'}" data-key="show_ev_in_sankey_toggle" style="flex-shrink:0;margin-left:12px;"></div>
          </div>
          ${cfg.features?.show_ev_in_sankey ? `
            <div style="margin-top:8px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="flex:1;">${this._entityRow('EV Energy Today', 'ev_energy_today', e)}</div>
                <button class="auto-detect-btn" data-key="auto_detect_ev" style="flex-shrink:0;padding:6px 12px;background:#ff69b4;color:#fff;border:none;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;" title="Auto-detect from HA Energy Dashboard device list">🔍 Detect</button>
              </div>
              <div class="ev-detect-status" style="font-size:10px;color:#8892a4;display:none;margin-bottom:4px;"></div>
              ${cfg.features?.ev_energy_is_cumulative ? `
                <div style="background:rgba(155,89,182,0.1);border:1px solid rgba(155,89,182,0.3);border-radius:8px;padding:8px;margin-bottom:6px;">
                  <div style="font-size:10px;font-weight:600;color:#ff69b4;">📊 Cumulative sensor detected</div>
                  <div style="font-size:10px;color:#8892a4;margin-top:2px;">Source entity tracks lifetime total. ${e.ev_energy_daily_meter ? 'Using daily utility meter: <b>' + e.ev_energy_daily_meter + '</b>' : 'No daily meter configured yet — click Detect to auto-create one.'}</div>
                  ${e.ev_energy_daily_meter ? this._entityRow('Daily Meter', 'ev_energy_daily_meter', e) : ''}
                </div>
              ` : ''}
              <div class="toggle-desc" style="color:#8892a4;font-size:10px;">Daily EV charging energy (kWh). Click Detect to scan your HA Energy Dashboard — if a cumulative sensor is found, a daily utility meter will be auto-created.</div>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="section" style="border:1px solid ${cfg.features?.show_hp_in_sankey ? '#e67e22' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div class="section-title">♨️ Heat Pump / HVAC</div>
        ${this._entityRow('HP Power', 'heat_pump_power', e)}
        <div style="margin-top:8px;border-top:1px solid rgba(230,126,34,0.2);padding-top:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:12px;font-weight:600;color:${cfg.features?.show_hp_in_sankey ? '#e67e22' : '#8892a4'};">📊 Show Heat Pump in Sankey Graph</div>
              <div style="font-size:10px;color:#8892a4;margin-top:1px;">Add heat pump/HVAC consumption as a destination node in the energy flow chart</div>
            </div>
            <div class="switch ${cfg.features?.show_hp_in_sankey ? 'on' : 'off'}" data-key="show_hp_in_sankey_toggle" style="flex-shrink:0;margin-left:12px;"></div>
          </div>
          ${cfg.features?.show_hp_in_sankey ? `
            <div style="margin-top:8px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="flex:1;">${this._entityRow('HP Energy Today', 'heat_pump_energy_today', e)}</div>
                <button class="auto-detect-btn" data-key="auto_detect_hp" style="flex-shrink:0;padding:6px 12px;background:#e67e22;color:#fff;border:none;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;" title="Auto-detect from HA Energy Dashboard device list">🔍 Detect</button>
              </div>
              <div class="hp-detect-status" style="font-size:10px;color:#8892a4;display:none;margin-bottom:4px;"></div>
              ${cfg.features?.hp_energy_is_cumulative ? `
                <div style="background:rgba(230,126,34,0.1);border:1px solid rgba(230,126,34,0.3);border-radius:8px;padding:8px;margin-bottom:6px;">
                  <div style="font-size:10px;font-weight:600;color:#e67e22;">📊 Cumulative sensor detected</div>
                  <div style="font-size:10px;color:#8892a4;margin-top:2px;">Source entity tracks lifetime total. ${e.hp_energy_daily_meter ? 'Using daily utility meter: <b>' + e.hp_energy_daily_meter + '</b>' : 'No daily meter configured yet — click Detect to auto-create one.'}</div>
                  ${e.hp_energy_daily_meter ? this._entityRow('Daily Meter', 'hp_energy_daily_meter', e) : ''}
                </div>
              ` : ''}
              <div class="toggle-desc" style="color:#8892a4;font-size:10px;">Daily heat pump energy (kWh). Click Detect to scan your HA Energy Dashboard — if a cumulative sensor is found, a daily utility meter will be auto-created.</div>
            </div>
          ` : ''}
        </div>
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
            ${this._entityRow('Forecast Power', 'solcast_forecast_power', e)}
            <div style="margin-top:8px;"><div class="section-title" style="font-size:11px;">Forecast.Solar (alternative)</div></div>
            ${this._entityRow('Today kWh', 'forecast_solar_today', e)}
          </div>
        ` : ''}
      </div>
      <div class="section">
        <div class="section-title" style="display:flex;align-items:center;">🌡️ System <button class="section-detect-btn" data-section="system" title="Auto-detect system entities">🔍</button></div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Temperature (<b>°C</b>), voltage (<b>V</b>), and frequency (<b>Hz</b>) sensors. Found in <i>HA → Settings → Devices</i>.</div>
        ${this._entityRow('Weather', 'weather', e)}
        ${this._entityRow('Inverter Temp', 'inverter_temp', e)}
        ${this._entityRow('Inv Internal Temp', 'inverter_internal_temp', e)}
        ${this._entityRow('Battery Temp', 'battery_temp', e)}
        <div style="border:1px solid ${cfg.features?.three_phase ? '#c8b84a' : '#2d3451'};border-radius:10px;padding:10px;margin:8px 0;transition:all 0.3s;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${cfg.features?.three_phase ? '8' : '0'}px;">
            <div>
              <div style="font-size:13px;font-weight:600;color:${cfg.features?.three_phase ? '#c8b84a' : '#8892a4'};">⚡ Grid Voltage</div>
              <div style="font-size:10px;color:#8892a4;margin-top:1px;">Enable 3-phase to configure per-phase voltage sensors</div>
            </div>
            <div class="switch ${cfg.features?.three_phase ? 'on' : 'off'}" data-key="three_phase_toggle" style="flex-shrink:0;margin-left:12px;"></div>
          </div>
          ${cfg.features?.three_phase ? `
            <div style="border-top:1px solid rgba(200,184,74,0.2);padding-top:8px;">
              ${this._entityRow('Voltage L1', 'grid_voltage', e)}
              ${this._entityRow('Voltage L2', 'grid_voltage_l2', e)}
              ${this._entityRow('Voltage L3', 'grid_voltage_l3', e)}
            </div>
          ` : `
            <div style="border-top:1px solid rgba(45,52,81,0.5);padding-top:8px;">
              ${this._entityRow('Grid Voltage', 'grid_voltage', e)}
            </div>
          `}
        </div>
        ${this._entityRow('Grid Frequency', 'grid_frequency', e)}
        ${this._entityRow('Grid CT Clamp', 'grid_power_ct', e)}
        ${this._entityRow('Net Grid Power', 'grid_active_power', e)}
        ${this._entityRow('EMHASS Enabled', 'emhass_enabled', e)}
      </div>
      <div class="section">
        <div class="section-title">🔌 Inverter & PV</div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Power sensors in <b>W</b> or <b>kW</b>. Individual PV string monitoring for detailed solar analysis.</div>
        ${this._entityRow('Inverter Output', 'inverter_output_power', e)}
        ${this._entityRow('Inverter Rated', 'inverter_rated_power', e)}
        ${this._entityRow('Rated Power', 'rated_power', e)}
        <div style="display:flex;align-items:center;gap:8px;margin:8px 0 4px;">
          <span style="font-size:12px;font-weight:600;color:#c8b84a;">☀️ PV Strings</span>
          <select class="pv-strings-select" data-key="pv_strings" style="background:var(--card-background-color,#1a1f2e);color:var(--primary-text-color,#e0e6f0);border:1px solid var(--divider-color,#2d3451);border-radius:6px;padding:3px 8px;font-size:11px;">
            ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${(cfg.features?.pv_strings || 2) == n ? 'selected' : ''}>${n} string${n > 1 ? 's' : ''}</option>`).join('')}
          </select>
        </div>
        ${Array.from({length: cfg.features?.pv_strings || 2}, (_, i) => this._entityRow('PV' + (i+1) + ' Power', 'pv' + (i+1) + '_power', e)).join('\n        ')}
        ${this._entityRow('Battery Voltage', 'battery_voltage', e)}
        ${this._entityRow('Battery Current', 'battery_current', e)}
      </div>
      <div class="section">
        <div class="section-title">🔋 Battery Pack SoC</div>
        <div class="toggle-desc" style="margin-bottom:8px;color:#8892a4;font-size:11px;">Individual SoC sensors for each battery pack. Leave blank to use the main Battery SoC entity as fallback.</div>
        ${Array.from({length: Math.min(cfg.features?.battery_packs || 2, 8)}, (_, i) => this._entityRow('Pack ' + (i+1) + ' SoC', 'battery_pack' + (i+1) + '_soc', e)).join('\n        ')}
      </div>
    `;

    // Entity keys that should be synced to the house card dashboard config
    const SYNCED_ENTITIES = new Set([
      'solar_power', 'load_power', 'battery_power', 'battery_soc',
      'grid_power', 'grid_power_ct', 'grid_active_power',
      'grid_import', 'grid_export', 'grid_active',
      'sun', 'weather',
      'ev_charger_power', 'ev_charger_state', 'ev_soc', 'ev_range',
      'heat_pump_power', 'battery_capacity',
    ]);

    // ── Entity autocomplete dropdown wiring ──────────────────────
    if (this._hass && this._hass.states) {
      const allEntityIds = Object.keys(this._hass.states);
      let activeDropdown = null;
      const closeAllDropdowns = () => {
        el.querySelectorAll('.entity-dropdown.open').forEach(d => d.classList.remove('open'));
        activeDropdown = null;
      };
      el.querySelectorAll('.entity-ac-input').forEach(input => {
        const wrap = input.closest('.entity-input-wrap');
        const dropdown = wrap ? wrap.querySelector('.entity-dropdown') : null;
        if (!dropdown) return;
        const showDropdown = (filter) => {
          const q = (filter || '').toLowerCase();
          const matches = allEntityIds.filter(k => {
            if (!q) return true;
            const st = this._hass.states[k];
            const fn = (st?.attributes?.friendly_name || '').toLowerCase();
            return k.toLowerCase().includes(q) || fn.includes(q);
          }).slice(0, 50);
          if (matches.length === 0) { dropdown.classList.remove('open'); activeDropdown = null; return; }
          dropdown.innerHTML = matches.map(k => {
            const st = this._hass.states[k];
            const fn = st?.attributes?.friendly_name || '';
            const val = st?.state || '';
            return '<div class="entity-dropdown-item" data-eid="' + this._esc(k) + '"><span class="entity-name">' + this._esc(k) + '</span>' + (fn ? ' <span class="entity-state">' + this._esc(fn) + '</span>' : '') + ' <span class="entity-state">= ' + this._esc(val) + '</span></div>';
          }).join('');
          dropdown.classList.add('open');
          activeDropdown = dropdown;
          dropdown.querySelectorAll('.entity-dropdown-item').forEach(item => {
            item.addEventListener('mousedown', (ev) => {
              ev.preventDefault();
              input.value = item.dataset.eid;
              input.dispatchEvent(new Event('change', { bubbles: true }));
              closeAllDropdowns();
            });
          });
        };
        input.addEventListener('focus', () => showDropdown(input.value));
        input.addEventListener('input', () => showDropdown(input.value));
        input.addEventListener('blur', () => { setTimeout(closeAllDropdowns, 200); });
      });
    }

    // ── Candidate picker click handlers ──────────────────────
    el.querySelectorAll('.candidate-item').forEach(item => {
      item.addEventListener('click', () => {
        const candKey = item.closest('.candidate-picker')?.dataset?.candKey;
        const candId = item.dataset.candId;
        if (!candKey || !candId) return;
        if (item.classList.contains('cand-disabled')) {
          // Show hint for disabled entities
          item.style.outline = '2px solid #e67e22';
          item.setAttribute('title', 'This entity is disabled in HA. Enable it first in Settings → Devices & Services.');
          return;
        }
        const cfg2 = this._storeGet();
        cfg2.entities[candKey] = candId;
        this._storeSave(cfg2);
        // Update input field
        const inp = el.querySelector(`.entity-ac-input[data-key="${candKey}"]`);
        if (inp) { inp.value = candId; inp.dispatchEvent(new Event('change', { bubbles: true })); }
        // Clear candidates for this key
        if (this._candidates) delete this._candidates[candKey];
        this._render();
      });
    });

    // EMS provider selector handler (None / EMHASS / HAEO)
    el.querySelectorAll('.ems-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.ems;
        const cfg2 = this._storeGet();
        cfg2.features.ems_provider = provider;
        // Keep backward-compat emhass boolean in sync
        cfg2.features.emhass = (provider === 'emhass');
        this._storeSave(cfg2);
        this._syncFeatureToDashboard('ems_provider', provider);
        this._syncFeatureToDashboard('emhass', cfg2.features.emhass);
        this._render();
      });
    });

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

    // Dual tariff toggle handler
    const dualTariffToggle = el.querySelector('[data-key="dual_tariff_toggle"]');
    if (dualTariffToggle) {
      dualTariffToggle.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.features.dual_tariff = !cfg2.features.dual_tariff;
        this._storeSave(cfg2);
        this._render();
      });
    }

    // 3-phase toggle handler
    const threePhaseToggle = el.querySelector('[data-key="three_phase_toggle"]');
    if (threePhaseToggle) {
      threePhaseToggle.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.features.three_phase = !cfg2.features.three_phase;
        this._storeSave(cfg2);
        this._syncFeatureToDashboard('three_phase', cfg2.features.three_phase);
        this._render();
      });
    }

    // EV in Sankey toggle handler
    const evSankeyToggle = el.querySelector('[data-key="show_ev_in_sankey_toggle"]');
    if (evSankeyToggle) {
      evSankeyToggle.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.features.show_ev_in_sankey = !cfg2.features.show_ev_in_sankey;
        this._storeSave(cfg2);
        if (this._hass) {
          this._buildDashboard().then(ok => {
            if (ok) console.log('Dashboard rebuilt after toggling EV Sankey');
            this._render();
          }).catch(() => this._render());
        } else { this._render(); }
      });
    }

    // Heat Pump in Sankey toggle handler
    const hpSankeyToggle = el.querySelector('[data-key="show_hp_in_sankey_toggle"]');
    if (hpSankeyToggle) {
      hpSankeyToggle.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.features.show_hp_in_sankey = !cfg2.features.show_hp_in_sankey;
        this._storeSave(cfg2);
        if (this._hass) {
          this._buildDashboard().then(ok => {
            if (ok) console.log('Dashboard rebuilt after toggling HP Sankey');
            this._render();
          }).catch(() => this._render());
        } else { this._render(); }
      });
    }

    // EV Energy auto-detect button
    const evDetectBtn = el.querySelector('[data-key="auto_detect_ev"]');
    if (evDetectBtn) {
      evDetectBtn.addEventListener('click', async () => {
        const statusEl = el.querySelector('.ev-detect-status');
        if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = '⏳ Scanning HA Energy Dashboard for EV devices...'; }
        try {
          const prefs = await this._hass.callWS({ type: 'energy/get_prefs' });
          const devs = prefs?.device_consumption || [];
          const evPatterns = ['ev', 'charger', 'wallbox', 'laadpaal', 'tesla', 'charging', 'zaptec', 'easee', 'ocpp', 'juicebox', 'grizzl-e', 'chargepoint', 'emporia', 'openevse', 'zappi', 'myenergi', 'go-e', 'keba', 'fronius_wattpilot', 'pulsar', 'copper', 'evnex', 'podpoint', 'rolec', 'ohme', 'hypervolt', 'alfen', 'evbox', 'schneider_evlink', 'siemens_versicharge', 'nrgkick', 'warp'];
          let foundEntity = null;
          const evDevices = devs.filter(d => {
            const name = (d.name || '').toLowerCase();
            const entity = (d.stat_consumption || '').toLowerCase();
            return evPatterns.some(p => name.includes(p) || entity.includes(p));
          });
          if (evDevices.length > 0) {
            foundEntity = evDevices[0].stat_consumption;
            const list = evDevices.map(d => '• ' + d.name + ' → ' + d.stat_consumption).join('<br>');
            if (statusEl) statusEl.innerHTML = '✅ Found ' + evDevices.length + ' EV device(s):<br>' + list;
          } else {
            // Fallback: scan all HA states for EV-related energy sensors
            const evStates = Object.keys(this._hass.states).filter(k =>
              k.includes('sensor.') && (k.includes('ev_') || k.includes('charger_energy') || k.includes('wallbox') || k.includes('charging_energy') || k.includes('zappi') || k.includes('easee') || k.includes('ocpp') || k.includes('tesla_') || k.includes('juicebox'))
              && (this._hass.states[k].attributes?.unit_of_measurement === 'kWh' || this._hass.states[k].attributes?.device_class === 'energy')
            );
            if (evStates.length > 0) {
              foundEntity = evStates[0];
              if (statusEl) statusEl.innerHTML = '✅ Found EV energy sensor: ' + evStates[0];
            }
          }
          if (foundEntity) {
            // Check if cumulative and create utility meter if needed
            if (statusEl) statusEl.innerHTML += '<br>⏳ Checking if sensor is cumulative...';
            const result = await this._ensureDailyMeter(foundEntity, 'ev_energy');
            const cfg2 = this._storeGet();
            cfg2.entities.ev_energy_today = foundEntity;
            cfg2.features.ev_energy_is_cumulative = result.isCumulative;
            if (result.isCumulative && result.dailyEntity !== foundEntity) {
              cfg2.entities.ev_energy_daily_meter = result.dailyEntity;
              if (statusEl) statusEl.innerHTML += '<br>📊 Entity is cumulative (total: ' + this._hass.states[foundEntity]?.state + ' kWh). Created daily utility meter: <b>' + result.dailyEntity + '</b>';
            } else if (result.isCumulative) {
              if (statusEl) statusEl.innerHTML += '<br>⚠️ Entity is cumulative but utility meter creation failed. You can create one manually in HA Settings → Helpers.';
            } else {
              if (statusEl) statusEl.innerHTML += '<br>✅ Entity reports daily values — using directly.';
            }
            this._storeSave(cfg2);
            setTimeout(() => this._render(), 500);
          } else {
            if (statusEl) statusEl.textContent = '⚠️ No EV-related device found in HA Energy Dashboard or state registry. Configure manually.';
          }
        } catch (err) {
          if (statusEl) statusEl.textContent = '❌ Detection failed: ' + (err.message || 'unknown error');
        }
      });
    }

    // HP Energy auto-detect button
    const hpDetectBtn = el.querySelector('[data-key="auto_detect_hp"]');
    if (hpDetectBtn) {
      hpDetectBtn.addEventListener('click', async () => {
        const statusEl = el.querySelector('.hp-detect-status');
        if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = '⏳ Scanning HA Energy Dashboard for Heat Pump/HVAC devices...'; }
        try {
          const prefs = await this._hass.callWS({ type: 'energy/get_prefs' });
          const devs = prefs?.device_consumption || [];
          const hpPatterns = ['heat pump', 'heat_pump', 'heatpump', 'warmtepomp', 'wärmepumpe', 'pompe a chaleur', 'bomba de calor', 'hvac', 'wp ', 'wp_', 'airco', 'air con', 'klimaat', 'climate', 'daikin', 'mitsubishi', 'toshiba', 'panasonic_aquarea', 'vaillant', 'viessmann', 'nibe', 'bosch', 'stiebel', 'atlantic', 'carrier', 'trane', 'lennox', 'fujitsu', 'lg_therma', 'samsung_ehs', 'alpha_innotec', 'lambda', 'thermia', 'cop_', 'compressor'];
          let foundEntity = null;
          const hpDevices = devs.filter(d => {
            const name = (d.name || '').toLowerCase();
            const entity = (d.stat_consumption || '').toLowerCase();
            return hpPatterns.some(p => name.includes(p) || entity.includes(p)) || entity.includes('wp_kot') || entity.includes('heat_pump');
          });
          if (hpDevices.length > 0) {
            foundEntity = hpDevices[0].stat_consumption;
            const list = hpDevices.map(d => '• ' + d.name + ' → ' + d.stat_consumption).join('<br>');
            if (statusEl) statusEl.innerHTML = '✅ Found ' + hpDevices.length + ' Heat Pump device(s):<br>' + list;
          } else {
            // Fallback: scan all HA states for HP-related energy sensors
            const hpStates = Object.keys(this._hass.states).filter(k =>
              k.includes('sensor.') && (k.includes('heat_pump') || k.includes('heatpump') || k.includes('warmtepomp') || k.includes('wp_kot') || k.includes('hvac_energy') || k.includes('daikin') || k.includes('nibe') || k.includes('aquarea') || k.includes('vaillant') || k.includes('viessmann'))
              && (this._hass.states[k].attributes?.unit_of_measurement === 'kWh' || this._hass.states[k].attributes?.device_class === 'energy')
            );
            if (hpStates.length > 0) {
              foundEntity = hpStates[0];
              if (statusEl) statusEl.innerHTML = '✅ Found HP energy sensor: ' + hpStates[0];
            }
          }
          if (foundEntity) {
            // Check if cumulative and create utility meter if needed
            if (statusEl) statusEl.innerHTML += '<br>⏳ Checking if sensor is cumulative...';
            const result = await this._ensureDailyMeter(foundEntity, 'hp_energy');
            const cfg2 = this._storeGet();
            cfg2.entities.heat_pump_energy_today = foundEntity;
            cfg2.features.hp_energy_is_cumulative = result.isCumulative;
            if (result.isCumulative && result.dailyEntity !== foundEntity) {
              cfg2.entities.hp_energy_daily_meter = result.dailyEntity;
              if (statusEl) statusEl.innerHTML += '<br>📊 Entity is cumulative (total: ' + this._hass.states[foundEntity]?.state + ' kWh). Created daily utility meter: <b>' + result.dailyEntity + '</b>';
            } else if (result.isCumulative) {
              if (statusEl) statusEl.innerHTML += '<br>⚠️ Entity is cumulative but utility meter creation failed. You can create one manually in HA Settings → Helpers.';
            } else {
              if (statusEl) statusEl.innerHTML += '<br>✅ Entity reports daily values — using directly.';
            }
            this._storeSave(cfg2);
            setTimeout(() => this._render(), 500);
          } else {
            if (statusEl) statusEl.textContent = '⚠️ No Heat Pump/HVAC device found in HA Energy Dashboard or state registry. Configure manually.';
          }
        } catch (err) {
          if (statusEl) statusEl.textContent = '❌ Detection failed: ' + (err.message || 'unknown error');
        }
      });
    }

    // Auto-detect from HA Energy Dashboard
    const autoDetectBtn = el.querySelector('[data-key="auto_detect_energy"]');
    if (autoDetectBtn) {
      autoDetectBtn.addEventListener('click', async () => {
        const statusEl = el.querySelector('.auto-detect-status');
        if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = '⏳ Fetching HA Energy Dashboard config...'; }
        try {
          const prefs = await this._hass.callWS({ type: 'energy/get_prefs' });
          if (!prefs || !prefs.energy_sources) {
            if (statusEl) statusEl.textContent = '❌ No energy sources configured in HA Energy Dashboard';
            return;
          }
          const cfg2 = this._storeGet();
          const found = [];

          for (const src of prefs.energy_sources) {
            if (src.type === 'solar' && src.stat_energy_from) {
              cfg2.entities.solar_energy_today = src.stat_energy_from;
              found.push('Solar: ' + src.stat_energy_from);
            }
            if (src.type === 'battery') {
              if (src.stat_energy_from) {
                cfg2.entities.battery_discharge_today = src.stat_energy_from;
                found.push('Battery discharge: ' + src.stat_energy_from);
              }
              if (src.stat_energy_to) {
                cfg2.entities.battery_charge_today = src.stat_energy_to;
                found.push('Battery charge: ' + src.stat_energy_to);
              }
            }
            if (src.type === 'grid') {
              const flowFrom = src.flow_from || [];
              const flowTo = src.flow_to || [];
              if (flowFrom.length === 1 && flowFrom[0].stat_energy_from) {
                cfg2.entities.grid_import_today = flowFrom[0].stat_energy_from;
                cfg2.features.dual_tariff = false;
                found.push('Grid import: ' + flowFrom[0].stat_energy_from);
              } else if (flowFrom.length >= 2) {
                // Multiple tariffs detected
                cfg2.features.dual_tariff = true;
                cfg2.entities.grid_import_high_tariff = flowFrom[0].stat_energy_from || '';
                cfg2.entities.grid_import_low_tariff = flowFrom[1].stat_energy_from || '';
                found.push('Grid import (dual tariff): ' + flowFrom.map(f => f.stat_energy_from).join(' + '));
              }
              if (flowTo.length === 1 && flowTo[0].stat_energy_to) {
                cfg2.entities.grid_export_today = flowTo[0].stat_energy_to;
                found.push('Grid export: ' + flowTo[0].stat_energy_to);
              } else if (flowTo.length >= 2) {
                cfg2.features.dual_tariff = true;
                cfg2.entities.grid_export_high_tariff = flowTo[0].stat_energy_to || '';
                cfg2.entities.grid_export_low_tariff = flowTo[1].stat_energy_to || '';
                found.push('Grid export (dual tariff): ' + flowTo.map(f => f.stat_energy_to).join(' + '));
              }
            }
          }

          // Auto-detect Solcast entities from HA state
          if (this._hass && this._hass.states) {
            const solcastToday = this._hass.states['sensor.solcast_pv_forecast_forecast_today'];
            const solcastTomorrow = this._hass.states['sensor.solcast_pv_forecast_forecast_tomorrow'];
            const solcastRemaining = this._hass.states['sensor.solcast_pv_forecast_forecast_remaining_today'];
            if (solcastToday) {
              cfg2.entities.solcast_today = 'sensor.solcast_pv_forecast_forecast_today';
              found.push('Solcast today: sensor.solcast_pv_forecast_forecast_today');
            }
            if (solcastTomorrow) {
              cfg2.entities.solcast_tomorrow = 'sensor.solcast_pv_forecast_forecast_tomorrow';
              found.push('Solcast tomorrow: sensor.solcast_pv_forecast_forecast_tomorrow');
            }
            if (solcastRemaining) {
              cfg2.entities.solcast_remaining = 'sensor.solcast_pv_forecast_forecast_remaining_today';
              found.push('Solcast remaining: sensor.solcast_pv_forecast_forecast_remaining_today');
            }
            // Enable solar_forecast feature if Solcast found
            if (solcastToday || solcastTomorrow || solcastRemaining) {
              cfg2.features.solar_forecast = true;
              found.push('✓ Solar Forecast feature auto-enabled (Solcast detected)');
            }
            // Auto-detect Solcast power now sensor
            const solcastPower = this._hass.states['sensor.solcast_pv_forecast_power_now'];
            if (solcastPower) {
              cfg2.entities.solcast_forecast_power = 'sensor.solcast_pv_forecast_power_now';
              found.push('Solcast power: sensor.solcast_pv_forecast_power_now');
            }

            // Auto-detect battery capacity entity (kWh, Wh, or Ah — house card handles unit conversion)
            const capKeys = Object.keys(this._hass.states).filter(k => {
              const lower = k.toLowerCase();
              return lower.includes('battery') && (lower.includes('rated_capacity') || lower.includes('rated_energy') || lower.includes('battery_capacity_kwh') || lower.includes('capacity_ah') || lower.includes('capacity_kwh'));
            });
            if (capKeys.length > 0) {
              // Prefer kWh entities, then Wh, then Ah
              const capKey = capKeys.find(k => k.includes('kwh')) || capKeys.find(k => k.includes('capacity') && !k.includes('_ah')) || capKeys[0];
              cfg2.entities.battery_capacity = capKey;
              found.push('Battery capacity: ' + capKey);
            }

            // Auto-detect battery max SoC (charge cutoff) entity
            const maxSocKeys = Object.keys(this._hass.states).filter(k => {
              const lower = k.toLowerCase();
              const st = this._hass.states[k];
              const uom = st?.attributes?.unit_of_measurement || '';
              // Must be a % entity related to charging limits
              return uom === '%' && (
                (lower.includes('charge') && lower.includes('cut_off') && lower.includes('soc')) ||
                (lower.includes('charge_cutoff') && lower.includes('soc')) ||
                (lower.includes('max_soc') && !lower.includes('emhass')) ||
                (lower.includes('charge') && lower.includes('limit') && lower.includes('soc'))
              );
            });
            if (maxSocKeys.length > 0) {
              cfg2.entities.battery_max_soc = maxSocKeys[0];
              found.push('Battery max SoC: ' + maxSocKeys[0]);
            }

            // Auto-detect battery min SoC (discharge cutoff / reserve) entity
            const minSocKeys = Object.keys(this._hass.states).filter(k => {
              const lower = k.toLowerCase();
              const st = this._hass.states[k];
              const uom = st?.attributes?.unit_of_measurement || '';
              // Must be a % entity related to discharge limits
              return uom === '%' && (
                (lower.includes('discharge') && lower.includes('cut_off') && lower.includes('soc')) ||
                (lower.includes('discharge_cutoff') && lower.includes('soc')) ||
                (lower.includes('min_soc') && !lower.includes('emhass')) ||
                (lower.includes('battery_shutdown') && !lower.includes('voltage'))
              );
            });
            if (minSocKeys.length > 0) {
              cfg2.entities.battery_min_soc = minSocKeys[0];
              found.push('Battery min SoC: ' + minSocKeys[0]);
            }

            // Auto-detect battery reserved/backup SoC entity (grid outage reserve)
            const reservedSocKeys = Object.keys(this._hass.states).filter(k => {
              const lower = k.toLowerCase();
              const st = this._hass.states[k];
              const uom = st?.attributes?.unit_of_measurement || '';
              return uom === '%' && (
                (lower.includes('backup') && lower.includes('soc')) ||
                (lower.includes('reserve') && lower.includes('soc')) ||
                (lower.includes('backup') && lower.includes('state_of_charge')) ||
                (lower.includes('reserved') && lower.includes('soc'))
              );
            });
            if (reservedSocKeys.length > 0 && !cfg2.entities.battery_reserved_soc) {
              cfg2.entities.battery_reserved_soc = reservedSocKeys[0];
              found.push('Battery reserved SoC: ' + reservedSocKeys[0]);
            }

            // Auto-detect forecast.solar entities
            const fcsKeys = Object.keys(this._hass.states).filter(k => k.startsWith('sensor.energy_production_') || k.startsWith('sensor.forecast_solar'));
            if (fcsKeys.length > 0) {
              const todayKey = fcsKeys.find(k => k.includes('today') || k.endsWith('_energy_production'));
              if (todayKey) {
                cfg2.entities.forecast_solar_today = todayKey;
                cfg2.features.solar_forecast = true;
                found.push('Forecast.Solar: ' + todayKey);
              }
            }
          }

          // Auto-detect common electricity price entities (Amber, Tibber, Nordpool, EnergiDataService, etc.)
          if (this._hass && this._hass.states && !cfg2.entities.buy_price) {
            const allKeys = Object.keys(this._hass.states);
            // Buy price patterns (ordered by specificity)
            const buyPatterns = [
              'sensor.amber_general_price',             // Amber Electric (AU)
              'sensor.electricity_price',                // Tibber
              /nordpool.*kwh/i,                          // Nordpool (various regions)
              /energi_data_service/i,                    // EnergiDataService (DK/NO/SE)
              /octopus.*current.*rate/i,                 // Octopus Energy (UK)
              /energy.*price.*import/i,                  // Generic import price
              /electricity.*price/i,                     // Generic
              /general.*price/i,                         // Generic general price
              /buy.*price/i,                             // Generic buy price
              /spot.*price/i,                            // Spot price
            ];
            for (const pattern of buyPatterns) {
              const match = typeof pattern === 'string'
                ? allKeys.find(k => k === pattern)
                : allKeys.find(k => pattern.test(k) && !k.includes('feed_in') && !k.includes('export') && !k.includes('sell'));
              if (match) {
                cfg2.entities.buy_price = match;
                found.push('Buy price: ' + match);
                break;
              }
            }
            // Sell/feed-in price patterns
            const sellPatterns = [
              'sensor.amber_feed_in_price',              // Amber Electric (AU)
              /feed.in.*price/i,                         // Generic feed-in
              /export.*price/i,                          // Generic export
              /sell.*price/i,                            // Generic sell
              /octopus.*export.*rate/i,                  // Octopus Energy (UK)
            ];
            if (!cfg2.entities.sell_price) {
              for (const pattern of sellPatterns) {
                const match = typeof pattern === 'string'
                  ? allKeys.find(k => k === pattern)
                  : allKeys.find(k => pattern.test(k));
                if (match) {
                  cfg2.entities.sell_price = match;
                  found.push('Sell price: ' + match);
                  break;
                }
              }
            }
            // Auto-detect Nordpool entity
            if (!cfg2.entities.nordpool) {
              const npKey = allKeys.find(k => k.startsWith('sensor.nordpool'));
              if (npKey) {
                cfg2.entities.nordpool = npKey;
                found.push('Nordpool: ' + npKey);
              }
            }
            // Auto-set currency for known providers
            if (cfg2.entities.buy_price && cfg2.entities.buy_price.includes('amber')) {
              if (!cfg2.pricing) cfg2.pricing = {};
              if (cfg2.pricing.currency === '€' || !cfg2.pricing.currency) {
                cfg2.pricing.currency = '$';
                cfg2.pricing.source = 'amber';
                found.push('✓ Currency set to $ (Amber Electric)');
              }
            }
          }

          // Auto-detect device consumption entities for EV and Heat Pump
          if (prefs.device_consumption && prefs.device_consumption.length > 0) {
            const evKw = ['ev', 'charger', 'wallbox', 'laadpaal', 'tesla', 'charging', 'zaptec', 'easee', 'ocpp', 'juicebox', 'chargepoint', 'zappi', 'myenergi', 'go-e', 'keba', 'openevse', 'emporia', 'pulsar', 'ohme', 'hypervolt', 'alfen', 'evbox'];
            const hpKw = ['heat pump', 'heat_pump', 'heatpump', 'warmtepomp', 'wärmepumpe', 'hvac', 'wp ', 'wp_', 'airco', 'klimaat', 'climate', 'daikin', 'mitsubishi', 'nibe', 'vaillant', 'viessmann', 'panasonic_aquarea', 'stiebel', 'bosch', 'toshiba', 'fujitsu', 'lg_therma', 'samsung_ehs', 'compressor'];
            for (const dev of prefs.device_consumption) {
              const name = (dev.name || '').toLowerCase();
              const entity = (dev.stat_consumption || '').toLowerCase();
              // EV / charger detection
              if (evKw.some(p => name.includes(p) || entity.includes(p))) {
                if (!cfg2.entities.ev_energy_today) {
                  cfg2.entities.ev_energy_today = dev.stat_consumption;
                  cfg2.features.show_ev_in_sankey = true;
                  found.push('EV energy (from devices): ' + dev.stat_consumption + ' (' + dev.name + ')');
                }
              }
              // Heat pump / HVAC detection
              if (hpKw.some(p => name.includes(p) || entity.includes(p)) || entity.includes('wp_kot')) {
                if (!cfg2.entities.heat_pump_energy_today) {
                  cfg2.entities.heat_pump_energy_today = dev.stat_consumption;
                  cfg2.features.show_hp_in_sankey = true;
                  found.push('Heat Pump energy (from devices): ' + dev.stat_consumption + ' (' + dev.name + ')');
                }
                // Also try to find the HP power entity (W/kW) for the HVAC section
                if (!cfg2.entities.heat_pump_power && this._hass?.states) {
                  // Derive device prefix from the energy entity (e.g. sensor.hp_energy → sensor.hp_)
                  const energyId = dev.stat_consumption || '';
                  const prefix = energyId.replace(/energy.*$|consumption.*$|verbrauch.*$/i, '');
                  const hpPowerKeys = Object.keys(this._hass.states).filter(k => {
                    if (!k.startsWith('sensor.')) return false;
                    const st = this._hass.states[k];
                    const unit = st?.attributes?.unit_of_measurement || '';
                    if (unit !== 'W' && unit !== 'kW') return false;
                    const lower = k.toLowerCase();
                    // Match by prefix or by HP keywords in the entity name
                    return (prefix && lower.startsWith(prefix)) ||
                           hpKw.some(kw => lower.includes(kw.replace(/\s+/g, '_')));
                  });
                  // Pick the most likely power entity (prefer ones with 'power' or 'leistung' in name)
                  const bestHpPower = hpPowerKeys.find(k => k.includes('power') || k.includes('leistung')) || hpPowerKeys[0];
                  if (bestHpPower) {
                    cfg2.entities.heat_pump_power = bestHpPower;
                    found.push('Heat Pump power: ' + bestHpPower);
                  }
                }
              }
            }
          }

          // ── Sigenergy Modbus auto-detect ──────────────────────────────
          if (this._hass && this._hass.states) {
            const allKeys = Object.keys(this._hass.states);
            const sigenKeys = allKeys.filter(k => k.startsWith('sensor.sigen_'));
            if (sigenKeys.length > 0) {
              const has = (suffix) => sigenKeys.find(k => k.endsWith(suffix));

              // Plant-level power/energy entities
              // Note: inverter-level entities use endsWith() because the entity_id
              // may contain device name/number between the prefix and register key,
              // e.g. sensor.sigen_inverter_1_active_power (not sensor.sigen_inverter_active_power)
              // Patterns support both TypQxQ (sensor.sigen_{plant}_{device}_{key})
              // and sigenergy2mqtt (sensor.sigen_0_plant_{key} or sensor.sigen_0_{key})
              const map = {
                solar_power:             has('_pv_power') && has('_pv_power').includes('plant') ? has('_pv_power') : sigenKeys.find(k => k.includes('plant') && k.includes('pv_power')) || sigenKeys.find(k => k.endsWith('_plant_pv_power')),
                load_power:              sigenKeys.find(k => k.includes('plant_total_load_power') || k.includes('plant_consumed_power')) || sigenKeys.find(k => k.endsWith('_consumed_power')),
                battery_power:           sigenKeys.find(k => k.includes('plant_battery_power') || k.includes('plant_ess_power')),
                battery_soc:             sigenKeys.find(k => k.includes('plant_battery_state_of_charge') || k.includes('plant_ess_soc') || k.includes('plant_battery_soc')),
                grid_power:              sigenKeys.find(k => k.includes('plant_grid_active_power') || k.includes('plant_grid_sensor_active_power')),
                grid_active_power:       sigenKeys.find(k => k.includes('plant_grid_active_power') || k.includes('plant_grid_sensor_active_power')),
                // Daily energy (TypQxQ uses plant_daily_*, sigenergy2mqtt uses _daily_* without plant_ prefix)
                solar_energy_today:      sigenKeys.find(k => k.includes('plant_daily_pv_energy')) || sigenKeys.find(k => k.endsWith('_daily_pv_energy')),
                load_energy_today:       sigenKeys.find(k => k.includes('plant_daily_load_consumption') || k.includes('plant_daily_consumed_energy')) || sigenKeys.find(k => k.endsWith('_daily_consumed_energy')),
                battery_charge_today:    sigenKeys.find(k => k.includes('plant_daily_battery_charge_energy')) || sigenKeys.find(k => k.endsWith('_daily_charge_energy')),
                battery_discharge_today: sigenKeys.find(k => k.includes('plant_daily_battery_discharge_energy')) || sigenKeys.find(k => k.endsWith('_daily_discharge_energy')),
                grid_import_today:       sigenKeys.find(k => k.includes('plant_daily_grid_import_energy')) || sigenKeys.find(k => k.endsWith('_daily_imported_energy')),
                grid_export_today:       sigenKeys.find(k => k.includes('plant_daily_grid_export_energy')) || sigenKeys.find(k => k.endsWith('_daily_exported_energy')),
                // Inverter-level — use endsWith() to handle numbered inverters (e.g. "Inverter 1")
                inverter_temp:           sigenKeys.find(k => k.endsWith('_pcs_internal_temperature') && !k.includes('plant')) || sigenKeys.find(k => k.endsWith('_temperature') && k.includes('inverter') && !k.includes('average') && !k.includes('max') && !k.includes('min') && !k.includes('cell') && !k.includes('battery')),
                inverter_output_power:   sigenKeys.find(k => k.endsWith('_active_power') && !k.includes('plant') && !k.includes('max') && !k.includes('min') && !k.includes('adjustment') && !k.includes('feedback') && !k.includes('reactive') && !k.includes('apparent')),
                inverter_rated_power:    sigenKeys.find(k => k.endsWith('_rated_active_power') && !k.includes('plant')),
                battery_temp:            sigenKeys.find(k => k.endsWith('_ess_average_cell_temperature') || k.endsWith('_battery_average_cell_temperature') || k.endsWith('_average_cell_temperature')),
                grid_frequency:          sigenKeys.find(k => k.endsWith('_grid_frequency') && !k.includes('rated') && !k.includes('plant')),
                grid_voltage:            sigenKeys.find(k => k.endsWith('_phase_a_voltage') && !k.includes('plant')),
                // PV strings (up to 6) — use endsWith() for numbered inverters
                pv1_power:               sigenKeys.find(k => k.endsWith('_pv1_power')),
                pv2_power:               sigenKeys.find(k => k.endsWith('_pv2_power')),
                pv3_power:               sigenKeys.find(k => k.endsWith('_pv3_power')),
                pv4_power:               sigenKeys.find(k => k.endsWith('_pv4_power')),
                pv5_power:               sigenKeys.find(k => k.endsWith('_pv5_power')),
                pv6_power:               sigenKeys.find(k => k.endsWith('_pv6_power')),
                // Battery capacity — Sigenergy reports rated capacity at plant level
                battery_capacity:        sigenKeys.find(k => k.includes('plant_rated_energy_capacity') || k.includes('plant_rated_capacity')),
              };

              // Also detect Sigenergy SoC limit entities (number domain, not sensor)
              const allSigenKeys = Object.keys(this._hass.states).filter(k => k.includes('sigen_'));
              const sigenMaxSoc = allSigenKeys.find(k => k.includes('ess_charge_cut_off_state_of_charge') || k.includes('charge_cut_off_soc'));
              const sigenMinSoc = allSigenKeys.find(k => k.includes('ess_discharge_cut_off_state_of_charge') || k.includes('discharge_cut_off_soc'));
              const sigenBackupSoc = allSigenKeys.find(k => k.includes('ess_backup_state_of_charge') || k.includes('backup_soc'));
              if (sigenMaxSoc && !cfg2.entities.battery_max_soc) {
                cfg2.entities.battery_max_soc = sigenMaxSoc;
                found.push('Sigenergy max SoC: ' + sigenMaxSoc);
              }
              if (sigenMinSoc && !cfg2.entities.battery_min_soc) {
                cfg2.entities.battery_min_soc = sigenMinSoc;
                found.push('Sigenergy min SoC (discharge cutoff): ' + sigenMinSoc);
              }
              if (sigenBackupSoc && !cfg2.entities.battery_reserved_soc) {
                cfg2.entities.battery_reserved_soc = sigenBackupSoc;
                found.push('Sigenergy reserved SoC (backup): ' + sigenBackupSoc);
              }

              let sigenCount = 0;
              for (const [key, eid] of Object.entries(map)) {
                if (eid && !cfg2.entities[key]) {
                  cfg2.entities[key] = eid;
                  found.push('Sigenergy auto-detect ' + key + ': ' + eid);
                  sigenCount++;
                }
              }

              // Auto-detect PV string count from available pv*_power entities
              if (sigenCount > 0) {
                let pvCount = 0;
                for (let i = 1; i <= 6; i++) {
                  if (sigenKeys.find(k => k.endsWith('_pv' + i + '_power'))) pvCount = i;
                }
                if (pvCount > 0) {
                  cfg2.features.pv_strings = pvCount;
                  found.push('Sigenergy PV strings detected: ' + pvCount);
                }
                // Sigenergy uses positive = charging convention
                cfg2.features.battery_positive_charging = true;
                found.push('✓ Battery sign convention set to Sigenergy (positive = charging)');
                // Set battery label to SigenStor for Sigenergy users
                if (!cfg2.display) cfg2.display = {};
                cfg2.display.battery_label = 'SigenStor';
                found.push('✓ Battery label set to SigenStor');

                // Hint about commonly disabled entities
                const tips = [];
                if (!map.grid_frequency)    tips.push('Grid Frequency');
                if (!map.grid_voltage)      tips.push('Phase Voltage');
                if (!map.battery_temp)      tips.push('Battery Cell Temperature');
                if (!map.inverter_rated_power) tips.push('Inverter Rated Active Power');
                if (tips.length > 0) {
                  found.push('ℹ️ Not found: ' + tips.join(', ') + '. These may be disabled in HA → Settings → Devices → Sigenergy inverter → enable them, then re-run Detect.');
                }
              }
            }
          }

          // ── Auto-detect battery sign convention ─────────────────────
          // If battery_power entity contains "output" or "discharge", positive = discharging
          if (this._hass && this._hass.states) {
            const bpEntity = (cfg2.entities.battery_power || '').toLowerCase();
            if (bpEntity) {
              if (bpEntity.includes('output') || bpEntity.includes('discharge')) {
                cfg2.features.battery_positive_charging = false;
                found.push('⚡ Battery sign: positive = discharging (entity name contains "output/discharge")');
              } else if (bpEntity.includes('sigen_') || bpEntity.includes('sigenergy')) {
                cfg2.features.battery_positive_charging = true;
                found.push('⚡ Battery sign: positive = charging (Sigenergy convention)');
              }
              // For other brands: if entity name is generic (just "battery_power"), keep the user's current setting
            }
          }

          // ── Auto-detect 3-phase voltage sensors ──────────────────────
          if (this._hass && this._hass.states && !cfg2.features.three_phase) {
            const allKeys = Object.keys(this._hass.states);
            // Common patterns for phase 2/3 voltage entities across brands
            const phase2Patterns = [/_l2_voltage/, /_voltage_l2/, /_phase_2.*voltage/, /voltage.*_l2$/, /voltage.*phase_2/, /_phase_b_voltage/, /spanning.*l2/, /spannung.*l2/];
            const phase2Key = allKeys.find(k => {
              if (!k.startsWith('sensor.')) return false;
              const st = this._hass.states[k];
              const unit = st?.attributes?.unit_of_measurement || '';
              if (unit !== 'V') return false;
              const lower = k.toLowerCase();
              return phase2Patterns.some(p => p.test(lower));
            });
            if (phase2Key) {
              cfg2.features.three_phase = true;
              found.push('✓ 3-phase grid detected: ' + phase2Key);
              // Try to auto-populate L1/L2/L3 voltage entities
              const baseL2 = phase2Key;
              const l1Guess = baseL2.replace(/_l2/g, '_l1').replace(/phase_2/g, 'phase_1').replace(/phase_b/g, 'phase_a');
              const l3Guess = baseL2.replace(/_l2/g, '_l3').replace(/phase_2/g, 'phase_3').replace(/phase_b/g, 'phase_c');
              if (this._hass.states[l1Guess]) {
                cfg2.entities.grid_voltage_l1 = l1Guess;
                found.push('Grid Voltage L1: ' + l1Guess);
              }
              cfg2.entities.grid_voltage_l2 = baseL2;
              found.push('Grid Voltage L2: ' + baseL2);
              if (this._hass.states[l3Guess]) {
                cfg2.entities.grid_voltage_l3 = l3Guess;
                found.push('Grid Voltage L3: ' + l3Guess);
              }
            }
          }

          // ── Check all energy entities for lifetime/cumulative values ──
          // If an entity has state_class='total_increasing' and value > 100 kWh,
          // auto-create a daily utility_meter helper and use that instead.
          const energyKeys = [
            ['solar_energy_today', 'solar_energy'],
            ['load_energy_today', 'load_energy'],
            ['battery_charge_today', 'battery_charge'],
            ['battery_discharge_today', 'battery_discharge'],
            ['grid_import_today', 'grid_import'],
            ['grid_export_today', 'grid_export'],
          ];
          for (const [cfgKey, meterName] of energyKeys) {
            if (cfg2.entities[cfgKey] && cfg2.entities[cfgKey] !== 'sensor.entity_id') {
              const result = await this._ensureDailyMeter(cfg2.entities[cfgKey], meterName);
              if (result.isCumulative) {
                const origEntity = cfg2.entities[cfgKey];
                cfg2.entities[cfgKey] = result.dailyEntity;
                found.push('⚡ ' + meterName + ': converted lifetime entity → daily meter (' + origEntity + ' → ' + result.dailyEntity + ')');
              }
            }
          }
          // Also check dual tariff entities
          if (cfg2.features.dual_tariff) {
            const dualKeys = [
              ['grid_import_high_tariff', 'grid_import_high'],
              ['grid_import_low_tariff', 'grid_import_low'],
              ['grid_export_high_tariff', 'grid_export_high'],
              ['grid_export_low_tariff', 'grid_export_low'],
            ];
            for (const [cfgKey, meterName] of dualKeys) {
              if (cfg2.entities[cfgKey] && cfg2.entities[cfgKey] !== 'sensor.entity_id') {
                const result = await this._ensureDailyMeter(cfg2.entities[cfgKey], meterName);
                if (result.isCumulative) {
                  const origEntity = cfg2.entities[cfgKey];
                  cfg2.entities[cfgKey] = result.dailyEntity;
                  found.push('⚡ ' + meterName + ': converted lifetime → daily (' + origEntity + ' → ' + result.dailyEntity + ')');
                }
              }
            }
          }

          // ── HAEO auto-detect ─────────────────────────────────────────
          if (this._hass && this._hass.states) {
            const allKeys = Object.keys(this._hass.states);
            // Look for HAEO network_optimization_status sensor pattern (HAEO prefixes with "network_")
            const haeoStatusKeys = allKeys.filter(k => k.startsWith('sensor.') && k.endsWith('_network_optimization_status'));
            if (haeoStatusKeys.length > 0) {
              const statusKey = haeoStatusKeys[0];
              // Derive network name prefix (e.g. "sensor.home_energy_" from "sensor.home_energy_network_optimization_status")
              const networkPrefix = statusKey.replace('_network_optimization_status', '_');
              cfg2.entities.haeo_optim_status = statusKey;
              found.push('HAEO optimization status: ' + statusKey);
              // Try network optimization cost and duration
              const costKey = statusKey.replace('_network_optimization_status', '_network_optimization_cost');
              const durKey = statusKey.replace('_network_optimization_status', '_network_optimization_duration');
              if (allKeys.includes(costKey)) {
                cfg2.entities.haeo_optim_cost = costKey;
                found.push('HAEO optimization cost: ' + costKey);
              }
              if (allKeys.includes(durKey)) {
                cfg2.entities.haeo_optim_duration = durKey;
                found.push('HAEO optimization duration: ' + durKey);
              }
              // Find HAEO battery sensors by entity naming patterns (no forecast attribute check needed)
              const haeoBattCharge = allKeys.filter(k => k.startsWith('sensor.') && (k.endsWith('_battery_power_charge') || k.endsWith('_power_consumed')) && !k.includes('grid') && !k.includes('load'));
              const haeoBattDischarge = allKeys.filter(k => k.startsWith('sensor.') && (k.endsWith('_battery_power_discharge') || k.endsWith('_power_produced')) && !k.includes('grid') && !k.includes('solar') && !k.includes('pv'));
              const haeoBattSoc = allKeys.filter(k => k.startsWith('sensor.') && (k.endsWith('_battery_state_of_charge') || k.endsWith('_soc')) && k !== (cfg2.entities.battery_soc || ''));
              // Use first match by entity name pattern
              const haeoCharge = haeoBattCharge[0];
              const haeoDischarge = haeoBattDischarge[0];
              const haeoSoc = haeoBattSoc[0];
              if (haeoCharge) { cfg2.entities.haeo_battery_charge = haeoCharge; found.push('HAEO battery charge: ' + haeoCharge); }
              if (haeoDischarge) { cfg2.entities.haeo_battery_discharge = haeoDischarge; found.push('HAEO battery discharge: ' + haeoDischarge); }
              if (haeoSoc) { cfg2.entities.haeo_battery_soc = haeoSoc; found.push('HAEO battery SoC: ' + haeoSoc); }
              // Find HAEO grid, solar, load sensors by naming patterns
              const haeoGridKeys = allKeys.filter(k => k.startsWith('sensor.') && k.includes('_grid_') && (k.endsWith('_power') || k.endsWith('_power_import') || k.endsWith('_power_export')));
              const haeoSolarKeys = allKeys.filter(k => k.startsWith('sensor.') && k.includes('_solar_') && (k.endsWith('_power') || k.endsWith('_power_produced') || k.endsWith('_power_available')));
              const haeoLoadKeys = allKeys.filter(k => k.startsWith('sensor.') && k.includes('_load_') && (k.endsWith('_power') || k.endsWith('_power_consumed')));
              if (haeoGridKeys.length > 0 && !cfg2.entities.haeo_grid_power) { cfg2.entities.haeo_grid_power = haeoGridKeys[0]; found.push('HAEO grid: ' + haeoGridKeys[0]); }
              if (haeoSolarKeys.length > 0 && !cfg2.entities.haeo_solar_power) { cfg2.entities.haeo_solar_power = haeoSolarKeys[0]; found.push('HAEO solar: ' + haeoSolarKeys[0]); }
              if (haeoLoadKeys.length > 0 && !cfg2.entities.haeo_load_power) { cfg2.entities.haeo_load_power = haeoLoadKeys[0]; found.push('HAEO load: ' + haeoLoadKeys[0]); }
              // Auto-enable HAEO as EMS provider
              cfg2.features.ems_provider = 'haeo';
              cfg2.features.haeo_forecasts = true;
              found.push('✓ HAEO detected — EMS provider set to HAEO');
            }
          }

          if (found.length > 0) {
            this._storeSave(cfg2);

            // Run candidate detection for ambiguous entities so picker UI shows
            if (!this._candidates) this._candidates = {};
            try { await this._autoDetectSocLimits(); } catch (e) { /* non-critical */ }
            // Run generic candidate detection for entities that may have multiple matches
            try {
              const allK = Object.keys(this._hass.states);
              const regEntities = this._registryEntities || [];
              // Price candidates
              const buyCandidates = this._findEntityCandidates(allK, [
                (k) => k === 'sensor.amber_general_price', /amber.*general.*price/i, /amber.*price/i,
                (k) => k === 'sensor.electricity_price',
                /nordpool.*kwh/i, /energi_data_service/i, /octopus.*current.*rate/i,
                /energy.*price.*import/i, /electricity.*price/i, /buy.*price/i, /spot.*price/i,
                /general.*price/i, /import.*price/i,
              ], { domainFilter: 'sensor', excludes: ['feed_in', 'export', 'sell', 'forecast', 'descriptor', 'controlled'] });
              if (buyCandidates.length > 1) this._candidates.buy_price = buyCandidates;
              const sellCandidates = this._findEntityCandidates(allK, [
                (k) => k === 'sensor.amber_feed_in_price', /amber.*feed.*in.*price/i,
                /feed.in.*price/i, /export.*price/i, /sell.*price/i, /octopus.*export.*rate/i,
              ], { domainFilter: 'sensor', excludes: ['forecast', 'descriptor'] });
              if (sellCandidates.length > 1) this._candidates.sell_price = sellCandidates;
              // Auto-set currency for Amber
              if (cfg2.entities.buy_price && cfg2.entities.buy_price.includes('amber')) {
                if (cfg2.pricing.currency === '€' || !cfg2.pricing.currency) {
                  cfg2.pricing.currency = '$';
                  cfg2.pricing.source = 'amber';
                  found.push('✓ Amber Electric detected — currency set to $');
                }
              }
              // Weather candidates
              const weatherC = this._findEntityCandidates(allK, [(k) => k.startsWith('weather.') && !k.includes('forecast')], {});
              if (weatherC.length > 1) this._candidates.weather = weatherC;
            } catch (e) { /* non-critical */ }

            if (statusEl) statusEl.innerHTML = '✅ Detected ' + found.length + ' entities:<br>' + found.map(f => '• ' + f).join('<br>');
            // Auto-apply detected entities to dashboard so house card and overview immediately work
            try {
              await this._buildDashboard();
              if (statusEl) statusEl.innerHTML += '<br><br>✅ Dashboard auto-rebuilt with detected entities. <b>Refresh the page</b> to see changes.';
            } catch (buildErr) {
              if (statusEl) statusEl.innerHTML += '<br><br>⚠️ Auto-rebuild failed — click "Apply Settings to Dashboard" manually.';
              console.warn('Auto-build after detect failed:', buildErr);
            }
            // Re-render to show detected entities
            setTimeout(() => this._render(), 500);
          } else {
            if (statusEl) statusEl.textContent = '⚠️ No matching entities found in your HA Energy Dashboard';
          }
        } catch (err) {
          console.error('Auto-detect failed:', err);
          if (statusEl) statusEl.textContent = '❌ Failed to fetch Energy Dashboard config: ' + (err.message || 'unknown error');
        }
      });
    }

    // PV strings selector handler
    const pvStringsSelect = el.querySelector('.pv-strings-select');
    if (pvStringsSelect) {
      pvStringsSelect.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        cfg2.features.pv_strings = parseInt(pvStringsSelect.value) || 2;
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
        const previousValue = cfg2.entities[key] || '';
        cfg2.entities[key] = value;
        this._storeSave(cfg2);
        // Update state badge inline without destroying the DOM
        const stateEl = input.closest('.row')?.querySelector('.row-state');
        if (stateEl) {
          const state = this._getState(value);
          stateEl.textContent = state;
          stateEl.className = 'row-state' + (state.startsWith('❌') ? ' err' : '');
        }
        // Sync entity to house card dashboard config
        if (SYNCED_ENTITIES.has(key)) {
          this._syncEntityToDashboard(key, value, previousValue);
        }
      });
    });

    // ── Per-section auto-detect button wiring ──────────────────
    el.querySelectorAll('.section-detect-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const section = btn.dataset.section;
        btn.textContent = '⏳';
        btn.disabled = true;
        let found = [];
        try {
          switch (section) {
            case 'core_power': found = await this._autoDetectCorePower(); break;
            case 'daily_energy': found = await this._autoDetectDailyEnergy(); break;
            case 'prices': found = await this._autoDetectPrices(); break;
            case 'ems': found = await this._autoDetectEMS(); break;
            case 'system': found = await this._autoDetectSystem(); break;
          }
        } catch (e) { console.error('Section detect error:', e); }
        if (found.length > 0) {
          btn.textContent = '✅ ' + found.length;
          setTimeout(() => { this._render(); }, 1000);
        } else {
          btn.textContent = '⚠️ 0';
          setTimeout(() => { btn.textContent = '🔍'; btn.disabled = false; }, 2000);
        }
      });
    });
  }

  // ── Per-section auto-detect methods ────────────────────────────

  async _autoDetectCorePower() {
    const found = [];
    if (!this._hass?.states) return found;
    const cfg2 = this._storeGet();
    const allKeys = Object.keys(this._hass.states);
    if (!this._candidates) this._candidates = {};
    const sigenKeys = allKeys.filter(k => k.startsWith('sensor.sigen_'));
    if (sigenKeys.length > 0) {
      // Sigenergy: specific naming → first-match is reliable
      const map = {
        solar_power: sigenKeys.find(k => k.includes('plant_pv_power') || k.endsWith('_pv_power')),
        load_power: sigenKeys.find(k => k.includes('plant_load_power') || k.endsWith('_load_power')),
        battery_power: sigenKeys.find(k => k.includes('plant_battery_power') || k.endsWith('_battery_power')),
        battery_soc: sigenKeys.find(k => k.includes('plant_battery_soc') || k.endsWith('_battery_soc')),
        grid_power: sigenKeys.find(k => k.includes('plant_active_power') || k.endsWith('_active_power')),
        battery_capacity: sigenKeys.find(k => k.includes('plant_rated_energy_capacity') || k.includes('plant_rated_capacity')),
      };
      for (const [key, eid] of Object.entries(map)) {
        if (eid) { cfg2.entities[key] = eid; found.push(key + ': ' + eid); }
      }
    } else {
      // Generic inverter: find candidates with multi-select support
      const powerOpts = { unitFilter: ['W', 'kW'], domainFilter: 'sensor' };
      const socOpts = { unitFilter: '%', domainFilter: 'sensor' };
      const capOpts = { unitFilter: ['kWh', 'Wh', 'Ah'], domainFilter: 'sensor' };
      const genericCandidates = {
        solar_power: this._findEntityCandidates(allKeys, [
          /solar.*power/, /pv.*power/, /photovoltaic.*power/,
        ], { ...powerOpts, excludes: ['forecast', 'solcast', 'energy', 'today', 'daily', 'monthly', 'yield', 'haeo'] }),
        load_power: this._findEntityCandidates(allKeys, [
          /load.*power/, /consumption.*power/, /home.*power/, /house.*power/,
          (k) => k.includes('consumed_power') && !k.includes('daily'),
        ], { ...powerOpts, excludes: ['energy', 'today', 'daily', 'monthly', 'haeo'] }),
        battery_power: this._findEntityCandidates(allKeys, [
          /battery.*power/, /batt.*power/, /ess.*power/,
        ], { ...powerOpts, excludes: ['energy', 'today', 'daily', 'monthly', 'charge_today', 'discharge_today', 'haeo'] }),
        battery_soc: this._findEntityCandidates(allKeys, [
          /battery.*soc/, /battery.*state_of_charge/, /batt.*soc/,
        ], { ...socOpts, excludes: ['haeo', 'emhass', 'mpc_', 'max', 'min', 'reserved', 'backup', 'cutoff', 'cut_off', 'limit', 'shutdown'] }),
        grid_power: this._findEntityCandidates(allKeys, [
          /grid.*power/, /grid.*active/, /meter.*power/,
        ], { ...powerOpts, excludes: ['energy', 'today', 'daily', 'monthly', 'import', 'export', 'haeo', 'reactive', 'apparent'] }),
        battery_capacity: this._findEntityCandidates(allKeys, [
          /battery.*capacity/, /rated.*capacity/, /battery.*rated/,
        ], { ...capOpts, excludes: ['remaining', 'available'] }),
      };
      for (const [key, candidates] of Object.entries(genericCandidates)) {
        this._assignCandidate(key, candidates, cfg2, found);
      }
    }
    // Battery capacity fallback (both Sigenergy and generic)
    if (!cfg2.entities.battery_capacity) {
      const capCandidates = this._findEntityCandidates(allKeys, [
        (k) => k.includes('battery') && (k.includes('rated_capacity') || k.includes('capacity_kwh')),
      ], { unitFilter: ['kWh', 'Wh', 'Ah'] });
      this._assignCandidate('battery_capacity', capCandidates, cfg2, found);
    }
    if (found.length > 0) this._storeSave(cfg2);
    // Also run SoC limit detection (with candidate picker support)
    const socFound = await this._autoDetectSocLimits();
    found.push(...socFound);
    return found;
  }

  // Universal candidate finder: searches enabled entities + optionally disabled entities from registry.
  // patterns: array of string/regex/function matchers applied to entity_id (lowercase)
  // options: { excludes, unitFilter, domainFilter, registryEntities, requireState }
  _findEntityCandidates(allKeys, patterns, options = {}) {
    const { excludes = [], unitFilter, domainFilter, registryEntities, requireState } = options;
    const candidates = [];
    const seen = new Set();
    // Enabled entities from hass.states
    for (const k of allKeys) {
      const lower = k.toLowerCase();
      if (domainFilter && !lower.startsWith(domainFilter + '.')) continue;
      if (excludes.some(p => typeof p === 'function' ? p(lower) : lower.includes(p))) continue;
      const st = this._hass.states[k];
      if (unitFilter) {
        const uom = st?.attributes?.unit_of_measurement || '';
        if (Array.isArray(unitFilter) ? !unitFilter.includes(uom) : uom !== unitFilter) continue;
      }
      if (requireState && (st?.state === 'unavailable' || st?.state === 'unknown')) continue;
      if (patterns.some(p => {
        if (typeof p === 'function') return p(lower);
        if (typeof p === 'string') return lower.includes(p);
        if (p instanceof RegExp) return p.test(lower);
        return false;
      })) {
        const fn = st?.attributes?.friendly_name || '';
        candidates.push({ id: k, value: st?.state || '?', disabled: false, friendly_name: fn });
        seen.add(k);
      }
    }
    // Disabled entities from entity registry
    if (registryEntities && registryEntities.length > 0) {
      for (const re of registryEntities) {
        if (!re.disabled_by) continue;
        if (seen.has(re.entity_id)) continue;
        const lower = (re.entity_id || '').toLowerCase();
        if (domainFilter && !lower.startsWith(domainFilter + '.')) continue;
        if (excludes.some(p => typeof p === 'function' ? p(lower) : lower.includes(p))) continue;
        if (patterns.some(p => {
          if (typeof p === 'function') return p(lower);
          if (typeof p === 'string') return lower.includes(p);
          if (p instanceof RegExp) return p.test(lower);
          return false;
        })) {
          candidates.push({ id: re.entity_id, value: 'disabled', disabled: true, friendly_name: re.name || '' });
        }
      }
    }
    return candidates;
  }

  // Assign a candidate to a config key. If 1 enabled → auto-assign. If >1 → store for picker.
  _assignCandidate(key, candidates, cfg2, found) {
    if (!this._candidates) this._candidates = {};
    const enabled = candidates.filter(c => !c.disabled);
    if (enabled.length === 1 && !cfg2.entities[key]) {
      cfg2.entities[key] = enabled[0].id;
      found.push(key + ': ' + enabled[0].id);
    } else if (enabled.length > 1 && !cfg2.entities[key]) {
      this._candidates[key] = candidates;
      found.push(key + ': ' + enabled.length + ' candidates — choose below');
    } else if (candidates.length > 0 && enabled.length === 0 && !cfg2.entities[key]) {
      this._candidates[key] = candidates;
      found.push(key + ': found disabled entities — enable in HA or set manually');
    }
    // If already set, still store candidates for manual override
    if (cfg2.entities[key] && candidates.length > 1) {
      this._candidates[key] = candidates;
    }
  }

  async _autoDetectSocLimits() {
    const found = [];
    if (!this._hass?.states) return found;
    const cfg2 = this._storeGet();
    const allKeys = Object.keys(this._hass.states);

    // Try to also load disabled entities from entity registry
    let registryEntities = [];
    try {
      registryEntities = await this._hass.callWS({ type: 'config/entity_registry/list' });
    } catch (e) { /* not critical */ }
    this._registryEntities = registryEntities; // cache for other detect methods

    const opts = { unitFilter: '%', excludes: ['emhass', 'mpc_'], registryEntities };

    const maxSocCandidates = this._findEntityCandidates(allKeys, [
      (k) => k.includes('charge') && k.includes('cut_off') && (k.includes('soc') || k.includes('state_of_charge')),
      (k) => k.includes('charge_cutoff') && (k.includes('soc') || k.includes('state_of_charge')),
      'max_soc', 'charge_limit_soc',
      (k) => k.includes('battery_soc_max'),
    ], opts);
    const minSocCandidates = this._findEntityCandidates(allKeys, [
      (k) => k.includes('discharge') && k.includes('cut_off') && (k.includes('soc') || k.includes('state_of_charge')),
      (k) => k.includes('discharge_cutoff') && (k.includes('soc') || k.includes('state_of_charge')),
      'min_soc', 'battery_shutdown',
      (k) => k.includes('battery_soc_min'),
    ], { ...opts, excludes: ['emhass', 'mpc_', 'voltage'] });
    const reservedSocCandidates = this._findEntityCandidates(allKeys, [
      (k) => k.includes('backup') && (k.includes('soc') || k.includes('state_of_charge')),
      (k) => k.includes('reserve') && (k.includes('soc') || k.includes('state_of_charge')),
      'reserved_soc',
    ], { ...opts, excludes: ['emhass'] });

    this._assignCandidate('battery_max_soc', maxSocCandidates, cfg2, found);
    this._assignCandidate('battery_min_soc', minSocCandidates, cfg2, found);
    this._assignCandidate('battery_reserved_soc', reservedSocCandidates, cfg2, found);

    if (found.length > 0) this._storeSave(cfg2);
    return found;
  }

  async _autoDetectDailyEnergy() {
    const found = [];
    const cfg2 = this._storeGet();
    try {
      const prefs = await this._hass.callWS({ type: 'energy/get_prefs' });
      if (!prefs?.energy_sources) return found;
      for (const src of prefs.energy_sources) {
        if (src.type === 'solar' && src.stat_energy_from) {
          cfg2.entities.solar_energy_today = src.stat_energy_from; found.push('Solar: ' + src.stat_energy_from);
        }
        if (src.type === 'battery') {
          if (src.stat_energy_from) { cfg2.entities.battery_discharge_today = src.stat_energy_from; found.push('Battery discharge: ' + src.stat_energy_from); }
          if (src.stat_energy_to) { cfg2.entities.battery_charge_today = src.stat_energy_to; found.push('Battery charge: ' + src.stat_energy_to); }
        }
        if (src.type === 'grid') {
          const flowFrom = src.flow_from || [];
          const flowTo = src.flow_to || [];
          if (flowFrom.length >= 1) { cfg2.entities.grid_import_today = flowFrom[0].stat_energy_from; found.push('Grid import: ' + flowFrom[0].stat_energy_from); }
          if (flowTo.length >= 1) { cfg2.entities.grid_export_today = flowTo[0].stat_energy_to; found.push('Grid export: ' + flowTo[0].stat_energy_to); }
        }
      }
    } catch (e) { console.error('Daily energy detect error:', e); }
    if (found.length > 0) this._storeSave(cfg2);
    return found;
  }

  async _autoDetectPrices() {
    const found = [];
    if (!this._hass?.states) return found;
    const cfg2 = this._storeGet();
    const allKeys = Object.keys(this._hass.states);
    if (!this._candidates) this._candidates = {};

    // Buy price candidates
    const buyCandidates = this._findEntityCandidates(allKeys, [
      (k) => k === 'sensor.amber_general_price',
      /amber.*general.*price/i, /amber.*price/i,
      (k) => k === 'sensor.electricity_price',
      /nordpool.*kwh/i, /energi_data_service/i, /octopus.*current.*rate/i,
      /energy.*price.*import/i, /electricity.*price/i, /buy.*price/i, /spot.*price/i,
      /general.*price/i, /import.*price/i,
    ], { domainFilter: 'sensor', excludes: ['feed_in', 'export', 'sell', 'forecast', 'descriptor', 'controlled'] });
    this._assignCandidate('buy_price', buyCandidates, cfg2, found);

    // Auto-set currency to AUD if Amber detected
    if (cfg2.entities.buy_price && cfg2.entities.buy_price.includes('amber')) {
      if (!cfg2.pricing) cfg2.pricing = {};
      if (cfg2.pricing.currency === '€' || !cfg2.pricing.currency) {
        cfg2.pricing.currency = '$';
        cfg2.pricing.source = 'amber';
        found.push('✓ Amber Electric detected — currency set to $');
      }
    }

    // Sell price candidates
    const sellCandidates = this._findEntityCandidates(allKeys, [
      (k) => k === 'sensor.amber_feed_in_price',
      /amber.*feed.*in.*price/i,
      /feed.in.*price/i, /export.*price/i, /sell.*price/i, /octopus.*export.*rate/i,
    ], { domainFilter: 'sensor', excludes: ['forecast', 'descriptor'] });
    this._assignCandidate('sell_price', sellCandidates, cfg2, found);

    // Nordpool candidates
    const npCandidates = this._findEntityCandidates(allKeys, [
      (k) => k.startsWith('sensor.nordpool'),
    ], { domainFilter: 'sensor' });
    this._assignCandidate('nordpool', npCandidates, cfg2, found);

    if (found.length > 0) this._storeSave(cfg2);
    return found;
  }

  async _autoDetectEMS() {
    const found = [];
    if (!this._hass?.states) return found;
    const cfg2 = this._storeGet();
    const allKeys = Object.keys(this._hass.states);
    if (!this._candidates) this._candidates = {};

    // HAEO detection — with candidate support for multi-instance
    const haeoStatusCandidates = this._findEntityCandidates(allKeys, [
      (k) => k.endsWith('_network_optimization_status'),
    ], { domainFilter: 'sensor' });
    this._assignCandidate('haeo_optim_status', haeoStatusCandidates, cfg2, found);

    // If HAEO status found (single or picked), derive related entities
    const statusKey = cfg2.entities.haeo_optim_status;
    if (statusKey) {
      const costKey = statusKey.replace('_network_optimization_status', '_network_optimization_cost');
      const durKey = statusKey.replace('_network_optimization_status', '_network_optimization_duration');
      if (allKeys.includes(costKey)) { cfg2.entities.haeo_optim_cost = costKey; found.push('HAEO cost: ' + costKey); }
      if (allKeys.includes(durKey)) { cfg2.entities.haeo_optim_duration = durKey; found.push('HAEO duration: ' + durKey); }

      // Battery charge/discharge/SoC with candidate support
      const bChargeC = this._findEntityCandidates(allKeys, [
        (k) => k.endsWith('_battery_power_charge') || (k.endsWith('_power_consumed') && k.includes('batt')),
      ], { domainFilter: 'sensor', excludes: ['grid', 'load'] });
      this._assignCandidate('haeo_battery_charge', bChargeC, cfg2, found);

      const bDischargeC = this._findEntityCandidates(allKeys, [
        (k) => k.endsWith('_battery_power_discharge') || (k.endsWith('_power_produced') && k.includes('batt')),
      ], { domainFilter: 'sensor', excludes: ['grid', 'solar', 'pv'] });
      this._assignCandidate('haeo_battery_discharge', bDischargeC, cfg2, found);

      const bSocC = this._findEntityCandidates(allKeys, [
        (k) => k.endsWith('_battery_state_of_charge'),
      ], { domainFilter: 'sensor', excludes: [cfg2.entities.battery_soc || '___'] });
      this._assignCandidate('haeo_battery_soc', bSocC, cfg2, found);

      // Grid/Solar/Load
      const gridC = this._findEntityCandidates(allKeys, [
        (k) => k.includes('_grid_') && (k.endsWith('_power') || k.endsWith('_power_import') || k.endsWith('_power_export')),
      ], { domainFilter: 'sensor' });
      this._assignCandidate('haeo_grid_power', gridC, cfg2, found);

      const solarC = this._findEntityCandidates(allKeys, [
        (k) => k.includes('_solar_') && (k.endsWith('_power') || k.endsWith('_power_produced') || k.endsWith('_power_available')),
      ], { domainFilter: 'sensor' });
      this._assignCandidate('haeo_solar_power', solarC, cfg2, found);

      const loadC = this._findEntityCandidates(allKeys, [
        (k) => k.includes('_load_') && (k.endsWith('_power') || k.endsWith('_power_consumed')),
      ], { domainFilter: 'sensor' });
      this._assignCandidate('haeo_load_power', loadC, cfg2, found);

      cfg2.features.ems_provider = 'haeo'; cfg2.features.haeo_forecasts = true;
      found.push('✓ HAEO detected');
    }
    // EMHASS detection fallback
    if (!statusKey) {
      const emhassC = this._findEntityCandidates(allKeys, [
        (k) => k.includes('emhass') && (k.includes('_mode') || k.includes('_status')),
      ], { domainFilter: 'sensor' });
      this._assignCandidate('emhass_mode', emhassC, cfg2, found);
      if (cfg2.entities.emhass_mode) {
        cfg2.features.ems_provider = 'emhass';
      }
    }
    if (found.length > 0) this._storeSave(cfg2);
    return found;
  }

  async _autoDetectSystem() {
    const found = [];
    if (!this._hass?.states) return found;
    const cfg2 = this._storeGet();
    const allKeys = Object.keys(this._hass.states);
    if (!this._candidates) this._candidates = {};
    const sigenKeys = allKeys.filter(k => k.startsWith('sensor.sigen_'));
    if (sigenKeys.length > 0) {
      // Sigenergy: specific naming
      const map = {
        inverter_temp: sigenKeys.find(k => k.includes('_radiator_temperature') || k.includes('inverter_temp')),
        battery_temp: sigenKeys.find(k => k.includes('_battery_temperature') || k.includes('cell_temperature')),
        grid_voltage: sigenKeys.find(k => k.includes('_a_phase_voltage') || k.endsWith('_grid_voltage')),
        grid_frequency: sigenKeys.find(k => k.includes('_frequency') || (k.includes('grid') && k.includes('frequency'))),
        inverter_output_power: sigenKeys.find(k => k.includes('_inverter_active_power') || k.endsWith('_active_power')),
      };
      for (const [key, eid] of Object.entries(map)) {
        if (eid) { cfg2.entities[key] = eid; found.push(key + ': ' + eid); }
      }
    } else {
      // Generic: candidate-based detection for system entities
      const tempOpts = { unitFilter: '°C', domainFilter: 'sensor' };
      const invTempC = this._findEntityCandidates(allKeys, [
        /inverter.*temp/, /pcs.*temp/,
      ], tempOpts);
      this._assignCandidate('inverter_temp', invTempC, cfg2, found);

      const battTempC = this._findEntityCandidates(allKeys, [
        /battery.*temp/, /batt.*cell.*temp/, /ess.*temp/,
      ], { ...tempOpts, excludes: ['ambient'] });
      this._assignCandidate('battery_temp', battTempC, cfg2, found);

      const vOpts = { unitFilter: 'V', domainFilter: 'sensor' };
      const gridVC = this._findEntityCandidates(allKeys, [
        /grid.*voltage/, /phase.*voltage/, /mains.*voltage/,
      ], { ...vOpts, excludes: ['battery', 'pv', 'solar', 'string'] });
      this._assignCandidate('grid_voltage', gridVC, cfg2, found);

      const freqC = this._findEntityCandidates(allKeys, [
        /grid.*frequency/, /mains.*frequency/,
      ], { unitFilter: 'Hz', domainFilter: 'sensor' });
      this._assignCandidate('grid_frequency', freqC, cfg2, found);
    }
    // Weather with candidate support
    const weatherCandidates = this._findEntityCandidates(allKeys, [
      (k) => k.startsWith('weather.') && !k.includes('forecast'),
    ], {});
    this._assignCandidate('weather', weatherCandidates, cfg2, found);

    if (found.length > 0) this._storeSave(cfg2);
    return found;
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
    const emsProvider = f.ems_provider || (f.emhass !== false ? 'emhass' : 'none');
    el.innerHTML = `
      <div style="margin-bottom:12px;padding:10px;background:rgba(63,81,181,0.08);border:1px solid rgba(63,81,181,0.2);border-radius:8px;">
        <div style="font-size:11px;color:#8892a4;line-height:1.5;">
          <b>💡 Tip:</b> Enable features here, then configure their entities on the <b>⚡ Entities</b> tab. Click <b>🔄 Apply Settings to Dashboard</b> at the bottom of any tab to rebuild.
        </div>
      </div>
      <div class="section">
        <div class="section-title">🏠 System Components</div>
        ${this._toggleHtml('Grid Connection', 'Disable for off-grid / island setups', 'grid_connection', f.grid_connection)}
        ${this._toggleHtml('Weather Widget', 'Show weather overlay on the Overview page', 'weather_widget', f.weather_widget)}
        ${this._toggleHtml('Hide Cable Lines', 'Show only animated flow dots, hide the static cable backbone on the house card', 'hide_cables', f.hide_cables)}
      </div>
      <div class="section">
        <div class="section-title">🤖 Energy Management (EMS)</div>
        <div style="font-size:10px;color:#666;margin-bottom:8px;">Choose your energy optimizer. <a href="https://emhass.readthedocs.io/" target="_blank" style="color:#00d4b8;">EMHASS</a> (add-on) or <a href="https://github.com/hass-energy/haeo" target="_blank" style="color:#7c4dff;">HAEO</a> (HACS integration). Configure entities on the Entities tab → EMS section.</div>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button class="ems-feature-btn ${emsProvider === 'none' ? 'active' : ''}" data-ems="none" style="flex:1;padding:10px 8px;border:1px solid ${emsProvider === 'none' ? '#8892a4' : '#2d3451'};background:${emsProvider === 'none' ? 'rgba(136,146,164,0.15)' : 'transparent'};color:${emsProvider === 'none' ? '#fff' : '#8892a4'};border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">None</button>
          <button class="ems-feature-btn ${emsProvider === 'emhass' ? 'active' : ''}" data-ems="emhass" style="flex:1;padding:10px 8px;border:1px solid ${emsProvider === 'emhass' ? '#00d4b8' : '#2d3451'};background:${emsProvider === 'emhass' ? 'rgba(0,212,184,0.15)' : 'transparent'};color:${emsProvider === 'emhass' ? '#00d4b8' : '#8892a4'};border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">EMHASS</button>
          <button class="ems-feature-btn ${emsProvider === 'haeo' ? 'active' : ''}" data-ems="haeo" style="flex:1;padding:10px 8px;border:1px solid ${emsProvider === 'haeo' ? '#7c4dff' : '#2d3451'};background:${emsProvider === 'haeo' ? 'rgba(124,77,255,0.15)' : 'transparent'};color:${emsProvider === 'haeo' ? '#7c4dff' : '#8892a4'};border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">HAEO</button>
        </div>
        ${emsProvider === 'emhass' ? `
          ${this._toggleHtml('EMHASS Forecasts', 'Overlay MPC forecast series (PV/Battery/Grid/Load) on energy charts', 'emhass_forecasts', f.emhass_forecasts)}
          ${this._toggleHtml('Deferrable Loads', 'Show heat pump/boiler schedule forecasts from EMHASS', 'deferrable_loads', f.deferrable_loads)}
          ${this._toggleHtml('Financial Tracking', 'Show cost/savings cards and chart annotations', 'financial_tracking', f.financial_tracking)}
        ` : ''}
        ${emsProvider === 'haeo' ? `
          ${this._toggleHtml('HAEO Forecasts', 'Overlay HAEO optimization schedule on energy charts (via forecast attributes)', 'haeo_forecasts', f.haeo_forecasts)}
          ${this._toggleHtml('Financial Tracking', 'Show optimization cost in chart annotations', 'financial_tracking', f.financial_tracking)}
        ` : ''}
      </div>
      <div class="section">
        <div class="section-title">☀️ Solar Forecast</div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Requires <a href="https://github.com/oziee/ha-solcast-solar" target="_blank" style="color:#FFA500;">Solcast</a> or <a href="https://www.home-assistant.io/integrations/forecast_solar/" target="_blank" style="color:#FFA500;">Forecast.Solar</a>. Configure entities on the Entities tab → Solar Forecasting section.</div>
        ${this._toggleHtml('Solar Forecast', 'Overlay solar production forecast on the energy chart', 'solar_forecast', f.solar_forecast)}
        ${this._toggleHtml('Sunrise/Sunset Lines', 'Show day/night shading bands on charts', 'sunrise_sunset', f.sunrise_sunset)}
      </div>
      <div class="section">
        <div class="section-title">🔌 Optional Equipment</div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Enable to show equipment on the house card. Configure power/energy entities on the Entities tab.</div>
        ${this._toggleHtml('EV Charger', 'Show EV charger with animated power flow', 'ev_charger', f.ev_charger)}
        ${this._toggleHtml('EV Vehicle', 'Show car visual in the garage layer', 'ev_vehicle', f.ev_vehicle)}
        ${this._toggleHtml('Heat Pump / HVAC', 'Show heat pump unit with power flow animation', 'heat_pump', f.heat_pump)}
      </div>
      <div class="section">
        <div class="section-title">🔋 Battery</div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Configure battery behavior and runtime estimation. Set the Battery Capacity entity on the Entities tab, or enter a manual value below.</div>
        <div class="row">
          <span class="row-label">Battery Packs</span>
          <input class="row-input" type="number" min="1" max="8" value="${f.battery_packs || 2}" data-key="battery_packs" />
        </div>
        <div style="font-size:10px;color:#666;padding:0 0 6px 4px;">Number of physical battery modules. Individual pack SoC entities are on the Entities tab.</div>
        ${this._toggleHtml('Positive = Charging', 'Enable if your inverter reports positive battery power when charging. Disable for inverters where positive means discharging (e.g. Deye, Goodwe).', 'battery_positive_charging', f.battery_positive_charging !== false)}
        ${this._toggleHtml('Battery Runtime', 'Show estimated time to full/empty on the house card battery label', 'battery_runtime', f.battery_runtime !== false)}
        <div style="margin-top:6px;padding:10px;background:rgba(33,150,243,0.08);border:1px solid rgba(33,150,243,0.2);border-radius:8px;">
          <div style="font-size:11px;font-weight:600;color:#64B5F6;margin-bottom:6px;">Runtime Settings</div>
          <div class="row">
            <span class="row-label" style="font-size:12px;color:#8892a4;">Manual Capacity (kWh)</span>
            <input class="row-input" type="number" min="0" max="500" step="0.1" value="${cfg.entities?.battery_capacity_kwh || ''}" data-key="battery_capacity_kwh" placeholder="auto" style="width:80px;" />
          </div>
          <div style="font-size:10px;color:#666;padding:2px 0 6px 4px;">Leave blank to auto-read from Battery Capacity entity. Set manually if your inverter doesn't expose a capacity sensor.</div>
          <div class="row">
            <span class="row-label" style="font-size:12px;color:#8892a4;">Max SoC Target (%)</span>
            <input class="row-input" type="number" min="50" max="100" step="1" value="${cfg.entities?.battery_max_soc_pct || ''}" data-key="battery_max_soc_pct" placeholder="100" style="width:80px;" />
          </div>
          <div class="row" style="margin-top:4px;">
            <span class="row-label" style="font-size:12px;color:#8892a4;">Min SoC Target (%)</span>
            <input class="row-input" type="number" min="0" max="50" step="1" value="${cfg.entities?.battery_min_soc_pct || ''}" data-key="battery_min_soc_pct" placeholder="0" style="width:80px;" />
          </div>
          <div class="row" style="margin-top:4px;">
            <span class="row-label" style="font-size:12px;color:#8892a4;">Reserved SoC (%)</span>
            <input class="row-input" type="number" min="0" max="50" step="1" value="${cfg.entities?.battery_reserved_soc_pct || ''}" data-key="battery_reserved_soc_pct" placeholder="" style="width:80px;" />
          </div>
          <div style="font-size:10px;color:#666;padding:2px 0 0 4px;">Charge/discharge cutoff targets for runtime estimation. E.g. 95% max, 10% min. Leave blank for 100%/0%.<br><b>Reserved SoC</b> = backup reserve for grid outages (e.g. 15–20%). When discharging, runtime shows time to this level. Leave blank to disable.</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">🛠️ Developer</div>
        ${this._toggleHtml('Cable Path Editor', 'Drag-to-position cable routing overlay on house card (for layout customization)', 'path_editor', this._pathEditorOn)}
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

    // EMS provider button handler (Features tab)
    el.querySelectorAll('.ems-feature-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.ems;
        const cfg2 = this._storeGet();
        cfg2.features.ems_provider = provider;
        cfg2.features.emhass = (provider === 'emhass');
        this._storeSave(cfg2);
        this._syncFeatureToDashboard('ems_provider', provider);
        this._syncFeatureToDashboard('emhass', cfg2.features.emhass);
        if (this._hass) {
          this._buildDashboard().then(ok => {
            if (ok) console.log('Dashboard rebuilt after EMS provider change to', provider);
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

    if (bpInput) {
      bpInput.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        cfg2.features.battery_packs = parseInt(bpInput.value) || 2;
        this._storeSave(cfg2);
        this._render();
      });
    }

    // Bind manual battery capacity kWh input
    const capInput = el.querySelector('input[data-key="battery_capacity_kwh"]');
    if (capInput) {
      capInput.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const val = parseFloat(capInput.value);
        cfg2.entities.battery_capacity_kwh = (val > 0) ? val.toString() : '';
        this._storeSave(cfg2);
        // Sync to house card directly (battery_capacity_kwh is a top-level config, not an entity)
        this._syncBatteryCapacityKwhToDashboard(cfg2.entities.battery_capacity_kwh);
      });
    }

    // Bind manual SoC target inputs
    const maxSocInput = el.querySelector('input[data-key="battery_max_soc_pct"]');
    if (maxSocInput) {
      maxSocInput.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const val = parseInt(maxSocInput.value);
        cfg2.entities.battery_max_soc_pct = (val >= 50 && val <= 100) ? val.toString() : '';
        this._storeSave(cfg2);
        this._syncSocTargetsToDashboard(cfg2);
      });
    }
    const minSocInput = el.querySelector('input[data-key="battery_min_soc_pct"]');
    if (minSocInput) {
      minSocInput.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const val = parseInt(minSocInput.value);
        cfg2.entities.battery_min_soc_pct = (val >= 0 && val <= 50) ? val.toString() : '';
        this._storeSave(cfg2);
        this._syncSocTargetsToDashboard(cfg2);
      });
    }
    const reservedSocInput = el.querySelector('input[data-key="battery_reserved_soc_pct"]');
    if (reservedSocInput) {
      reservedSocInput.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const val = parseInt(reservedSocInput.value);
        cfg2.entities.battery_reserved_soc_pct = (val >= 0 && val <= 50) ? val.toString() : '';
        this._storeSave(cfg2);
        this._syncSocTargetsToDashboard(cfg2);
      });
    }
  }

  async _syncBatteryCapacityKwhToDashboard(value) {
    if (!this._hass) return;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const patchHouse = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        if (obj.type === 'custom:sigenergy-house-card') {
          obj.battery_capacity_kwh = value ? parseFloat(value) : undefined;
          if (!obj.battery_capacity_kwh) delete obj.battery_capacity_kwh;
          return true;
        }
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) { for (const item of v) { if (patchHouse(item)) return true; } }
          else if (typeof v === 'object' && v !== null) { if (patchHouse(v)) return true; }
        }
        return false;
      };
      if (patchHouse(config)) {
        await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config });
      }
    } catch (e) { console.error('Sync battery_capacity_kwh to dashboard failed:', e); }
  }

  async _syncBatteryLabelToDashboard(value) {
    if (!this._hass) return;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const patchHouse = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        if (obj.type === 'custom:sigenergy-house-card') {
          if (value) obj.battery_label = value;
          else delete obj.battery_label;
          return true;
        }
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) { for (const item of v) { if (patchHouse(item)) return true; } }
          else if (typeof v === 'object' && v !== null) { if (patchHouse(v)) return true; }
        }
        return false;
      };
      if (patchHouse(config)) {
        await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config });
      }
    } catch (e) { console.error('Sync battery_label to dashboard failed:', e); }
  }

  async _syncSocTargetsToDashboard(cfg) {
    if (!this._hass) return;
    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });
      const maxPct = (cfg.entities?.battery_max_soc_pct != null && cfg.entities.battery_max_soc_pct !== '') ? parseInt(cfg.entities.battery_max_soc_pct) : undefined;
      const minPct = (cfg.entities?.battery_min_soc_pct != null && cfg.entities.battery_min_soc_pct !== '') ? parseInt(cfg.entities.battery_min_soc_pct) : undefined;
      const reservedPct = (cfg.entities?.battery_reserved_soc_pct != null && cfg.entities.battery_reserved_soc_pct !== '') ? parseInt(cfg.entities.battery_reserved_soc_pct) : undefined;
      const patchHouse = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        if (obj.type === 'custom:sigenergy-house-card') {
          if (maxPct >= 50 && maxPct <= 100) obj.battery_max_soc_pct = maxPct;
          else delete obj.battery_max_soc_pct;
          if (minPct >= 0 && minPct <= 50) obj.battery_min_soc_pct = minPct;
          else delete obj.battery_min_soc_pct;
          if (reservedPct >= 0 && reservedPct <= 50) obj.battery_reserved_soc_pct = reservedPct;
          else delete obj.battery_reserved_soc_pct;
          return true;
        }
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) { for (const item of v) { if (patchHouse(item)) return true; } }
          else if (typeof v === 'object' && v !== null) { if (patchHouse(v)) return true; }
        }
        return false;
      };
      if (patchHouse(config)) {
        await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'dashboard-sigenergy', config });
      }
    } catch (e) { console.error('Sync SoC targets to dashboard failed:', e); }
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
          <span class="row-label">Cheap (${this._esc(p.currency||'€')}/kWh)</span>
          <input class="row-input" type="number" step="0.01" value="${p.cheap_threshold||0.10}" data-key="cheap_threshold" />
        </div>
        <div class="row">
          <span class="row-label">Expensive (${this._esc(p.currency||'€')}/kWh)</span>
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
        // Auto-set currency and entities for known providers
        if (btn.dataset.src === 'amber') {
          cfg2.pricing.currency = '$';
          if (this._hass?.states) {
            const allK = Object.keys(this._hass.states);
            const amberBuy = allK.find(k => k.includes('amber') && k.includes('general') && k.includes('price'));
            const amberSell = allK.find(k => k.includes('amber') && k.includes('feed_in') && k.includes('price'));
            if (amberBuy) cfg2.entities.buy_price = amberBuy;
            if (amberSell) cfg2.entities.sell_price = amberSell;
          }
        } else if (btn.dataset.src === 'nordpool') {
          if (this._hass?.states) {
            const npKey = Object.keys(this._hass.states).find(k => k.startsWith('sensor.nordpool'));
            if (npKey) cfg2.entities.nordpool = npKey;
          }
        }
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
        if (key === 'currency') this._render();
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

  _buildApexSeries(e, features, cfg) {
    const series = [];
    // Unit-aware power transform: only divide by 1000 if sensor reports in W (not kW)
    const powerTransform = "const u = entity?.attributes?.unit_of_measurement || ''; return (u === 'kW' || u === 'MW') ? x : x / 1000;";
    const fp = this._storeGet()?.display?.decimal_places ?? 1;
    // Always: actual solar
    series.push({
      entity: e.solar_power || 'sensor.solar_production',
      name: 'Solar', color: '#FF8F00', type: 'area', opacity: 0.35,
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: powerTransform,
      group_by: { func: 'avg', duration: '5min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: fp
    });
    // Always: actual battery
    series.push({
      entity: e.battery_power || 'sensor.battery_output_power',
      name: 'Battery', color: '#00C853', type: 'line',
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: powerTransform,
      group_by: { func: 'avg', duration: '5min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: fp
    });
    // Always: actual grid
    series.push({
      entity: e.grid_active_power || e.grid_power || 'sensor.net_grid_power',
      name: 'Grid', color: '#D32F2F', type: 'line',
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: powerTransform,
      group_by: { func: 'avg', duration: '5min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: fp
    });
    // Always: actual consumption (inverted)
    series.push({
      entity: e.load_power || 'sensor.home_consumption',
      name: 'Consumption', color: '#8E24AA', type: 'area', opacity: 0.08,
      stroke_width: 1.5, extend_to: false, unit: ' kW',
      transform: powerTransform,
      group_by: { func: 'avg', duration: '5min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', invert: true, float_precision: fp
    });

    // EMHASS Forecast overlays (conditional)
    if (features.emhass && features.emhass_forecasts && e.mpc_pv) {
      // PV forecast
      series.push({
        entity: e.mpc_pv, name: 'Solar (plan)', color: '#FFF59D',
        type: 'area', opacity: 0.06, curve: 'smooth', extend_to: false,
        unit: ' kW', float_precision: fp, stroke_width: 1, stroke_dash: 5,
        show: { in_header: false, legend_value: false },
        data_generator: "const data = entity.attributes.forecasts;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_pv_power) / 1000]);",
        yaxis_id: 'power'
      });
      // Battery forecast
      if (e.mpc_battery) {
        series.push({
          entity: e.mpc_battery, name: 'Battery (plan)', color: '#A5D6A7',
          type: 'area', opacity: 0.06, curve: 'stepline', extend_to: false,
          unit: ' kW', stroke_width: 1, stroke_dash: 5,
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.battery_scheduled_power;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_batt_power) / 1000]);",
          yaxis_id: 'power', float_precision: 0
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
          yaxis_id: 'power', float_precision: 0
        });
      }
      // Load forecast (inverted)
      if (e.mpc_load) {
        series.push({
          entity: e.mpc_load, name: 'Load (plan)', color: '#CE93D8',
          type: 'line', curve: 'smooth', extend_to: false, unit: ' kW',
          float_precision: fp, stroke_width: 1, stroke_dash: 4,
          show: { in_header: false, legend_value: false, in_chart: true },
          data_generator: "const data = entity.attributes.forecasts;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_load_power) / 1000]);",
          yaxis_id: 'power', invert: true, opacity: 0.6
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
    }

    // HAEO Forecast overlays (conditional) — reads forecast attribute from HAEO sensors
    const emsProvider = features.ems_provider || (features.emhass !== false ? 'emhass' : 'none');
    if (emsProvider === 'haeo' && features.haeo_forecasts) {
      // HAEO Battery charge forecast
      if (e.haeo_battery_charge) {
        series.push({
          entity: e.haeo_battery_charge, name: 'Charge (plan)', color: '#A5D6A7',
          type: 'area', opacity: 0.06, curve: 'stepline', extend_to: false,
          unit: ' kW', stroke_width: 1, stroke_dash: 5,
          show: { in_header: false, legend_value: false },
          data_generator: `var fc = entity.attributes.forecast; if (!fc) return []; if (Array.isArray(fc)) return fc.map(function(p){ return [new Date(p.time).getTime(), p.value || 0]; }).sort(function(a,b){ return a[0]-b[0]; }); return Object.entries(fc).map(function(e){ return [new Date(e[0]).getTime(), parseFloat(e[1]) || 0]; }).sort(function(a,b){ return a[0]-b[0]; });`,
          yaxis_id: 'power', float_precision: 2
        });
      }
      // HAEO Battery discharge forecast (inverted to match EMHASS convention)
      if (e.haeo_battery_discharge) {
        series.push({
          entity: e.haeo_battery_discharge, name: 'Discharge (plan)', color: '#FFCC80',
          type: 'area', opacity: 0.06, curve: 'stepline', extend_to: false,
          unit: ' kW', stroke_width: 1, stroke_dash: 5,
          show: { in_header: false, legend_value: false },
          data_generator: `var fc = entity.attributes.forecast; if (!fc) return []; if (Array.isArray(fc)) return fc.map(function(p){ return [new Date(p.time).getTime(), -(p.value || 0)]; }).sort(function(a,b){ return a[0]-b[0]; }); return Object.entries(fc).map(function(e){ return [new Date(e[0]).getTime(), -(parseFloat(e[1]) || 0)]; }).sort(function(a,b){ return a[0]-b[0]; });`,
          yaxis_id: 'power', float_precision: 2
        });
      }
      // HAEO Solar forecast
      if (e.haeo_solar_power) {
        series.push({
          entity: e.haeo_solar_power, name: 'Solar (plan)', color: '#FFF59D',
          type: 'area', opacity: 0.06, curve: 'smooth', extend_to: false,
          unit: ' kW', float_precision: fp, stroke_width: 1, stroke_dash: 5,
          show: { in_header: false, legend_value: false },
          data_generator: `var fc = entity.attributes.forecast; if (!fc) return []; if (Array.isArray(fc)) return fc.map(function(p){ return [new Date(p.time).getTime(), p.value || 0]; }).sort(function(a,b){ return a[0]-b[0]; }); return Object.entries(fc).map(function(e){ return [new Date(e[0]).getTime(), parseFloat(e[1]) || 0]; }).sort(function(a,b){ return a[0]-b[0]; });`,
          yaxis_id: 'power'
        });
      }
      // HAEO Grid forecast
      if (e.haeo_grid_power) {
        series.push({
          entity: e.haeo_grid_power, name: 'Grid (plan)', color: '#EF5350',
          type: 'line', curve: 'stepline', stroke_width: 1, stroke_dash: 5,
          extend_to: false, unit: ' kW',
          show: { in_header: false, legend_value: false },
          data_generator: `var fc = entity.attributes.forecast; if (!fc) return []; if (Array.isArray(fc)) return fc.map(function(p){ return [new Date(p.time).getTime(), p.value || 0]; }).sort(function(a,b){ return a[0]-b[0]; }); return Object.entries(fc).map(function(e){ return [new Date(e[0]).getTime(), parseFloat(e[1]) || 0]; }).sort(function(a,b){ return a[0]-b[0]; });`,
          yaxis_id: 'power', float_precision: 2
        });
      }
      // HAEO Load forecast (inverted)
      if (e.haeo_load_power) {
        series.push({
          entity: e.haeo_load_power, name: 'Load (plan)', color: '#CE93D8',
          type: 'line', curve: 'smooth', extend_to: false, unit: ' kW',
          float_precision: fp, stroke_width: 1, stroke_dash: 4,
          show: { in_header: false, legend_value: false, in_chart: true },
          data_generator: `var fc = entity.attributes.forecast; if (!fc) return []; if (Array.isArray(fc)) return fc.map(function(p){ return [new Date(p.time).getTime(), p.value || 0]; }).sort(function(a,b){ return a[0]-b[0]; }); return Object.entries(fc).map(function(e){ return [new Date(e[0]).getTime(), parseFloat(e[1]) || 0]; }).sort(function(a,b){ return a[0]-b[0]; });`,
          yaxis_id: 'power', invert: true, opacity: 0.6
        });
      }
      // HAEO SOC forecast (secondary axis)
      if (e.haeo_battery_soc) {
        series.push({
          entity: e.haeo_battery_soc, name: 'SOC (plan)', color: '#81C784',
          type: 'line', curve: 'stepline', stroke_width: 1, stroke_dash: 5,
          extend_to: false, unit: ' %',
          show: { in_header: false, legend_value: false },
          data_generator: `var fc = entity.attributes.forecast; if (!fc) return []; if (Array.isArray(fc)) return fc.map(function(p){ return [new Date(p.time).getTime(), p.value || 0]; }).sort(function(a,b){ return a[0]-b[0]; }); return Object.entries(fc).map(function(e){ return [new Date(e[0]).getTime(), parseFloat(e[1]) || 0]; }).sort(function(a,b){ return a[0]-b[0]; });`,
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
      // HAEO optimization cost in header
      if (features.financial_tracking && e.haeo_optim_cost) {
        series.push({
          entity: e.haeo_optim_cost, name: 'Optim Cost', unit: ' ' + (cfg.pricing?.currency || '$'),
          show: { legend_value: true, in_chart: false, in_header: true },
          float_precision: 2, yaxis_id: 'power'
        });
      }
    }

    // Price overlays — independent of EMS provider (works with EMHASS, HAEO, or standalone)
    {
      const priceUnit = ' ' + (cfg.pricing?.currency || '€') + '/kWh';
      if (e.buy_price) {
        // Universal data_generator: tries EMHASS attributes, then Amber/generic forecast, then returns empty for state-tracked fallback
        const buyDG = `var d = entity.attributes.unit_load_cost_forecasts;
if (d && d.length) return d.map(function(p){ return [new Date(p.date).getTime(), parseFloat(p.mpc_general_price || p.price || 0)]; });
var fc = entity.attributes.forecasts || entity.attributes.forecast;
if (fc && Array.isArray(fc) && fc.length) return fc.map(function(p){ return [new Date(p.start_time || p.time || p.date).getTime(), parseFloat(p.per_kwh || p.price || p.value || 0)]; });
return [];`;
        series.push({
          entity: e.buy_price, name: 'Import Price (plan)', color: '#EF9A9A',
          type: 'line', extend_to: false, unit: priceUnit,
          float_precision: 4, stroke_width: 1, opacity: 0.9,
          show: { in_header: false, legend_value: false },
          data_generator: buyDG,
          yaxis_id: 'price', curve: 'stepline', stroke_dash: 4
        });
        // State-tracked line (actual price history) — only if no separate current_import_price
        if (!e.current_import_price || e.current_import_price === e.buy_price) {
          series.push({
            entity: e.buy_price, name: 'Import Price', color: '#EF5350',
            type: 'line', opacity: 0.55, stroke_width: 2, extend_to: false,
            unit: priceUnit, float_precision: 4,
            group_by: { func: 'avg', duration: '30min' },
            show: { in_header: false, legend_value: true },
            yaxis_id: 'price', curve: 'stepline'
          });
        }
      }
      if (e.sell_price) {
        const sellDG = `var d = entity.attributes.unit_prod_price_forecasts;
if (d && d.length) return d.map(function(p){ return [new Date(p.date).getTime(), parseFloat(p.mpc_feed_in_price || p.price || 0)]; });
var fc = entity.attributes.forecasts || entity.attributes.forecast;
if (fc && Array.isArray(fc) && fc.length) return fc.map(function(p){ return [new Date(p.start_time || p.time || p.date).getTime(), parseFloat(p.per_kwh || p.price || p.value || 0)]; });
return [];`;
        series.push({
          entity: e.sell_price, name: 'Export Price (plan)', color: '#90CAF9',
          type: 'line', extend_to: false, unit: priceUnit,
          float_precision: 4, stroke_width: 1, opacity: 0.9,
          show: { in_header: false, legend_value: false },
          data_generator: sellDG,
          yaxis_id: 'price', curve: 'stepline', stroke_dash: 4
        });
        // State-tracked line — only if no separate current_export_price
        if (!e.current_export_price || e.current_export_price === e.sell_price) {
          series.push({
            entity: e.sell_price, name: 'Export Price', color: '#42A5F5',
            type: 'line', opacity: 0.55, stroke_width: 2, extend_to: false,
            unit: priceUnit, float_precision: 4,
            group_by: { func: 'avg', duration: '30min' },
            show: { in_header: false, legend_value: true },
            yaxis_id: 'price', curve: 'stepline'
          });
        }
      }
      // Actual prices (separate entities — used when buy/sell are EMHASS-specific and these are the actual Amber/Nordpool sensors)
      if (e.current_import_price && e.current_import_price !== e.buy_price) {
        series.push({
          entity: e.current_import_price, name: 'Import Price', color: '#EF5350',
          type: 'line', opacity: 0.55, stroke_width: 2, extend_to: false,
          unit: priceUnit, float_precision: 4,
          group_by: { func: 'avg', duration: '1h' },
          show: { in_header: false, legend_value: true },
          yaxis_id: 'price', curve: 'stepline'
        });
      }
      if (e.current_export_price && e.current_export_price !== e.sell_price) {
        series.push({
          entity: e.current_export_price, name: 'Export Price', color: '#42A5F5',
          type: 'line', opacity: 0.55, stroke_width: 2, extend_to: false,
          unit: priceUnit, float_precision: 4,
          group_by: { func: 'avg', duration: '1h' },
          show: { in_header: false, legend_value: true },
          yaxis_id: 'price', curve: 'stepline'
        });
      }
    }

    // Solar forecast overlay (Solcast / forecast.solar) — separate from EMHASS
    if (features.solar_forecast) {
      // Solcast detailed forecast from detailedForecast attribute
      const solcastEntity = e.solcast_today || e.solcast_remaining;
      if (solcastEntity) {
        series.push({
          entity: solcastEntity,
          name: 'Solar Forecast',
          color: '#FFD54F',
          type: 'area', opacity: 0.12, curve: 'smooth',
          extend_to: false, unit: ' kW', float_precision: 1,
          stroke_width: 1.5, stroke_dash: 5,
          show: { in_header: false, legend_value: true },
          data_generator: `var forecast = entity.attributes.detailedForecast || entity.attributes.detailed_forecast || [];
if (!forecast || !forecast.length) return [];
return forecast.map(function(d) {
  var ts = d.period_start;
  var t = typeof ts === 'string' ? new Date(ts).getTime() : new Date(ts).getTime();
  var kw = parseFloat(d.pv_estimate || 0);
  return [t, kw];
}).filter(function(p) { return !isNaN(p[0]) && !isNaN(p[1]); });`,
          yaxis_id: 'power'
        });
      }
      // If user has a separate Solcast tomorrow entity with its own detailedForecast
      if (e.solcast_tomorrow && e.solcast_tomorrow !== solcastEntity) {
        series.push({
          entity: e.solcast_tomorrow,
          name: 'Solar Forecast (tomorrow)',
          color: '#FFD54F',
          type: 'area', opacity: 0.08, curve: 'smooth',
          extend_to: false, unit: ' kW', float_precision: 1,
          stroke_width: 1, stroke_dash: 6,
          show: { in_header: false, legend_value: false, in_chart: true },
          data_generator: `var forecast = entity.attributes.detailedForecast || entity.attributes.detailed_forecast || [];
if (!forecast || !forecast.length) return [];
return forecast.map(function(d) {
  var ts = d.period_start;
  var t = typeof ts === 'string' ? new Date(ts).getTime() : new Date(ts).getTime();
  var kw = parseFloat(d.pv_estimate || 0);
  return [t, kw];
}).filter(function(p) { return !isNaN(p[0]) && !isNaN(p[1]); });`,
          yaxis_id: 'power'
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
          yaxis_id: 'power', invert: true, float_precision: 0
        });
      }
      if (e.mpc_deferrable1) {
        series.push({
          entity: e.mpc_deferrable1, name: (e.deferrable1_label || 'Deferrable 1') + ' (plan)',
          color: '#26A69A', type: 'area', opacity: 0.05, curve: 'stepline',
          extend_to: false, unit: ' kW', stroke_width: 0.8, stroke_dash: 4,
          show: { in_header: false, legend_value: false },
          data_generator: "const data = entity.attributes.deferrables_schedule;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_deferrable1) / 1000]);",
          yaxis_id: 'power', invert: true, float_precision: 0
        });
      }
      // Actual deferrable power
      if (e.deferrable0_power) {
        series.push({
          entity: e.deferrable0_power, name: e.deferrable0_label || 'Deferrable 0',
          color: '#E65100', type: 'line', stroke_width: 1.5, extend_to: false,
          transform: powerTransform, unit: ' kW',
          group_by: { func: 'avg', duration: '5min' },
          show: { in_header: false, legend_value: false },
          yaxis_id: 'power', invert: true, opacity: 1, float_precision: fp
        });
      }
    }

    // EMHASS financial header (in chart header)
    if (features.emhass && features.financial_tracking) {
      if (e.emhass_net_cost_today) {
        series.push({
          entity: e.emhass_net_cost_today, name: 'Cost Today', unit: ' ' + (cfg.pricing?.currency || '€'),
          show: { legend_value: true, in_chart: false, in_header: true },
          float_precision: 2, yaxis_id: 'power'
        });
      }
      if (e.emhass_savings_today) {
        series.push({
          entity: e.emhass_savings_today, name: 'Savings Today', unit: ' ' + (cfg.pricing?.currency || '€'),
          color: '#4CAF50',
          show: { legend_value: true, in_chart: false, in_header: true },
          float_precision: 2, yaxis_id: 'power'
        });
      }
    }

    return series;
  }

  _buildYAxes(features, cfg) {
    const currency = cfg?.pricing?.currency || '€';
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
        id: 'price', min: 'auto', max: 'auto', decimals: 2,
        opposite: true,
        apex_config: {
          title: { text: 'Price (' + currency + '/kWh)', style: { fontSize: '11px', color: '#888' } },
          labels: { style: { fontSize: '10px', colors: ['#888'] } },
          forceNiceScale: true, tickAmount: 4
        }
      });
    }
    const emsP = features.ems_provider || (features.emhass !== false ? 'emhass' : 'none');
    if (emsP === 'haeo' && features.haeo_forecasts) {
      // Add SOC and price axes for HAEO (only if not already added by EMHASS block above)
      if (!yaxis.find(y => y.id === 'soc')) {
        yaxis.push({
          id: 'soc', min: 0, max: 100, decimals: 0, show: false,
          apex_config: { title: { text: 'SOC (%)' }, opposite: true }
        });
      }
      if (!yaxis.find(y => y.id === 'price')) {
        yaxis.push({
          id: 'price', min: 'auto', max: 'auto', decimals: 2,
          opposite: true,
          apex_config: {
            title: { text: 'Price (' + currency + '/kWh)', style: { fontSize: '11px', color: '#888' } },
            labels: { style: { fontSize: '10px', colors: ['#888'] } },
            forceNiceScale: true, tickAmount: 4
          }
        });
      }
    }
    // Always add price axis if price entities are configured (standalone price without forecasts)
    const ent = cfg?.entities || {};
    if (!yaxis.find(y => y.id === 'price') && (ent.buy_price || ent.sell_price || ent.current_import_price || ent.current_export_price)) {
      yaxis.push({
        id: 'price', min: 'auto', max: 'auto', decimals: 2,
        opposite: true,
        apex_config: {
          title: { text: 'Price (' + currency + '/kWh)', style: { fontSize: '11px', color: '#888' } },
          labels: { style: { fontSize: '10px', colors: ['#888'] } },
          forceNiceScale: true, tickAmount: 4
        }
      });
    }
    return yaxis;
  }

  async _buildDashboard() {
    if (!this._hass) return;
    const store = window.SigenergyConfig;
    // Wait for any pending store save to complete before reading the dashboard config
    // This prevents a race condition where _buildDashboard reads stale data
    if (store._saveToHAPromise) {
      try { await store._saveToHAPromise; } catch(e) { /* ignore */ }
    }
    const cfg = store.get();
    const e = cfg.entities || {};
    const f = cfg.features || {};

    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });

      // Build the apex chart with conditional series
      const series = this._buildApexSeries(e, f, cfg);
      const yaxis = this._buildYAxes(f, cfg);
      const emsP = f.ems_provider || (f.emhass !== false ? 'emhass' : 'none');
      const hasEmhassForecasts = emsP === 'emhass' && f.emhass_forecasts;
      const hasHaeoForecasts = emsP === 'haeo' && f.haeo_forecasts;
      const hasForecasts = hasEmhassForecasts || hasHaeoForecasts;
      const hasSolarForecast = f.solar_forecast && (e.solcast_today || e.solcast_remaining || e.forecast_solar_today);
      const hasPriceOverlay = (e.buy_price || e.sell_price) && cfg.pricing?.show_price_overlay;
      const showExtendedChart = hasForecasts || hasSolarForecast || hasPriceOverlay;

      const apexChart = {
        type: 'custom:apexcharts-card',
        card_mod: {
          style: 'ha-card { background: var(--ha-card-background, linear-gradient(135deg, rgba(30,33,40,0.95) 0%, rgba(40,44,52,0.98) 100%)) !important; border: 1px solid var(--divider-color, rgba(92,156,230,0.12)) !important; border-radius: var(--ha-card-border-radius, 16px) !important; color: var(--primary-text-color, #fff); }'
        },
        header: {
          show: true, show_states: true, colorize_states: true,
          title: hasEmhassForecasts ? 'Energy + EMHASS Forecast' : hasHaeoForecasts ? 'Energy + HAEO Forecast' : hasSolarForecast ? 'Energy + Solar Forecast' : 'Energy Overview'
        },
        graph_span: showExtendedChart ? '48h' : '24h',
        update_interval: '60s',
        apex_config: {
          chart: {
            height: showExtendedChart ? '500px' : '350px',
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
            tickAmount: showExtendedChart ? 24 : 12
          },
          tooltip: { x: { format: 'HH:mm' }, shared: true, intersect: false },
          legend: {
            show: true, position: 'top', horizontalAlign: 'center',
            fontSize: '10px', itemMargin: { horizontal: 4, vertical: 1 }
          },
          stroke: { curve: 'smooth' },
          grid: { strokeDashArray: 3 },
          annotations: showExtendedChart ? { yaxis: [{ y: 0, yAxisIndex: 0, borderColor: 'rgba(255,255,255,0.35)', strokeDashArray: 0 }] } : undefined
        },
        now: showExtendedChart ? { show: true, label: 'Now' } : undefined,
        span: showExtendedChart ? { start: 'hour', offset: '-6h' } : undefined,
        all_series_config: { stroke_width: 2 },
        yaxis: yaxis,
        series: series
      };

      // Build EMS status card (EMHASS or HAEO — conditional)
      let emsStatusCard = null;
      if (emsP === 'emhass' && e.emhass_mode) {
        emsStatusCard = {
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
            card_mod: { style: 'ha-card { background: linear-gradient(135deg, rgba(0,180,120,0.15), rgba(0,120,80,0.08)) !important; border: 1px solid rgba(0,180,120,0.25) !important; border-radius: 12px !important; color: var(--primary-text-color, #fff); } mushroom-state-info { --card-primary-font-size: 15px; --card-secondary-font-size: 11px; overflow: visible !important; white-space: normal !important; }' }
          }
        };
      } else if (emsP === 'haeo' && e.haeo_optim_status) {
        emsStatusCard = {
          type: 'conditional',
          conditions: [{ entity: e.haeo_optim_status, state_not: 'unavailable' }],
          card: {
            type: 'custom:mushroom-template-card',
            entity: e.haeo_optim_status,
            primary: "HAEO: {{ states('" + e.haeo_optim_status + "') }}",
            secondary: e.haeo_optim_cost ? "Cost: {{ states('" + e.haeo_optim_cost + "') | round(2) }}" + (e.haeo_optim_duration ? " | {{ states('" + e.haeo_optim_duration + "') | round(1) }}s" : '') : '',
            icon: "{% if states('" + e.haeo_optim_status + "') == 'success' %}mdi:check-circle{% elif states('" + e.haeo_optim_status + "') == 'failed' %}mdi:alert-circle{% else %}mdi:timer-sand{% endif %}",
            icon_color: "{% if states('" + e.haeo_optim_status + "') == 'success' %}green{% elif states('" + e.haeo_optim_status + "') == 'failed' %}red{% else %}amber{% endif %}",
            fill_container: true, multiline_secondary: true,
            card_mod: { style: 'ha-card { background: linear-gradient(135deg, rgba(124,77,255,0.15), rgba(80,50,180,0.08)) !important; border: 1px solid rgba(124,77,255,0.25) !important; border-radius: 12px !important; color: var(--primary-text-color, #fff); } mushroom-state-info { --card-primary-font-size: 15px; --card-secondary-font-size: 11px; overflow: visible !important; white-space: normal !important; }' }
          }
        };
      }

      // Build status mushroom cards
      // Helper: build Jinja template that shows value + unit from the sensor itself
      const _powerTpl = (eid) => {
        // Normalise to watts then auto-scale so the chip always shows a sensible value.
        // state_attr might return None (HA bug / entity loading), so coerce via default(…, true).
        return "{% set u = (state_attr('" + eid + "', 'unit_of_measurement') or 'W') | string %}" +
               "{% set raw = states('" + eid + "') | float(0) %}" +
               "{% set w = raw * 1000 if u == 'kW' else raw %}" +
               "{% if w >= 1000 %}{{ (w / 1000) | round(2) }} kW{% else %}{{ w | round(0) }} W{% endif %}";
      };

      // Theme-aware card style — uses HA CSS variables with dark-theme fallbacks
      const _cardStyle = 'ha-card { background: var(--ha-card-background, rgba(30,35,54,0.94)) !important; border: 1px solid var(--divider-color, #2d3451) !important; border-radius: 12px !important; } mushroom-state-info { --card-primary-font-size: 20px !important; font-weight: bold !important; --card-secondary-font-size: 11px; }';
      const statusCards = [
        {
          type: 'custom:mushroom-template-card',
          entity: e.solar_power || 'sensor.solar_production',
          primary: 'Solar', icon: 'mdi:solar-power', icon_color: 'orange',
          secondary: _powerTpl(e.solar_power || 'sensor.solar_production'),
          card_mod: { style: _cardStyle }
        },
        {
          type: 'custom:mushroom-template-card',
          entity: e.load_power || 'sensor.home_consumption',
          primary: 'Home', icon: 'mdi:home-lightning-bolt', icon_color: 'deep-purple',
          secondary: _powerTpl(e.load_power || 'sensor.home_consumption'),
          card_mod: { style: _cardStyle }
        },
        {
          type: 'custom:mushroom-template-card',
          entity: e.battery_soc || 'sensor.battery_soc',
          primary: 'Battery', icon: 'mdi:battery', icon_color: 'green',
          secondary: "{{ states('" + (e.battery_soc || 'sensor.battery_soc') + "') | round(0) }}%",
          card_mod: { style: _cardStyle }
        },
        {
          type: 'custom:mushroom-template-card',
          entity: e.grid_active_power || e.grid_power || 'sensor.net_grid_power',
          primary: 'Grid', icon: 'mdi:transmission-tower', icon_color: 'red',
          secondary: _powerTpl(e.grid_active_power || e.grid_power || 'sensor.net_grid_power'),
          card_mod: { style: _cardStyle }
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
          card_mod: { style: _cardStyle }
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
        card_mod: { style: 'ha-card { background: var(--ha-card-background, rgba(30,35,54,0.94)) !important; border: 1px solid var(--divider-color, #2d3451) !important; border-radius: 12px !important; }' }
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
        card_mod: { style: 'ha-card { --ha-card-background: transparent !important; --card-background-color: transparent !important; box-shadow: none !important; }' }
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

      // Card 0: House + optional EMS status
      // Get existing house card or create default, sync entities from store, and add min-height
      const houseCardOrig = mainLayout.cards[0]?.cards?.[0] || { type: 'custom:sigenergy-house-card' };
      // Auto-fill battery_capacity if empty and a capacity entity exists (for runtime estimation)
      if (!e.battery_capacity && !e.battery_capacity_kwh && this._hass) {
        const capKeys = Object.keys(this._hass.states).filter(k => {
          const lower = k.toLowerCase();
          return lower.includes('battery') && (lower.includes('rated_capacity') || lower.includes('rated_energy') || lower.includes('capacity_kwh') || lower.includes('capacity_ah'));
        });
        if (capKeys.length > 0) {
          const autoCapKey = capKeys.find(k => k.includes('kwh')) || capKeys.find(k => k.includes('capacity') && !k.includes('_ah')) || capKeys[0];
          e.battery_capacity = autoCapKey;
          // Also save to config store so it persists
          const cfg2 = store.get();
          cfg2.entities.battery_capacity = autoCapKey;
          store.save(cfg2);
          console.log('Auto-detected battery capacity entity:', autoCapKey);
        }
      }
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
        heat_pump_power: e.heat_pump_power || e.deferrable0_power || '',
        battery_capacity: e.battery_capacity || '',
        battery_max_soc: e.battery_max_soc || '',
        battery_min_soc: e.battery_min_soc || '',
        battery_reserved_soc: e.battery_reserved_soc || ''
      };
      // Sync manual battery capacity override — always set or clear explicitly
      if (e.battery_capacity_kwh) {
        houseCardOrig.battery_capacity_kwh = parseFloat(e.battery_capacity_kwh) || 0;
      } else {
        delete houseCardOrig.battery_capacity_kwh;
      }
      // Sync manual SoC target overrides — always set or clear explicitly
      if (e.battery_max_soc_pct != null && e.battery_max_soc_pct !== '') {
        houseCardOrig.battery_max_soc_pct = parseInt(e.battery_max_soc_pct);
      } else {
        delete houseCardOrig.battery_max_soc_pct;
      }
      if (e.battery_min_soc_pct != null && e.battery_min_soc_pct !== '') {
        houseCardOrig.battery_min_soc_pct = parseInt(e.battery_min_soc_pct);
      } else {
        delete houseCardOrig.battery_min_soc_pct;
      }
      if (e.battery_reserved_soc_pct != null && e.battery_reserved_soc_pct !== '') {
        houseCardOrig.battery_reserved_soc_pct = parseInt(e.battery_reserved_soc_pct);
      } else {
        delete houseCardOrig.battery_reserved_soc_pct;
      }
      // Sync ALL features from config store to house card
      if (!houseCardOrig.features) houseCardOrig.features = {};
      // Remove stale image_path from old configs — house card auto-detects the correct path
      delete houseCardOrig.image_path;
      houseCardOrig.features.ev_charger = f.ev_charger || false;
      houseCardOrig.features.ev_vehicle = f.ev_vehicle || false;
      houseCardOrig.features.heat_pump = f.heat_pump || false;
      houseCardOrig.features.grid = f.grid_connection !== false;
      houseCardOrig.features.hide_cables = f.hide_cables || false;
      houseCardOrig.features.battery_runtime = f.battery_runtime !== false;
      // Sigenergy convention: positive battery_power = charging
      houseCardOrig.battery_positive_charging = (f.battery_positive_charging !== false);
      // Battery label override (e.g. "SigenStor", "Huawei LUNA", "PowerWall")
      const battLabel = cfg.display?.battery_label;
      if (battLabel) {
        houseCardOrig.battery_label = battLabel;
      } else {
        delete houseCardOrig.battery_label;
      }
      if (!houseCardOrig.card_mod) houseCardOrig.card_mod = {};
      houseCardOrig.card_mod.style = 'ha-card { overflow: hidden !important; }\n.house-container { width: 100% !important; overflow: hidden !important; }\n.house-container img { width: 100% !important; height: auto !important; }\n.house-container svg { width: 100% !important; height: auto !important; }';
      const houseStack = [houseCardOrig];
      if (emsStatusCard) houseStack.push(emsStatusCard);
      if (solcastCard) houseStack.push(solcastCard);
      newCards.push({ type: 'vertical-stack', cards: houseStack });

      // Card 1: Sankey (rebuild from store entities)
      const sankeyTitle = mainLayout.cards[1]?.cards?.[0] || {
        type: 'custom:mushroom-template-card',
        primary: 'Energy Flow Today', icon: 'mdi:chart-sankey-variant', icon_color: 'teal',
        card_mod: { style: { 'ha-tile-info$': '.primary { font-size: 20px !important; font-weight: bold !important; color: var(--primary-text-color, #fff) !important; letter-spacing: 0.5px; }', '.': 'ha-card { --ha-card-background: transparent !important; --card-background-color: transparent !important; border: none !important; }' } }
      };
      const sankeyOld = mainLayout.cards[1]?.cards?.[1] || {};
      // Resolve EV/HP entity IDs — use utility meter if cumulative, otherwise direct entity
      const evSankeyEntity = (f.ev_energy_is_cumulative && e.ev_energy_daily_meter) ? e.ev_energy_daily_meter : e.ev_energy_today;
      const hpSankeyEntity = (f.hp_energy_is_cumulative && e.hp_energy_daily_meter) ? e.hp_energy_daily_meter : e.heat_pump_energy_today;

      // Build Sankey destinations list (Load is always present, EV/HP are optional)
      const sankeyDest = [];
      if (e.load_energy_today) sankeyDest.push({ entity_id: e.load_energy_today, name: 'Home', color: '#e8337f' });
      if (f.show_ev_in_sankey && evSankeyEntity) sankeyDest.push({ entity_id: evSankeyEntity, name: 'EV', color: '#ff69b4' });
      if (f.show_hp_in_sankey && hpSankeyEntity) sankeyDest.push({ entity_id: hpSankeyEntity, name: 'HP', color: '#e67e22' });
      if (e.battery_charge_today) sankeyDest.push({ entity_id: e.battery_charge_today, name: 'Battery', color: '#00d4b8' });
      if (e.grid_export_today) sankeyDest.push({ entity_id: e.grid_export_today, name: 'Grid', color: '#7c5cbf' });

      // Build source children arrays — sources can flow to all destinations
      const battDischargeChildren = [e.grid_export_today, e.load_energy_today].filter(Boolean);
      const solarChildren = [e.battery_charge_today, e.grid_export_today, e.load_energy_today].filter(Boolean);
      const gridImportChildren = [e.battery_charge_today, e.load_energy_today].filter(Boolean);

      // Add EV/HP as potential children of all sources (energy can flow from any source)
      if (f.show_ev_in_sankey && evSankeyEntity) {
        battDischargeChildren.push(evSankeyEntity);
        solarChildren.push(evSankeyEntity);
        gridImportChildren.push(evSankeyEntity);
      }
      if (f.show_hp_in_sankey && hpSankeyEntity) {
        battDischargeChildren.push(hpSankeyEntity);
        solarChildren.push(hpSankeyEntity);
        gridImportChildren.push(hpSankeyEntity);
      }

      const sankeyChart = {
        type: 'custom:sankey-chart',
        layout: 'horizontal',
        show_names: true, show_states: true, show_units: true, show_icons: false,
        round: 1, height: 480, wide: true,
        min_box_size: 50, min_box_distance: 8, unit_prefix: 'k',
        min_state: 0.01,
        energy_date_selection: false,
        sections: [
          {
            // Order matters! ha-sankey-chart uses greedy allocation (first source claims
            // destinations first). Put smallest source (Grid) first so it gets visible
            // flow lines even when larger sources would otherwise consume all destinations.
            entities: [
              { entity_id: e.grid_import_today, name: 'Grid', color: '#6b7fd4', children: gridImportChildren },
              { entity_id: e.battery_discharge_today, name: 'Battery', color: '#00d4b8', children: battDischargeChildren },
              { entity_id: e.solar_energy_today, name: 'Solar', color: '#c8b84a', children: solarChildren }
            ].filter(x => x.entity_id)
          },
          {
            entities: sankeyDest.filter(x => x.entity_id)
          }
        ],
        card_mod: sankeyOld.card_mod || {}
      };
      // Rebuild the Jinja :host{} block fresh — includes EV/HP CSS variables when enabled
      const _j = (eid) => "states('" + eid + "') | float(0)";
      let jinjaHost = "{% set pv = " + _j(e.solar_energy_today || '') + " %}\n";
      jinjaHost += "{% set bat_d = " + _j(e.battery_discharge_today || '') + " %}\n";
      jinjaHost += "{% set grid_i = " + _j(e.grid_import_today || '') + " %}\n";
      jinjaHost += "{% set bat_c = " + _j(e.battery_charge_today || '') + " %}\n";
      jinjaHost += "{% set load = " + _j(e.load_energy_today || '') + " %}\n";
      jinjaHost += "{% set grid_e = " + _j(e.grid_export_today || '') + " %}\n";
      let dstSum = 'bat_c + load + grid_e';
      if (f.show_ev_in_sankey && evSankeyEntity) {
        jinjaHost += "{% set ev = " + _j(evSankeyEntity) + " %}\n";
        dstSum += ' + ev';
      }
      if (f.show_hp_in_sankey && hpSankeyEntity) {
        jinjaHost += "{% set hp = " + _j(hpSankeyEntity) + " %}\n";
        dstSum += ' + hp';
      }
      jinjaHost += "{% set src = pv + bat_d + grid_i %}\n";
      jinjaHost += "{% set dst = " + dstSum + " %}\n";
      jinjaHost += ":host {\n";
      jinjaHost += "  --pct-src-solar: \"{{ '%0.2f' | format((pv/src*100) if src > 0 else 0) }}%\";\n";
      jinjaHost += "  --pct-src-bat: \"{{ '%0.2f' | format((bat_d/src*100) if src > 0 else 0) }}%\";\n";
      jinjaHost += "  --pct-src-grid: \"{{ '%0.2f' | format((grid_i/src*100) if src > 0 else 0) }}%\";\n";
      jinjaHost += "  --pct-dst-bat: \"{{ '%0.2f' | format((bat_c/dst*100) if dst > 0 else 0) }}%\";\n";
      jinjaHost += "  --pct-dst-load: \"{{ '%0.2f' | format((load/dst*100) if dst > 0 else 0) }}%\";\n";
      jinjaHost += "  --pct-dst-grid: \"{{ '%0.2f' | format((grid_e/dst*100) if dst > 0 else 0) }}%\";\n";
      if (f.show_ev_in_sankey && evSankeyEntity) {
        jinjaHost += "  --pct-dst-ev: \"{{ '%0.2f' | format((ev/dst*100) if dst > 0 else 0) }}%\";\n";
      }
      if (f.show_hp_in_sankey && hpSankeyEntity) {
        jinjaHost += "  --pct-dst-hp: \"{{ '%0.2f' | format((hp/dst*100) if dst > 0 else 0) }}%\";\n";
      }
      jinjaHost += "}\n";

      // Fix sankey CSS: strip old :host block + accumulated layout rules, then prepend fresh Jinja
      if (sankeyChart.card_mod?.style?.['sankey-chart-base$']) {
        let css = sankeyChart.card_mod.style['sankey-chart-base$'];
        // Remove ALL old Jinja :host blocks (can accumulate from repeated builds)
        while (/\{%\s*set\s+pv[\s\S]*?:host\s*\{[\s\S]*?\}\n?/.test(css)) {
          css = css.replace(/\{%\s*set\s+pv[\s\S]*?:host\s*\{[\s\S]*?\}\n?/, '');
        }
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
        // Remove ALL accumulated layout fix blocks and duplicates
        css = css.replace(/\/\* Sankey layout fix[^*]*\*\/\n?/g, '');
        css = css.replace(/\.section:first-of-type\s*\{[^}]*flex[^}]*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\{[^}]*flex[^}]*\}\n?/g, '');
        // Remove ALL accumulated duplicate rules from prior rebuilds
        css = css.replace(/\.section:last-of-type\s*\.box\s*\{\s*flex-direction:\s*row-reverse\s*!important;\s*\}\n?/g, '');
        css = css.replace(/@media\s*\(max-width:\s*800px\)\s*\{\s*\}\n?/g, '');
        css = css.replace(/@media\s*\(max-width:\s*800px\)\s*\{  \}\n?/g, '');
        // Remove accumulated EV/HP/Home duplicate rules before re-adding
        css = css.replace(/\.box\s*>\s*div\[title\*="EV"\]\s*~\s*\.label\s*\.name\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.box\s*>\s*div\[title\*="HP"\]\s*~\s*\.label\s*\.name\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.box\s*>\s*div\[title\*="Heat"\]\s*~\s*\.label\s*\.name\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.box\s*>\s*div\[title\*="Home"\]\s*~\s*\.label\s*\.name\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\.box\s*>\s*div\[title\*="EV"\]\s*~\s*\.label::after\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\.box\s*>\s*div\[title\*="HP"\]\s*~\s*\.label::after\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\.box\s*>\s*div\[title\*="Heat"\]\s*~\s*\.label::after\s*\{[^}]*\}\n?/g, '');
        css = css.replace(/\.section:last-of-type\s*\.box\s*>\s*div\[title\*="Home"\]\s*~\s*\.label::after\s*\{[^}]*\}\n?/g, '');
        // Replace hardcoded dark-theme Sankey background with theme-aware transparent
        // ha-card reads --ha-card-background in its :host shadow DOM, so set the variable
        css = css.replace(/ha-card\s*\{\s*background:\s*#1a1f2e\s*!important/g, 'ha-card { --ha-card-background: transparent !important; --card-background-color: transparent !important; background: var(--ha-card-background, transparent) !important');
        // Update Sankey card border-radius to 16px.
        // ha-card has its own shadow DOM with :host { border-radius: var(--ha-card-border-radius) }
        // Parent layout-card resets --ha-card-border-radius to 0, so we override it on ha-card itself.
        // Setting the CSS variable propagates into ha-card's shadow DOM :host styling.
        css = css.replace(/border-radius:\s*4px\s*!important;?/g, '');
        css = css.replace(/border-radius:\s*var\(--ha-card-border-radius,\s*16px\)\s*!important;?/g, '');
        css = css.replace(/border-radius:\s*16px\s*!important;?/g, '');
        // Remove any old --ha-card-border-radius override to avoid duplication
        css = css.replace(/ha-card\s*\{\s*--ha-card-border-radius:[^}]*\}\n?/g, '');
        // Set the CSS variable on ha-card so its shadow DOM :host picks up 16px
        // Also override overflow to clip content at rounded corners (connectors are inside .container)
        css += '\nha-card { --ha-card-border-radius: 16px !important; overflow: hidden !important; }\n';
        // Collapse multiple blank lines
        css = css.replace(/\n{3,}/g, '\n\n');
        // Prepend fresh Jinja :host block
        css = jinjaHost + css;
        // Always rebuild the layout/connector/EV/HP rules fresh from scratch
        css += '\n/* Sankey layout fix */\n';
        css += '.section:first-of-type { flex: 1 1 auto !important; max-width: none !important; }\n';
        css += '.section:last-of-type { flex: 0 0 auto !important; width: auto !important; max-width: none !important; position: relative !important; z-index: 2 !important; }\n';
        css += '.section:last-of-type .box { flex-direction: row-reverse !important; }\n';
        css += '.connectors { left: 90px !important; width: calc(100% - 88px) !important; overflow: visible !important; z-index: 1 !important; }\n';
        css += '.connectors svg { width: 100% !important; left: 0 !important; overflow: visible !important; }\n';
        css += '@media (max-width: 800px) { .connectors { left: 65px !important; width: calc(100% - 63px) !important; } }\n';
        // EV/HP pill border colors + destination percentages
        css += '.box > div[title*="EV"] ~ .label .name { border-color: #ff69b4 !important; }\n';
        css += '.box > div[title*="HP"] ~ .label .name { border-color: #e67e22 !important; }\n';
        css += '.box > div[title*="Home"] ~ .label .name { border-color: #e8337f !important; }\n';
        css += '.section:last-of-type .box > div[title*="EV"] ~ .label::after { content: var(--pct-dst-ev); }\n';
        css += '.section:last-of-type .box > div[title*="HP"] ~ .label::after { content: var(--pct-dst-hp); }\n';
        css += '.section:last-of-type .box > div[title*="Home"] ~ .label::after { content: var(--pct-dst-load); }\n';
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

      // Preserve persistent config on the layout card — use current store state
      // (not the version from disk, which may be stale due to async save race)
      mainLayout.cards = newCards;
      mainLayout._sigenergy_config = store.get();

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
        <div class="row">
          <span class="row-label">Battery Label</span>
          <input class="row-input" type="text" value="${d.battery_label||''}" data-key="battery_label" placeholder="BATTERY" />
          <span class="row-state">Name shown on house card</span>
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
      <div class="section">
        <div class="section-title">💾 Configuration Profiles</div>
        <div style="font-size:10px;color:#666;margin-bottom:8px;">Save up to 3 named snapshots of your entire configuration (entities, features, pricing, display).</div>
        ${(() => {
          const profiles = JSON.parse(localStorage.getItem('sigenergy_dashboard_profiles') || '[]');
          return [0,1,2].map(i => {
            const p = profiles[i] || null;
            const nameVal = p ? this._esc(p.name || 'Profile ' + (i+1)) : '';
            const savedAt = p ? new Date(p.savedAt).toLocaleString() : '';
            return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding:8px;background:rgba(45,52,81,0.4);border-radius:8px;">' +
              '<span style="font-size:12px;font-weight:600;color:#00d4b8;min-width:18px;">' + (i+1) + '</span>' +
              '<input class="row-input profile-name" data-slot="' + i + '" value="' + nameVal + '" placeholder="Profile ' + (i+1) + '" style="flex:1;max-width:140px;" />' +
              '<button class="profile-save-btn" data-slot="' + i + '" style="padding:4px 8px;background:#00d4b8;color:#1a1f2e;border:none;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;">Save</button>' +
              (p ? '<button class="profile-load-btn" data-slot="' + i + '" style="padding:4px 8px;background:#3F51B5;color:#fff;border:none;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;">Load</button>' +
              '<button class="profile-del-btn" data-slot="' + i + '" style="padding:4px 8px;background:#e74c3c;color:#fff;border:none;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;">✕</button>' : '') +
              (savedAt ? '<span style="font-size:9px;color:#8892a4;">' + savedAt + '</span>' : '<span style="font-size:9px;color:#666;">Empty</span>') +
              '</div>';
          }).join('');
        })()}
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
        // Sync battery_label directly to house card when changed
        if (key === 'battery_label') {
          this._syncBatteryLabelToDashboard(val);
        }
      });
    });

    // ── Profile handlers ──────────────────────────────────────
    el.querySelectorAll('.profile-save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot);
        const nameInput = el.querySelector('.profile-name[data-slot="' + slot + '"]');
        const profiles = JSON.parse(localStorage.getItem('sigenergy_dashboard_profiles') || '[]');
        const currentCfg = this._storeGet();
        profiles[slot] = {
          name: (nameInput?.value || '').trim() || 'Profile ' + (slot + 1),
          savedAt: new Date().toISOString(),
          config: { entities: { ...currentCfg.entities }, features: { ...currentCfg.features }, pricing: { ...currentCfg.pricing }, display: { ...currentCfg.display } }
        };
        localStorage.setItem('sigenergy_dashboard_profiles', JSON.stringify(profiles));
        btn.textContent = '✅'; setTimeout(() => { this._render(); }, 1000);
      });
    });
    el.querySelectorAll('.profile-load-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot);
        const profiles = JSON.parse(localStorage.getItem('sigenergy_dashboard_profiles') || '[]');
        const prof = profiles[slot];
        if (!prof?.config) return;
        const cfg2 = this._storeGet();
        if (prof.config.entities) cfg2.entities = { ...cfg2.entities, ...prof.config.entities };
        if (prof.config.features) cfg2.features = { ...cfg2.features, ...prof.config.features };
        if (prof.config.pricing) cfg2.pricing = { ...cfg2.pricing, ...prof.config.pricing };
        if (prof.config.display) cfg2.display = { ...cfg2.display, ...prof.config.display };
        this._storeSave(cfg2);
        btn.textContent = '✅ Loaded'; setTimeout(() => { this._render(); }, 500);
      });
    });
    el.querySelectorAll('.profile-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot);
        const profiles = JSON.parse(localStorage.getItem('sigenergy_dashboard_profiles') || '[]');
        profiles[slot] = null;
        localStorage.setItem('sigenergy_dashboard_profiles', JSON.stringify(profiles));
        this._render();
      });
    });
  }
}

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

  /**
   * Check which required HACS frontend cards are missing.
   * Returns an array of { name, tag, hacs, purpose, owner, repository } objects.
   */
  _checkPrerequisites() {
    const REQUIRED_CARDS = [
      { name: 'Layout Card', tag: 'layout-card', hacs: 'layout-card', owner: 'thomasloven', repository: 'lovelace-layout-card', purpose: 'Responsive grid layout' },
      { name: 'ApexCharts Card', tag: 'apexcharts-card', hacs: 'apexcharts-card', owner: 'RomRider', repository: 'apexcharts-card', purpose: 'Energy time-series charts' },
      { name: 'Sankey Chart Card', tag: 'sankey-chart', hacs: 'ha-sankey-chart', owner: 'MindFreeze', repository: 'ha-sankey-chart', purpose: 'Energy flow diagram' },
      { name: 'Mushroom Cards', tag: 'mushroom-template-card', hacs: 'mushroom', owner: 'piitaya', repository: 'lovelace-mushroom', purpose: 'Status pills and cards' },
      { name: 'Card Mod', tag: 'mod-card', hacs: 'lovelace-card-mod', owner: 'thomasloven', repository: 'lovelace-card-mod', purpose: 'CSS styling injection' },
    ];
    const missing = [];
    for (const card of REQUIRED_CARDS) {
      if (!customElements.get(card.tag)) {
        missing.push(card);
      }
    }
    return missing;
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

  // Get a power entity value normalized to Watts (handles sensors that report in W, kW, or MW)
  _getPowerInWatts(entityId) {
    if (!this._hass || !entityId) return null;
    const s = this._hass.states[entityId];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;
    const v = parseFloat(s.state);
    if (isNaN(v)) return null;
    const unit = (s.attributes.unit_of_measurement || '').toLowerCase();
    if (unit === 'kw') return v * 1000;
    if (unit === 'mw') return v * 1000000;
    return v;
  }

  _fmtPower(w) {
    if (w === null) return '— W';
    const store = window.SigenergyConfig;
    const dps = store ? (store.getDisplay('decimal_places') ?? 1) : 1;
    const abs = Math.abs(w);
    return abs >= 1000 ? (abs / 1000).toFixed(Math.max(dps, 1)) + ' kW' : abs.toFixed(0) + ' W';
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
    const invPower = this._getPowerInWatts(invPowerEntity);
    const battSocFallback = this._getVal(battSocEntity);
    const packSocs = [];
    for (let p = 1; p <= packs; p++) {
      const packEntity = store ? store.getEntity('battery_pack' + p + '_soc') : null;
      const val = packEntity ? this._getVal(packEntity) : null;
      packSocs.push(val !== null ? val : battSocFallback);
    }
    const invFmt = this._fmtPower(invPower);

    // Check for missing prerequisite cards
    const missingCards = this._checkPrerequisites();
    const prereqDismissed = localStorage.getItem('genergy_prereq_dismissed_overview') === 'true';
    var prereqBanner = '';
    if (missingCards.length > 0 && !prereqDismissed) {
      prereqBanner = '<div style="background:var(--ha-card-background,linear-gradient(135deg,#1a2332,#1e2a3a));border:1px solid #f59e0b;border-radius:12px;padding:12px 16px;margin-bottom:12px;font-family:var(--ha-card-header-font-family,inherit)">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:18px">⚠️</span><span style="font-size:14px;font-weight:600;color:#f59e0b">Missing Required Cards</span></div>' +
        '<p style="font-size:12px;color:var(--secondary-text-color,#8892a4);margin:0 0 8px;line-height:1.4">Install these HACS plugins for the dashboard to work properly, then hard-refresh (Ctrl+Shift+R).</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">' +
        missingCards.map(function(c) {
          return '<a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=' + c.owner + '&repository=' + c.repository + '&category=plugin" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:4px 10px;text-decoration:none;font-size:11px;color:#f59e0b;white-space:nowrap">' +
            '<span>' + c.name + '</span><span style="font-size:9px;opacity:0.7">↗</span></a>';
        }).join('') +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="prereq-dismiss-overview" style="background:none;border:1px solid var(--divider-color,#4a4e5866);border-radius:8px;padding:4px 12px;font-size:11px;color:var(--secondary-text-color,#8892a4);cursor:pointer">Dismiss</button>' +
        '<a href="/dashboard-sigenergy/settings" style="display:inline-flex;align-items:center;gap:4px;background:rgba(0,212,184,0.1);border:1px solid rgba(0,212,184,0.3);border-radius:8px;padding:4px 12px;text-decoration:none;font-size:11px;color:#00d4b8">Open Settings ↗</a>' +
        '</div></div>';
    }

    /* ── Compact layout for narrow cards ── */
    if (this._cardWidth < 380) {
      var np = Math.max(1, Math.min(packs, 8));
      var imgSrc = _SIGENERGY_SCRIPT_DIR + 'images/1inverter' + np + 'battery.png';
      var html = '<style>:host{display:block}.card{background:var(--ha-card-background,#1a1f2e);border-radius:16px;padding:12px;overflow:hidden;text-align:center;color:var(--primary-text-color,#fff)}.img{max-width:100%;height:auto;margin:0 auto 12px;display:block}.labels{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.pill{background:var(--card-background-color,rgba(30,35,54,0.94));border:1px solid var(--divider-color,#2d3451);border-radius:14px;padding:8px 14px;display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer}.pill-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}.pill-name{font-size:15px;font-weight:600;color:var(--primary-text-color,#e0e4ec);white-space:nowrap}.pill-val{font-size:16px;font-weight:700;color:var(--primary-text-color,#fff);white-space:nowrap}</style>';
      html += '<div class="card">';
      html += prereqBanner;
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
    var imgHs = [342, 552, 750, 963, 1170, 1398, 1602, 1602, 1602];
    var np = Math.max(1, Math.min(packs, 8));
    var imgH = imgHs[np] || imgHs[6];
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
    var dps = store ? (store.getDisplay('decimal_places') ?? 1) : 1; // user-configurable decimal places

    var fmtEntity = function(eid, decimals, unit) {
      if (!self._hass || !eid) return '—';
      var s = self._hass.states[eid];
      if (!s || s.state === 'unavailable' || s.state === 'unknown') return '—';
      var v = parseFloat(s.state);
      if (isNaN(v)) return s.state;
      // Unit-aware: if caller expects W but entity reports kW, convert
      var entityUnit = (s.attributes.unit_of_measurement || '').toLowerCase();
      if (unit === 'W' || unit === 'w') {
        if (entityUnit === 'kw') { v = v * 1000; }
        else if (entityUnit === 'mw') { v = v * 1000000; }
      }
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
      var pvStrings = store ? (store.getFeature && store.getFeature('pv_strings')) || 2 : 2;
      var gridV = store ? store.getEntity('grid_voltage') : 'sensor.deyeinvertermaster_grid_voltage_l1';
      var gridHz = store ? store.getEntity('grid_frequency') : 'sensor.deyeinvertermaster_grid_frequency';
      var gridVL2 = store ? store.getEntity('grid_voltage_l2') : '';
      var gridVL3 = store ? store.getEntity('grid_voltage_l3') : '';
      var threePhase = store ? (store.getFeature && store.getFeature('three_phase')) : false;
      panels += '<div style="' + panelStyle + '">';
      panels += '<div style="' + headerStyle + '">⚡ Inverter Details</div>';
      panels += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(invTemp || invIntTemp, dps, '°C') + '</span><span style="' + statLbl + '">Temperature</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(invOutput, 0, 'W') + '</span><span style="' + statLbl + '">Output</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + (function() {
        if (!invRated || fmtEntity(invRated, 0, '') === '—') return '—';
        var rs = self._hass.states[invRated]; if (!rs) return '—';
        var rv = parseFloat(rs.state); if (isNaN(rv)) return '—';
        var ru = (rs.attributes.unit_of_measurement || '').toLowerCase();
        if (ru === 'kw') return rv.toFixed(dps) + 'kW';
        if (ru === 'mw') return (rv * 1000).toFixed(dps) + 'kW';
        return (rv / 1000).toFixed(dps) + 'kW';
      })() + '</span><span style="' + statLbl + '">Rated</span></div>';
      for (var pvi = 1; pvi <= pvStrings; pvi++) {
        var pvEnt = store ? store.getEntity('pv' + pvi + '_power') : (pvi === 1 ? pvOne : pvi === 2 ? pvTwo : '');
        if (pvEnt) {
          panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(pvEnt, 0, 'W') + '</span><span style="' + statLbl + '">PV' + pvi + '</span></div>';
        }
      }
      if (threePhase && gridVL2 && gridVL3) {
        panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridV, dps, 'V') + '</span><span style="' + statLbl + '">Grid L1</span></div>';
        panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridVL2, dps, 'V') + '</span><span style="' + statLbl + '">Grid L2</span></div>';
        panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridVL3, dps, 'V') + '</span><span style="' + statLbl + '">Grid L3</span></div>';
      } else {
        panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridV, dps, 'V') + '</span><span style="' + statLbl + '">Grid V</span></div>';
      }
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridHz, dps, 'Hz') + '</span><span style="' + statLbl + '">Grid Hz</span></div>';
      panels += '</div></div>';
    }

    for (var p = 1; p <= np; p++) {
      if (!this._expanded['battery' + p]) continue;
      var pad = p < 10 ? '0' + p : '' + p;
      var prefix = 'sensor.battery_monitor_pack_' + pad + '_view_';
      panels += '<div style="' + panelStyle + '">';
      panels += '<div style="' + headerStyle + '">🔋 Battery ' + p + ' Details</div>';
      panels += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'soc', dps, '%') + '</span><span style="' + statLbl + '">SoC</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'soh', dps, '%') + '</span><span style="' + statLbl + '">SoH</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'voltage', dps, 'V') + '</span><span style="' + statLbl + '">Voltage</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'current', dps, 'A') + '</span><span style="' + statLbl + '">Current</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'power', 0, 'W') + '</span><span style="' + statLbl + '">Power</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'cycle_number', 0, '') + '</span><span style="' + statLbl + '">Cycles</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'remain_capacity', dps, 'Ah') + '</span><span style="' + statLbl + '">Remain</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(prefix + 'full_capacity', dps, 'Ah') + '</span><span style="' + statLbl + '">Full Cap</span></div>';
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
      var temp1 = fmtEntity('sensor.battery_monitor_pack_' + pad + '_temperature_01', dps, '°C');
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + temp1 + '</span><span style="' + statLbl + '">Temp</span></div>';
      panels += '</div></div>';
    }

    this.shadowRoot.innerHTML =
      '<style>:host{display:block}.card{background:var(--ha-card-background,#1a1f2e);border-radius:16px;padding:12px 4px;overflow:hidden;color:var(--primary-text-color,#fff)} .chevron{cursor:pointer;pointer-events:all;-webkit-tap-highlight-color:transparent;touch-action:manipulation} .chevron *{pointer-events:all} .chevron:hover circle,.chevron:active circle{fill:#3a3e48}</style>' +
      '<div class="card">' + prereqBanner +
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

    // Wire up dismiss button for prerequisite banner
    var dismissBtn = this.shadowRoot.querySelector('.prereq-dismiss-overview');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function() {
        localStorage.setItem('genergy_prereq_dismissed_overview', 'true');
        self._render();
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Robust Element Registration — belt-and-suspenders approach
// Handles ES module caching, race conditions, and timing issues
// ═══════════════════════════════════════════════════════════

// Store class references on window for resilient re-registration
window.__sigCardClasses = window.__sigCardClasses || {};
window.__sigCardClasses['sigenergy-settings-card'] = SigenergySettingsCard;
window.__sigCardClasses['sigenergy-device-card'] = SigenergyDeviceCard;

// Core registration function — safe to call repeatedly
function _sigRegisterAll() {
  var registered = 0;
  var classes = window.__sigCardClasses;
  if (!classes) return 0;
  for (var name in classes) {
    if (!customElements.get(name)) {
      try {
        customElements.define(name, classes[name]);
        registered++;
      } catch(e) { /* already defined or invalid — ignore */ }
    }
  }
  return registered;
}

// Attempt 1: Immediate (module evaluation time)
_sigRegisterAll();

// Attempt 2: Microtask (after current task completes)
if (typeof queueMicrotask === 'function') {
  queueMicrotask(_sigRegisterAll);
}

// Attempt 3: Next animation frame
requestAnimationFrame(_sigRegisterAll);

// Attempt 4: Next tick
setTimeout(_sigRegisterAll, 0);

// Attempt 5: Fast watchdog — 100ms for first 10s, then 1s for 50s
// Also handles error card recovery after late registration
(function _sigWatchdog() {
  var checks = 0;
  var phase1 = 100;  // 100 checks × 100ms = 10 seconds
  var phase2 = 50;   // 50 checks × 1000ms = 50 seconds

  function _replaceErrorCards() {
    try {
      var ha = document.querySelector('home-assistant');
      if (!ha || !ha.shadowRoot) return;
      var main = ha.shadowRoot.querySelector('home-assistant-main');
      if (!main || !main.shadowRoot) return;
      var panel = main.shadowRoot.querySelector('ha-panel-lovelace');
      if (!panel || !panel.shadowRoot) return;
      var root = panel.shadowRoot.querySelector('hui-root');
      if (!root || !root.shadowRoot) return;
      function walkShadow(node) {
        if (!node) return;
        var children = node.children || [];
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.tagName && child.tagName.toLowerCase() === 'hui-error-card') {
            var msg = child.shadowRoot?.querySelector('.error')?.textContent || '';
            if (msg.includes('sigenergy-settings-card') || msg.includes('sigenergy-device-card')) {
              var parent = child.parentElement;
              if (parent && typeof parent._rebuildCard === 'function') {
                parent._rebuildCard();
              } else if (parent && parent.config) {
                var cfg = parent.config;
                parent.config = undefined;
                requestAnimationFrame(function() { parent.config = cfg; });
              }
            }
          }
          if (child.shadowRoot) walkShadow(child.shadowRoot);
          walkShadow(child);
        }
      }
      walkShadow(root.shadowRoot);
    } catch(e) { /* DOM traversal failed — not critical */ }
  }

  function check() {
    checks++;
    var fixed = _sigRegisterAll();
    if (fixed > 0) {
      setTimeout(_replaceErrorCards, 50);
    }
    if (checks < phase1) {
      setTimeout(check, 100);
    } else if (checks < phase1 + phase2) {
      setTimeout(check, 1000);
    }
  }

  setTimeout(check, 50);
})();

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'sigenergy-settings-card',
  name: 'Genergy Settings',
  description: 'Dashboard configuration: entities, features, pricing, display preferences',
  preview: true,
  documentationURL: 'https://github.com/SpengeSec/Genergy-Dashboard',
});
window.customCards.push({
  type: 'sigenergy-device-card',
  name: 'Genergy Device Card',
  description: 'Battery stack visualization with inverter and battery modules',
  preview: true,
});

console.info(
  '%c GENERGY-DASHBOARD %c v2.8.0 ',
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
    '  :host { overflow-x: hidden !important; max-width: 100vw !important; }',
    '  #root { grid-template-columns: 1fr !important; grid-template-rows: repeat(10, auto) !important; overflow-x: hidden !important; max-width: 100% !important; box-sizing: border-box !important; }',
    '  #root > * { grid-column: 1 !important; grid-row: auto !important; max-width: 100% !important; overflow: hidden !important; box-sizing: border-box !important; }',
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
      if (!gl.shadowRoot) return;
      // Only inject into the outermost grid-layout (the main dashboard layout).
      // Skip nested grid-layouts (e.g. stat-card grids) to avoid corrupting their layout.
      // grid-layout lives as the root of a LAYOUT-CARD shadow DOM, so parentElement is null.
      // Walk up the shadow host chain to check for ancestor grid-layout elements.
      var node = gl;
      while (true) {
        var rootNode = node.getRootNode();
        if (rootNode === document) break;
        var host = rootNode.host;
        if (!host) break;
        if (host.tagName && host.tagName.toLowerCase() === 'grid-layout') {
          // Nested grid — remove stale responsive CSS if previously injected, then skip
          var stale = gl.shadowRoot.querySelector('#sigenergy-responsive-fix');
          if (stale) stale.remove();
          return;
        }
        node = host;
      }
      var existing = gl.shadowRoot.querySelector('#sigenergy-responsive-fix');
      if (existing) {
        existing.textContent = RESPONSIVE_CSS;
      } else {
        var style = document.createElement('style');
        style.id = 'sigenergy-responsive-fix';
        style.textContent = RESPONSIVE_CSS;
        gl.shadowRoot.appendChild(style);
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

        // Fix Sankey ha-card background: clone the adopted stylesheet and set transparent
        // ha-card uses a SHARED adopted stylesheet with :host { background: var(--ha-card-background) }
        // Modifying it directly would make ALL ha-cards transparent (shared CSSStyleSheet object).
        // Instead, clone the stylesheet for THIS ha-card only.
        try {
          var haCard = baseSr.querySelector('ha-card');
          if (haCard && haCard.shadowRoot && haCard.shadowRoot.adoptedStyleSheets && haCard.shadowRoot.adoptedStyleSheets.length > 0) {
            var origSheet = haCard.shadowRoot.adoptedStyleSheets[0];
            var hostRule = origSheet.cssRules[0];
            if (hostRule && hostRule.selectorText === ':host' && hostRule.style.background && hostRule.style.background.indexOf('transparent') === -1) {
              // Clone by creating a new sheet and copying rules
              var newSheet = new CSSStyleSheet();
              for (var ri = 0; ri < origSheet.cssRules.length; ri++) {
                newSheet.insertRule(origSheet.cssRules[ri].cssText, ri);
              }
              // Set transparent on the cloned sheet only
              newSheet.cssRules[0].style.setProperty('background', 'transparent', 'important');
              haCard.shadowRoot.adoptedStyleSheets = [newSheet];
            }
          }
        } catch(e) {}

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
