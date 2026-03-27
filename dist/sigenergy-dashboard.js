/**
 * Sigenergy Dashboard v2.1.0 — Bundled Distribution
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
    return `${s.state}${u ? ' ' + u : ''}`;
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

    // Only act on total_increasing energy sensors with high cumulative values
    // Daily-resetting sensors (like Deye summary_day) typically have state < 100.
    // True cumulative sensors have state in the hundreds/thousands.
    const isCumulative = stateClass === 'total_increasing' && unit === 'kWh' && stateVal > 100;

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
        <h2>⚙️ Sigenergy Settings</h2>
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
  }

  _entityRow(label, key, entities) {
    const id = entities[key] || '';
    const state = this._getState(id);
    const isErr = state.startsWith('❌');
    return `
      <div class="row">
        <span class="row-label">${label}</span>
        <input class="row-input" value="${this._esc(id)}" placeholder="sensor.entity_id" data-key="${key}" />
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
    const emhassOn = cfg.features?.emhass !== false;
    el.innerHTML = `
      <div style="margin-bottom:16px;padding:12px;background:rgba(0,212,184,0.08);border:1px solid rgba(0,212,184,0.25);border-radius:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:13px;font-weight:600;color:#00d4b8;">🔍 Auto-Detect from HA Energy Dashboard</div>
            <div style="font-size:11px;color:#8892a4;margin-top:2px;">Automatically detect energy sources, solar forecasts (Solcast/forecast.solar), EV chargers, and heat pumps from your HA configuration</div>
          </div>
          <button class="auto-detect-btn" data-key="auto_detect_energy" style="flex-shrink:0;margin-left:12px;padding:8px 16px;background:#00d4b8;color:#1a1f2e;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">Detect</button>
        </div>
        <div class="auto-detect-status" style="margin-top:6px;font-size:11px;color:#8892a4;display:none;"></div>
      </div>
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
        ${this._entityRow('Inverter Output', 'inverter_output_power', e)}
        ${this._entityRow('Inverter Rated', 'inverter_rated_power', e)}
        ${this._entityRow('Rated Power', 'rated_power', e)}
        <div style="display:flex;align-items:center;gap:8px;margin:8px 0 4px;">
          <span style="font-size:12px;font-weight:600;color:#c8b84a;">☀️ PV Strings</span>
          <select class="pv-strings-select" data-key="pv_strings" style="background:#1a1f2e;color:#e0e6f0;border:1px solid #2d3451;border-radius:6px;padding:3px 8px;font-size:11px;">
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
              const map = {
                solar_power:             has('_pv_power') && has('_pv_power').includes('plant') ? has('_pv_power') : sigenKeys.find(k => k.includes('plant') && k.includes('pv_power')),
                load_power:              sigenKeys.find(k => k.includes('plant_total_load_power')),
                battery_power:           sigenKeys.find(k => k.includes('plant_battery_power')),
                battery_soc:             sigenKeys.find(k => k.includes('plant_battery_state_of_charge')),
                grid_power:              sigenKeys.find(k => k.includes('plant_grid_active_power')),
                grid_active_power:       sigenKeys.find(k => k.includes('plant_grid_active_power')),
                // Daily energy
                solar_energy_today:      sigenKeys.find(k => k.includes('plant_daily_pv_energy')),
                load_energy_today:       sigenKeys.find(k => k.includes('plant_daily_load_consumption')),
                battery_charge_today:    sigenKeys.find(k => k.includes('plant_daily_battery_charge_energy')),
                battery_discharge_today: sigenKeys.find(k => k.includes('plant_daily_battery_discharge_energy')),
                grid_import_today:       sigenKeys.find(k => k.includes('plant_daily_grid_import_energy')),
                grid_export_today:       sigenKeys.find(k => k.includes('plant_daily_grid_export_energy')),
                // Inverter-level
                inverter_temp:           sigenKeys.find(k => k.includes('inverter_pcs_internal_temperature')),
                battery_temp:            sigenKeys.find(k => k.includes('inverter_battery_average_cell_temperature')),
                // PV strings (up to 6)
                pv1_power:               sigenKeys.find(k => k.includes('inverter_pv1_power')),
                pv2_power:               sigenKeys.find(k => k.includes('inverter_pv2_power')),
                pv3_power:               sigenKeys.find(k => k.includes('inverter_pv3_power')),
                pv4_power:               sigenKeys.find(k => k.includes('inverter_pv4_power')),
                pv5_power:               sigenKeys.find(k => k.includes('inverter_pv5_power')),
                pv6_power:               sigenKeys.find(k => k.includes('inverter_pv6_power')),
              };

              let sigenCount = 0;
              for (const [key, eid] of Object.entries(map)) {
                if (eid && !cfg2.entities[key]) {
                  cfg2.entities[key] = eid;
                  found.push('Sigenergy ' + key + ': ' + eid);
                  sigenCount++;
                }
              }

              // Auto-detect PV string count from available pv*_power entities
              if (sigenCount > 0) {
                let pvCount = 0;
                for (let i = 1; i <= 6; i++) {
                  if (sigenKeys.find(k => k.includes('inverter_pv' + i + '_power'))) pvCount = i;
                }
                if (pvCount > 0) {
                  cfg2.features.pv_strings = pvCount;
                  found.push('Sigenergy PV strings detected: ' + pvCount);
                }
                // Sigenergy uses positive = charging convention
                cfg2.features.battery_positive_charging = true;
                found.push('✓ Battery sign convention set to Sigenergy (positive = charging)');
              }
            }
          }

          if (found.length > 0) {
            this._storeSave(cfg2);
            if (statusEl) statusEl.innerHTML = '✅ Detected ' + found.length + ' entities:<br>' + found.map(f => '• ' + f).join('<br>');
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
        const stateEl = input.parentElement.querySelector('.row-state');
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
        ${this._toggleHtml('Positive = Charging', 'Enable if your inverter reports positive battery power when charging (most brands). Disable if positive means discharging.', 'battery_positive_charging', f.battery_positive_charging !== false)}
      </div>
      <div class="section">
        <div class="section-title">Charts</div>
        ${this._toggleHtml('Sunrise/Sunset Lines', 'Show day/night shading', 'sunrise_sunset', f.sunrise_sunset)}
      </div>
      <div class="section">
        <div class="section-title">\u{1F527} Developer</div>
        ${this._toggleHtml('Cable Path Editor', 'Drag-to-position cable routing overlay on house card', 'path_editor', this._pathEditorOn)}
      </div>
      <div style="margin-top:12px;padding:10px;background:rgba(0,212,184,0.08);border-radius:8px;font-size:11px;color:#8892a4;">
        <b>ℹ️</b> Grid configuration (3-phase, dual tariff), Sankey graph nodes (EV, heat pump), and auto-detect are in the <b>⚡ Entities</b> tab.
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
      // Helper: build Jinja template that shows value + unit from the sensor itself
      const _powerTpl = (eid) => {
        return "{% set u = state_attr('" + eid + "', 'unit_of_measurement') | default('W') %}" +
               "{% set v = states('" + eid + "') | float(0) %}" +
               "{% if u == 'kW' %}{{ v | round(2) }} kW{% else %}{{ v | round(0) }} W{% endif %}";
      };

      const statusCards = [
        {
          type: 'custom:mushroom-template-card',
          entity: e.solar_power || 'sensor.solar_production',
          primary: 'Solar', icon: 'mdi:solar-power', icon_color: 'orange',
          secondary: _powerTpl(e.solar_power || 'sensor.solar_production'),
          card_mod: { style: 'ha-card { background: rgba(30,35,54,0.94) !important; border: 1px solid #2d3451 !important; border-radius: 12px !important; } mushroom-state-info { --card-primary-font-size: 20px !important; font-weight: bold !important; --card-secondary-font-size: 11px; }' }
        },
        {
          type: 'custom:mushroom-template-card',
          entity: e.load_power || 'sensor.home_consumption',
          primary: 'Home', icon: 'mdi:home-lightning-bolt', icon_color: 'deep-purple',
          secondary: _powerTpl(e.load_power || 'sensor.home_consumption'),
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
          secondary: _powerTpl(e.grid_active_power || e.grid_power || 'sensor.net_grid_power'),
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
      // Sigenergy convention: positive battery_power = charging
      houseCardOrig.battery_positive_charging = (f.battery_positive_charging !== false);
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
      // Resolve EV/HP entity IDs — use utility meter if cumulative, otherwise direct entity
      const evSankeyEntity = (f.ev_energy_is_cumulative && e.ev_energy_daily_meter) ? e.ev_energy_daily_meter : e.ev_energy_today;
      const hpSankeyEntity = (f.hp_energy_is_cumulative && e.hp_energy_daily_meter) ? e.hp_energy_daily_meter : e.heat_pump_energy_today;
      // Build Sankey destinations list (Load is always present, EV/HP are optional)
      const sankeyLoadChildren = [];
      if (e.load_energy_today) sankeyLoadChildren.push(e.load_energy_today);
      if (f.show_ev_in_sankey && evSankeyEntity) sankeyLoadChildren.push(evSankeyEntity);
      if (f.show_hp_in_sankey && hpSankeyEntity) sankeyLoadChildren.push(hpSankeyEntity);

      // Build destination entities for section 2
      const sankeyDest = [];
      if (e.load_energy_today) sankeyDest.push({ entity_id: e.load_energy_today, name: 'Home', color: '#e8337f' });
      if (f.show_ev_in_sankey && evSankeyEntity) sankeyDest.push({ entity_id: evSankeyEntity, name: 'EV', color: '#ff69b4' });
      if (f.show_hp_in_sankey && hpSankeyEntity) sankeyDest.push({ entity_id: hpSankeyEntity, name: 'HP', color: '#e67e22' });
      if (e.battery_charge_today) sankeyDest.push({ entity_id: e.battery_charge_today, name: 'Battery', color: '#00d4b8' });
      if (e.grid_export_today) sankeyDest.push({ entity_id: e.grid_export_today, name: 'Grid', color: '#7c5cbf' });

      // Build source children arrays — sources can flow to all destinations
      const allDestIds = sankeyDest.map(d => d.entity_id).filter(Boolean);
      const battDischargeChildren = [e.grid_export_today, e.load_energy_today].filter(Boolean);
      const solarChildren = [e.battery_charge_today, e.grid_export_today, e.load_energy_today].filter(Boolean);
      const gridImportChildren = [e.load_energy_today].filter(Boolean);

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
        show_names: true, show_states: true, show_units: true, show_icons: false,
        round: 1, height: 480, wide: true,
        min_box_size: 50, min_box_distance: 8, unit_prefix: 'k',
        min_state: 0.1,
        energy_date_selection: false,
        sections: [
          {
            entities: [
              { entity_id: e.battery_discharge_today, name: 'Battery', color: '#00d4b8', children: battDischargeChildren },
              { entity_id: e.solar_energy_today, name: 'Solar', color: '#c8b84a', children: solarChildren },
              { entity_id: e.grid_import_today, name: 'Grid', color: '#6b7fd4', children: gridImportChildren }
            ].filter(x => x.entity_id)
          },
          {
            entities: sankeyDest.filter(x => x.entity_id)
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
        // Add EV/HP pill border colors if not already present
        if (!css.includes('title*="EV"')) {
          css += '.box > div[title*="EV"] ~ .label .name { border-color: #ff69b4 !important; }\n';
        }
        if (!css.includes('title*="HP"')) {
          css += '.box > div[title*="HP"] ~ .label .name { border-color: #e67e22 !important; }\n';
        }
        // Also support "Home" label (renamed from "Load")
        if (!css.includes('title*="Home"')) {
          css += '.box > div[title*="Home"] ~ .label .name { border-color: #e8337f !important; }\n';
        }
        // EV/HP destination percentage CSS variables
        if (!css.includes('pct-dst-ev')) {
          css += '.section:last-of-type .box > div[title*="EV"] ~ .label::after { content: var(--pct-dst-ev); }\n';
          css += '.section:last-of-type .box > div[title*="HP"] ~ .label::after { content: var(--pct-dst-hp); }\n';
          css += '.section:last-of-type .box > div[title*="Home"] ~ .label::after { content: var(--pct-dst-load); }\n';
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
      var np = Math.max(1, Math.min(packs, 8));
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
      var gridVL2 = store ? store.getEntity('grid_voltage_l2') : '';
      var gridVL3 = store ? store.getEntity('grid_voltage_l3') : '';
      var threePhase = store ? (store.getFeature && store.getFeature('three_phase')) : false;
      panels += '<div style="' + panelStyle + '">';
      panels += '<div style="' + headerStyle + '">⚡ Inverter Details</div>';
      panels += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(invTemp || invIntTemp, 1, '°C') + '</span><span style="' + statLbl + '">Temperature</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(invOutput, 0, 'W') + '</span><span style="' + statLbl + '">Output</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + (invRated && fmtEntity(invRated, 0, '') !== '—' ? (parseFloat(self._hass.states[invRated]?.state || 0) / 1000).toFixed(1) + 'kW' : '—') + '</span><span style="' + statLbl + '">Rated</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(pvOne, 0, 'W') + '</span><span style="' + statLbl + '">PV1</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(pvTwo, 0, 'W') + '</span><span style="' + statLbl + '">PV2</span></div>';
      if (threePhase && gridVL2 && gridVL3) {
        panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridV, 1, 'V') + '</span><span style="' + statLbl + '">Grid L1</span></div>';
        panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridVL2, 1, 'V') + '</span><span style="' + statLbl + '">Grid L2</span></div>';
        panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridVL3, 1, 'V') + '</span><span style="' + statLbl + '">Grid L3</span></div>';
      } else {
        panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(gridV, 1, 'V') + '</span><span style="' + statLbl + '">Grid V</span></div>';
      }
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
  '%c SIGENERGY-DASHBOARD %c v2.1.0 ',
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
