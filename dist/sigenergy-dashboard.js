/**
 * Genergy Dashboard v2.19.0 — Bundled Distribution
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
// Smart load card auto-load
import('./sigenergy-smart-load-card.js').catch(e => console.warn('Smart load card import failed:', e));

// ═══════════════════════════════════════════════════════════
// Config Store (singleton)
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'sigenergy-dashboard-config';

const DEFAULT_ENTITIES = {
  solar_power: '',
  load_power: '',
  battery_power: '',
  battery_soc: '',
  grid_power: '',
  solar_energy_today: '',
  load_energy_today: '',
  battery_charge_today: '',
  battery_discharge_today: '',
  grid_import_today: '',
  grid_export_today: '',
  grid_import_high_tariff: '',
  grid_import_low_tariff: '',
  grid_export_high_tariff: '',
  grid_export_low_tariff: '',
  weather: '',
  ev_charger_power: '',
  ev_charger_state: '',
  ev_soc: '',
  ev_range: '',
  heat_pump_power: '',
  emhass_mode: '',
  emhass_reason: '',
  mpc_battery: '',
  mpc_grid: '',
  mpc_pv: '',
  buy_price: '',
  sell_price: '',
  mpc_soc: '',
  mpc_load: '',
  mpc_optim_status: '',
  emhass_savings_today: '',
  emhass_net_cost_today: '',
  emhass_battery_action: '',
  nordpool: '',
  battery_pack1_soc: '',
  battery_pack2_soc: '',
  battery_pack3_soc: '',
  battery_pack4_soc: '',
  battery_pack5_soc: '',
  battery_pack6_soc: '',
  battery_pack7_soc: '',
  battery_pack8_soc: '',
  inverter_temp: '',
  battery_temp: '',
  grid_voltage: '',
  grid_voltage_l2: '',
  grid_voltage_l3: '',
  grid_frequency: '',
  // Additional system entities
  grid_power_ct: '',
  grid_active_power: '',
  emhass_enabled: '',
  // Device/inverter entities
  battery_voltage: '',
  battery_current: '',
  pv1_power: '',
  pv2_power: '',
  pv3_power: '',
  pv4_power: '',
  pv5_power: '',
  pv6_power: '',
  inverter_rated_power: '',
  inverter_output_power: '',
  inverter_internal_temp: '',
  rated_power: '',
  // EMHASS financial entities
  emhass_net_cost_month: '',
  emhass_savings_month: '',
  emhass_projected_bill: '',
  emhass_projected_savings: '',
  emhass_last_decision: '',
  // Automation entities
  automation_mpc_optimizer: '',
  automation_battery_control: '',
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
  haeo_import_price: '',
  haeo_export_price: '',
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
    battery_packs: 0,
    emhass: false,
    emhass_forecasts: true,
    deferrable_loads: false,
    ems_provider: 'none',
    haeo_forecasts: true,
    forecast_table: false,
    financial_tracking: false,
    solar_forecast: false,
    weather_widget: true,
    sunrise_sunset: false,
    three_phase: false,
    dual_tariff: false,
    show_ev_in_sankey: false,
    show_hp_in_sankey: false,
    show_losses_in_sankey: true,
    ev_energy_is_cumulative: false,
    hp_energy_is_cumulative: false,
    battery_positive_charging: true,
    battery_runtime: true,
    pv_strings: 2,
    smart_loads: false,
    smart_load_columns: 4,
    smart_load_sort: 'power',
    smart_load_standby_threshold: 5,
    smart_load_hide_inactive: false,
  },
  smart_loads: [],
  pricing: {
    source: 'custom',
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
    kiosk_mode: false,
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
      result.features.ems_provider = result.features.emhass === true ? 'emhass' : 'none';
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

// Shared theme resolver — used by all Genergy components
window._sigenergyResolveTheme = function(hass) {
  var cfg = window.SigenergyConfig ? window.SigenergyConfig.get() : {};
  var theme = (cfg.display && cfg.display.theme) || 'dark';
  if (theme !== 'auto') return theme;
  // Auto-detect from HA
  if (hass && hass.themes && hass.themes.darkMode !== undefined) return hass.themes.darkMode ? 'dark' : 'light';
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  var bg = getComputedStyle(document.documentElement).getPropertyValue('--primary-background-color').trim();
  if (bg) { var m = bg.match(/(\d+)/g); if (m && m.length >= 3) { var lum = 0.299 * parseInt(m[0]) + 0.587 * parseInt(m[1]) + 0.114 * parseInt(m[2]); return lum < 128 ? 'dark' : 'light'; } }
  return 'dark';
};

// Auto-load house card from same directory (after ConfigStore is available)

// ── Kiosk mode ───────────────────────────────────────────
// Hides HA sidebar + header for fullscreen wall-tablet experience
window._sigenergyKioskStyleId = 'sigenergy-kiosk-css';
window._sigenergyApplyKiosk = function(enable) {
  // Inject/remove a <style> in each shadow root level
  const _inject = (root, id, css, on) => {
    if (!root) return;
    let tag = root.getElementById ? root.getElementById(id) : root.querySelector('#' + id);
    if (on && !tag) {
      tag = document.createElement('style');
      tag.id = id;
      tag.textContent = css;
      root.appendChild(tag);
    } else if (!on && tag) {
      tag.remove();
    }
  };

  try {
    // Level 1: home-assistant shadow root → hide sidebar + make main full-width
    const ha = document.querySelector('home-assistant');
    if (!ha || !ha.shadowRoot) return;
    const haMain = ha.shadowRoot.querySelector('home-assistant-main');
    if (!haMain || !haMain.shadowRoot) return;

    _inject(haMain.shadowRoot, window._sigenergyKioskStyleId + '-main',
      'ha-sidebar { display: none !important; } ' +
      'ha-drawer { --mdc-drawer-width: 0px !important; } ' +
      ':host { --mdc-top-app-bar-width: 100% !important; }',
      enable);

    // Level 2: panel-lovelace → hui-root → hide toolbar header + big-screen scaling
    const panel = haMain.shadowRoot.querySelector('ha-panel-lovelace');
    if (panel && panel.shadowRoot) {
      const huiRoot = panel.shadowRoot.querySelector('hui-root');
      if (huiRoot && huiRoot.shadowRoot) {
        _inject(huiRoot.shadowRoot, window._sigenergyKioskStyleId + '-header',
          '.header { display: none !important; }',
          enable);

        // Big-screen scaling CSS — injected into hui-root shadow
        const bigScreenCSS = `
          /* 1080p kiosk: add padding and increase card gap */
          @media (min-width: 1200px) {
            #view { padding: 12px 16px !important; }
          }
          /* 1440p+ kiosk: larger spacing */
          @media (min-width: 1800px) {
            #view { padding: 16px 24px !important; }
            #view hui-view { --grid-card-gap: 8px !important; }
          }
          /* 4K kiosk: even more spacing */
          @media (min-width: 2400px) {
            #view { padding: 24px 32px !important; }
          }
        `;
        _inject(huiRoot.shadowRoot, window._sigenergyKioskStyleId + '-bigscreen',
          bigScreenCSS, enable);

        // Level 3: hui-view — inject card-level scaling
        const huiView = huiRoot.shadowRoot.querySelector('#view hui-view');
        if (huiView && huiView.shadowRoot) {
          const viewCSS = `
            @media (min-width: 1200px) {
              :host { --card-primary-font-size: 22px !important; --card-secondary-font-size: 13px !important; }
            }
            @media (min-width: 1800px) {
              :host { --card-primary-font-size: 26px !important; --card-secondary-font-size: 15px !important; }
            }
          `;
          _inject(huiView.shadowRoot, window._sigenergyKioskStyleId + '-viewscale',
            viewCSS, enable);
        }
      }
    }
  } catch (e) {
    console.warn('[Genergy] Kiosk mode error:', e);
  }

  // Add/remove floating exit button
  const _exitId = 'sigenergy-kiosk-exit';
  let _exitBtn = document.getElementById(_exitId);
  if (enable && !_exitBtn) {
    _exitBtn = document.createElement('div');
    _exitBtn.id = _exitId;
    _exitBtn.innerHTML = '✕';
    _exitBtn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;width:36px;height:36px;background:rgba(42,48,72,0.85);border:1px solid rgba(255,255,255,0.15);border-radius:50%;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:all 0.2s;';
    _exitBtn.addEventListener('mouseenter', () => { _exitBtn.style.background = 'rgba(231,76,60,0.9)'; _exitBtn.style.color = '#fff'; });
    _exitBtn.addEventListener('mouseleave', () => { _exitBtn.style.background = 'rgba(42,48,72,0.85)'; _exitBtn.style.color = 'rgba(255,255,255,0.5)'; });
    _exitBtn.addEventListener('click', () => {
      const _cfg = window.SigenergyConfig ? window.SigenergyConfig.get() : {};
      if (_cfg.display) _cfg.display.kiosk_mode = false;
      if (window.SigenergyConfig) window.SigenergyConfig.save(_cfg);
      window._sigenergyApplyKiosk(false);
      location.reload();
    });
    document.body.appendChild(_exitBtn);
  } else if (!enable && _exitBtn) {
    _exitBtn.remove();
  }
};

// Apply kiosk on load if previously enabled
try {
  const _kioskCfg = window.SigenergyConfig ? window.SigenergyConfig.get() : {};
  if (_kioskCfg.display && _kioskCfg.display.kiosk_mode) {
    // Delay to let HA finish rendering its shadow DOM hierarchy
    setTimeout(() => window._sigenergyApplyKiosk(true), 2000);
    setTimeout(() => window._sigenergyApplyKiosk(true), 5000);
  }
} catch (e) { /* ignore */ }

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
    this._activeTab = parseInt(sessionStorage.getItem('genergy_settings_tab') || '0') || 0;
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
      // Convert MWh → kWh and Wh → kWh for clearer energy display
      if (u === 'MWh') return `${(num * 1000).toFixed(2)} kWh`;
      if (u === 'Wh') return `${(num / 1000).toFixed(2)} kWh`;
      // Convert MW → kW for clearer power display
      if (u === 'MW') return `${(num * 1000).toFixed(2)} kW`;
      let decimals;
      if (u === 'V' || u === 'W' || u === 'VA') decimals = 1;
      else if (u === 'kW' || u === 'kWh') decimals = 2;
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
          // Try to force-initialize by requesting a state update on the source entity
          try { await this._hass.callService('homeassistant', 'update_entity', { entity_id: sourceEntityId }); } catch(e) {}
          await new Promise(r => setTimeout(r, 1000));
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
          transition: color 0.2s, background 0.2s, border-bottom-color 0.2s;
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
          background: var(--secondary-background-color, rgba(45,52,81,0.4)); border-radius: 8px;
        }
        .row-label { min-width: 100px; max-width: 140px; font-size: 12px; color: var(--secondary-text-color, #8892a4); overflow: hidden; text-overflow: ellipsis; }
        .row-input {
          flex: 1; min-width: 0; width: 100%; background: var(--card-background-color, #1a1f2e);
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
          padding: 10px 12px; background: var(--secondary-background-color, rgba(45,52,81,0.4));
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
          font-weight: 500; transition: border-color 0.2s, background 0.2s;
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
          margin-left: 8px; transition: background 0.2s, border-color 0.2s;
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
          transition: background 0.2s, border-color 0.2s;
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
        try { sessionStorage.setItem('genergy_settings_tab', String(this._activeTab)); } catch(e) {}
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
        ${candidates.map(c => `<div class="candidate-item${c.disabled ? ' cand-disabled' : ''}" data-cand-id="${this._esc(c.id)}"><span class="ci-id">${this._esc(c.id)}${c.friendly_name ? ' <span class="ci-fn">(' + this._esc(c.friendly_name) + ')</span>' : ''}</span><span class="ci-val">= ${this._esc(String(c.value))}${c.unit ? ' ' + this._esc(c.unit) : ''}</span>${c.disabled ? '<span class="ci-badge">disabled</span>' : ''}</div>`).join('')}
      </div>` : '';
    // Check if this is a daily energy field with a cumulative source — offer to create helper
    let helperHTML = '';
    const dailyKeys = ['solar_energy_today','load_energy_today','battery_charge_today','battery_discharge_today','grid_import_today','grid_export_today','ev_energy_today','heat_pump_energy_today','grid_import_high_tariff','grid_import_low_tariff','grid_export_high_tariff','grid_export_low_tariff'];
    if (id && dailyKeys.includes(key) && this._hass?.states?.[id]) {
      const st = this._hass.states[id];
      const sc = st?.attributes?.state_class;
      const uom = st?.attributes?.unit_of_measurement || '';
      const val = parseFloat(st?.state);
      const isEnergy = uom === 'kWh' || uom === 'MWh' || uom === 'Wh';
      const valKwh = uom === 'MWh' ? val * 1000 : uom === 'Wh' ? val / 1000 : val;
      const isCumulative = (sc === 'total_increasing' || sc === 'total') && isEnergy && valKwh > 50;
      if (isCumulative) {
        helperHTML = `<div style="margin:-2px 0 4px 110px;padding:6px 10px;background:rgba(255,165,0,0.1);border:1px solid rgba(255,165,0,0.3);border-radius:6px;font-size:11px;color:#ffa726;">⚠️ Lifetime entity detected (${this._esc(String(Math.round(valKwh)))} kWh). <button class="create-daily-helper-btn" data-key="${key}" data-source="${this._esc(id)}" style="background:#FF8F00;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;margin-left:6px;">Create Daily Helper</button><br><span style="font-size:10px;color:#8892a4;margin-top:3px;display:inline-block;">ℹ️ Creates a utility meter helper that resets daily. May show <b>unknown</b> until the source sensor updates (usually within minutes).</span></div>`;
      }
    }
    return `
      <div class="row">
        <span class="row-label">${label}</span>
        <div class="entity-input-wrap">
          <input class="row-input entity-ac-input" value="${this._esc(id)}" placeholder="sensor.entity_id" data-key="${key}" autocomplete="off" />
          <div class="entity-dropdown" data-dropdown-for="${key}"></div>
          ${candidateHTML}
        </div>
        <span class="row-state ${isErr?'err':''}" data-entity="${this._esc(id)}">${state}</span>
      </div>${helperHTML}`;
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
    const emsProvider = cfg.features?.ems_provider || (cfg.features?.emhass === true ? 'emhass' : 'none');
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
      <div class="section" style="border:1px solid ${cfg.features?.dual_tariff ? '#00d4b8' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${cfg.features?.dual_tariff ? '12' : '0'}px;">
          <div>
            <div style="font-size:14px;font-weight:700;color:${cfg.features?.dual_tariff ? '#00d4b8' : '#8892a4'};">⚡ Grid Energy Metering</div>
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
            <div class="toggle-desc" style="margin-top:6px;margin-bottom:4px;color:#8892a4;font-size:10px;">HAEO price forecast entities — with <code>forecast</code> attribute for timeline table</div>
            ${this._entityRow('Import Price Forecast', 'haeo_import_price', e)}
            <div style="font-size:9px;color:#666;padding:0 0 4px 4px;">number.grid_import_price — includes forecast attribute with future import prices</div>
            ${this._entityRow('Export Price Forecast', 'haeo_export_price', e)}
            <div style="font-size:9px;color:#666;padding:0 0 4px 4px;">number.grid_export_price — includes forecast attribute with future export prices</div>
          </div>
        ` : ''}
      </div>
      <div class="section" style="border:1px solid ${cfg.features?.show_ev_in_sankey ? '#E8705A' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div class="section-title">🔌 EV / Charger</div>
        ${this._entityRow('Charger Power', 'ev_charger_power', e)}
        ${this._entityRow('Charger State', 'ev_charger_state', e)}
        ${this._entityRow('EV SoC', 'ev_soc', e)}
        ${this._entityRow('EV Range', 'ev_range', e)}
        <div style="margin-top:8px;border-top:1px solid rgba(155,89,182,0.2);padding-top:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:12px;font-weight:600;color:${cfg.features?.show_ev_in_sankey ? '#E8705A' : '#8892a4'};">📊 Show EV in Sankey Graph</div>
              <div style="font-size:10px;color:#8892a4;margin-top:1px;">Add EV consumption as a destination node in the energy flow chart</div>
            </div>
            <div class="switch ${cfg.features?.show_ev_in_sankey ? 'on' : 'off'}" data-key="show_ev_in_sankey_toggle" style="flex-shrink:0;margin-left:12px;"></div>
          </div>
          ${cfg.features?.show_ev_in_sankey ? `
            <div style="margin-top:8px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="flex:1;">${this._entityRow('EV Energy Today', 'ev_energy_today', e)}</div>
                <button class="auto-detect-btn" data-key="auto_detect_ev" style="flex-shrink:0;padding:6px 12px;background:#E8705A;color:#fff;border:none;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;" title="Auto-detect from HA Energy Dashboard device list">🔍 Detect</button>
              </div>
              <div class="ev-detect-status" style="font-size:10px;color:#8892a4;display:none;margin-bottom:4px;"></div>
              ${cfg.features?.ev_energy_is_cumulative ? `
                <div style="background:rgba(155,89,182,0.1);border:1px solid rgba(155,89,182,0.3);border-radius:8px;padding:8px;margin-bottom:6px;">
                  <div style="font-size:10px;font-weight:600;color:#E8705A;">📊 Cumulative sensor detected</div>
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
      <div class="section" style="border:1px solid ${cfg.features?.show_losses_in_sankey ? '#444' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:12px;font-weight:600;color:${cfg.features?.show_losses_in_sankey ? '#aaa' : '#8892a4'};">📉 Show Losses in Sankey Graph</div>
            <div style="font-size:10px;color:#8892a4;margin-top:1px;">Display conversion/distribution losses as a destination node in the energy flow chart</div>
          </div>
          <div class="switch ${cfg.features?.show_losses_in_sankey ? 'on' : 'off'}" data-key="show_losses_in_sankey_toggle" style="flex-shrink:0;margin-left:12px;"></div>
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
        <div style="border:1px solid ${cfg.features?.three_phase ? '#F0D850' : '#2d3451'};border-radius:10px;padding:10px;margin:8px 0;transition:all 0.3s;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${cfg.features?.three_phase ? '8' : '0'}px;">
            <div>
              <div style="font-size:13px;font-weight:600;color:${cfg.features?.three_phase ? '#F0D850' : '#8892a4'};">⚡ Grid Voltage</div>
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
        ${emhassOn ? this._entityRow('EMHASS Enabled', 'emhass_enabled', e) : ''}
      </div>
      <div class="section">
        <div class="section-title">🔌 Inverter & PV</div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Power sensors in <b>W</b> or <b>kW</b>. Individual PV string monitoring for detailed solar analysis.</div>
        ${this._entityRow('Inverter Output', 'inverter_output_power', e)}
        ${this._entityRow('Inverter Rated', 'inverter_rated_power', e)}
        ${this._entityRow('Rated Power', 'rated_power', e)}
        <div style="display:flex;align-items:center;gap:8px;margin:8px 0 4px;">
          <span style="font-size:12px;font-weight:600;color:#F0D850;">☀️ PV Strings</span>
          <select class="pv-strings-select" data-key="pv_strings" style="background:var(--card-background-color,#1a1f2e);color:var(--primary-text-color,#e0e6f0);border:1px solid var(--divider-color,#2d3451);border-radius:6px;padding:3px 8px;font-size:11px;">
            ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${(cfg.features?.pv_strings || 2) == n ? 'selected' : ''}>${n} string${n > 1 ? 's' : ''}</option>`).join('')}
          </select>
        </div>
        ${Array.from({length: cfg.features?.pv_strings || 2}, (_, i) => this._entityRow('PV' + (i+1) + ' Power', 'pv' + (i+1) + '_power', e)).join('\n        ')}
      </div>
      <div class="section">
        <div class="section-title">🔋 Battery System</div>
        <div class="toggle-desc" style="margin-bottom:8px;color:#8892a4;font-size:11px;">Battery voltage, current, and individual pack SoC sensors. Leave pack SoC blank to use the main Battery SoC entity as fallback.</div>
        ${this._entityRow('Battery Voltage', 'battery_voltage', e)}
        ${this._entityRow('Battery Current', 'battery_current', e)}
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
            const uom = st?.attributes?.unit_of_measurement || '';
            return '<div class="entity-dropdown-item" data-eid="' + this._esc(k) + '"><span class="entity-name">' + this._esc(k) + '</span>' + (fn ? ' <span class="entity-state">' + this._esc(fn) + '</span>' : '') + ' <span class="entity-state">= ' + this._esc(val) + (uom ? ' ' + this._esc(uom) : '') + '</span></div>';
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

    // Handle "Create Daily Helper" buttons
    el.querySelectorAll('.create-daily-helper-btn').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const key = btn.dataset.key;
        const source = btn.dataset.source;
        if (!key || !source) return;
        btn.disabled = true;
        btn.textContent = 'Creating...';
        const meterName = key.replace('_today', '').replace('_energy', '_energy').replace('_tariff', '');
        try {
          const result = await this._ensureDailyMeter(source, meterName);
          if (result.isCumulative && result.dailyEntity) {
            const cfg2 = this._storeGet();
            cfg2.entities[key] = result.dailyEntity;
            this._storeSave(cfg2);
            // Try to force-initialize the utility meter by updating the source entity
            try { await this._hass.callService('homeassistant', 'update_entity', { entity_id: source }); } catch(e) {}
            btn.textContent = '✓ Created: ' + result.dailyEntity;
            btn.style.background = '#00d4b8';
            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = 'font-size:10px;color:#8892a4;margin-top:4px;';
            infoDiv.textContent = 'ℹ️ Helper may show "unknown" until the source sensor updates (usually within minutes). This is normal.';
            btn.parentElement.appendChild(infoDiv);
            setTimeout(() => this._render(), 3000);
          } else {
            btn.textContent = 'Not needed (entity is already daily)';
            btn.style.background = '#8892a4';
          }
        } catch (err) {
          btn.textContent = '❌ Failed: ' + (err.message || 'Unknown error');
          btn.style.background = '#e74c3c';
        }
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

    // Losses in Sankey toggle handler
    const lossesSankeyToggle = el.querySelector('[data-key="show_losses_in_sankey_toggle"]');
    if (lossesSankeyToggle) {
      lossesSankeyToggle.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.features.show_losses_in_sankey = !cfg2.features.show_losses_in_sankey;
        this._storeSave(cfg2);
        if (this._hass) {
          this._buildDashboard().then(ok => {
            if (ok) console.log('Dashboard rebuilt after toggling Losses Sankey');
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
              && (['kWh','MWh','Wh'].includes(this._hass.states[k].attributes?.unit_of_measurement) || this._hass.states[k].attributes?.device_class === 'energy')
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
              && (['kWh','MWh','Wh'].includes(this._hass.states[k].attributes?.unit_of_measurement) || this._hass.states[k].attributes?.device_class === 'energy')
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
          const _flatGridEntries = [];

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
                // Multiple tariffs detected (flow_from array format)
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
              // Also handle flat format: HA Energy Dashboard may use separate grid entries
              // with stat_energy_from/stat_energy_to directly on each entry (no flow_from/flow_to)
              if (flowFrom.length === 0 && flowTo.length === 0 && src.stat_energy_from) {
                _flatGridEntries.push(src);
              }
            }
          }
          // Handle flat grid format: multiple grid entries = dual tariff
          if (_flatGridEntries.length === 1) {
            if (_flatGridEntries[0].stat_energy_from && !cfg2.entities.grid_import_today) {
              cfg2.entities.grid_import_today = _flatGridEntries[0].stat_energy_from;
              found.push('Grid import: ' + _flatGridEntries[0].stat_energy_from);
            }
            if (_flatGridEntries[0].stat_energy_to && !cfg2.entities.grid_export_today) {
              cfg2.entities.grid_export_today = _flatGridEntries[0].stat_energy_to;
              found.push('Grid export: ' + _flatGridEntries[0].stat_energy_to);
            }
          } else if (_flatGridEntries.length >= 2) {
            cfg2.features.dual_tariff = true;
            if (!cfg2.entities.grid_import_high_tariff) {
              cfg2.entities.grid_import_high_tariff = _flatGridEntries[0].stat_energy_from || '';
              cfg2.entities.grid_import_low_tariff = _flatGridEntries[1].stat_energy_from || '';
              found.push('Grid import (dual tariff): ' + _flatGridEntries.map(f => f.stat_energy_from).join(' + '));
            }
            if (!cfg2.entities.grid_export_high_tariff) {
              cfg2.entities.grid_export_high_tariff = _flatGridEntries[0].stat_energy_to || '';
              cfg2.entities.grid_export_low_tariff = _flatGridEntries[1].stat_energy_to || '';
              found.push('Grid export (dual tariff): ' + _flatGridEntries.map(f => f.stat_energy_to).join(' + '));
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
                grid_voltage:            sigenKeys.find(k => k.includes('plant_grid_phase_a_voltage')) || sigenKeys.find(k => k.includes('grid_phase_a_voltage')) || sigenKeys.find(k => k.endsWith('_phase_a_voltage') && !k.includes('inverter')),
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
            // Prefer plant-level grid voltage sensors (e.g. sigen_plant_grid_phase_b_voltage)
            // over inverter-level sensors (e.g. sigen_inverter_phase_b_voltage)
            const phase2Candidates = allKeys.filter(k => {
              if (!k.startsWith('sensor.')) return false;
              const st = this._hass.states[k];
              const unit = st?.attributes?.unit_of_measurement || '';
              if (unit !== 'V') return false;
              const lower = k.toLowerCase();
              return phase2Patterns.some(p => p.test(lower));
            });
            // Prioritize plant grid sensors, then any non-inverter sensor, then any match
            const phase2Key = phase2Candidates.find(k => k.includes('plant_grid')) || phase2Candidates.find(k => !k.includes('inverter')) || phase2Candidates[0];
            if (phase2Key) {
              cfg2.features.three_phase = true;
              found.push('✓ 3-phase grid detected: ' + phase2Key);
              // Try to auto-populate L1/L2/L3 voltage entities
              const baseL2 = phase2Key;
              const l1Guess = baseL2.replace(/_l2/g, '_l1').replace(/phase_2/g, 'phase_1').replace(/phase_b/g, 'phase_a');
              const l3Guess = baseL2.replace(/_l2/g, '_l3').replace(/phase_2/g, 'phase_3').replace(/phase_b/g, 'phase_c');
              if (this._hass.states[l1Guess]) {
                cfg2.entities.grid_voltage = l1Guess;
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

          // ── Auto-detect BMS integrations (JK BMS, PACE BMS, Seplos BMS) ──
          if (this._hass && this._hass.states) {
            const allKeys = Object.keys(this._hass.states);
            // Common BMS entity patterns:
            // JK BMS:    sensor.jk_bms_*_state_of_charge, sensor.jk_bms_*_soc
            // PACE BMS:  sensor.pace_bms_*_soc, sensor.pace_bms_*_state_of_charge
            // Seplos BMS: sensor.seplos_*_soc, sensor.seplos_bms_*_soc
            // BMS BLE (generic): sensor.*_bms_*_soc, sensor.*_bms_*_state_of_charge
            // bms_connector: sensor.bms_*_soc
            const bmsPatterns = [
              { name: 'JK BMS', prefix: /^sensor\.jk_bms_/ },
              { name: 'PACE BMS', prefix: /^sensor\.pace_bms_/ },
              { name: 'Seplos BMS', prefix: /^sensor\.seplos[_.]/ },
              { name: 'BMS BLE', prefix: /^sensor\.[a-z0-9_]*bms_ble_/ },
              { name: 'BMS Connector', prefix: /^sensor\.bms_connector_/ },
            ];
            let bmsDetected = false;
            for (const bms of bmsPatterns) {
              const bmsKeys = allKeys.filter(k => bms.prefix.test(k));
              if (bmsKeys.length === 0) continue;
              // Find SoC entities
              const socKeys = bmsKeys.filter(k => k.endsWith('_soc') || k.endsWith('_state_of_charge'));
              if (socKeys.length > 0) {
                bmsDetected = true;
                found.push('🔋 ' + bms.name + ' detected (' + socKeys.length + ' pack' + (socKeys.length > 1 ? 's' : '') + ')');
                // Auto-assign pack SoC entities
                const sortedSocs = socKeys.sort();
                const packCount = Math.min(sortedSocs.length, 8);
                cfg2.features.battery_packs = Math.max(cfg2.features.battery_packs || 0, packCount);
                for (let pi = 0; pi < packCount; pi++) {
                  const packKey = 'battery_pack' + (pi + 1) + '_soc';
                  if (!cfg2.entities[packKey]) {
                    cfg2.entities[packKey] = sortedSocs[pi];
                    found.push('  Pack ' + (pi + 1) + ' SoC: ' + sortedSocs[pi]);
                  }
                }
                // Also look for battery voltage/current from this BMS
                const voltKey = bmsKeys.find(k => k.endsWith('_total_voltage') || k.endsWith('_pack_voltage') || k.endsWith('_voltage'));
                const currKey = bmsKeys.find(k => k.endsWith('_current') || k.endsWith('_pack_current'));
                if (voltKey && !cfg2.entities.battery_voltage) {
                  cfg2.entities.battery_voltage = voltKey;
                  found.push('  Battery Voltage: ' + voltKey);
                }
                if (currKey && !cfg2.entities.battery_current) {
                  cfg2.entities.battery_current = currKey;
                  found.push('  Battery Current: ' + currKey);
                }
                break; // Use first detected BMS brand
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
            // Look for HAEO sensor patterns — both full network_optimization_ and short optimizer_ naming
            const haeoStatusKeys = allKeys.filter(k => k.startsWith('sensor.') && (k.endsWith('_network_optimization_status') || k.endsWith('_optimizer_status')));
            if (haeoStatusKeys.length > 0) {
              const statusKey = haeoStatusKeys[0];
              cfg2.entities.haeo_optim_status = statusKey;
              found.push('HAEO optimization status: ' + statusKey);
              // Derive cost/duration — handle both naming patterns
              let costKey, durKey;
              if (statusKey.endsWith('_network_optimization_status')) {
                costKey = statusKey.replace('_network_optimization_status', '_network_optimization_cost');
                durKey = statusKey.replace('_network_optimization_status', '_network_optimization_duration');
              } else {
                costKey = statusKey.replace(/_status$/, '_cost');
                durKey = statusKey.replace(/_status$/, '_duration');
              }
              if (costKey !== statusKey && allKeys.includes(costKey)) {
                cfg2.entities.haeo_optim_cost = costKey;
                found.push('HAEO optimization cost: ' + costKey);
              }
              if (durKey !== statusKey && allKeys.includes(durKey)) {
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
              // Find HAEO price entities (number domain)
              const haeoImpPrice = allKeys.filter(k => k.startsWith('number.') && (k.includes('grid_import_price') || k.includes('import_price')));
              const haeoExpPrice = allKeys.filter(k => k.startsWith('number.') && (k.includes('grid_export_price') || k.includes('export_price')));
              if (haeoImpPrice.length > 0 && !cfg2.entities.haeo_import_price) { cfg2.entities.haeo_import_price = haeoImpPrice[0]; found.push('HAEO import price: ' + haeoImpPrice[0]); }
              if (haeoExpPrice.length > 0 && !cfg2.entities.haeo_export_price) { cfg2.entities.haeo_export_price = haeoExpPrice[0]; found.push('HAEO export price: ' + haeoExpPrice[0]); }
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
        const uom = st?.attributes?.unit_of_measurement || '';
        candidates.push({ id: k, value: st?.state || '?', disabled: false, friendly_name: fn, unit: uom });
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
    if (!this._hass?.states) return found;
    const allKeys = Object.keys(this._hass.states);
    if (!this._candidates) this._candidates = {};

    // Step 1: Try HA Energy Dashboard config first
    try {
      const prefs = await this._hass.callWS({ type: 'energy/get_prefs' });
      if (prefs?.energy_sources) {
        for (const src of prefs.energy_sources) {
          if (src.type === 'solar' && src.stat_energy_from && !cfg2.entities.solar_energy_today) {
            cfg2.entities.solar_energy_today = src.stat_energy_from; found.push('Solar: ' + src.stat_energy_from);
          }
          if (src.type === 'battery') {
            if (src.stat_energy_from && !cfg2.entities.battery_discharge_today) { cfg2.entities.battery_discharge_today = src.stat_energy_from; found.push('Battery discharge: ' + src.stat_energy_from); }
            if (src.stat_energy_to && !cfg2.entities.battery_charge_today) { cfg2.entities.battery_charge_today = src.stat_energy_to; found.push('Battery charge: ' + src.stat_energy_to); }
          }
          if (src.type === 'grid' && !cfg2.features.dual_tariff) {
            const flowFrom = src.flow_from || [];
            const flowTo = src.flow_to || [];
            if (flowFrom.length >= 1 && !cfg2.entities.grid_import_today) { cfg2.entities.grid_import_today = flowFrom[0].stat_energy_from; found.push('Grid import: ' + flowFrom[0].stat_energy_from); }
            if (flowTo.length >= 1 && !cfg2.entities.grid_export_today) { cfg2.entities.grid_export_today = flowTo[0].stat_energy_to; found.push('Grid export: ' + flowTo[0].stat_energy_to); }
          }
        }
      }
    } catch (e) { console.warn('energy/get_prefs not available, using fallback detection'); }

    // Step 2: Generic fallback detection for missing daily energy entities
    const energyDefs = [
      { key: 'solar_energy_today', patterns: [/solar.*energy.*daily/i, /solar.*energy.*today/i, /solar.*production.*daily/i, /pv.*energy.*today/i, /solar.*yield.*today/i, /summary_day_pv/i, /daily_yield_energy/i, /day_pv_energy/i, /today.*generation/i, /daily_generation/i, /solar.*today.*kwh/i], meter: 'solar_energy' },
      { key: 'load_energy_today', patterns: [/load.*energy.*daily/i, /load.*energy.*today/i, /consumption.*energy.*daily/i, /consumption.*today/i, /home.*consumption.*daily/i, /summary_day_load/i, /daily_consumption/i, /day_load_energy/i, /today.*consumption/i], meter: 'load_energy' },
      { key: 'battery_charge_today', patterns: [/battery.*charge.*energy.*daily/i, /battery.*charge.*today/i, /battery.*input.*energy.*daily/i, /summary_day_battery_charge/i, /daily_charge_energy/i, /day_battery_charge/i, /today.*battery.*charge/i], meter: 'battery_charge' },
      { key: 'battery_discharge_today', patterns: [/battery.*discharge.*energy.*daily/i, /battery.*discharge.*today/i, /battery.*output.*energy.*daily/i, /summary_day_battery_discharge/i, /daily_discharge_energy/i, /day_battery_discharge/i, /today.*battery.*discharge/i], meter: 'battery_discharge' },
      { key: 'grid_import_today', patterns: [/grid.*import.*energy.*daily/i, /grid.*import.*today/i, /grid.*buy.*energy.*daily/i, /electricity.*import.*daily/i, /summary_day_grid_import/i, /daily.*grid.*buy/i, /day_grid_import/i, /today.*grid.*import/i, /today.*buy/i], meter: 'grid_import' },
      { key: 'grid_export_today', patterns: [/grid.*export.*energy.*daily/i, /grid.*export.*today/i, /grid.*sell.*energy.*daily/i, /grid.*feed.*daily/i, /summary_day_grid_export/i, /daily.*grid.*sell/i, /day_grid_export/i, /today.*grid.*export/i, /today.*sell/i, /today.*feed/i], meter: 'grid_export' },
    ];
    // Filter out grid import/export from generic detection when dual_tariff is enabled
    // (they are handled via tariff entities instead)
    const energyDefsFiltered = cfg2.features.dual_tariff
      ? energyDefs.filter(d => d.key !== 'grid_import_today' && d.key !== 'grid_export_today')
      : energyDefs;
    for (const def of energyDefsFiltered) {
      if (!cfg2.entities[def.key]) {
        // Try to find a matching daily entity
        const candidates = this._findEntityCandidates(allKeys, def.patterns, { domainFilter: 'sensor' });
        if (candidates.length > 0) {
          this._assignCandidate(def.key, candidates, cfg2, found);
        } else {
          // Try to find a cumulative/lifetime entity that could be converted
          const cumulativePatterns = def.patterns.map(p => new RegExp(p.source.replace(/daily|today/gi, '').replace(/\.\*\.\*/g, '.*'), 'i'));
          const cumCandidates = this._findEntityCandidates(allKeys, cumulativePatterns, { domainFilter: 'sensor' });
          // Filter to only cumulative entities (total_increasing state class)
          const actualCumulative = cumCandidates.filter(eid => {
            const s = this._hass.states[eid];
            return s?.attributes?.state_class === 'total_increasing' || s?.attributes?.state_class === 'total';
          });
          if (actualCumulative.length > 0) {
            this._assignCandidate(def.key, actualCumulative, cfg2, found);
          }
        }
      }
    }

    // Step 3: For all detected energy entities, check if cumulative and auto-create daily helpers
    const energyKeys = [
      ['solar_energy_today', 'solar_energy'],
      ['load_energy_today', 'load_energy'],
      ['battery_charge_today', 'battery_charge'],
      ['battery_discharge_today', 'battery_discharge'],
      ...(!cfg2.features.dual_tariff ? [['grid_import_today', 'grid_import'], ['grid_export_today', 'grid_export']] : []),
    ];
    for (const [cfgKey, meterName] of energyKeys) {
      if (cfg2.entities[cfgKey]) {
        const result = await this._ensureDailyMeter(cfg2.entities[cfgKey], meterName);
        if (result.isCumulative) {
          const origEntity = cfg2.entities[cfgKey];
          cfg2.entities[cfgKey] = result.dailyEntity;
          found.push('⚡ ' + meterName + ': created daily helper (' + origEntity + ' → ' + result.dailyEntity + ')');
        }
      }
    }
    // Also handle dual tariff entities — ensure they point to daily helpers, not cumulative lifetime sensors
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
      (k) => k.endsWith('_network_optimization_status') || k.endsWith('_optimizer_status'),
    ], { domainFilter: 'sensor' });
    this._assignCandidate('haeo_optim_status', haeoStatusCandidates, cfg2, found);

    // If HAEO status found (single or picked), derive related entities
    const statusKey = cfg2.entities.haeo_optim_status;
    if (statusKey) {
      // Derive cost/duration from status key — handle both naming patterns
      let costKey, durKey;
      if (statusKey.endsWith('_network_optimization_status')) {
        costKey = statusKey.replace('_network_optimization_status', '_network_optimization_cost');
        durKey = statusKey.replace('_network_optimization_status', '_network_optimization_duration');
      } else {
        costKey = statusKey.replace(/_status$/, '_cost');
        durKey = statusKey.replace(/_status$/, '_duration');
      }
      if (costKey !== statusKey && allKeys.includes(costKey)) { cfg2.entities.haeo_optim_cost = costKey; found.push('HAEO cost: ' + costKey); }
      if (durKey !== statusKey && allKeys.includes(durKey)) { cfg2.entities.haeo_optim_duration = durKey; found.push('HAEO duration: ' + durKey); }

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

      // HAEO price entities — number.grid_import_price / number.grid_export_price
      const impPriceC = this._findEntityCandidates(allKeys, [
        (k) => k.includes('grid_import_price') || k.includes('import_price'),
      ], { domainFilter: 'number' });
      this._assignCandidate('haeo_import_price', impPriceC, cfg2, found);

      const expPriceC = this._findEntityCandidates(allKeys, [
        (k) => k.includes('grid_export_price') || k.includes('export_price'),
      ], { domainFilter: 'number' });
      this._assignCandidate('haeo_export_price', expPriceC, cfg2, found);

      cfg2.features.ems_provider = 'haeo'; cfg2.features.haeo_forecasts = true;
      found.push('✓ HAEO detected');
    }
    // EMHASS detection fallback — require sensor.emhass_ prefix AND confirmatory evidence
    if (!statusKey) {
      const emhassC = this._findEntityCandidates(allKeys, [
        // Must have sensor.emhass_ prefix and end with _mode (e.g. sensor.emhass_current_mode)
        (k) => k.startsWith('sensor.emhass_') && k.endsWith('_mode') && !k.includes('_mode_'),
      ], { domainFilter: 'sensor' });
      // Confirm EMHASS by checking for standard EMHASS published entities:
      //   - sensor.p_batt_forecast / sensor.p_grid_forecast / sensor.p_pv_forecast (stock EMHASS publish-data)
      //   - sensor.emhass_ entities for costs/savings/decisions (custom EMHASS integrations)
      //   - sensor.*mpc_* with battery/grid/pv (MPC optimization outputs)
      const hasEmhassPublished = allKeys.some(k =>
        k.startsWith('sensor.p_batt') || k.startsWith('sensor.p_grid') || k.startsWith('sensor.p_pv')
      );
      const hasEmhassCustom = allKeys.filter(k =>
        k.startsWith('sensor.emhass_') && (k.includes('_cost') || k.includes('_savings') || k.includes('_decision') || k.includes('_forecast'))
      ).length >= 2;
      const hasEmhassMpc = allKeys.some(k =>
        k.startsWith('sensor.') && k.includes('emhass') && k.includes('mpc')
      );
      if (emhassC.length > 0 && (hasEmhassPublished || hasEmhassCustom || hasEmhassMpc)) {
        this._assignCandidate('emhass_mode', emhassC, cfg2, found);
        if (cfg2.entities.emhass_mode) {
          cfg2.features.ems_provider = 'emhass';
        }
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
        grid_voltage: sigenKeys.find(k => k.includes('plant_grid_phase_a_voltage')) || sigenKeys.find(k => k.includes('grid_phase_a_voltage')) || sigenKeys.find(k => (k.includes('_a_phase_voltage') || k.endsWith('_grid_voltage')) && !k.includes('inverter')),
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
    const emsProvider = f.ems_provider || (f.emhass === true ? 'emhass' : 'none');
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
          ${this._toggleHtml('Forecast Table', 'Show a tabular timeline of upcoming forecast data (PV/Battery/Grid/Load/SoC/Prices)', 'forecast_table', f.forecast_table)}
          ${this._toggleHtml('Financial Tracking', 'Show cost/savings cards and chart annotations', 'financial_tracking', f.financial_tracking)}
        ` : ''}
        ${emsProvider === 'haeo' ? `
          ${this._toggleHtml('HAEO Forecasts', 'Overlay HAEO optimization schedule on energy charts (via forecast attributes)', 'haeo_forecasts', f.haeo_forecasts)}
          ${this._toggleHtml('Forecast Table', 'Show a tabular timeline of upcoming forecast data (PV/Battery/Grid/Load/SoC/Prices)', 'forecast_table', f.forecast_table)}
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
        <div class="section-title">⚡ Smart Load Monitoring</div>
        <div style="font-size:10px;color:#666;margin-bottom:6px;">Track individual appliance power consumption. Enable the feature, then add loads below or use Auto-Detect to find power sensors.</div>
        ${this._toggleHtml('Smart Loads', 'Show a grid of individual appliance tiles with real-time power and daily energy', 'smart_loads', f.smart_loads)}
        ${f.smart_loads ? `
          ${this._toggleHtml('Include EMS Loads', 'Also detect entities already assigned as Heat Pump, Boiler, or Deferrable Loads in the EMS/Entities config', 'smart_load_include_ems', f.smart_load_include_ems)}
          ${this._toggleHtml('Hide Inactive Loads', 'Only show devices that are currently consuming energy (above standby threshold)', 'smart_load_hide_inactive', f.smart_load_hide_inactive)}
          <div style="margin-top:8px;">
            <div class="row">
              <span class="row-label" style="font-size:12px;color:#8892a4;">Grid Columns</span>
              <input class="row-input smart-load-setting" type="number" min="2" max="6" value="${f.smart_load_columns || 4}" data-sl-key="smart_load_columns" style="width:60px;" />
            </div>
            <div class="row" style="margin-top:4px;">
              <span class="row-label" style="font-size:12px;color:#8892a4;">Sort By</span>
              <select class="row-input smart-load-setting" data-sl-key="smart_load_sort" style="width:100px;background:var(--card-background-color,#1a1f2e);color:var(--primary-text-color,#fff);border:1px solid var(--divider-color,#2d3451);border-radius:6px;padding:4px;">
                <option value="power" ${(f.smart_load_sort||'power')==='power'?'selected':''}>Power ↓</option>
                <option value="energy" ${f.smart_load_sort==='energy'?'selected':''}>Energy ↓</option>
                <option value="name" ${f.smart_load_sort==='name'?'selected':''}>Name A-Z</option>
              </select>
            </div>
            <div class="row" style="margin-top:4px;">
              <span class="row-label" style="font-size:12px;color:#8892a4;">Standby Threshold (W)</span>
              <input class="row-input smart-load-setting" type="number" min="1" max="50" value="${f.smart_load_standby_threshold || 5}" data-sl-key="smart_load_standby_threshold" style="width:60px;" />
            </div>
          </div>
          <div style="margin-top:10px;display:flex;gap:6px;">
            <button class="action-btn" id="sl-auto-detect" style="flex:1;padding:8px;background:rgba(0,212,184,0.12);border:1px solid rgba(0,212,184,0.3);border-radius:8px;color:#00d4b8;font-size:11px;font-weight:600;cursor:pointer;">🔍 Auto-Detect Loads</button>
            <button class="action-btn" id="sl-add-manual" style="flex:1;padding:8px;background:rgba(63,81,181,0.12);border:1px solid rgba(63,81,181,0.3);border-radius:8px;color:#7c8cf8;font-size:11px;font-weight:600;cursor:pointer;">➕ Add Manual</button>
          </div>
          <div id="sl-load-list" style="margin-top:10px;">
            ${this._renderSmartLoadList(cfg)}
          </div>
        ` : ''}
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

    // Smart Load settings bindings
    el.querySelectorAll('.smart-load-setting').forEach(input => {
      const handler = () => {
        const cfg2 = this._storeGet();
        const key = input.dataset.slKey;
        if (input.type === 'number') {
          cfg2.features[key] = parseInt(input.value) || parseInt(input.min) || 4;
        } else {
          cfg2.features[key] = input.value;
        }
        this._storeSave(cfg2);
      };
      input.addEventListener('change', handler);
    });

    // Smart Load auto-detect button
    const slAutoBtn = el.querySelector('#sl-auto-detect');
    if (slAutoBtn) {
      slAutoBtn.addEventListener('click', async () => {
        slAutoBtn.textContent = '⏳ Detecting...';
        slAutoBtn.disabled = true;
        try {
          const detected = await this._autoDetectSmartLoads();
          if (detected.length === 0) {
            slAutoBtn.textContent = '✅ No new loads found';
            setTimeout(() => { slAutoBtn.textContent = '🔍 Auto-Detect Loads'; slAutoBtn.disabled = false; }, 2000);
            return;
          }
          const cfg2 = this._storeGet();
          if (!cfg2.smart_loads) cfg2.smart_loads = [];
          const existingPower = new Set(cfg2.smart_loads.map(l => l.entity_power));
          let added = 0;
          for (const load of detected) {
            if (!existingPower.has(load.entity_power)) {
              cfg2.smart_loads.push(load);
              existingPower.add(load.entity_power);
              added++;
            }
          }
          this._storeSave(cfg2);
          slAutoBtn.textContent = `✅ Added ${added} load${added !== 1 ? 's' : ''}`;
          setTimeout(() => { slAutoBtn.textContent = '🔍 Auto-Detect Loads'; slAutoBtn.disabled = false; }, 2000);
          // Rebuild the load list
          const listEl = el.querySelector('#sl-load-list');
          if (listEl) { listEl.innerHTML = this._renderSmartLoadList(cfg2); this._bindSmartLoadListEvents(el); this._bindSmartLoadEntityAutocomplete(el); }
          // Rebuild dashboard to add smart load card
          if (this._hass) this._buildDashboard();
        } catch (e) {
          console.error('Smart load auto-detect failed:', e);
          slAutoBtn.textContent = '❌ Error';
          setTimeout(() => { slAutoBtn.textContent = '🔍 Auto-Detect Loads'; slAutoBtn.disabled = false; }, 2000);
        }
      });
    }

    // Smart Load manual add button
    const slAddBtn = el.querySelector('#sl-add-manual');
    if (slAddBtn) {
      slAddBtn.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        if (!cfg2.smart_loads) cfg2.smart_loads = [];
        cfg2.smart_loads.push({
          id: 'load_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          entity_power: '',
          entity_energy: '',
          type: 'plug_socket',
          label: 'New Load',
          show_in_sankey: false,
        });
        this._storeSave(cfg2);
        const listEl = el.querySelector('#sl-load-list');
        if (listEl) {
          listEl.innerHTML = this._renderSmartLoadList(cfg2);
          this._bindSmartLoadListEvents(el);
          this._bindSmartLoadEntityAutocomplete(el);
          // Scroll to and focus the newly added item
          const newItem = listEl.querySelector(`.sl-item[data-idx="${cfg2.smart_loads.length - 1}"]`);
          if (newItem) {
            newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            const labelInput = newItem.querySelector('.sl-label');
            if (labelInput) { labelInput.focus(); labelInput.select(); }
          }
        }
        // Rebuild dashboard to include new load
        if (this._hass) this._buildDashboard();
      });
    }

    // Bind existing smart load list events
    this._bindSmartLoadListEvents(el);
    this._bindSmartLoadEntityAutocomplete(el);
  }

  _renderSmartLoadList(cfg) {
    const loads = cfg.smart_loads || [];
    if (!loads.length) {
      return '<div style="font-size:11px;color:#666;text-align:center;padding:12px;">No smart loads configured. Use Auto-Detect or Add Manual.</div>';
    }
    const types = window.__sigApplianceTypes || [];
    const imgBase = _SIGENERGY_SCRIPT_DIR + 'images/smart_load/';
    return loads.map((load, idx) => `
      <div class="sl-item" data-idx="${idx}" style="display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(92,156,230,0.12);border-radius:8px;">
        <img src="${imgBase}${load.type || 'plug_socket'}_mid.png" style="width:28px;height:28px;object-fit:contain;" onerror="this.src='${imgBase}plug_socket_mid.png'" />
        <div style="flex:1;min-width:0;">
          <input class="sl-label" data-idx="${idx}" value="${(load.label || '').replace(/"/g, '&quot;')}" placeholder="Label" style="width:100%;border:none;background:transparent;color:var(--primary-text-color,#fff);font-size:12px;font-weight:600;outline:none;" />
          <div class="entity-input-wrap" style="position:relative;">
            <input class="sl-entity" data-idx="${idx}" value="${load.entity_power || ''}" placeholder="sensor.xxx_power — type to search" autocomplete="off" style="width:100%;border:none;background:transparent;color:#8892a4;font-size:10px;outline:none;margin-top:2px;" />
            <div class="entity-dropdown sl-entity-dropdown" data-dropdown-idx="${idx}"></div>
          </div>
        </div>
        <select class="sl-type" data-idx="${idx}" style="width:80px;background:var(--card-background-color,#1a1f2e);color:var(--secondary-text-color,#8892a4);border:1px solid var(--divider-color,#2d3451);border-radius:4px;font-size:10px;padding:2px;">
          ${types.map(t => `<option value="${t.id}" ${load.type === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
        <button class="sl-delete" data-idx="${idx}" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:16px;padding:4px;">✕</button>
      </div>
    `).join('');
  }

  _bindSmartLoadListEvents(el) {
    // Label changes
    el.querySelectorAll('.sl-label').forEach(input => {
      input.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const idx = parseInt(input.dataset.idx);
        if (cfg2.smart_loads?.[idx]) {
          cfg2.smart_loads[idx].label = input.value;
          this._storeSave(cfg2);
        }
      });
    });
    // Entity changes
    el.querySelectorAll('.sl-entity').forEach(input => {
      input.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const idx = parseInt(input.dataset.idx);
        if (cfg2.smart_loads?.[idx]) {
          cfg2.smart_loads[idx].entity_power = input.value;
          this._storeSave(cfg2);
          if (this._hass) this._buildDashboard();
        }
      });
    });
    // Type selector changes
    el.querySelectorAll('.sl-type').forEach(select => {
      select.addEventListener('change', () => {
        const cfg2 = this._storeGet();
        const idx = parseInt(select.dataset.idx);
        if (cfg2.smart_loads?.[idx]) {
          cfg2.smart_loads[idx].type = select.value;
          this._storeSave(cfg2);
          // Update the icon
          const itemEl = select.closest('.sl-item');
          if (itemEl) {
            const img = itemEl.querySelector('img');
            if (img) img.src = _SIGENERGY_SCRIPT_DIR + 'images/smart_load/' + select.value + '_mid.png';
          }
        }
      });
    });
    // Delete buttons
    el.querySelectorAll('.sl-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        const idx = parseInt(btn.dataset.idx);
        if (cfg2.smart_loads?.[idx]) {
          cfg2.smart_loads.splice(idx, 1);
          this._storeSave(cfg2);
          const listEl = el.querySelector('#sl-load-list');
          if (listEl) { listEl.innerHTML = this._renderSmartLoadList(cfg2); this._bindSmartLoadListEvents(el); this._bindSmartLoadEntityAutocomplete(el); }
          if (this._hass) this._buildDashboard();
        }
      });
    });
  }

  _bindSmartLoadEntityAutocomplete(el) {
    if (!this._hass || !this._hass.states) return;
    const allEntityIds = Object.keys(this._hass.states);
    const closeAllSLDropdowns = () => {
      el.querySelectorAll('.sl-entity-dropdown.open').forEach(d => d.classList.remove('open'));
    };
    el.querySelectorAll('.sl-entity').forEach(input => {
      const wrap = input.closest('.entity-input-wrap');
      const dropdown = wrap ? wrap.querySelector('.sl-entity-dropdown') : null;
      if (!dropdown) return;
      const showDropdown = (filter) => {
        const q = (filter || '').toLowerCase();
        if (!q || q.length < 2) { dropdown.classList.remove('open'); return; }
        const matches = allEntityIds.filter(k => {
          const st = this._hass.states[k];
          const fn = (st?.attributes?.friendly_name || '').toLowerCase();
          return k.toLowerCase().includes(q) || fn.includes(q);
        }).slice(0, 40);
        if (matches.length === 0) { dropdown.classList.remove('open'); return; }
        dropdown.innerHTML = matches.map(k => {
          const st = this._hass.states[k];
          const fn = st?.attributes?.friendly_name || '';
          const val = st?.state || '';
          const uom = st?.attributes?.unit_of_measurement || '';
          return '<div class="entity-dropdown-item" data-eid="' + this._esc(k) + '"><span class="entity-name">' + this._esc(k) + '</span>' + (fn ? ' <span class="entity-state">' + this._esc(fn) + '</span>' : '') + ' <span class="entity-state">= ' + this._esc(val) + (uom ? ' ' + this._esc(uom) : '') + '</span></div>';
        }).join('');
        dropdown.classList.add('open');
        dropdown.querySelectorAll('.entity-dropdown-item').forEach(item => {
          item.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            input.value = item.dataset.eid;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            closeAllSLDropdowns();
          });
        });
      };
      input.addEventListener('focus', () => showDropdown(input.value));
      input.addEventListener('input', () => showDropdown(input.value));
      input.addEventListener('blur', () => { setTimeout(closeAllSLDropdowns, 200); });
    });
  }

  async _autoDetectSmartLoads() {
    if (!this._hass) return [];
    const allStates = this._hass.states;
    const cfg = this._storeGet();
    const includeEms = cfg.features?.smart_load_include_ems;

    // Entity keys that represent actual end-device power (not system-level)
    const emsLoadKeys = new Set(['heat_pump_power', 'deferrable0_power', 'deferrable1_power', 'ev_charger_power']);

    // Gather all entities already assigned to core/system roles
    const assignedEntities = new Set();
    const entities = cfg.entities || {};
    for (const [key, val] of Object.entries(entities)) {
      if (val && typeof val === 'string' && val.startsWith('sensor.')) {
        // When includeEms is on, don't exclude EMS load entities from detection
        if (includeEms && emsLoadKeys.has(key)) continue;
        assignedEntities.add(val);
      }
    }
    // Also exclude already-configured smart loads
    for (const load of (cfg.smart_loads || [])) {
      if (load.entity_power) assignedEntities.add(load.entity_power);
      if (load.entity_energy) assignedEntities.add(load.entity_energy);
    }

    const classify = window.__sigClassifyByName || ((name) => 'plug_socket');

    // System-level entity ID patterns to exclude
    const systemIdRegex = /(inverter|battery|grid|solar|pv[\d_]|mpc_|emhass|solcast|capaciteit|peak_|yambms|plant|sigen_|photovoltaic|deferr|slimmeleze|_no_var_|home_power|house.load|total.power|net.power|remain|forecast|cost_|price_|tarif|production|all_standby|home_consumption|home_total|total_consumption|essential_load|non_essential_load|grid_load|load_power$|daily_load)/;
    // System-level friendly name patterns to exclude
    const systemFnRegex = /(slimmeleze|p1.meter|energy.meter|smart.meter|home.?power|net.?power|home.?consumption|total.?(power|consumption|load)|essential.?load|grid.?load)/i;

    // Find candidate power sensors
    const candidates = [];
    for (const [entityId, state] of Object.entries(allStates)) {
      if (!entityId.startsWith('sensor.')) continue;
      if (assignedEntities.has(entityId)) continue;
      const uom = state.attributes?.unit_of_measurement;
      const dc = state.attributes?.device_class;
      if (!((dc === 'power') || uom === 'W' || uom === 'kW')) continue;
      // Exclude system-level sensors (inverters, battery, grid, solar, EMHASS, meters, photovoltaics, etc.)
      if (systemIdRegex.test(entityId.toLowerCase())) continue;
      // Skip generic meter entity IDs (P1 meter: power_consumed, power_produced, and their phases)
      if (/^sensor\.(power_consumed|power_produced)/.test(entityId)) continue;
      // Skip entities with hex addresses (Zigbee devices without friendly names)
      if (/0x[0-9a-f]{10,}/.test(entityId.toLowerCase())) continue;
      // Skip entities whose friendly name looks like a raw address or is a known system name
      const fn = state.attributes?.friendly_name || '';
      if (/^0x[0-9a-f]{10,}/i.test(fn)) continue;
      if (systemFnRegex.test(fn)) continue;
      candidates.push([entityId, state]);
    }

    return candidates.map(([entityId, state]) => {
      const friendlyName = state.attributes?.friendly_name || entityId;
      const type = classify(friendlyName);

      // Try to find a matching energy sensor
      const baseName = entityId.replace(/_power$/, '');
      const energyCandidates = [baseName + '_energy', baseName + '_consumption', baseName + '_kwh',
                                 baseName + '_energy_today', baseName + '_daily_energy'];
      const energyEntity = energyCandidates.find(e => e in allStates) || '';

      return {
        id: 'load_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        entity_power: entityId,
        entity_energy: energyEntity,
        type,
        label: friendlyName
          .replace(/\s*(Vermogen|Power|Puissance|Leistung|Watt|Consumed|Produced|Phase\s*\d*)\s*/gi, '')
          .replace(/_/g, ' ')
          .trim() || entityId.split('.')[1].replace(/_power$/, '').replace(/_/g, ' '),
        show_in_sankey: false,
      };
    });
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
    // Also rejects energy units (Wh/kWh/MWh) to prevent cumulative counters from breaking the axis
    const powerTransform = "const u = (entity?.attributes?.unit_of_measurement || '').trim(); if (/wh$/i.test(u)) return null; return u === 'MW' ? x * 1000 : u === 'kW' ? x : x / 1000;";
    const fp = this._storeGet()?.display?.decimal_places ?? 1;
    // Actual solar
    if (e.solar_power) series.push({
      entity: e.solar_power,
      name: 'Solar', color: '#F0A830', type: 'area', opacity: 0.25,
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: powerTransform,
      group_by: { func: 'last', duration: '1min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: fp
    });
    // Actual battery
    if (e.battery_power) series.push({
      entity: e.battery_power,
      name: 'Battery', color: '#00d4b8', type: 'line',
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: powerTransform,
      group_by: { func: 'last', duration: '1min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: fp
    });
    // Actual grid
    if (e.grid_active_power || e.grid_power) series.push({
      entity: e.grid_active_power || e.grid_power,
      name: 'Grid', color: '#E53935', type: 'line',
      stroke_width: 2.5, extend_to: false, unit: ' kW',
      transform: powerTransform,
      group_by: { func: 'last', duration: '1min' },
      show: { in_header: true, legend_value: true },
      yaxis_id: 'power', float_precision: fp
    });
    // Actual consumption (inverted)
    if (e.load_power) series.push({
      entity: e.load_power,
      name: 'Consumption', color: '#AB47BC', type: 'area', opacity: 0.10,
      stroke_width: 1.5, extend_to: false, unit: ' kW',
      transform: powerTransform,
      group_by: { func: 'last', duration: '1min' },
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
        show: { in_header: false, legend_value: false, in_legend: false },
        data_generator: "const data = entity.attributes.forecasts;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_pv_power) / 1000]);",
        yaxis_id: 'power'
      });
      // Battery forecast
      if (e.mpc_battery) {
        series.push({
          entity: e.mpc_battery, name: 'Battery (plan)', color: '#A5D6A7',
          type: 'area', opacity: 0.06, curve: 'stepline', extend_to: false,
          unit: ' kW', stroke_width: 1, stroke_dash: 5,
          show: { in_header: false, legend_value: false, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_chart: true, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_legend: false },
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
          group_by: { func: 'last', duration: '1min' },
          show: { in_header: true, legend_value: true },
          yaxis_id: 'soc', float_precision: 1
        });
      }
    }

    // HAEO Forecast overlays (conditional) — reads forecast attribute from HAEO sensors
    const emsProvider = features.ems_provider || (features.emhass === true ? 'emhass' : 'none');
    if (emsProvider === 'haeo' && features.haeo_forecasts) {
      // HAEO Battery charge forecast
      if (e.haeo_battery_charge) {
        series.push({
          entity: e.haeo_battery_charge, name: 'Charge (plan)', color: '#A5D6A7',
          type: 'area', opacity: 0.06, curve: 'stepline', extend_to: false,
          unit: ' kW', stroke_width: 1, stroke_dash: 5,
          show: { in_header: false, legend_value: false, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_chart: true, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_legend: false },
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
          group_by: { func: 'last', duration: '1min' },
          show: { in_header: true, legend_value: true },
          yaxis_id: 'soc', float_precision: 1
        });
      }
      // HAEO optimization cost in header
      if (features.financial_tracking && e.haeo_optim_cost) {
        series.push({
          entity: e.haeo_optim_cost, name: 'Optim Cost', unit: ' ' + (cfg.pricing?.currency || '$'),
          show: { legend_value: true, in_chart: false, in_header: 'raw' },
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
          entity: e.buy_price, name: 'Import Price (plan)', color: '#FFD54F',
          type: 'line', extend_to: false, unit: priceUnit,
          float_precision: 4, stroke_width: 1, opacity: 0.7,
          show: { in_header: false, legend_value: false, in_legend: false },
          data_generator: buyDG,
          yaxis_id: 'price', curve: 'stepline', stroke_dash: 5
        });
        // State-tracked line (actual price history) — only if no separate current_import_price
        if (!e.current_import_price || e.current_import_price === e.buy_price) {
          series.push({
            entity: e.buy_price, name: 'Import Price', color: '#FFB300',
            type: 'area', opacity: 0.08, stroke_width: 2, extend_to: false,
            unit: priceUnit, float_precision: 4,
            group_by: { func: 'avg', duration: '30min' },
            show: { in_header: false, legend_value: true },
            yaxis_id: 'price', curve: 'stepline', stroke_dash: 3
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
          entity: e.sell_price, name: 'Export Price (plan)', color: '#A5D6A7',
          type: 'line', extend_to: false, unit: priceUnit,
          float_precision: 4, stroke_width: 1, opacity: 0.7,
          show: { in_header: false, legend_value: false, in_legend: false },
          data_generator: sellDG,
          yaxis_id: 'price', curve: 'stepline', stroke_dash: 5
        });
        // State-tracked line — only if no separate current_export_price
        if (!e.current_export_price || e.current_export_price === e.sell_price) {
          series.push({
            entity: e.sell_price, name: 'Export Price', color: '#43A047',
            type: 'area', opacity: 0.08, stroke_width: 2, extend_to: false,
            unit: priceUnit, float_precision: 4,
            group_by: { func: 'avg', duration: '30min' },
            show: { in_header: false, legend_value: true },
            yaxis_id: 'price', curve: 'stepline', stroke_dash: 3
          });
        }
      }
      // Actual prices (separate entities — used when buy/sell are EMHASS-specific and these are the actual Amber/Nordpool sensors)
      if (e.current_import_price && e.current_import_price !== e.buy_price) {
        series.push({
          entity: e.current_import_price, name: 'Import Price', color: '#FFB300',
          type: 'area', opacity: 0.08, stroke_width: 2, extend_to: false,
          unit: priceUnit, float_precision: 4,
          group_by: { func: 'avg', duration: '1h' },
          show: { in_header: false, legend_value: true },
          yaxis_id: 'price', curve: 'stepline', stroke_dash: 3
        });
      }
      if (e.current_export_price && e.current_export_price !== e.sell_price) {
        series.push({
          entity: e.current_export_price, name: 'Export Price', color: '#43A047',
          type: 'area', opacity: 0.08, stroke_width: 2, extend_to: false,
          unit: priceUnit, float_precision: 4,
          group_by: { func: 'avg', duration: '1h' },
          show: { in_header: false, legend_value: true },
          yaxis_id: 'price', curve: 'stepline', stroke_dash: 3
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
          show: { in_header: false, legend_value: false, in_chart: true, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_legend: false },
          data_generator: "const data = entity.attributes.deferrables_schedule;\nif (!data) return [];\nreturn data.map(d => [new Date(d.date).getTime(), parseFloat(d.mpc_deferrable0) / 1000]);",
          yaxis_id: 'power', invert: true, float_precision: 0
        });
      }
      if (e.mpc_deferrable1) {
        series.push({
          entity: e.mpc_deferrable1, name: (e.deferrable1_label || 'Deferrable 1') + ' (plan)',
          color: '#26A69A', type: 'area', opacity: 0.05, curve: 'stepline',
          extend_to: false, unit: ' kW', stroke_width: 0.8, stroke_dash: 4,
          show: { in_header: false, legend_value: false, in_legend: false },
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
          show: { in_header: false, legend_value: false, in_legend: false },
          yaxis_id: 'power', invert: true, opacity: 1, float_precision: fp
        });
      }
    }

    // EMHASS financial header (in chart header)
    if (features.emhass && features.financial_tracking) {
      if (e.emhass_net_cost_today) {
        series.push({
          entity: e.emhass_net_cost_today, name: 'Cost Today', unit: ' ' + (cfg.pricing?.currency || '€'),
          show: { legend_value: true, in_chart: false, in_header: 'raw' },
          float_precision: 2, yaxis_id: 'power'
        });
      }
      if (e.emhass_savings_today) {
        series.push({
          entity: e.emhass_savings_today, name: 'Savings Today', unit: ' ' + (cfg.pricing?.currency || '€'),
          color: '#4CAF50',
          show: { legend_value: true, in_chart: false, in_header: 'raw' },
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
          title: { text: 'Power (kW)', style: { fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 } },
          labels: { style: { fontSize: '10px', colors: ['rgba(255,255,255,0.5)'] } },
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
    const emsP = features.ems_provider || (features.emhass === true ? 'emhass' : 'none');
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

    // Runtime check: if dual tariff entities are still cumulative (not daily helpers),
    // try to find existing daily helpers or run _ensureDailyMeter to create them
    if (f.dual_tariff) {
      const dualKeys = [
        ['grid_import_high_tariff', 'grid_import_high'],
        ['grid_import_low_tariff', 'grid_import_low'],
        ['grid_export_high_tariff', 'grid_export_high'],
        ['grid_export_low_tariff', 'grid_export_low'],
      ];
      let changed = false;
      for (const [cfgKey, meterName] of dualKeys) {
        if (e[cfgKey] && e[cfgKey] !== 'sensor.entity_id') {
          const result = await this._ensureDailyMeter(e[cfgKey], meterName);
          if (result.isCumulative && result.dailyEntity !== e[cfgKey]) {
            e[cfgKey] = result.dailyEntity;
            cfg.entities[cfgKey] = result.dailyEntity;
            changed = true;
          }
        }
      }
      if (changed) {
        store.save(cfg);
      }
    }

    try {
      const config = await this._hass.callWS({ type: 'lovelace/config', url_path: 'dashboard-sigenergy' });

      // Build the apex chart with conditional series
      const series = this._buildApexSeries(e, f, cfg);
      const yaxis = this._buildYAxes(f, cfg);
      const emsP = f.ems_provider || (f.emhass === true ? 'emhass' : 'none');
      const hasEmhassForecasts = emsP === 'emhass' && f.emhass_forecasts;
      const hasHaeoForecasts = emsP === 'haeo' && f.haeo_forecasts;
      const hasForecasts = hasEmhassForecasts || hasHaeoForecasts;
      const hasSolarForecast = f.solar_forecast && (e.solcast_today || e.solcast_remaining || e.forecast_solar_today);
      const hasPriceOverlay = (e.buy_price || e.sell_price) && cfg.pricing?.show_price_overlay;
      const showExtendedChart = hasForecasts || hasSolarForecast || hasPriceOverlay;

      // Theme-aware card style — resolves 'auto' / 'dark' / 'light'
      const _resolvedTheme = this._resolveTheme();

      // Compute sunrise/sunset xaxis annotations from sun.sun entity
      const _sunXAnnotations = [];
      const _sunEntity = this._hass?.states?.['sun.sun'];
      if (f.sunrise_sunset && _sunEntity?.attributes?.next_rising && _sunEntity?.attributes?.next_setting) {
        const _nextRise = new Date(_sunEntity.attributes.next_rising);
        const _nextSet = new Date(_sunEntity.attributes.next_setting);
        const _todayUtc = new Date().toISOString().slice(0, 10);
        // If next event is tomorrow (UTC date differs), today's was 24h earlier
        const _todayRise = _nextRise.toISOString().slice(0, 10) === _todayUtc
          ? _nextRise : new Date(_nextRise.getTime() - 86400000);
        const _todaySet = _nextSet.toISOString().slice(0, 10) === _todayUtc
          ? _nextSet : new Date(_nextSet.getTime() - 86400000);
        const _fmt = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const _sunAnno = (ts, text, clr) => ({
          x: ts, borderColor: clr, strokeDashArray: 4,
          label: { text, borderColor: clr, orientation: 'horizontal', position: 'top',
            style: { color: '#fff', background: clr, fontSize: '9px', padding: { left: 3, right: 3, top: 1, bottom: 1 } } }
        });
        // Yesterday, today, tomorrow sunrise/sunset (covers 48h span)
        for (const offset of [-86400000, 0, 86400000]) {
          const r = new Date(_todayRise.getTime() + offset);
          const s = new Date(_todaySet.getTime() + offset);
          _sunXAnnotations.push(_sunAnno(r.getTime(), '☀ ' + _fmt(r), offset === 0 ? 'rgba(255,165,0,0.6)' : 'rgba(255,165,0,0.35)'));
          _sunXAnnotations.push(_sunAnno(s.getTime(), '🌙 ' + _fmt(s), offset === 0 ? 'rgba(100,80,180,0.6)' : 'rgba(100,80,180,0.35)'));
        }
      }

      const _apexCardModStyle = _resolvedTheme === 'light'
        ? 'ha-card { background: var(--ha-card-background, rgba(255,255,255,0.95)) !important; border: 1px solid var(--divider-color, rgba(0,0,0,0.08)) !important; border-radius: var(--ha-card-border-radius, 16px) !important; color: var(--primary-text-color, #1a1f2e); box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important; } .apexcharts-tooltip { background: rgba(255,255,255,0.96) !important; border: 1px solid rgba(0,212,184,0.25) !important; border-radius: 8px !important; color: #333 !important; font-size: 12px !important; backdrop-filter: blur(8px) !important; box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; } .apexcharts-tooltip-title { background: rgba(0,212,184,0.08) !important; border-bottom: 1px solid rgba(0,212,184,0.15) !important; color: #1a1f2e !important; font-weight: 600 !important; } .apexcharts-toolbar { top: 4px !important; right: 4px !important; } .apexcharts-toolbar svg { fill: rgba(0,0,0,0.4) !important; } .apexcharts-toolbar svg:hover { fill: #00b89c !important; } .apexcharts-legend-series { display: inline-flex !important; align-items: center !important; gap: 4px !important; } .apexcharts-legend-text:empty { display: none !important; } .apexcharts-legend-text:empty + .apexcharts-legend-marker, .apexcharts-legend-series:has(.apexcharts-legend-text:empty) { display: none !important; } @media (max-width: 600px) { .apexcharts-legend-text { font-size: 13px !important; } .apexcharts-legend-marker { width: 10px !important; height: 10px !important; } }'
        : 'ha-card { background: var(--ha-card-background, linear-gradient(135deg, rgba(30,33,40,0.95) 0%, rgba(40,44,52,0.98) 100%)) !important; border: 1px solid var(--divider-color, rgba(92,156,230,0.12)) !important; border-radius: var(--ha-card-border-radius, 16px) !important; color: var(--primary-text-color, #fff); } .apexcharts-tooltip { background: rgba(26,31,46,0.95) !important; border: 1px solid rgba(0,212,184,0.3) !important; border-radius: 8px !important; color: #e0e0e0 !important; font-size: 12px !important; backdrop-filter: blur(8px) !important; box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important; } .apexcharts-tooltip-title { background: rgba(0,212,184,0.12) !important; border-bottom: 1px solid rgba(0,212,184,0.2) !important; color: #fff !important; font-weight: 600 !important; } .apexcharts-toolbar { top: 4px !important; right: 4px !important; } .apexcharts-toolbar .apexcharts-zoom-icon svg, .apexcharts-toolbar .apexcharts-pan-icon svg, .apexcharts-toolbar .apexcharts-reset-icon svg, .apexcharts-toolbar .apexcharts-zoomin-icon svg, .apexcharts-toolbar .apexcharts-zoomout-icon svg, .apexcharts-toolbar .apexcharts-selection-icon svg { fill: rgba(255,255,255,0.5) !important; } .apexcharts-toolbar svg:hover { fill: #00d4b8 !important; } .apexcharts-legend-series { display: inline-flex !important; align-items: center !important; gap: 4px !important; } .apexcharts-legend-text:empty { display: none !important; } .apexcharts-legend-text:empty + .apexcharts-legend-marker, .apexcharts-legend-series:has(.apexcharts-legend-text:empty) { display: none !important; } @media (max-width: 600px) { .apexcharts-legend-text { font-size: 13px !important; } .apexcharts-legend-marker { width: 10px !important; height: 10px !important; } }';

      const apexChart = {
        type: 'custom:apexcharts-card',
        card_mod: {
          style: _apexCardModStyle
        },
        header: {
          show: true, show_states: true, colorize_states: true,
          title: hasEmhassForecasts ? 'Energy + EMHASS Forecast' : hasHaeoForecasts ? 'Energy + HAEO Forecast' : hasSolarForecast ? 'Energy + Solar Forecast' : 'Energy Overview'
        },
        graph_span: showExtendedChart ? '48h' : '24h',
        update_interval: '10s',
        apex_config: {
          chart: {
            height: showExtendedChart ? '500px' : '350px',
            animations: { enabled: true, easing: 'easeinout', speed: 400, dynamicAnimation: { enabled: true, speed: 200 } },
            stacked: false,
            zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
            toolbar: {
              show: true,
              tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
              autoSelected: 'zoom'
            },
            pinch: { enabled: true },
            dropShadow: { enabled: false }
          },
          xaxis: {
            type: 'datetime',
            labels: {
              datetimeFormatter: { minute: 'HH:mm', hour: 'HH:00', day: 'dd MMM' },
              style: { fontSize: '10px', colors: _resolvedTheme === 'light' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)' },
              rotateAlways: false, hideOverlappingLabels: true
            },
            tickAmount: showExtendedChart ? 24 : 12,
            axisBorder: { show: false },
            axisTicks: { show: true, color: _resolvedTheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' },
            crosshairs: { show: true, stroke: { color: '#00d4b8', width: 1, dashArray: 3 } }
          },
          tooltip: {
            x: { format: 'dd MMM HH:mm' }, shared: true, intersect: false,
            followCursor: true,
            theme: _resolvedTheme === 'light' ? 'light' : 'dark'
          },
          legend: {
            show: true, position: 'bottom', horizontalAlign: 'center',
            fontSize: '11px',
            fontFamily: 'inherit',
            labels: { colors: _resolvedTheme === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' },
            markers: { size: 4, strokeWidth: 0, offsetX: -2 },
            itemMargin: { horizontal: 8, vertical: 2 }
          },
          stroke: { curve: 'smooth' },
          grid: {
            borderColor: _resolvedTheme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            padding: { left: 8, right: 8 }
          },
          annotations: {
            yaxis: showExtendedChart ? [{ y: 0, yAxisIndex: 0, borderColor: _resolvedTheme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)', strokeDashArray: 3 }] : [],
            xaxis: _sunXAnnotations.length > 0 ? _sunXAnnotations : undefined
          }
        },
        now: { show: true, label: 'Now', color: '#00d4b8' },
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
            card_mod: { style: 'ha-card { background: linear-gradient(135deg, rgba(0,180,120,0.15), rgba(0,120,80,0.08)) !important; border: 1px solid rgba(0,180,120,0.25) !important; border-radius: 12px !important; color: var(--primary-text-color, #fff); } mushroom-state-info { --card-primary-font-size: 16px; --card-secondary-font-size: 12px; overflow: visible !important; white-space: normal !important; }' }
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
            card_mod: { style: 'ha-card { background: linear-gradient(135deg, rgba(124,77,255,0.15), rgba(80,50,180,0.08)) !important; border: 1px solid rgba(124,77,255,0.25) !important; border-radius: 12px !important; color: var(--primary-text-color, #fff); } mushroom-state-info { --card-primary-font-size: 16px; --card-secondary-font-size: 12px; overflow: visible !important; white-space: normal !important; }' }
          }
        };
      }

      // Build status mushroom cards
      // Helper: build Jinja template that shows value + unit from the sensor itself
      const pwrThresh = cfg.display?.power_threshold || 1000;
      const _powerTpl = (eid) => {
        // Normalise to watts then auto-scale so the chip always shows a sensible value.
        // state_attr might return None (HA bug / entity loading), so coerce via default(…, true).
        return "{% set u = (state_attr('" + eid + "', 'unit_of_measurement') or 'W') | string %}" +
               "{% set raw = states('" + eid + "') | float(0) %}" +
               "{% set w = raw * 1000000 if u == 'MW' else raw * 1000 if u == 'kW' else raw %}" +
               "{% if w >= " + pwrThresh + " %}{{ (w / 1000) | round(2) }} kW{% else %}{{ w | round(0) }} W{% endif %}";
      };

      // Card styles
      const _cardStyle = _resolvedTheme === 'light'
        ? 'ha-card { background: linear-gradient(135deg, rgba(0,212,184,0.06) 0%, rgba(255,255,255,0.92) 60%, rgba(240,252,250,0.95) 100%) !important; backdrop-filter: blur(14px) !important; -webkit-backdrop-filter: blur(14px) !important; border: 1px solid rgba(0,212,184,0.18) !important; border-radius: 16px !important; color: var(--primary-text-color, #1a1f2e) !important; box-shadow: 0 2px 12px rgba(0,212,184,0.08), inset 0 1px 0 rgba(255,255,255,0.8) !important; transition: transform 0.15s ease, box-shadow 0.15s ease !important; } ha-card:active { transform: scale(0.97) !important; } mushroom-state-info { --card-primary-font-size: 14px !important; --card-secondary-font-size: 14px !important; }'
        : 'ha-card { background: linear-gradient(135deg, rgba(18,24,40,0.95) 0%, rgba(26,31,46,0.98) 50%, rgba(20,28,42,0.95) 100%) !important; backdrop-filter: blur(14px) !important; -webkit-backdrop-filter: blur(14px) !important; border: 1px solid rgba(0,212,184,0.18) !important; border-radius: 16px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0,212,184,0.06) !important; transition: transform 0.15s ease, box-shadow 0.15s ease !important; } ha-card:active { transform: scale(0.97) !important; } mushroom-state-info { --card-primary-font-size: 14px !important; --card-secondary-font-size: 14px !important; }';
      const statusCards = [];
      if (e.solar_power) statusCards.push({
        type: 'custom:mushroom-template-card',
        entity: e.solar_power, primary: 'Solar', icon: 'mdi:solar-power', icon_color: 'orange',
        secondary: _powerTpl(e.solar_power), card_mod: { style: _cardStyle }
      });
      if (e.load_power) statusCards.push({
        type: 'custom:mushroom-template-card',
        entity: e.load_power, primary: 'Home', icon: 'mdi:home-lightning-bolt', icon_color: 'deep-purple',
        secondary: _powerTpl(e.load_power), card_mod: { style: _cardStyle }
      });
      if (e.battery_soc) statusCards.push({
        type: 'custom:mushroom-template-card',
        entity: e.battery_soc, primary: 'Battery', icon: 'mdi:battery', icon_color: 'green',
        secondary: "{{ states('" + e.battery_soc + "') | round(0) }}%",
        card_mod: { style: _cardStyle }
      });
      if (e.grid_active_power || e.grid_power) statusCards.push({
        type: 'custom:mushroom-template-card',
        entity: e.grid_active_power || e.grid_power, primary: 'Grid', icon: 'mdi:transmission-tower', icon_color: 'red',
        secondary: _powerTpl(e.grid_active_power || e.grid_power), card_mod: { style: _cardStyle }
      });

      // Build stat cards
      // Helper: build unit-aware energy template that normalises MWh/Wh → kWh
      const _energyTpl = (eid) => {
        return "{% set u = (state_attr('" + eid + "', 'unit_of_measurement') or 'kWh') | string %}" +
               "{% set raw = states('" + eid + "') | float(0) %}" +
               "{% set kwh = raw * 1000 if u == 'MWh' else raw / 1000 if u == 'Wh' else raw %}" +
               "{{ kwh | round(1) }} kWh";
      };
      const statCards = [];
      const addStat = (entity, name, icon, color) => {
        if (!entity) return;
        statCards.push({
          type: 'custom:mushroom-template-card',
          entity: entity,
          primary: name, icon: icon, icon_color: color,
          secondary: _energyTpl(entity),
          card_mod: { style: _cardStyle }
        });
      };
      addStat(e.solar_energy_today, 'Solar', 'mdi:solar-power', 'orange');
      addStat(e.load_energy_today, 'Load', 'mdi:power-plug', 'purple');
      addStat(e.battery_charge_today, 'Charged', 'mdi:battery-arrow-up', 'green');
      addStat(e.battery_discharge_today, 'Discharged', 'mdi:battery-arrow-down', 'teal');

      // Grid import/export mushroom cards — dual tariff sums high+low via Jinja (unit-aware)
      if (f.dual_tariff && (e.grid_import_high_tariff || e.grid_import_low_tariff)) {
        const hiI = e.grid_import_high_tariff, loI = e.grid_import_low_tariff;
        const impEntity = hiI || loI;
        const impSecondary = (hiI && loI)
          ? "{% set u = (state_attr('" + hiI + "', 'unit_of_measurement') or 'kWh') | string %}" +
            "{% set hi = states('" + hiI + "') | float(0) %}" +
            "{% set lo = states('" + loI + "') | float(0) %}" +
            "{% set total = hi + lo %}" +
            "{% set kwh = total * 1000 if u == 'MWh' else total / 1000 if u == 'Wh' else total %}" +
            "{{ kwh | round(1) }} kWh"
          : _energyTpl(impEntity);
        statCards.push({
          type: 'custom:mushroom-template-card',
          entity: impEntity,
          primary: 'Imported', icon: 'mdi:transmission-tower-import', icon_color: 'red',
          secondary: impSecondary,
          card_mod: { style: _cardStyle }
        });
      } else {
        addStat(e.grid_import_today, 'Imported', 'mdi:transmission-tower-import', 'red');
      }
      if (f.dual_tariff && (e.grid_export_high_tariff || e.grid_export_low_tariff)) {
        const hiE = e.grid_export_high_tariff, loE = e.grid_export_low_tariff;
        const expEntity = hiE || loE;
        const expSecondary = (hiE && loE)
          ? "{% set u = (state_attr('" + hiE + "', 'unit_of_measurement') or 'kWh') | string %}" +
            "{% set hi = states('" + hiE + "') | float(0) %}" +
            "{% set lo = states('" + loE + "') | float(0) %}" +
            "{% set total = hi + lo %}" +
            "{% set kwh = total * 1000 if u == 'MWh' else total / 1000 if u == 'Wh' else total %}" +
            "{{ kwh | round(1) }} kWh"
          : _energyTpl(expEntity);
        statCards.push({
          type: 'custom:mushroom-template-card',
          entity: expEntity,
          primary: 'Exported', icon: 'mdi:transmission-tower-export', icon_color: 'blue',
          secondary: expSecondary,
          card_mod: { style: _cardStyle }
        });
      } else {
        addStat(e.grid_export_today, 'Exported', 'mdi:transmission-tower-export', 'blue');
      }

      // Build self-sufficiency card (unit-aware: normalise both to kWh before dividing)
      const selfSuffCard = (e.solar_energy_today && e.load_energy_today) ? {
        type: 'custom:mushroom-template-card',
        entity: e.solar_energy_today,
        primary: 'Self-Sufficiency',
        secondary: "{% set su = (state_attr('" + e.solar_energy_today + "', 'unit_of_measurement') or 'kWh') | string %}" +
          "{% set sr = states('" + e.solar_energy_today + "') | float(0) %}" +
          "{% set solar = sr * 1000 if su == 'MWh' else sr / 1000 if su == 'Wh' else sr %}" +
          "{% set lu = (state_attr('" + e.load_energy_today + "', 'unit_of_measurement') or 'kWh') | string %}" +
          "{% set lr = states('" + e.load_energy_today + "') | float(0) %}" +
          "{% set load = lr * 1000 if lu == 'MWh' else lr / 1000 if lu == 'Wh' else lr %}" +
          "{{ ((solar / load) * 100) | round(1) if load > 0 else 0 }}%",
        icon: 'mdi:check-decagram', icon_color: 'green',
        card_mod: { style: _resolvedTheme === 'light'
          ? 'ha-card { background: linear-gradient(135deg, rgba(0,212,184,0.08), rgba(255,255,255,0.9)) !important; backdrop-filter: blur(14px) !important; -webkit-backdrop-filter: blur(14px) !important; border: 1px solid rgba(0,212,184,0.2) !important; border-radius: 16px !important; color: var(--primary-text-color, #1a1f2e) !important; box-shadow: 0 2px 12px rgba(0,212,184,0.1) !important; } mushroom-state-info { --card-primary-font-size: 14px !important; --card-secondary-font-size: 18px !important; --card-secondary-color: #00b89c !important; }'
          : 'ha-card { background: linear-gradient(135deg, rgba(0,212,184,0.12), rgba(45,52,81,0.5)) !important; backdrop-filter: blur(14px) !important; -webkit-backdrop-filter: blur(14px) !important; border: 1px solid rgba(0,212,184,0.2) !important; border-radius: 16px !important; box-shadow: 0 4px 16px rgba(0,212,184,0.1), inset 0 1px 0 rgba(0,212,184,0.1) !important; } mushroom-state-info { --card-primary-font-size: 14px !important; --card-secondary-font-size: 18px !important; --card-secondary-color: #00d4b8 !important; }' }
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

      // Set view theme based on resolved theme setting
      overviewView.theme = _resolvedTheme === 'light' ? 'sigenergy_light' : 'sigenergy_dark';

      // Get the layout card
      const mainLayout = overviewView.cards[0];
      if (!mainLayout || mainLayout.type !== 'custom:layout-card') throw new Error('Layout card not found');

      // Responsive grid: 3 columns on desktop (house|sankey|battery), 2 on tablet, 1 on mobile
      if (mainLayout.layout) {
        mainLayout.layout['grid-template-columns'] = '1fr';
        mainLayout.layout['align-items'] = 'start';
        if (mainLayout.layout.mediaquery) {
          mainLayout.layout.mediaquery['(min-width: 769px)'] = {
            'grid-template-columns': '1fr 1fr',
            'align-items': 'start'
          };
          mainLayout.layout.mediaquery['(min-width: 1201px)'] = {
            'grid-template-columns': '1fr 1fr 1fr',
            'grid-template-rows': 'auto',
            'align-items': 'start'
          };
          mainLayout.layout.mediaquery['(min-width: 1800px)'] = {
            'grid-template-columns': '1fr 1fr 1fr',
            'grid-template-rows': 'auto',
            'max-width': '2200px',
            'margin': '0 auto',
            'align-items': 'start'
          };
        }
      }

      // Build new cards array
      const newCards = [];

      // Card 0: House + optional EMS status
      // Get existing house card or create default, sync entities from store, and add min-height
      // mainLayout.cards[0] may be a layout-card (after rebuild) wrapping [houseVerticalStack, batteryCard]
      // Or it may be the original vertical-stack. Find the sigenergy-house-card wherever it is.
      const _findHouseCard = (cards) => {
        if (!cards) return null;
        for (const c of cards) {
          if (c.type === 'custom:sigenergy-house-card') return c;
          if (c.cards) { const h = _findHouseCard(c.cards); if (h) return h; }
        }
        return null;
      };
      const houseCardOrig = _findHouseCard(mainLayout.cards) || { type: 'custom:sigenergy-house-card' };
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

      // Build Forecast Timeline Table (conditional on forecast_table feature)
      let forecastTableCard = null;
      let ftToggleCard = null;
      let ftConditionalCard = null;
      if (f.forecast_table && emsP !== 'none') {
        const currency = cfg.pricing?.currency || '€';
        const _ft = _resolvedTheme;
        const _ftBg = _ft === 'light' ? '#f8f9fa' : 'rgba(30,35,54,0.94)';
        const _ftBorder = _ft === 'light' ? '#e0e0e0' : '#2d3451';
        const _ftText = _ft === 'light' ? '#1a1f2e' : '#e0e4ec';
        const _ftMuted = _ft === 'light' ? '#666' : '#8892a4';
        const _ftRowAlt = _ft === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)';
        const _ftNowBg = _ft === 'light' ? 'rgba(0,212,184,0.12)' : 'rgba(0,212,184,0.15)';

        if (emsP === 'haeo') {
          // HAEO forecast table — uses forecast attributes (HTML table via html-template-card)
          const hImpP = e.haeo_import_price || '';
          const hExpP = e.haeo_export_price || '';
          const hBatt = e.haeo_battery_charge || e.haeo_battery_discharge || '';
          const hGrid = e.haeo_grid_power || '';
          const hSolar = e.haeo_solar_power || '';
          const hLoad = e.haeo_load_power || '';
          const hSoc = e.haeo_battery_soc || '';
          const hHasNet = hImpP && hExpP && hGrid;

          // Build Jinja2 template — iterates over export price forecast or falls back
          const iterEntity = hExpP || hImpP || hSolar || hLoad || hGrid || hBatt || hSoc;
          if (iterEntity) {
            // Count total columns for colspan in day-divider rows
            let haeCols = 1; // Time
            if (hImpP) haeCols++;
            if (hExpP) haeCols++;
            if (hSolar) haeCols++;
            if (hLoad) haeCols++;
            if (hGrid) haeCols++;
            if (hBatt) haeCols++;
            if (hSoc) haeCols++;
            if (hHasNet) haeCols++;
            const leftCols = Math.max(1, haeCols - 3);
            const rightCols = haeCols - leftCols;

            let tpl = '';
            // CSS variables for theming
            const _thStyle = "position:sticky; top:0; z-index:2; background:var(--card-background-color); padding:4px 6px; border-bottom:2px solid var(--divider-color); text-align:center; white-space:nowrap; font-size:11px; color:var(--secondary-text-color);";
            const _tdStyle = "padding:4px 6px; border-bottom:1px solid var(--divider-color); text-align:center; white-space:nowrap;";
            const _dayStyle = "padding:6px; border-bottom:1px solid var(--divider-color); border-top:2px solid var(--divider-color); font-weight:bold; background:var(--secondary-background-color);";

            // Collect all forecast arrays into time-keyed maps
            tpl += "{%- set _iter = state_attr('" + iterEntity + "', 'forecast') or [] %}\n";
            if (hImpP) tpl += "{%- set _imp_fc = state_attr('" + hImpP + "', 'forecast') or [] %}\n";
            if (hExpP) tpl += "{%- set _exp_fc = state_attr('" + hExpP + "', 'forecast') or [] %}\n";
            if (hBatt) tpl += "{%- set _batt_fc = state_attr('" + hBatt + "', 'forecast') or [] %}\n";
            if (hGrid) tpl += "{%- set _grid_fc = state_attr('" + hGrid + "', 'forecast') or [] %}\n";
            if (hSolar) tpl += "{%- set _solar_fc = state_attr('" + hSolar + "', 'forecast') or [] %}\n";
            if (hLoad) tpl += "{%- set _load_fc = state_attr('" + hLoad + "', 'forecast') or [] %}\n";
            if (hSoc) tpl += "{%- set _soc_fc = state_attr('" + hSoc + "', 'forecast') or [] %}\n";

            // Build time-keyed lookup dicts
            tpl += "{%- set ns = namespace(imp={}, exp={}, batt={}, grid={}, solar={}, load={}, soc={}) %}\n";
            if (hImpP) tpl += "{%- for p in _imp_fc %}{%- set ts = p.time | as_datetime | as_local | as_timestamp | string %}{%- set ns.imp = dict(ns.imp, **{ts: (p.value * 100) | round(2)}) %}{%- endfor %}\n";
            if (hExpP) tpl += "{%- for p in _exp_fc %}{%- set ts = p.time | as_datetime | as_local | as_timestamp | string %}{%- set ns.exp = dict(ns.exp, **{ts: (p.value * 100) | round(2)}) %}{%- endfor %}\n";
            if (hBatt) tpl += "{%- for p in _batt_fc %}{%- set ts = p.time | as_datetime | as_local | as_timestamp | string %}{%- set ns.batt = dict(ns.batt, **{ts: (p.value) | round(1)}) %}{%- endfor %}\n";
            if (hGrid) tpl += "{%- for p in _grid_fc %}{%- set ts = p.time | as_datetime | as_local | as_timestamp | string %}{%- set ns.grid = dict(ns.grid, **{ts: (p.value) | round(1)}) %}{%- endfor %}\n";
            if (hSolar) tpl += "{%- for p in _solar_fc %}{%- set ts = p.time | as_datetime | as_local | as_timestamp | string %}{%- set ns.solar = dict(ns.solar, **{ts: (p.value) | round(1)}) %}{%- endfor %}\n";
            if (hLoad) tpl += "{%- for p in _load_fc %}{%- set ts = p.time | as_datetime | as_local | as_timestamp | string %}{%- set ns.load = dict(ns.load, **{ts: (p.value) | round(1)}) %}{%- endfor %}\n";
            if (hSoc) tpl += "{%- for p in _soc_fc %}{%- set ts = p.time | as_datetime | as_local | as_timestamp | string %}{%- set ns.soc = dict(ns.soc, **{ts: (p.value) | round(0)}) %}{%- endfor %}\n";

            // Compute per-slot net cost from buy/sell prices and grid power
            if (hHasNet) {
              tpl += "{%- set ns2 = namespace(daily={}, cur_day='', cur_total=0) %}\n";
              tpl += "{%- for p in _iter %}\n";
              tpl += "{%- set ts = p.time | as_datetime | as_local | as_timestamp %}\n";
              tpl += "{%- set _day = ts | timestamp_custom('%Y-%m-%d') %}\n";
              tpl += "{%- set _g = ns.grid.get(ts|string, 0)|float(0) %}\n";
              tpl += "{%- set _bp = ns.imp.get(ts|string, 0)|float(0) / 100 %}\n";
              tpl += "{%- set _sp = ns.exp.get(ts|string, 0)|float(0) / 100 %}\n";
              // HAEO: grid > 0 = export (selling), grid < 0 = import (buying)
              tpl += "{%- set _slot_cost = (_sp * [_g, 0]|max * -1) + (_bp * [-_g, 0]|max) %}\n";
              tpl += "{%- if _day != ns2.cur_day %}\n";
              tpl += "{%- if ns2.cur_day != '' %}{%- set ns2.daily = dict(ns2.daily, **{ns2.cur_day: ns2.cur_total | round(4)}) %}{%- endif %}\n";
              tpl += "{%- set ns2.cur_day = _day %}{%- set ns2.cur_total = _slot_cost %}\n";
              tpl += "{%- else %}{%- set ns2.cur_total = ns2.cur_total + _slot_cost %}{%- endif %}\n";
              tpl += "{%- endfor %}\n";
              tpl += "{%- if ns2.cur_day != '' %}{%- set ns2.daily = dict(ns2.daily, **{ns2.cur_day: ns2.cur_total | round(4)}) %}{%- endif %}\n";
            }

            tpl += "{%- set today = now() | as_timestamp | timestamp_custom('%Y-%m-%d') %}\n";
            tpl += "{%- set months = ['January','February','March','April','May','June','July','August','September','October','November','December'] %}\n";

            // HTML table start
            tpl += '<div style="max-height:570px; overflow-y:auto; position:relative;">\n';
            tpl += '<table style="border-collapse:collapse; width:100%; font-size:12px;">\n';
            tpl += '<thead><tr>\n';
            tpl += '<th style="' + _thStyle + '">Time</th>\n';
            if (hImpP) tpl += '<th style="' + _thStyle + '">Buy ' + currency + '</th>\n';
            if (hExpP) tpl += '<th style="' + _thStyle + '">Sell ' + currency + '</th>\n';
            if (hSolar) tpl += '<th style="' + _thStyle + '">PV kW</th>\n';
            if (hLoad) tpl += '<th style="' + _thStyle + '">Load kW</th>\n';
            if (hGrid) tpl += '<th style="' + _thStyle + '">Grid kW</th>\n';
            if (hBatt) tpl += '<th style="' + _thStyle + '">Batt kW</th>\n';
            if (hSoc) tpl += '<th style="' + _thStyle + '">SoC %</th>\n';
            if (hHasNet) tpl += '<th style="' + _thStyle + '">Net ' + currency + '</th>\n';
            tpl += '</tr></thead>\n';

            // TODAY section — fully expanded
            tpl += '<tbody>\n';
            tpl += "{%- set _todayHeader = namespace(shown=false) %}\n";
            tpl += "{%- for p in _iter %}\n";
            tpl += "{%- set ts = p.time | as_datetime | as_local | as_timestamp %}\n";
            tpl += "{%- set _day = ts | timestamp_custom('%Y-%m-%d') %}\n";
            tpl += "{%- if _day == today %}\n";
            tpl += "{%- set _isNow = (ts | int - now().timestamp() | int) | abs < 900 %}\n";
            tpl += "{%- if not _todayHeader.shown %}{%- set _todayHeader.shown = true %}\n";
            if (hHasNet) {
              tpl += "{%- set _day_total = ns2.daily.get(_day, 0) | float(0) %}\n";
              tpl += "{%- set _day_color = '#00cc00' if _day_total < 0 else '#ff4444' %}\n";
              tpl += "{%- set _day_label = 'Daily Total: -" + currency + "' + '%0.2f' | format(_day_total | abs) if _day_total < 0 else 'Daily Total: +" + currency + "' + '%0.2f' | format(_day_total | abs) %}\n";
            }
            tpl += "{%- set _month = months[(ts | timestamp_custom('%m') | int) - 1] %}\n";
            tpl += "{%- set _day_name = '📅 ' + ts | timestamp_custom('%A %d ') + _month %}\n";
            tpl += '<tr><td colspan="' + leftCols + '" style="' + _dayStyle + ' text-align:center;"><span>{{ _day_name }}</span></td>';
            if (hHasNet) {
              tpl += '<td colspan="' + rightCols + '" style="' + _dayStyle + ' text-align:right;"><span style="color:{{ _day_color }};">{{ _day_label }}</span></td>';
            } else {
              tpl += '<td colspan="' + rightCols + '" style="' + _dayStyle + ' text-align:right;">&nbsp;</td>';
            }
            tpl += '</tr>\n';
            tpl += "{%- endif %}\n";

            // Data row
            tpl += "{%- set t = ts | timestamp_custom('%H:%M') %}\n";
            tpl += "{%- set _isPast = ts | int < (now().timestamp() | int - 450) %}\n";
            // Value lookups
            if (hImpP) tpl += "{%- set _imp_val = ns.imp.get(ts|string, 0) | float(0) %}\n";
            if (hExpP) tpl += "{%- set _exp_val = ns.exp.get(ts|string, 0) | float(0) %}\n";
            if (hGrid) tpl += "{%- set _g = ns.grid.get(ts|string) %}\n";
            if (hSoc) tpl += "{%- set _soc_val = ns.soc.get(ts|string) | float(50) %}\n";
            if (hHasNet) {
              tpl += "{%- set _g_f = ns.grid.get(ts|string, 0)|float(0) %}\n";
              tpl += "{%- set _nc = (ns.exp.get(ts|string,0)|float(0)/100) * [_g_f, 0]|max * -1 + (ns.imp.get(ts|string,0)|float(0)/100) * [-_g_f, 0]|max %}\n";
            }

            // Colors
            if (hImpP) tpl += "{%- set _imp_color = '#ff2222' if _imp_val >= 50 else '#cc6600' if _imp_val >= 40 else '#cccc00' if _imp_val >= 30 else '#00e5cc' if _imp_val >= 20 else '#888888' %}\n";
            if (hExpP) tpl += "{%- set _exp_color = '#00ff00' if _exp_val >= 250 else '#00cc00' if _exp_val >= 100 else '#009900' if _exp_val >= 50 else '#336633' if _exp_val >= 30 else '#888888' %}\n";
            if (hGrid) tpl += "{%- set _g_color = '#00cc00' if (_g|float(0)) > 0 else '#ff4444' if (_g|float(0)) < 0 else '#888888' %}\n";
            if (hSoc) tpl += "{%- set _soc_color = '#ff4444' if _soc_val <= 20 else '#00cc00' if _soc_val >= 75 else '' %}\n";
            if (hHasNet) tpl += "{%- set _nc_color = '#00cc00' if _nc < -0.001 else '#ff4444' if _nc > 0.001 else '' %}\n";

            tpl += "{%- if _isPast %}\n";
            // Past row — dimmed
            tpl += '<tr style="opacity:0.4;"><td style="' + _tdStyle + '">{{ t }}</td>';
            if (hImpP) tpl += '<td style="' + _tdStyle + '">{{ _imp_val | round(1) }}</td>';
            if (hExpP) tpl += '<td style="' + _tdStyle + '">{{ _exp_val | round(1) }}</td>';
            if (hSolar) tpl += '<td style="' + _tdStyle + '">{{ ns.solar.get(ts|string, 0) }}</td>';
            if (hLoad) tpl += '<td style="' + _tdStyle + '">{{ ns.load.get(ts|string, \'—\') }}</td>';
            if (hGrid) tpl += '<td style="' + _tdStyle + '">{{ _g if _g is not none else \'—\' }}</td>';
            if (hBatt) tpl += '<td style="' + _tdStyle + '">{{ ns.batt.get(ts|string, \'—\') }}</td>';
            if (hSoc) tpl += '<td style="' + _tdStyle + '">{{ ns.soc.get(ts|string, \'—\') }}%</td>';
            if (hHasNet) tpl += "<td style=\"" + _tdStyle + "\">{{ '%+0.4f' | format(_nc) }}</td>";
            tpl += '</tr>\n';

            tpl += "{%- else %}\n";
            // Current/future row — colored
            tpl += "<tr{{ ' style=font-weight:bold;' if _isNow else '' }}>";
            tpl += '<td style="' + _tdStyle + '">{{ \'▶ \' + t if _isNow else t }}</td>';
            if (hImpP) tpl += '<td style="' + _tdStyle + '"><span style="color:{{ _imp_color }};">{{ _imp_val | round(1) }}</span></td>';
            if (hExpP) tpl += '<td style="' + _tdStyle + '"><span style="color:{{ _exp_color }};">{{ _exp_val | round(1) }}</span></td>';
            if (hSolar) tpl += "<td style=\"" + _tdStyle + "\">{%- set _s = ns.solar.get(ts|string) %}{{ '<span style=color:#e8a835;>' ~ _s ~ '</span>' if _s and _s != 0 else '0' }}</td>";
            if (hLoad) tpl += '<td style="' + _tdStyle + '">{{ ns.load.get(ts|string, \'—\') }}</td>';
            if (hGrid) tpl += '<td style="' + _tdStyle + '"><span style="color:{{ _g_color }};">{{ _g if _g is not none else \'—\' }}</span></td>';
            if (hBatt) tpl += "<td style=\"" + _tdStyle + "\">{%- set _b = ns.batt.get(ts|string) %}<span style=\"color:{{ 'green' if (_b|float(0)) > 0 else 'orange' if (_b|float(0)) < 0 else 'grey' }};\">{{ _b if _b is not none else '—' }}</span></td>";
            if (hSoc) tpl += '<td style="' + _tdStyle + '"><span style="color:{{ _soc_color }};">{{ ns.soc.get(ts|string, \'—\') }}%</span></td>';
            if (hHasNet) tpl += "<td style=\"" + _tdStyle + "\"><span style=\"color:{{ _nc_color }};\">{{ '%+0.4f' | format(_nc) }}</span></td>";
            tpl += '</tr>\n';
            tpl += "{%- endif %}\n";

            tpl += "{%- endif %}\n"; // end if _day == today
            tpl += "{%- endfor %}\n";
            tpl += '</tbody>\n';

            // UPCOMING DAYS — summary rows only
            tpl += '<tbody>\n';
            tpl += '<tr><td colspan="' + haeCols + '" style="padding:8px 6px 4px 6px; text-align:left; font-size:11px; color:var(--secondary-text-color); letter-spacing:0.05em; border-top:3px solid var(--divider-color);">UPCOMING DAYS</td></tr>\n';
            tpl += "{%- set _seenDays = namespace(days=[]) %}\n";
            tpl += "{%- for p in _iter %}\n";
            tpl += "{%- set ts = p.time | as_datetime | as_local | as_timestamp %}\n";
            tpl += "{%- set _day = ts | timestamp_custom('%Y-%m-%d') %}\n";
            tpl += "{%- if _day != today and _day not in _seenDays.days %}\n";
            tpl += "{%- set _seenDays.days = _seenDays.days + [_day] %}\n";
            if (hHasNet) {
              tpl += "{%- set _day_total = ns2.daily.get(_day, 0) | float(0) %}\n";
              tpl += "{%- set _day_color = '#00cc00' if _day_total < 0 else '#ff4444' %}\n";
              tpl += "{%- set _day_label = 'Daily Total: -" + currency + "' + '%0.2f' | format(_day_total | abs) if _day_total < 0 else 'Daily Total: +" + currency + "' + '%0.2f' | format(_day_total | abs) %}\n";
            }
            tpl += "{%- set _month = months[(ts | timestamp_custom('%m') | int) - 1] %}\n";
            tpl += "{%- set _day_name = '📅 ' + ts | timestamp_custom('%A %d ') + _month %}\n";
            tpl += '<tr><td colspan="' + leftCols + '" style="' + _dayStyle + ' text-align:center;"><span>{{ _day_name }}</span></td>';
            if (hHasNet) {
              tpl += '<td colspan="' + rightCols + '" style="' + _dayStyle + ' text-align:right;"><span style="color:{{ _day_color }};">{{ _day_label }}</span></td>';
            } else {
              tpl += '<td colspan="' + rightCols + '" style="' + _dayStyle + ' text-align:right;">&nbsp;</td>';
            }
            tpl += '</tr>\n';
            tpl += "{%- endif %}\n";
            tpl += "{%- endfor %}\n";
            tpl += '</tbody>\n';

            tpl += '</table></div>\n';

            forecastTableCard = {
              type: 'custom:html-template-card',
              ignore_line_breaks: true,
              content: tpl,
              card_mod: { style: 'ha-card { background: ' + _ftBg + ' !important; border: 1px solid ' + _ftBorder + ' !important; border-radius: 12px !important; }' }
            };
          }
        } else if (emsP === 'emhass') {
          // EMHASS forecast table — each MPC entity has its own forecast attribute (HTML table via html-template-card)
          const mpPv = e.mpc_pv || '';
          const mpBatt = e.mpc_battery || '';
          const mpGrid = e.mpc_grid || '';
          const mpLoad = e.mpc_load || '';
          const mpSoc = e.mpc_soc || '';
          const bpEnt = e.buy_price || '';
          const spEnt = e.sell_price || '';
          const emHasNet = bpEnt && spEnt && mpGrid;

          const iterEnt = mpPv || mpGrid || mpLoad || mpBatt || '';
          if (iterEnt) {
            // Count total columns
            let emCols = 1; // Time
            if (bpEnt) emCols++;
            if (spEnt) emCols++;
            if (mpPv) emCols++;
            if (mpLoad) emCols++;
            if (mpGrid) emCols++;
            if (mpBatt) emCols++;
            if (mpSoc) emCols++;
            if (emHasNet) emCols++;
            const emLeftCols = Math.max(1, emCols - 3);
            const emRightCols = emCols - emLeftCols;

            const _thStyle = "position:sticky; top:0; z-index:2; background:var(--card-background-color); padding:4px 6px; border-bottom:2px solid var(--divider-color); text-align:center; white-space:nowrap; font-size:11px; color:var(--secondary-text-color);";
            const _tdStyle = "padding:4px 6px; border-bottom:1px solid var(--divider-color); text-align:center; white-space:nowrap;";
            const _dayStyle = "padding:6px; border-bottom:1px solid var(--divider-color); border-top:2px solid var(--divider-color); font-weight:bold; background:var(--secondary-background-color);";

            let tpl = '';
            // Load each entity's forecast into a time-keyed dict
            tpl += "{%- set _iter = state_attr('" + iterEnt + "', 'forecasts') or state_attr('" + iterEnt + "', 'battery_scheduled_power') or [] %}\n";
            tpl += "{%- set ns = namespace(pv={}, grid={}, load={}, batt={}, soc={}, buy={}, sell={}) %}\n";
            if (mpPv) tpl += "{%- for p in (state_attr('" + mpPv + "', 'forecasts') or []) %}{%- set ns.pv = dict(ns.pv, **{p.date: ((p.mpc_pv_power | float(0)) / 1000) | round(2)}) %}{%- endfor %}\n";
            if (mpGrid) tpl += "{%- for p in (state_attr('" + mpGrid + "', 'forecasts') or []) %}{%- set ns.grid = dict(ns.grid, **{p.date: ((p.mpc_grid_power | float(0)) / 1000) | round(2)}) %}{%- endfor %}\n";
            if (mpLoad) tpl += "{%- for p in (state_attr('" + mpLoad + "', 'forecasts') or []) %}{%- set ns.load = dict(ns.load, **{p.date: ((p.mpc_load_power | float(0)) / 1000) | round(2)}) %}{%- endfor %}\n";
            if (mpBatt) tpl += "{%- for p in (state_attr('" + mpBatt + "', 'battery_scheduled_power') or []) %}{%- set ns.batt = dict(ns.batt, **{p.date: ((p.mpc_batt_power | float(0)) / 1000) | round(2)}) %}{%- endfor %}\n";
            if (mpSoc) tpl += "{%- for p in (state_attr('" + mpSoc + "', 'battery_scheduled_soc') or []) %}{%- set ns.soc = dict(ns.soc, **{p.date: (p.mpc_batt_soc | float(0)) | round(0)}) %}{%- endfor %}\n";
            if (bpEnt) tpl += "{%- for p in (state_attr('" + bpEnt + "', 'unit_load_cost_forecasts') or []) %}{%- set ns.buy = dict(ns.buy, **{p.date: (p.mpc_general_price | float(0)) | round(4)}) %}{%- endfor %}\n";
            if (spEnt) tpl += "{%- for p in (state_attr('" + spEnt + "', 'unit_prod_price_forecasts') or []) %}{%- set ns.sell = dict(ns.sell, **{p.date: (p.mpc_feed_in_price | float(0)) | round(4)}) %}{%- endfor %}\n";

            // Compute per-slot net cost and daily totals
            if (emHasNet) {
              tpl += "{%- set ns2 = namespace(daily={}, cur_day='', cur_total=0) %}\n";
              tpl += "{%- for row in _iter %}\n";
              tpl += "{%- set dt = row.date %}\n";
              tpl += "{%- set _day = dt | as_datetime | as_local | as_timestamp | timestamp_custom('%Y-%m-%d') %}\n";
              tpl += "{%- set _g = ns.grid.get(dt, 0)|float(0) %}\n";
              tpl += "{%- set _bp = ns.buy.get(dt, 0)|float(0) %}\n";
              tpl += "{%- set _sp = ns.sell.get(dt, 0)|float(0) %}\n";
              // EMHASS: grid > 0 = import (buying), grid < 0 = export (selling)
              tpl += "{%- set _slot_cost = _bp * [_g, 0]|max + _sp * [_g, 0]|min * -1 * -1 %}\n";
              tpl += "{%- if _day != ns2.cur_day %}\n";
              tpl += "{%- if ns2.cur_day != '' %}{%- set ns2.daily = dict(ns2.daily, **{ns2.cur_day: ns2.cur_total | round(4)}) %}{%- endif %}\n";
              tpl += "{%- set ns2.cur_day = _day %}{%- set ns2.cur_total = _slot_cost %}\n";
              tpl += "{%- else %}{%- set ns2.cur_total = ns2.cur_total + _slot_cost %}{%- endif %}\n";
              tpl += "{%- endfor %}\n";
              tpl += "{%- if ns2.cur_day != '' %}{%- set ns2.daily = dict(ns2.daily, **{ns2.cur_day: ns2.cur_total | round(4)}) %}{%- endif %}\n";
            }

            tpl += "{%- set today = now() | as_timestamp | timestamp_custom('%Y-%m-%d') %}\n";
            tpl += "{%- set months = ['January','February','March','April','May','June','July','August','September','October','November','December'] %}\n";

            // HTML table start
            tpl += '<div style="max-height:570px; overflow-y:auto; position:relative;">\n';
            tpl += '<table style="border-collapse:collapse; width:100%; font-size:12px;">\n';
            tpl += '<thead><tr>\n';
            tpl += '<th style="' + _thStyle + '">Time</th>\n';
            if (bpEnt) tpl += '<th style="' + _thStyle + '">Buy ' + currency + '</th>\n';
            if (spEnt) tpl += '<th style="' + _thStyle + '">Sell ' + currency + '</th>\n';
            if (mpPv) tpl += '<th style="' + _thStyle + '">PV kW</th>\n';
            if (mpLoad) tpl += '<th style="' + _thStyle + '">Load kW</th>\n';
            if (mpGrid) tpl += '<th style="' + _thStyle + '">Grid kW</th>\n';
            if (mpBatt) tpl += '<th style="' + _thStyle + '">Batt kW</th>\n';
            if (mpSoc) tpl += '<th style="' + _thStyle + '">SoC %</th>\n';
            if (emHasNet) tpl += '<th style="' + _thStyle + '">Net ' + currency + '</th>\n';
            tpl += '</tr></thead>\n';

            // TODAY section — fully expanded
            tpl += '<tbody>\n';
            tpl += "{%- set _todayHeader = namespace(shown=false) %}\n";
            tpl += "{%- for row in _iter %}\n";
            tpl += "{%- set dt = row.date %}\n";
            tpl += "{%- set ts = dt | as_datetime | as_local | as_timestamp %}\n";
            tpl += "{%- set _day = ts | timestamp_custom('%Y-%m-%d') %}\n";
            tpl += "{%- if _day == today %}\n";
            tpl += "{%- set _isNow = (ts | int - now().timestamp() | int) | abs < 900 %}\n";
            tpl += "{%- if not _todayHeader.shown %}{%- set _todayHeader.shown = true %}\n";
            if (emHasNet) {
              tpl += "{%- set _day_total = ns2.daily.get(_day, 0) | float(0) %}\n";
              tpl += "{%- set _day_color = '#00cc00' if _day_total < 0 else '#ff4444' %}\n";
              tpl += "{%- set _day_label = 'Daily Total: -" + currency + "' + '%0.2f' | format(_day_total | abs) if _day_total < 0 else 'Daily Total: +" + currency + "' + '%0.2f' | format(_day_total | abs) %}\n";
            }
            tpl += "{%- set _month = months[(ts | timestamp_custom('%m') | int) - 1] %}\n";
            tpl += "{%- set _day_name = '📅 ' + ts | timestamp_custom('%A %d ') + _month %}\n";
            tpl += '<tr><td colspan="' + emLeftCols + '" style="' + _dayStyle + ' text-align:center;"><span>{{ _day_name }}</span></td>';
            if (emHasNet) {
              tpl += '<td colspan="' + emRightCols + '" style="' + _dayStyle + ' text-align:right;"><span style="color:{{ _day_color }};">{{ _day_label }}</span></td>';
            } else {
              tpl += '<td colspan="' + emRightCols + '" style="' + _dayStyle + ' text-align:right;">&nbsp;</td>';
            }
            tpl += '</tr>\n';
            tpl += "{%- endif %}\n";

            // Data row
            tpl += "{%- set t = ts | timestamp_custom('%H:%M') %}\n";
            tpl += "{%- set _isPast = ts | int < (now().timestamp() | int - 450) %}\n";
            // Value lookups
            if (bpEnt) tpl += "{%- set _buy_val = ns.buy.get(dt, 0) | float(0) %}\n";
            if (spEnt) tpl += "{%- set _sell_val = ns.sell.get(dt, 0) | float(0) %}\n";
            if (mpGrid) tpl += "{%- set _g = ns.grid.get(dt) %}\n";
            if (mpSoc) tpl += "{%- set _soc_val = ns.soc.get(dt) | float(50) %}\n";
            if (emHasNet) {
              tpl += "{%- set _g_f = ns.grid.get(dt, 0)|float(0) %}\n";
              tpl += "{%- set _nc = ns.buy.get(dt,0)|float(0) * [_g_f, 0]|max + ns.sell.get(dt,0)|float(0) * [_g_f, 0]|min * -1 * -1 %}\n";
            }

            // Colors
            if (bpEnt) tpl += "{%- set _buy_color = '#ff2222' if _buy_val >= 0.50 else '#cc6600' if _buy_val >= 0.40 else '#cccc00' if _buy_val >= 0.30 else '#00e5cc' if _buy_val >= 0.20 else '#888888' %}\n";
            if (spEnt) tpl += "{%- set _sell_color = '#00ff00' if _sell_val >= 0.25 else '#00cc00' if _sell_val >= 0.10 else '#009900' if _sell_val >= 0.05 else '#336633' if _sell_val >= 0.03 else '#888888' %}\n";
            if (mpGrid) tpl += "{%- set _g_color = '#ff4444' if (_g|float(0)) > 0 else '#00cc00' if (_g|float(0)) < 0 else '#888888' %}\n";
            if (mpSoc) tpl += "{%- set _soc_color = '#ff4444' if _soc_val <= 20 else '#00cc00' if _soc_val >= 75 else '' %}\n";
            if (emHasNet) tpl += "{%- set _nc_color = '#00cc00' if _nc < -0.001 else '#ff4444' if _nc > 0.001 else '' %}\n";

            tpl += "{%- if _isPast %}\n";
            // Past row — dimmed
            tpl += '<tr style="opacity:0.4;"><td style="' + _tdStyle + '">{{ t }}</td>';
            if (bpEnt) tpl += '<td style="' + _tdStyle + '">{{ _buy_val }}</td>';
            if (spEnt) tpl += '<td style="' + _tdStyle + '">{{ _sell_val }}</td>';
            if (mpPv) tpl += '<td style="' + _tdStyle + '">{{ ns.pv.get(dt, 0) }}</td>';
            if (mpLoad) tpl += '<td style="' + _tdStyle + '">{{ ns.load.get(dt, \'—\') }}</td>';
            if (mpGrid) tpl += '<td style="' + _tdStyle + '">{{ _g if _g is not none else \'—\' }}</td>';
            if (mpBatt) tpl += '<td style="' + _tdStyle + '">{{ ns.batt.get(dt, \'—\') }}</td>';
            if (mpSoc) tpl += '<td style="' + _tdStyle + '">{{ ns.soc.get(dt, \'—\') }}%</td>';
            if (emHasNet) tpl += "<td style=\"" + _tdStyle + "\">{{ '%+0.4f' | format(_nc) }}</td>";
            tpl += '</tr>\n';

            tpl += "{%- else %}\n";
            // Current/future row — colored
            tpl += "<tr{{ ' style=font-weight:bold;' if _isNow else '' }}>";
            tpl += '<td style="' + _tdStyle + '">{{ \'▶ \' + t if _isNow else t }}</td>';
            if (bpEnt) tpl += '<td style="' + _tdStyle + '"><span style="color:{{ _buy_color }};">{{ _buy_val }}</span></td>';
            if (spEnt) tpl += '<td style="' + _tdStyle + '"><span style="color:{{ _sell_color }};">{{ _sell_val }}</span></td>';
            if (mpPv) tpl += "<td style=\"" + _tdStyle + "\">{%- set _pv = ns.pv.get(dt) %}{{ '<span style=color:#e8a835;>' ~ _pv ~ '</span>' if _pv and _pv != 0 else '0' }}</td>";
            if (mpLoad) tpl += '<td style="' + _tdStyle + '">{{ ns.load.get(dt, \'—\') }}</td>';
            if (mpGrid) tpl += '<td style="' + _tdStyle + '"><span style="color:{{ _g_color }};">{{ _g if _g is not none else \'—\' }}</span></td>';
            if (mpBatt) tpl += "<td style=\"" + _tdStyle + "\">{%- set _b = ns.batt.get(dt) %}<span style=\"color:{{ 'green' if (_b|float(0)) > 0 else 'orange' if (_b|float(0)) < 0 else 'grey' }};\">{{ _b if _b is not none else '—' }}</span></td>";
            if (mpSoc) tpl += '<td style="' + _tdStyle + '"><span style="color:{{ _soc_color }};">{{ ns.soc.get(dt, \'—\') }}%</span></td>';
            if (emHasNet) tpl += "<td style=\"" + _tdStyle + "\"><span style=\"color:{{ _nc_color }};\">{{ '%+0.4f' | format(_nc) }}</span></td>";
            tpl += '</tr>\n';
            tpl += "{%- endif %}\n";

            tpl += "{%- endif %}\n"; // end if _day == today
            tpl += "{%- endfor %}\n";
            tpl += '</tbody>\n';

            // UPCOMING DAYS — summary rows only
            tpl += '<tbody>\n';
            tpl += '<tr><td colspan="' + emCols + '" style="padding:8px 6px 4px 6px; text-align:left; font-size:11px; color:var(--secondary-text-color); letter-spacing:0.05em; border-top:3px solid var(--divider-color);">UPCOMING DAYS</td></tr>\n';
            tpl += "{%- set _seenDays = namespace(days=[]) %}\n";
            tpl += "{%- for row in _iter %}\n";
            tpl += "{%- set dt = row.date %}\n";
            tpl += "{%- set ts = dt | as_datetime | as_local | as_timestamp %}\n";
            tpl += "{%- set _day = ts | timestamp_custom('%Y-%m-%d') %}\n";
            tpl += "{%- if _day != today and _day not in _seenDays.days %}\n";
            tpl += "{%- set _seenDays.days = _seenDays.days + [_day] %}\n";
            if (emHasNet) {
              tpl += "{%- set _day_total = ns2.daily.get(_day, 0) | float(0) %}\n";
              tpl += "{%- set _day_color = '#00cc00' if _day_total < 0 else '#ff4444' %}\n";
              tpl += "{%- set _day_label = 'Daily Total: -" + currency + "' + '%0.2f' | format(_day_total | abs) if _day_total < 0 else 'Daily Total: +" + currency + "' + '%0.2f' | format(_day_total | abs) %}\n";
            }
            tpl += "{%- set _month = months[(ts | timestamp_custom('%m') | int) - 1] %}\n";
            tpl += "{%- set _day_name = '📅 ' + ts | timestamp_custom('%A %d ') + _month %}\n";
            tpl += '<tr><td colspan="' + emLeftCols + '" style="' + _dayStyle + ' text-align:center;"><span>{{ _day_name }}</span></td>';
            if (emHasNet) {
              tpl += '<td colspan="' + emRightCols + '" style="' + _dayStyle + ' text-align:right;"><span style="color:{{ _day_color }};">{{ _day_label }}</span></td>';
            } else {
              tpl += '<td colspan="' + emRightCols + '" style="' + _dayStyle + ' text-align:right;">&nbsp;</td>';
            }
            tpl += '</tr>\n';
            tpl += "{%- endif %}\n";
            tpl += "{%- endfor %}\n";
            tpl += '</tbody>\n';

            tpl += '</table></div>\n';

            forecastTableCard = {
              type: 'custom:html-template-card',
              ignore_line_breaks: true,
              content: tpl,
              card_mod: { style: 'ha-card { background: ' + _ftBg + ' !important; border: 1px solid ' + _ftBorder + ' !important; border-radius: 12px !important; }' }
            };
          }
        }
        // Build toggle + conditional cards if we have a forecast table
        if (forecastTableCard) {
          ftToggleCard = {
            type: 'custom:mushroom-template-card',
            primary: emsP === 'haeo' ? '📊 HAEO Forecasts' : '📊 EMHASS Forecasts',
            secondary: "{{ 'Tap to collapse' if is_state('input_boolean.genergy_forecast_table', 'on') else 'Tap to expand' }}",
            icon: 'mdi:table-clock',
            icon_color: "{{ 'teal' if is_state('input_boolean.genergy_forecast_table', 'on') else 'grey' }}",
            tap_action: { action: 'call-service', service: 'input_boolean.toggle', service_data: {}, target: { entity_id: 'input_boolean.genergy_forecast_table' } },
            card_mod: { style: 'ha-card { cursor: pointer; background: ' + _ftBg + ' !important; border: 1px solid ' + _ftBorder + ' !important; border-radius: 12px 12px ' + "{{ '0 0' if is_state('input_boolean.genergy_forecast_table', 'on') else '12px 12px' }}" + ' !important; margin-bottom: 0 !important; padding-bottom: 0 !important; }' }
          };
          forecastTableCard.card_mod.style = forecastTableCard.card_mod.style.replace('border-radius: 12px', 'border-radius: 0 0 12px 12px; border-top: none');
          ftConditionalCard = {
            type: 'conditional',
            conditions: [{ entity: 'input_boolean.genergy_forecast_table', state: 'on' }],
            card: forecastTableCard
          };
        }
      }
      if (ftToggleCard) houseStack.push(ftToggleCard);
      if (ftConditionalCard) houseStack.push(ftConditionalCard);

      if (solcastCard) houseStack.push(solcastCard);
      newCards.push({ type: 'vertical-stack', cards: houseStack });

      // Card 1: Sankey (rebuild from store entities)
      // Date navigation — HA's built-in energy-date-selection card for historical date picking
      const sankeyDateNav = {
        type: 'energy-date-selection',
        card_mod: { style: 'ha-card { --ha-card-background: transparent !important; --card-background-color: transparent !important; border: none !important; margin-top: 0 !important; margin-bottom: -8px !important; }' }
      };
      // Date picker right-aligned (no title — date nav IS the header per Sigenergy app)
      const sankeyHeader = {
        type: 'custom:layout-card',
        layout_type: 'custom:grid-layout',
        layout: { 'grid-template-columns': '1fr auto', 'grid-gap': '0' },
        cards: [sankeyDateNav]
      };
      const _vsCards = mainLayout.cards[1]?.cards || [];
      const sankeyOld = _vsCards.find(c => c.type === 'custom:sankey-chart') || {};
      // Resolve EV/HP entity IDs — use utility meter if cumulative, otherwise direct entity
      const evSankeyEntity = (f.ev_energy_is_cumulative && e.ev_energy_daily_meter) ? e.ev_energy_daily_meter : e.ev_energy_today;
      const hpSankeyEntity = (f.hp_energy_is_cumulative && e.hp_energy_daily_meter) ? e.hp_energy_daily_meter : e.heat_pump_energy_today;

      // Build Sankey destinations list (Load is always present, EV/HP are optional)
      // IMPORTANT: EV/HP go AFTER Battery and Grid Export so that if ha-sankey-chart
      // hides them (below min_state), the click target mismatch doesn't affect
      // the main destination items (Home, Battery, Grid).
      const sankeyDest = [];
      if (e.load_energy_today) sankeyDest.push({ entity_id: e.load_energy_today, name: 'Home', color: '#9B7AB8' });
      if (e.battery_charge_today) sankeyDest.push({ entity_id: e.battery_charge_today, name: 'Battery', color: '#4ECDC4' });

      // Grid export destination — prefer the non-tariff total entity for accurate Sankey sizing.
      // Only fall back to tariff add_entities summation when grid_export_today is missing.
      let _gridExportId, _gridExportAdd;
      if (e.grid_export_today) {
        _gridExportId = e.grid_export_today;
        _gridExportAdd = undefined;
      } else if (f.dual_tariff && (e.grid_export_high_tariff || e.grid_export_low_tariff)) {
        _gridExportId = e.grid_export_high_tariff || e.grid_export_low_tariff;
        _gridExportAdd = (e.grid_export_high_tariff && e.grid_export_low_tariff)
          ? [e.grid_export_high_tariff === _gridExportId ? e.grid_export_low_tariff : e.grid_export_high_tariff]
          : undefined;
      }
      if (_gridExportId) {
        const exportNode = { entity_id: _gridExportId, name: 'Grid', color: '#7B8FD4' };
        if (_gridExportAdd) exportNode.add_entities = _gridExportAdd;
        sankeyDest.push(exportNode);
      }

      // EV/HP added last — if ha-sankey-chart hides them (below min_state),
      // the click target mismatch only affects the bottom items, not main destinations.
      if (f.show_ev_in_sankey && evSankeyEntity) sankeyDest.push({ entity_id: evSankeyEntity, name: 'EV', color: '#E8705A' });
      if (f.show_hp_in_sankey && hpSankeyEntity) sankeyDest.push({ entity_id: hpSankeyEntity, name: 'HP', color: '#E8A799' });

      // Build source children arrays — sources can flow to all destinations
      // ha-sankey-chart uses greedy allocation: first child claims energy first.
      // For small consumers (HP/EV), use connection_entity_id to force proportional
      // multi-source flows (like the Sigenergy app shows). Each source→HP/EV connection
      // gets a fake entity whose state is calculated proportionally by the runtime IIFE.
      const _gridExportChild = _gridExportId || e.grid_export_today;
      // Small consumers as simple entity_ids (for destination section)
      const _smallConsumerIds = [];
      if (f.show_ev_in_sankey && evSankeyEntity) _smallConsumerIds.push(evSankeyEntity);
      if (f.show_hp_in_sankey && hpSankeyEntity) _smallConsumerIds.push(hpSankeyEntity);

      // Small consumers with connection_entity_id for proportional source allocation
      // _conn_<src>_<dest> entities are injected by the runtime IIFE at render time
      const _smallConsForSolar = [];
      const _smallConsForBat = [];
      const _smallConsForGrid = [];
      if (f.show_hp_in_sankey && hpSankeyEntity) {
        _smallConsForSolar.push({ entity_id: hpSankeyEntity, connection_entity_id: '_conn_solar_to_hp' });
        _smallConsForBat.push({ entity_id: hpSankeyEntity, connection_entity_id: '_conn_bat_to_hp' });
        _smallConsForGrid.push({ entity_id: hpSankeyEntity, connection_entity_id: '_conn_grid_to_hp' });
      }
      if (f.show_ev_in_sankey && evSankeyEntity) {
        _smallConsForSolar.push({ entity_id: evSankeyEntity, connection_entity_id: '_conn_solar_to_ev' });
        _smallConsForBat.push({ entity_id: evSankeyEntity, connection_entity_id: '_conn_bat_to_ev' });
        _smallConsForGrid.push({ entity_id: evSankeyEntity, connection_entity_id: '_conn_grid_to_ev' });
      }

      // remaining_parent_state virtual child — only used when losses toggle is ON.
      // When ON, absorbs unaccounted state so flow paths fill the entire source box.
      // When OFF, completely omitted — no losses entity, no flow, no solid bar inflating.
      const _remLosses = f.show_losses_in_sankey ? '_sankey_losses' : null;

      // Children order matters: ha-sankey-chart uses greedy sequential allocation
      // (first child claims energy first). Order by descending energy share from each
      // source so the visual flows better approximate proportional allocation.
      // Small consumers use connection_entity_id for accurate multi-source distribution.
      // _remLosses (when present) always last — absorbs whatever is left over.
      const battDischargeChildren = [e.load_energy_today, _gridExportChild, ..._smallConsForBat, _remLosses].filter(Boolean);
      const solarChildren = [e.battery_charge_today, e.load_energy_today, _gridExportChild, ..._smallConsForSolar, _remLosses].filter(Boolean);
      const gridImportChildren = [e.load_energy_today, e.battery_charge_today, ..._smallConsForGrid, _remLosses].filter(Boolean);

      // Grid import source — prefer the non-tariff total entity for accurate Sankey sizing.
      // Only fall back to tariff add_entities summation when grid_import_today is missing.
      let _gridImportId, _gridImportAdd;
      if (e.grid_import_today) {
        _gridImportId = e.grid_import_today;
        _gridImportAdd = undefined;
      } else if (f.dual_tariff && (e.grid_import_high_tariff || e.grid_import_low_tariff)) {
        _gridImportId = e.grid_import_high_tariff || e.grid_import_low_tariff;
        _gridImportAdd = (e.grid_import_high_tariff && e.grid_import_low_tariff)
          ? [e.grid_import_high_tariff === _gridImportId ? e.grid_import_low_tariff : e.grid_import_high_tariff]
          : undefined;
      }
      const gridImportNode = { entity_id: _gridImportId, name: 'Grid', color: '#6B8FD4', children: gridImportChildren };
      if (_gridImportAdd) gridImportNode.add_entities = _gridImportAdd;

      // Build node metadata for the custom energy flow card AND the interactive info panel
      const _sankeyNodes = [];
      // Source nodes
      if (e.solar_energy_today) _sankeyNodes.push({
        id: 'solar', name: 'Solar', color: '#D4C850', entity_id: e.solar_energy_today, type: 'source',
        children: solarChildren.map(x => typeof x === 'string' ? x : x?.entity_id).filter(Boolean), parents: []
      });
      if (e.battery_discharge_today) _sankeyNodes.push({
        id: 'bat_d', name: 'Battery', color: '#4ECDC4', entity_id: e.battery_discharge_today, type: 'source',
        children: battDischargeChildren.map(x => typeof x === 'string' ? x : x?.entity_id).filter(Boolean), parents: []
      });
      if (_gridImportId) _sankeyNodes.push({
        id: 'grid_i', name: 'Grid', color: '#6B8FD4', entity_id: _gridImportId, type: 'source',
        children: gridImportChildren.map(x => typeof x === 'string' ? x : x?.entity_id).filter(Boolean), parents: []
      });
      // Destination nodes
      if (e.load_energy_today) _sankeyNodes.push({
        id: 'load', name: 'Home', color: '#9B7AB8', entity_id: e.load_energy_today, type: 'dest',
        children: [], parents: [e.solar_energy_today, e.battery_discharge_today, _gridImportId].filter(Boolean)
      });
      if (e.battery_charge_today) _sankeyNodes.push({
        id: 'bat_c', name: 'Battery', color: '#4ECDC4', entity_id: e.battery_charge_today, type: 'dest',
        children: [], parents: [e.solar_energy_today, _gridImportId].filter(Boolean)
      });
      if (_gridExportId) _sankeyNodes.push({
        id: 'grid_e', name: 'Grid', color: '#7B8FD4', entity_id: _gridExportId, type: 'dest',
        children: [], parents: [e.solar_energy_today, e.battery_discharge_today].filter(Boolean)
      });
      if (f.show_ev_in_sankey && evSankeyEntity) _sankeyNodes.push({
        id: 'ev', name: 'EV', color: '#E8705A', entity_id: evSankeyEntity, type: 'dest',
        children: [], parents: [e.solar_energy_today, e.battery_discharge_today, _gridImportId].filter(Boolean)
      });
      if (f.show_hp_in_sankey && hpSankeyEntity) _sankeyNodes.push({
        id: 'hp', name: 'HP', color: '#E8A799', entity_id: hpSankeyEntity, type: 'dest',
        children: [], parents: [e.solar_energy_today, e.battery_discharge_today, _gridImportId].filter(Boolean)
      });
      if (f.show_losses_in_sankey) _sankeyNodes.push({
        id: 'losses', name: 'Losses', color: '#444444', entity_id: '_sankey_losses', type: 'dest',
        children: [], parents: []
      });

      // Custom energy flow card — replaces ha-sankey-chart
      const sankeyChart = {
        type: 'custom:sigenergy-energy-flow-card',
        nodes: _sankeyNodes,
        height: 520,
        show_losses: f.show_losses_in_sankey || false,
        min_flow: 0.1
      };

      // Build node metadata for the interactive info panel
      const _panelNodes = [];
      // Source nodes
      if (e.solar_energy_today) _panelNodes.push({
        id: 'solar', name: 'Solar', color: '#D4C850', entity_id: e.solar_energy_today, type: 'source',
        children: solarChildren.map(eid => eid), parents: []
      });
      if (e.battery_discharge_today) _panelNodes.push({
        id: 'bat_d', name: 'Battery Discharged', color: '#4ECDC4', entity_id: e.battery_discharge_today, type: 'source',
        children: battDischargeChildren.map(eid => eid), parents: []
      });
      if (_gridImportId) _panelNodes.push({
        id: 'grid_i', name: 'Grid Imported', color: '#6B8FD4', entity_id: _gridImportId, type: 'source',
        children: gridImportChildren.map(eid => eid), parents: []
      });
      // Destination nodes
      if (e.load_energy_today) _panelNodes.push({
        id: 'load', name: 'Home Consumed', color: '#9B7AB8', entity_id: e.load_energy_today, type: 'dest',
        children: [], parents: [e.solar_energy_today, e.battery_discharge_today, _gridImportId].filter(Boolean)
      });
      if (e.battery_charge_today) _panelNodes.push({
        id: 'bat_c', name: 'Battery Charged', color: '#4ECDC4', entity_id: e.battery_charge_today, type: 'dest',
        children: [], parents: [e.solar_energy_today, _gridImportId].filter(Boolean)
      });
      if (_gridExportId) _panelNodes.push({
        id: 'grid_e', name: 'Grid Exported', color: '#7B8FD4', entity_id: _gridExportId, type: 'dest',
        children: [], parents: [e.solar_energy_today, e.battery_discharge_today].filter(Boolean)
      });
      if (f.show_ev_in_sankey && evSankeyEntity) _panelNodes.push({
        id: 'ev', name: 'EV Charger', color: '#E8705A', entity_id: evSankeyEntity, type: 'dest',
        children: [], parents: [e.solar_energy_today, e.battery_discharge_today, _gridImportId].filter(Boolean)
      });
      if (f.show_hp_in_sankey && hpSankeyEntity) _panelNodes.push({
        id: 'hp', name: 'Heat Pump', color: '#E8A799', entity_id: hpSankeyEntity, type: 'dest',
        children: [], parents: [e.solar_energy_today, e.battery_discharge_today, _gridImportId].filter(Boolean)
      });

      // Sankey info panel card
      const sankeyInfoPanel = {
        type: 'custom:sigenergy-sankey-panel',
        nodes: _panelNodes
      };

      newCards.push({ type: 'vertical-stack', cards: [sankeyHeader, sankeyChart, sankeyInfoPanel] });

      // Section divider helper — creates a styled label between major card groups
      const _sectionDivider = (label, icon) => ({
        type: 'markdown',
        content: `${icon || ''} ${label}`,
        card_mod: { style: _resolvedTheme === 'light'
          ? 'ha-card { background: transparent !important; border: none !important; box-shadow: none !important; padding: 6px 4px 4px 4px !important; margin-top: 0px !important; font-size: 11px !important; font-weight: 700 !important; letter-spacing: 2.5px !important; text-transform: uppercase !important; color: rgba(0,130,115,0.6) !important; border-bottom: 2px solid rgba(0,180,155,0.25) !important; } ha-markdown { padding: 0 !important; }'
          : 'ha-card { background: transparent !important; border: none !important; box-shadow: none !important; padding: 6px 4px 4px 4px !important; margin-top: 0px !important; font-size: 11px !important; font-weight: 700 !important; letter-spacing: 2.5px !important; text-transform: uppercase !important; color: rgba(0,212,184,0.7) !important; border-bottom: 2px solid rgba(0,212,184,0.3) !important; } ha-markdown { padding: 0 !important; }' }
      });

      // Card 2: Battery device card — separate column in the 3-col grid
      // Find battery device card from existing layout — search all cards at any level for sigenergy-device-card
      const _findBatteryCard = (cards) => {
        if (!cards) return null;
        for (const c of cards) {
          if (c.type === 'custom:layout-card' && c.cards?.[1]?.type === 'vertical-stack') {
            const inner = c.cards[1];
            if (inner?.cards?.some(ic => ic.type === 'custom:sigenergy-device-card')) return inner;
            if (inner?.type === 'vertical-stack' && !inner?.cards) return null;
          }
          if (c.type === 'vertical-stack' && c.cards?.some(ic => ic.type === 'custom:sigenergy-device-card')) return c;
          if (c.type === 'custom:sigenergy-device-card') return c;
        }
        for (const c of cards) {
          if (c.cards) {
            const found = _findBatteryCard(c.cards);
            if (found) return found;
          }
        }
        return null;
      };

      const _defaultBatteryCard = { type: 'vertical-stack', cards: [{ type: 'custom:sigenergy-device-card', battery_packs: f.battery_packs || 2 }] };
      const batteryCard = _findBatteryCard(mainLayout.cards) || _defaultBatteryCard;
      // Push battery card as a separate item — grid handles 3-col layout
      newCards.push(batteryCard);

      // Card 3: Apex chart + self-sufficiency (full width)
      newCards.push({ ..._sectionDivider('FORECAST', '📈'), view_layout: { 'grid-column': '1 / -1' } });
      const chartStack = [apexChart];
      if (selfSuffCard) chartStack.push(selfSuffCard);
      newCards.push({ type: 'vertical-stack', cards: chartStack, view_layout: { 'grid-column': '1 / -1' } });

      // Card 6+7: Smart Loads + System Insights side by side in a full-width container
      // Both get full row (1 / -1) so they sit in a proper horizontal layout
      const insightsCard = { type: 'custom:sigenergy-insights-card' };
      if (f.smart_loads && cfg.smart_loads?.length > 0) {
        // Wrap smart loads + insights in a 2-column horizontal layout spanning full width
        const smartLoadsCard = { type: 'custom:sigenergy-smart-load-card' };
        newCards.push({
          type: 'custom:layout-card',
          layout_type: 'custom:grid-layout',
          layout: {
            'grid-template-columns': '1fr 1fr',
            'grid-gap': '8px',
            'padding': '0',
            mediaquery: {
              '(max-width: 600px)': { 'grid-template-columns': '1fr' }
            }
          },
          cards: [smartLoadsCard, insightsCard],
          view_layout: { 'grid-column': '1 / -1' }
        });
      } else {
        // Only insights — span 2 of the 3 columns so it gets proper width
        newCards.push({ ...insightsCard, view_layout: { 'grid-column': '1 / 3' } });
      }

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

  // Detect HA's current theme preference (dark or light)
  _detectHaTheme() {
    // Method 1: Check HA's selected_theme from hass object
    if (this._hass?.themes?.darkMode !== undefined) {
      return this._hass.themes.darkMode ? 'dark' : 'light';
    }
    // Method 2: Check if prefers-color-scheme media query matches dark
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // Method 3: Check computed CSS variable on document
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--primary-background-color').trim();
    if (bg) {
      // Parse RGB — dark backgrounds have low luminance
      const m = bg.match(/(\d+)/g);
      if (m && m.length >= 3) {
        const lum = (0.299 * parseInt(m[0]) + 0.587 * parseInt(m[1]) + 0.114 * parseInt(m[2]));
        return lum < 128 ? 'dark' : 'light';
      }
    }
    return 'dark'; // default fallback
  }

  // Resolve the effective theme — delegates to shared global resolver
  _resolveTheme() {
    return window._sigenergyResolveTheme ? window._sigenergyResolveTheme(this._hass) : 'dark';
  }

  _renderDisplay(el, cfg) {
    const d = cfg.display || {};
    el.innerHTML = `
      <div class="section">
        <div class="section-title">Theme</div>
        <div class="price-grid" style="grid-template-columns:1fr 1fr 1fr;">
          <div class="price-btn ${d.theme==='dark'?'active':''}" data-theme="dark">🌙 Dark</div>
          <div class="price-btn ${d.theme==='light'?'active':''}" data-theme="light">☀️ Light</div>
          <div class="price-btn ${d.theme==='auto'?'active':''}" data-theme="auto">🔄 Auto</div>
        </div>
        <div style="font-size:10px;color:#666;margin-top:4px;">Auto: follows your HA theme (${this._detectHaTheme() === 'dark' ? 'currently dark' : 'currently light'})</div>
      </div>
      <div class="section" style="border:1px solid ${d.kiosk_mode ? '#00d4b8' : '#2d3451'};border-radius:12px;padding:12px;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:12px;font-weight:600;color:${d.kiosk_mode ? '#00d4b8' : '#8892a4'};">🖥️ Kiosk Mode</div>
            <div style="font-size:10px;color:#666;margin-top:2px;">Hides sidebar & header for wall-mounted displays</div>
          </div>
          <div class="switch ${d.kiosk_mode ? 'on' : 'off'}" data-key="kiosk_mode_toggle" style="flex-shrink:0;margin-left:12px;"></div>
        </div>
        <div style="margin-top:8px;padding:8px 10px;background:rgba(255,165,0,0.1);border:1px solid rgba(255,165,0,0.25);border-radius:6px;font-size:10px;color:#ffa726;line-height:1.5;">⚠️ Enabling kiosk mode will redirect you to the overview (main) dashboard page. To exit kiosk mode, click the <b>✕</b> button in the top-right corner.</div>
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
        <div class="row">
          <span class="row-label">SoC Ring Low</span>
          <input class="row-input" type="number" min="0" max="100" value="${d.soc_ring_low!==undefined?d.soc_ring_low:40}" data-key="soc_ring_low" />
          <span class="row-state">Below: red pulse</span>
        </div>
        <div class="row">
          <span class="row-label">SoC Ring High</span>
          <input class="row-input" type="number" min="0" max="100" value="${d.soc_ring_high!==undefined?d.soc_ring_high:60}" data-key="soc_ring_high" />
          <span class="row-state">Above: green · Between: orange</span>
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

    // Kiosk mode toggle
    const kioskToggle = el.querySelector('[data-key="kiosk_mode_toggle"]');
    if (kioskToggle) {
      kioskToggle.addEventListener('click', () => {
        const cfg2 = this._storeGet();
        cfg2.display.kiosk_mode = !cfg2.display.kiosk_mode;
        this._storeSave(cfg2);
        if (window._sigenergyApplyKiosk) {
          window._sigenergyApplyKiosk(cfg2.display.kiosk_mode);
        }
        if (cfg2.display.kiosk_mode) {
          // Redirect to main overview dashboard
          window.location.href = '/dashboard-sigenergy/0';
          return;
        }
        this._render();
      });
    }

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
// Custom Energy Flow Card — SVG-based Sankey with thick ribbons
// Replaces ha-sankey-chart HACS integration
// ═══════════════════════════════════════════════════════════

class SigenergyEnergyFlowCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // Immediate host styling so border-radius applies before first render
    const initStyle = document.createElement('style');
    initStyle.textContent = ':host { display: block; border-radius: 16px; overflow: hidden; }';
    this.shadowRoot.appendChild(initStyle);
    this._config = {};
    this._hass = null;
    this._overriddenStates = null;
    this._lastRenderKey = '';
    this._renderRAF = null;
  }

  setConfig(config) {
    this._config = config || {};
  }

  static getConfigElement() { return document.createElement('div'); }
  static getStubConfig() { return { nodes: [], height: 520 }; }
  getCardSize() { return 6; }

  set hass(hass) {
    this._hass = hass;
    if (this._shouldRerender()) this._scheduleRender();
  }

  set states(states) {
    this._overriddenStates = (states && Object.keys(states).length) ? states : null;
    this._lastRenderKey = '';
    this._scheduleRender();
  }

  get __sections() {
    const nodes = this._config.nodes || [];
    return [
      { boxes: nodes.filter(n => n.type === 'source').map(n => ({ entity_id: n.entity_id })) },
      { boxes: nodes.filter(n => n.type === 'dest').map(n => ({ entity_id: n.entity_id })) }
    ];
  }

  _handleMouseEnter(box) {
    if (!this.shadowRoot) return;
    const eid = box?.entity_id;
    if (!eid) return;
    this.shadowRoot.querySelectorAll('.flow-path').forEach(p => {
      const src = p.dataset.src, dst = p.dataset.dst;
      p.style.fillOpacity = (src === eid || dst === eid) ? '0.8' : '0.12';
    });
    this.shadowRoot.querySelectorAll('.node-bar').forEach(b => {
      b.style.filter = b.dataset.entityId === eid ? 'brightness(1.15)' : 'brightness(0.7)';
    });
  }

  _handleMouseLeave() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.flow-path').forEach(p => { p.style.fillOpacity = ''; });
    this.shadowRoot.querySelectorAll('.node-bar').forEach(b => { b.style.filter = ''; });
  }

  _shouldRerender() {
    const nodes = this._config.nodes || [];
    const states = this._overriddenStates || (this._hass && this._hass.states) || {};
    const key = nodes.map(n => {
      const s = states[n.entity_id];
      const raw = s ? parseFloat(s.state) || 0 : 0;
      return Math.round(raw * 10);
    }).join(',');
    if (key === this._lastRenderKey) return false;
    this._lastRenderKey = key;
    return true;
  }

  _scheduleRender() {
    if (this._renderRAF) return;
    this._renderRAF = requestAnimationFrame(() => {
      this._renderRAF = null;
      this._render();
    });
  }

  connectedCallback() { this._scheduleRender(); }
  disconnectedCallback() { if (this._renderRAF) { cancelAnimationFrame(this._renderRAF); this._renderRAF = null; } }

  _getKwh(entityId) {
    if (!entityId) return 0;
    const states = this._overriddenStates || (this._hass && this._hass.states) || {};
    const s = states[entityId];
    if (!s) return 0;
    const raw = parseFloat(s.state) || 0;
    const unit = (s.attributes && s.attributes.unit_of_measurement) || 'kWh';
    if (unit === 'MWh') return raw * 1000;
    if (unit === 'Wh') return raw / 1000;
    return raw;
  }

  _formatValue(kwh) {
    if (kwh >= 1000) return { v: (kwh / 1000).toFixed(2), u: 'MWh' };
    if (kwh >= 100) return { v: kwh.toFixed(0), u: 'kWh' };
    if (kwh >= 10) return { v: kwh.toFixed(1), u: 'kWh' };
    return { v: kwh.toFixed(2), u: 'kWh' };
  }

  _render() {
    if (!this.shadowRoot || !this._config.nodes) return;
    const nodes = this._config.nodes || [];
    const minKwh = this._config.min_flow || 0.1;
    const sources = nodes.filter(n => n.type === 'source' && this._getKwh(n.entity_id) >= minKwh);
    const dests = nodes.filter(n => n.type === 'dest' && this._getKwh(n.entity_id) >= minKwh);
    if (sources.length === 0 && dests.length === 0) {
      this.shadowRoot.innerHTML = '<div style="padding:24px;text-align:center;color:#aaa;font-size:13px;">No energy data available</div>';
      return;
    }

    const isDark = (window._sigenergyResolveTheme ? window._sigenergyResolveTheme(this._hass) : 'dark') === 'dark';
    const height = this._config.height || 520;
    const gap = 8;

    // Compute totals
    const totalSrc = sources.reduce((s, n) => s + this._getKwh(n.entity_id), 0);
    const totalDst = dests.reduce((s, n) => s + this._getKwh(n.entity_id), 0);

    // Proportional box height allocation — bars scale with energy values
    const minBarH = 20;
    const srcAvail = height - (sources.length - 1) * gap;
    const dstAvail = height - (dests.length - 1) * gap;
    const _allocateBoxes = (nodeList, totalKwh, avail) => {
      if (nodeList.length === 0) return [];
      const boxes = nodeList.map(n => {
        const kwh = this._getKwh(n.entity_id);
        return { ...n, kwh, h: totalKwh > 0 ? (kwh / totalKwh) * avail : avail / nodeList.length, cursor: 0 };
      });
      // Enforce minimum heights: bump small bars, shrink large bars proportionally
      let deficit = 0, flexTotal = 0;
      boxes.forEach(b => {
        if (b.h < minBarH) { deficit += minBarH - b.h; b.h = minBarH; }
        else { flexTotal += b.h; }
      });
      if (deficit > 0 && flexTotal > deficit) {
        const shrink = (flexTotal - deficit) / flexTotal;
        boxes.forEach(b => { if (b.h > minBarH) b.h *= shrink; });
      }
      let y = 0;
      boxes.forEach(b => { b.y = y; y += b.h + gap; });
      return boxes;
    };
    const srcBoxes = _allocateBoxes(sources, totalSrc, srcAvail);
    const dstBoxes = _allocateBoxes(dests, totalDst, dstAvail);

    // Greedy flow allocation
    const remaining = {};
    dstBoxes.forEach(d => { remaining[d.entity_id] = d.kwh; });
    const flows = [];
    srcBoxes.forEach(src => {
      let srcRem = src.kwh;
      const childSet = new Set(src.children || []);
      dstBoxes.forEach(d => { if ((d.parents || []).includes(src.entity_id)) childSet.add(d.entity_id); });
      const children = [...childSet]
        .map(eid => dstBoxes.find(d => d.entity_id === eid))
        .filter(Boolean);
      const totalDstRem = children.reduce((s, d) => s + (remaining[d.entity_id] || 0), 0);
      children.forEach(dst => {
        if (totalDstRem > 0 && srcRem > 0) {
          const share = (remaining[dst.entity_id] || 0) / totalDstRem;
          const flow = Math.min(share * src.kwh, srcRem, remaining[dst.entity_id] || 0);
          if (flow > 0.005) {
            flows.push({ src, dst, kwh: flow });
          }
          remaining[dst.entity_id] = (remaining[dst.entity_id] || 0) - flow;
          srcRem -= flow;
        }
      });
    });

    // ── Minimize crossings: reorder destination nodes by weighted source position ──
    // Compute ideal dest position = weighted average of connected source midpoints
    const dstIdeal = {};
    dstBoxes.forEach(d => { dstIdeal[d.entity_id] = { sumKwhY: 0, sumKwh: 0 }; });
    flows.forEach(f => {
      const srcMid = f.src.y + f.src.h / 2;
      dstIdeal[f.dst.entity_id].sumKwhY += f.kwh * srcMid;
      dstIdeal[f.dst.entity_id].sumKwh += f.kwh;
    });
    dstBoxes.sort((a, b) => {
      const wa = dstIdeal[a.entity_id].sumKwh > 0 ? dstIdeal[a.entity_id].sumKwhY / dstIdeal[a.entity_id].sumKwh : a.y;
      const wb = dstIdeal[b.entity_id].sumKwh > 0 ? dstIdeal[b.entity_id].sumKwhY / dstIdeal[b.entity_id].sumKwh : b.y;
      return wa - wb;
    });
    // Recompute dest y positions after reorder
    let _dstY2 = 0;
    dstBoxes.forEach(d => { d.y = _dstY2; _dstY2 += d.h + gap; });

    // Pre-assign destination cursor positions: within each dest, flows from
    // upper sources get upper slots
    const flowsByDest = {};
    flows.forEach(f => {
      const deid = f.dst.entity_id;
      if (!flowsByDest[deid]) flowsByDest[deid] = [];
      flowsByDest[deid].push(f);
    });
    Object.values(flowsByDest).forEach(arr => arr.sort((a, b) => a.src.y - b.src.y));
    dstBoxes.forEach(d => { d.cursor = 0; });
    flows.forEach(f => { f._dstSlot = null; });
    dstBoxes.forEach(dst => {
      const dstFlows = flowsByDest[dst.entity_id] || [];
      dstFlows.forEach(f => {
        const ribbonDst = f.dst.kwh > 0 ? (f.kwh / f.dst.kwh) * f.dst.h : 0;
        f._dstSlot = { dy1: f.dst.y + f.dst.cursor, ribbonDst };
        f.dst.cursor += ribbonDst;
      });
    });
    srcBoxes.forEach(s => { s.cursor = 0; });
    // Process flows by source position for consistent source cursor tracking
    flows.sort((a, b) => {
      const srcDiff = a.src.y - b.src.y;
      if (Math.abs(srcDiff) > 0.1) return srcDiff;
      return a.dst.y - b.dst.y;
    });

    // Compute percentage for each node
    const srcPcts = {};
    srcBoxes.forEach(b => { srcPcts[b.entity_id] = totalSrc > 0 ? ((b.kwh / totalSrc) * 100).toFixed(2) : '0'; });
    const dstPcts = {};
    dstBoxes.forEach(b => { dstPcts[b.entity_id] = totalDst > 0 ? ((b.kwh / totalDst) * 100).toFixed(2) : '0'; });

    // Build SVG paths and gradients — FULL WIDTH flows (mySigen style)
    const gradients = [];
    const paths = [];
    flows.forEach((flow, idx) => {
      const gradId = `fg${idx}`;
      gradients.push({ id: gradId, c1: flow.src.color, c2: flow.dst.color });

      const ribbonSrc = flow.src.kwh > 0 ? (flow.kwh / flow.src.kwh) * flow.src.h : 0;
      const sy1 = flow.src.y + flow.src.cursor;
      const sy2 = sy1 + ribbonSrc;
      flow.src.cursor += ribbonSrc;

      // Use pre-computed destination slot (assigned by source position within each dest)
      const slot = flow._dstSlot || { dy1: flow.dst.y, ribbonDst: 0 };
      const dy1 = slot.dy1;
      const dy2 = dy1 + slot.ribbonDst;

      // Flow connects exactly at node panel edges (16% label columns)
      const x1 = 18;
      const x2 = 82;
      const cp1x = 36;
      const cp2x = 64;

      const d = `M ${x1},${sy1} C ${cp1x},${sy1} ${cp2x},${dy1} ${x2},${dy1} L ${x2},${dy2} C ${cp2x},${dy2} ${cp1x},${sy2} ${x1},${sy2} Z`;
      // Measure crossing: how far the flow goes against the natural direction
      const srcMid = (sy1 + sy2) / 2;
      const dstMid = (dy1 + dy2) / 2;
      const crossDist = Math.abs(srcMid - dstMid);
      const isCrossing = (srcMid > dstMid + 50) || (dstMid > srcMid + 200); // upward or long downward
      paths.push({ d, gradId, srcEid: flow.src.entity_id, dstEid: flow.dst.entity_id, kwh: flow.kwh, crossDist, isCrossing });
    });

    // mySigen-style colors
    const brandTeal = '#00CDB8';
    const txtPrimary = isDark ? '#fff' : '#1a1a2e';
    const txtSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)';
    const cardBg = isDark
      ? 'linear-gradient(135deg, rgba(18,24,40,0.95) 0%, rgba(26,31,46,0.98) 50%, rgba(20,28,42,0.95) 100%)'
      : '#ffffff';
    const labelBg = isDark ? 'rgba(20,26,42,0.92)' : 'rgba(255,255,255,0.95)';
    const labelBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    // Hex→rgb helper for node-tinted backgrounds
    const hexRgb = (hex) => {
      const h = hex.replace('#','');
      return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
    };

    // Build mySigen-style node panel (full-height bar covering flow edge)
    const makeLabel = (box, pct, align) => {
      const fmt = this._formatValue(box.kwh);
      const isTiny = box.h < 55;
      const isCompact = box.h < 105;
      const alignCls = align === 'left' ? 'lbl-left' : 'lbl-right';
      // Per-node color-tinted background (mySigen style)
      const [r,g,b] = hexRgb(box.color || '#4ECDC4');
      const panelBg = isDark
        ? `linear-gradient(180deg, rgba(${r},${g},${b},0.32) 0%, rgba(${r},${g},${b},0.15) 100%)`
        : `linear-gradient(180deg, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.08) 100%)`;
      if (isTiny) {
        return `<div class="node-panel ${alignCls}" style="background:${panelBg};">
          <span class="lbl-name">${this._escHtml(box.name)}</span>
          <span class="lbl-inline">${fmt.v} ${fmt.u.charAt(0) === 'M' ? 'MWh' : 'kWh'}</span>
        </div>`;
      }
      return `<div class="node-panel ${alignCls}${isCompact ? ' lbl-compact' : ''}" style="background:${panelBg};">
        <span class="lbl-name">${this._escHtml(box.name)}</span>
        <span class="lbl-val">${fmt.v}</span>
        <span class="lbl-unit">${fmt.u}</span>
        ${!isCompact ? `<span class="lbl-pct">${pct}%</span>` : ''}
      </div>`;
    };

    // Container height = configured height (bars are allocated to fit within it)
    const totalH = height;
    const vbW = 100;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; border-radius: 16px; overflow: hidden; }
        .efc-card {
          background: ${cardBg};
          border: 1px solid ${isDark ? 'rgba(0,212,184,0.12)' : 'rgba(0,0,0,0.06)'};
          border-radius: 16px;
          box-shadow: ${isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'};
          overflow: hidden;
          position: relative;
          padding: 0;
        }
        .efc-container {
          position: relative;
          width: 100%;
          height: ${totalH}px;
        }
        .efc-svg {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
        }
        .flow-path {
          transition: fill-opacity 0.3s ease;
          pointer-events: auto;
        }
        .flow-path:hover { fill-opacity: 0.85 !important; }

        /* Node bar columns — flush at chart edges */
        .label-col {
          position: absolute;
          top: 0;
          width: 18%;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }
        .label-col.left { left: 0; }
        .label-col.right { right: 0; }

        /* Individual node bar wrappers — full height of node */
        .node-bar {
          position: absolute;
          left: 0;
          right: 0;
          pointer-events: auto;
          cursor: pointer;
          overflow: hidden;
        }

        /* mySigen-style node panel (full-height bar) */
        .node-panel {
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
          height: 100%;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 6px 8px;
          gap: 0px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .node-panel > * { flex-shrink: 1; min-height: 0; }
        .lbl-left { align-items: center; text-align: center; }
        .lbl-right { align-items: center; text-align: center; }

        .lbl-name {
          display: inline-block;
          background: ${brandTeal};
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 4px;
          line-height: 1.4;
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .lbl-val {
          font-size: 22px;
          font-weight: 900;
          color: ${txtPrimary};
          line-height: 1.1;
        }
        .lbl-unit {
          font-size: 11px;
          font-weight: 600;
          color: ${txtSecondary};
          margin-top: -1px;
        }
        .lbl-pct {
          font-size: 12px;
          font-weight: 700;
          color: ${txtSecondary};
          margin-top: 2px;
        }

        /* Compact (small nodes) */
        .lbl-compact { padding: 3px 6px; }
        .lbl-compact .lbl-name { font-size: 8px; padding: 1px 5px; margin-bottom: 1px; }
        .lbl-compact .lbl-val { font-size: 16px; }
        .lbl-compact .lbl-unit { font-size: 9px; }

        /* Tiny inline label */
        .node-panel:has(.lbl-inline) {
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: 4px;
          padding: 3px 5px;
        }
        .node-panel:has(.lbl-inline) .lbl-name {
          font-size: 8px;
          padding: 1px 5px;
          flex-shrink: 0;
        }
        .lbl-right:has(.lbl-inline) {
          justify-content: flex-end;
        }
        .lbl-inline {
          font-size: 11px;
          font-weight: 700;
          color: ${txtPrimary};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }

        @media (max-width: 500px) {
          .lbl-val { font-size: 16px !important; }
          .lbl-name { font-size: 7px !important; padding: 1px 4px !important; }
          .lbl-unit { font-size: 9px !important; }
          .lbl-pct { font-size: 10px !important; }
          .node-panel { padding: 3px 5px; }
        }
        @media (min-width: 769px) {
          .lbl-val { font-size: 26px !important; }
          .lbl-name { font-size: 10px !important; }
          .lbl-unit { font-size: 12px !important; }
          .lbl-pct { font-size: 13px !important; }
        }
      </style>
      <ha-card class="efc-card">
        <div class="efc-container">
          <svg class="efc-svg" viewBox="0 0 ${vbW} ${totalH}" preserveAspectRatio="none">
            <defs>
              ${gradients.map(g => `
                <linearGradient id="${g.id}" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="${g.c1}" stop-opacity="0.75"/>
                  <stop offset="100%" stop-color="${g.c2}" stop-opacity="0.7"/>
                </linearGradient>
              `).join('')}
            </defs>
            ${[...paths].sort((a, b) => (b.isCrossing ? 1 : 0) - (a.isCrossing ? 1 : 0)).map(p => `<path class="flow-path" d="${p.d}" fill="url(#${p.gradId})" fill-opacity="${p.isCrossing ? 0.35 : 0.65}" data-src="${p.srcEid}" data-dst="${p.dstEid}"/>`).join('\n            ')}
          </svg>
          <div class="label-col left">
            ${srcBoxes.map(b => {
              return `<div class="node-bar" data-entity-id="${b.entity_id}" style="top:${b.y}px;height:${b.h}px;">${makeLabel(b, srcPcts[b.entity_id], 'left')}</div>`;
            }).join('\n            ')}
          </div>
          <div class="label-col right">
            ${dstBoxes.map(b => {
              return `<div class="node-bar" data-entity-id="${b.entity_id}" style="top:${b.y}px;height:${b.h}px;">${makeLabel(b, dstPcts[b.entity_id], 'right')}</div>`;
            }).join('\n            ')}
          </div>
        </div>
      </ha-card>
    `;

    // Attach hover/click listeners for interactive highlighting
    const allBoxes = this.shadowRoot.querySelectorAll('.node-bar');
    allBoxes.forEach(box => {
      const eid = box.dataset.entityId;
      box.addEventListener('mouseenter', () => {
        this.shadowRoot.querySelectorAll('.flow-path').forEach(p => {
          p.style.fillOpacity = (p.dataset.src === eid || p.dataset.dst === eid) ? '0.8' : '0.12';
        });
      });
      box.addEventListener('mouseleave', () => {
        this.shadowRoot.querySelectorAll('.flow-path').forEach(p => { p.style.fillOpacity = ''; });
      });
    });
  }

  _hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  _escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
}

// ═══════════════════════════════════════════════════════════
// Sankey Info Panel — Interactive detail panel for Sankey chart
// ═══════════════════════════════════════════════════════════

class SigenergySankeyPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._selectedNode = null;
    this._expanded = false;
    this._lastStatsKey = '';
  }

  set hass(hass) {
    this._hass = hass;
    this._updateStatsPanel();
    this._updatePanel();
  }

  setConfig(config) {
    this._config = config;
    // config.nodes = [{ id, name, color, entity_id, children: [entity_id], parents: [entity_id] }]
    // config.unit_norm = function(eid) expression
  }

  connectedCallback() {
    this._render();
    // Walk the DOM to find the Sankey chart's .box elements and attach click listeners directly.
    // hass-more-info events from ha-sankey-chart don't cross shadow DOM boundaries,
    // so we hook into the boxes directly.
    this._boxClickCleanup = [];
    this._attachBoxListeners();
    this._setupDateNavigation();
  }

  disconnectedCallback() {
    this._cleanupBoxListeners();
    if (this._dateNavInterval) {
      clearInterval(this._dateNavInterval);
      this._dateNavInterval = null;
    }
    if (this._dateNavActive) {
      this._dateNavActive = false;
      this._historicalStates = null;
    }
  }

  _cleanupBoxListeners() {
    if (this._boxClickCleanup) {
      this._boxClickCleanup.forEach(fn => fn());
      this._boxClickCleanup = [];
    }
    if (this._boxObserver) {
      this._boxObserver.disconnect();
      this._boxObserver = null;
    }
  }

  _attachBoxListeners() {
    // Try to find boxes immediately, retry with MutationObserver if not ready
    if (this._tryAttachBoxes()) return;
    // The Sankey chart may not be rendered yet — observe DOM for changes
    this._waitForBoxes();
  }

  _waitForBoxes() {
    let attempts = 0;
    const maxAttempts = 50; // ~5 seconds
    const interval = setInterval(() => {
      attempts++;
      if (this._tryAttachBoxes() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);
    this._boxClickCleanup.push(() => clearInterval(interval));
  }

  _tryAttachBoxes() {
    // Walk up from this element to find the vertical-stack, then find the sankey-chart
    const meta = this._config.nodes;
    if (!meta || meta.length === 0) return false;

    // Search siblings and parents for the sankey chart
    const sankeyBase = this._findSankeyBase();
    if (!sankeyBase || !sankeyBase.shadowRoot) return false;

    const boxes = sankeyBase.shadowRoot.querySelectorAll('.node-bar');
    if (boxes.length === 0) return false;

    // Match DOM boxes to config nodes by data-entity-id attribute.
    // The internal __sections may include synthetic nodes (e.g. _sankey_losses)
    // that have no DOM box, so we cannot rely on index-based matching.

    // Track these boxes so we can detect when the flow card re-renders
    this._attachedBoxes = new Set(boxes);

    let attached = 0;
    boxes.forEach((box) => {
      const entityId = box.dataset.entityId;
      if (!entityId) return;
      const node = meta.find(n => n.entity_id === entityId);
      if (!node) return;

      const handler = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        if (this._selectedNode === node.id) {
          this._selectedNode = null;
          this._expanded = false;
        } else {
          this._selectedNode = node.id;
          this._expanded = true;
        }
        this._updatePanel();
      };
      box.addEventListener('click', handler, true);
      this._boxClickCleanup.push(() => box.removeEventListener('click', handler, true));

      // Attach hover highlighting to the full .box element
      if (sankeyBase._handleMouseEnter && sankeyBase._handleMouseLeave) {
        const hoverBox = { entity_id: entityId };
        const enterHandler = () => sankeyBase._handleMouseEnter(hoverBox);
        const leaveHandler = () => sankeyBase._handleMouseLeave();
        box.addEventListener('mouseenter', enterHandler);
        box.addEventListener('mouseleave', leaveHandler);
        box.style.cursor = 'pointer';
        this._boxClickCleanup.push(() => {
          box.removeEventListener('mouseenter', enterHandler);
          box.removeEventListener('mouseleave', leaveHandler);
        });
      }

      attached++;
    });

    return attached > 0;
  }

  _stabilizeLiveValues() {
    // Prevent destination bars from jumping by quantizing entity values at the
    // SANKEY-CHART level. The chart's render inspects:
    //   Object.keys(this.states).length ? this.states : this.hass.states
    // With energy_date_selection:false, this.states is {} so it falls through to
    // hass.states (full-precision, constantly-changing values → layout jitter).
    // By setting sankeyChart.states to a quantized snapshot, we make the chart
    // use stable values. We only update when the quantized values actually change.
    const sankeyBase = this._findSankeyBase();
    if (!sankeyBase || !this._hass) return;
    // Collect entity IDs from the sankey chart's sections
    const entityIds = [];
    if (sankeyBase.__sections) {
      for (const section of sankeyBase.__sections) {
        if (section.boxes) {
          for (const box of section.boxes) {
            if (box.entity_id && !entityIds.includes(box.entity_id)) entityIds.push(box.entity_id);
          }
        }
      }
    }
    if (entityIds.length === 0) return;
    // Quantize each entity's state to display precision (0.1 kWh)
    const liveStates = this._hass.states;
    const lastQ = this._lastQuantValues || {};
    let changed = false;
    const newQ = {};
    for (const eid of entityIds) {
      const s = liveStates[eid];
      if (!s) continue;
      const raw = parseFloat(s.state);
      if (isNaN(raw)) continue;
      const unit = (s.attributes && s.attributes.unit_of_measurement) || 'kWh';
      let factor;
      if (unit === 'MWh') factor = 10000;   // 4 decimals → 0.1 kWh precision
      else if (unit === 'Wh') factor = 0.01; // nearest 100 Wh → 0.1 kWh
      else factor = 10;                       // 1 decimal kWh
      const rounded = Math.round(raw * factor) / factor;
      newQ[eid] = rounded;
      if (lastQ[eid] !== rounded) changed = true;
    }
    this._lastQuantValues = newQ;
    if (changed || !this._quantStatesCache) {
      // Build a full states object with only the sankey entities quantized
      const qs = Object.assign({}, liveStates);
      for (const eid of entityIds) {
        if (newQ[eid] !== undefined && qs[eid]) {
          qs[eid] = Object.assign({}, qs[eid], { state: String(newQ[eid]) });
        }
      }
      this._quantStatesCache = qs;
      // Set sankeyChart.states to the quantized snapshot.
      // This makes the render template use our stable values instead of hass.states.
      this._setSankeyChartStates(this._quantStatesCache);
    }
    // When unchanged, do nothing — the chart keeps using the previously set states.
  }

  _setupDateNavigation() {
    // Monitor the energy-date-selection card for date changes.
    // energy_date_selection is false (for accurate live values today).
    // When a historical date is selected, fetch HA statistics and
    // directly set the sankeyBase's hass property with overridden states.
    this._dateNavLastStr = null;
    this._dateNavActive = false;
    this._dateNavInterval = setInterval(() => {
      this._checkDateNavigation();
    }, 2000);
  }

  _getSelectedDateStr() {
    // Read the selected date from the energy-date-selection card's period selector.
    try {
      function deepFind(root, sel, depth) {
        if (depth > 15) return null;
        const el = root.querySelector(sel);
        if (el) return el;
        for (const child of root.querySelectorAll('*')) {
          if (child.shadowRoot) {
            const r = deepFind(child.shadowRoot, sel, depth + 1);
            if (r) return r;
          }
        }
        return null;
      }
      // Note: HA uses hui-energy-period-selector (not ha-energy-period-selector)
      const haMain = document.querySelector('home-assistant');
      if (!haMain || !haMain.shadowRoot) return null;
      const periodSel = deepFind(haMain.shadowRoot, 'hui-energy-period-selector', 0);
      if (!periodSel) return null;

      // Read startDate property — this is the start of the selected period in UTC.
      // Convert to local date string (YYYY-MM-DD) since HA stores UTC but the user sees local dates.
      const sd = periodSel.startDate || periodSel._startDate;
      if (sd) {
        const d = new Date(sd);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }

      // Fallback: parse the displayed date text from the shadow root
      const sr = periodSel.shadowRoot;
      if (sr) {
        const text = sr.textContent || '';
        const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
        const match = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)/);
        if (match) {
          const now = new Date();
          const d = new Date(now.getFullYear(), months[match[1]], parseInt(match[2]));
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd2 = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd2}`;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  _checkDateNavigation() {
    // Re-attach box listeners if the flow card re-rendered (DOM replaced)
    if (this._attachedBoxes) {
      const sample = this._attachedBoxes.values().next().value;
      if (sample && !sample.isConnected) {
        this._cleanupBoxListeners();
        this._boxClickCleanup = [];
        this._tryAttachBoxes();
      }
    } else if (!this._attachedBoxes) {
      this._tryAttachBoxes();
    }

    const selectedStr = this._getSelectedDateStr();
    if (!selectedStr) return;

    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
    const isToday = selectedStr === todayStr;

    if (isToday) {
      if (this._dateNavActive) {
        this._dateNavActive = false;
        this._historicalStates = null;
        this._dateNavLastStr = selectedStr;
        // Clear quantization cache so next _stabilizeLiveValues picks up fresh data
        this._quantStatesCache = null;
        this._lastQuantValues = {};
        // Refresh stats panel to show live data again
        this._updateStatsPanel();
        this._updatePanel();
      }
      if (this._dateNavLastStr !== selectedStr) this._dateNavLastStr = selectedStr;
      // Stabilize live values: quantize entity state values to 1 decimal place
      // so that sub-0.1 kWh fluctuations don't cause pixel-level layout jitter.
      this._stabilizeLiveValues();
      return;
    }

    // When historical date is active, re-apply states every tick to override HA's live updates
    if (selectedStr === this._dateNavLastStr && this._dateNavActive && this._historicalStates) {
      this._setSankeyChartStates(this._historicalStates);
      return;
    }

    this._dateNavLastStr = selectedStr;
    // Historical date selected — fetch stats and override
    this._dateNavActive = true;
    this._fetchAndApplyHistory(selectedStr);
  }

  async _fetchAndApplyHistory(dateStr) {
    if (!this._hass?.connection) return;

    const sankeyBase = this._findSankeyBase();
    if (!sankeyBase) return;

    const startDate = new Date(dateStr + 'T00:00:00');
    const endDate = new Date(startDate.getTime() + 86400000);

    // Collect entity IDs from sankey chart sections
    const entityIds = [];
    if (sankeyBase.__sections) {
      for (const section of sankeyBase.__sections) {
        if (section.boxes) {
          for (const box of section.boxes) {
            if (box.entity_id && !entityIds.includes(box.entity_id)) entityIds.push(box.entity_id);
          }
        }
      }
    }
    // Also add from our config nodes
    if (this._config?.nodes) {
      for (const node of this._config.nodes) {
        if (node.entity_id && !entityIds.includes(node.entity_id)) entityIds.push(node.entity_id);
      }
    }
    if (entityIds.length === 0) return;

    try {
      const stats = await this._hass.connection.sendMessagePromise({
        type: 'recorder/statistics_during_period',
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        statistic_ids: entityIds,
        period: 'day',
        types: ['change']
      });

      // Build overridden states
      const newStates = { ...this._hass.states };
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();
      for (const entityId of entityIds) {
        const entityStats = stats[entityId];
        let totalChange = 0;
        if (entityStats) {
          for (const period of entityStats) {
            // Only include periods whose start falls strictly within [startDate, endDate)
            // The API can return an extra boundary period at endDate — skip it
            if (period.start >= endMs) continue;
            if (period.change !== null && period.change !== undefined) {
              totalChange += period.change;
            }
          }
        }
        const currentState = this._hass.states[entityId];
        if (currentState) {
          newStates[entityId] = { ...currentState, state: String(totalChange) };
        }
      }

      // For entities with zero/no recorder data, try daily summary fallbacks.
      // Some utility meters (e.g. genergy_*_daily) may lack recorder statistics
      // while the inverter's own day counters have full history.
      const _fallbackMap = {
        'solar': 'deyeinvertermaster_summary_day_pv',
        'battery_charge': 'deyeinvertermaster_summary_day_battery_charge',
        'battery_discharge': 'deyeinvertermaster_summary_day_battery_discharge',
        'grid_import': 'deyeinvertermaster_summary_day_grid_import_buy',
        'grid_export': 'deyeinvertermaster_summary_day_grid_export_sell',
        'load': 'deyeinvertermaster_summary_day_load',
        'hp_energy': 'deyeinvertermaster_summary_day_aux_energy'
      };
      const needsFallback = entityIds.filter(eid => {
        const s = newStates[eid];
        return s && parseFloat(s.state) === 0 && !stats[eid]?.some(p => p.change);
      });
      if (needsFallback.length > 0) {
        // Build fallback entity IDs
        const fallbackIds = [];
        const fallbackMapping = {}; // fallbackEid → originalEid
        for (const eid of needsFallback) {
          for (const [keyword, fallbackSuffix] of Object.entries(_fallbackMap)) {
            if (eid.includes(keyword)) {
              const fbEid = 'sensor.' + fallbackSuffix;
              if (!entityIds.includes(fbEid) && !fallbackIds.includes(fbEid)) {
                fallbackIds.push(fbEid);
                fallbackMapping[fbEid] = eid;
              }
              break;
            }
          }
        }
        if (fallbackIds.length > 0) {
          try {
            const fbStats = await this._hass.connection.sendMessagePromise({
              type: 'recorder/statistics_during_period',
              start_time: startDate.toISOString(),
              end_time: endDate.toISOString(),
              statistic_ids: fallbackIds,
              period: 'day',
              types: ['change']
            });
            for (const fbEid of fallbackIds) {
              const fbData = fbStats[fbEid];
              if (!fbData) continue;
              let fbChange = 0;
              for (const p of fbData) {
                if (p.start >= endMs) continue;
                if (p.change !== null && p.change !== undefined) fbChange += p.change;
              }
              if (fbChange > 0) {
                const origEid = fallbackMapping[fbEid];
                const origState = newStates[origEid];
                if (origState) {
                  // Convert fallback kWh to original entity's unit if needed
                  const origUnit = origState.attributes?.unit_of_measurement || 'kWh';
                  const fbUnit = this._hass.states[fbEid]?.attributes?.unit_of_measurement || 'kWh';
                  let converted = fbChange;
                  // Normalize both to kWh then convert to orig unit
                  if (fbUnit === 'MWh') converted *= 1000;
                  else if (fbUnit === 'Wh') converted /= 1000;
                  // Now converted is in kWh, convert to orig unit
                  if (origUnit === 'MWh') converted /= 1000;
                  else if (origUnit === 'Wh') converted *= 1000;
                  newStates[origEid] = { ...origState, state: String(converted) };
                  console.log(`Genergy: Fallback ${fbEid} → ${origEid}: ${fbChange} ${fbUnit} = ${converted} ${origUnit}`);
                }
              }
            }
          } catch (fbErr) {
            console.warn('Genergy: Fallback stats fetch failed:', fbErr);
          }
        }
      }

      // Only apply if we still want historical data
      if (this._dateNavActive) {
        // Cache the historical states for re-application every tick
        this._historicalStates = newStates;

        // Apply via SANKEY-CHART.states (parent, Lit reactive) so it flows through the render template
        this._setSankeyChartStates(newStates);

        // Refresh the stats panel and detail panel with historical values
        this._updateStatsPanel();
        this._updatePanel();
      }
    } catch (err) {
      console.warn('Genergy: Failed to fetch historical statistics for Sankey:', err);
    }
  }

  _setSankeyChartStates(states) {
    // Set states on the energy flow card via its `states` setter.
    // The card re-renders with overridden values (historical or quantized).
    const sankeyBase = this._findSankeyBase();
    if (!sankeyBase) return;
    sankeyBase.states = states;
  }

  _findSankeyBase() {
    // Walk up to find the enclosing vertical-stack card, then search down for sigenergy-energy-flow-card
    function deepFind(root, sel, depth) {
      if (depth > 20) return null;
      const el = root.querySelector(sel);
      if (el) return el;
      for (const child of root.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const r = deepFind(child.shadowRoot, sel, depth + 1);
          if (r) return r;
        }
      }
      return null;
    }
    // Try from our parent chain first (most efficient)
    let el = this.parentElement || this.getRootNode()?.host;
    while (el) {
      // Search for our custom energy flow card first, fall back to old sankey-chart-base
      const base = deepFind(el, 'sigenergy-energy-flow-card', 0) || deepFind(el, 'sankey-chart-base', 0);
      if (base) return base;
      el = el.parentElement || el.getRootNode()?.host;
    }
    // Fallback: search from document
    return deepFind(document, 'sigenergy-energy-flow-card', 0) || deepFind(document, 'sankey-chart-base', 0);
  }

  _getKwh(entityId) {
    if (!entityId || !this._hass) return 0;
    // When viewing a historical date, read from the overridden states
    // so stats panel and detail panel show historical values, not live.
    const states = (this._dateNavActive && this._historicalStates) ? this._historicalStates : this._hass.states;
    const stateObj = states[entityId];
    if (!stateObj) return 0;
    const raw = parseFloat(stateObj.state) || 0;
    const unit = (stateObj.attributes?.unit_of_measurement || 'kWh').toString();
    if (unit === 'MWh') return raw * 1000;
    if (unit === 'Wh') return raw / 1000;
    return raw;
  }

  _toggleExpand() {
    if (this._expanded) {
      // First click: collapse the breakdown section
      this._expanded = false;
    } else {
      // Second click when already collapsed: deselect the node entirely
      this._selectedNode = null;
      this._expanded = false;
    }
    this._updatePanel();
  }

  _render() {
    if (!this.shadowRoot) return;
    try {
    const _dk = (window._sigenergyResolveTheme ? window._sigenergyResolveTheme(this._hass) : 'dark') === 'dark';
    const _panelBg = _dk ? 'rgba(15,20,30,0.92)' : 'rgba(255,255,255,0.95)';
    const _panelBgLight = _dk ? 'rgba(15,20,30,0.85)' : 'rgba(255,255,255,0.9)';
    const _subtleBorder = _dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
    const _hoverBg = _dk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const _featGrad = _dk
      ? 'linear-gradient(135deg, rgba(240,216,80,0.18) 0%, rgba(15,20,30,0.92) 60%)'
      : 'linear-gradient(135deg, rgba(240,216,80,0.18) 0%, rgba(255,255,255,0.95) 60%)';
    const _textPrimary = _dk ? '' : '--primary-text-color: #1a1a2e;';
    const _textSecondary = _dk ? '' : '--secondary-text-color: #555;';
    const _divider = _dk ? '' : '--divider-color: rgba(0,0,0,0.12);';
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; margin-top: -8px; ${_textPrimary} ${_textSecondary} ${_divider} }
        .sankey-info-panel {
          border-radius: 16px;
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }
        .sankey-info-panel.hidden {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
        }
        .sankey-info-panel.visible {
          max-height: 600px;
          opacity: 1;
        }
        /* ── Stats grid (3×2 mySigen-style) ── */
        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
          background: ${_panelBgLight};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--divider-color, #2d3451);
          border-radius: 16px;
          overflow: hidden;
        }
        .stat-chip {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 14px;
          transition: background 0.2s ease;
          cursor: pointer;
        }
        .stat-chip:hover {
          background: ${_hoverBg};
        }
        /* Vertical dividers between columns */
        .stat-chip:nth-child(3n+1),
        .stat-chip:nth-child(3n+2) {
          border-right: 1px solid ${_subtleBorder};
        }
        /* Horizontal divider between rows */
        .stat-chip:nth-child(n+4) {
          border-top: 1px solid ${_subtleBorder};
        }
        .stat-chip .chip-dot {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .stat-chip .chip-info { flex: 1; min-width: 0; }
        .stat-chip .chip-val {
          font-size: 20px; font-weight: 800;
          color: var(--primary-text-color, #fff);
          line-height: 1.1;
          white-space: nowrap;
        }
        .stat-chip .chip-val .chip-unit {
          font-size: 12px; font-weight: 500;
          opacity: 0.6;
          margin-left: 2px;
        }
        .stat-chip .chip-label {
          font-size: 10px; font-weight: 600;
          color: var(--secondary-text-color, #aaa);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* ── Expand detail (legacy click panel) ── */
        .info-main {
          padding: 16px 20px 8px;
          text-align: center;
          background: ${_panelBg};
          backdrop-filter: blur(12px);
          border: 1px solid var(--divider-color, #2d3451);
          border-radius: 16px 16px 0 0;
        }
        .info-main .value {
          font-size: 28px; font-weight: bold;
          color: var(--primary-text-color, #fff);
        }
        .info-main .value .unit {
          font-size: 16px; font-weight: normal; opacity: 0.7;
        }
        .info-main .label {
          font-size: 14px;
          color: var(--secondary-text-color, #aaa);
          margin-top: 2px;
        }
        .expand-btn {
          text-align: center; padding: 4px 0; cursor: pointer;
          background: ${_panelBg};
          border-left: 1px solid var(--divider-color, #2d3451);
          border-right: 1px solid var(--divider-color, #2d3451);
          color: var(--secondary-text-color, #aaa);
          user-select: none; line-height: 1;
        }
        .expand-btn svg { transition: transform 0.3s ease; }
        .expand-btn.expanded svg { transform: rotate(180deg); }
        .breakdown {
          display: flex; flex-wrap: wrap; gap: 0;
          background: ${_panelBg};
          border: 1px solid var(--divider-color, #2d3451);
          border-top: none; border-radius: 0 0 16px 16px;
          overflow: hidden; transition: max-height 0.3s ease;
        }
        .breakdown.collapsed { max-height: 0; }
        .breakdown.open { max-height: 400px; }
        .breakdown-item {
          flex: 1 1 50%; min-width: 140px;
          padding: 12px 16px; box-sizing: border-box;
          display: flex; align-items: center; gap: 12px;
          border-top: 1px solid var(--divider-color, #2d3451);
        }
        .breakdown-item .dot {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
        }
        .breakdown-item .details { flex: 1; }
        .breakdown-item .pct {
          font-size: 20px; font-weight: bold;
          color: var(--primary-text-color, #fff);
        }
        .breakdown-item .desc {
          font-size: 12px; color: var(--secondary-text-color, #aaa);
        }
        .breakdown-item .kwh {
          font-size: 12px; color: var(--secondary-text-color, #aaa);
        }
        .chevron-icon {
          width: 18px; height: 18px; fill: currentColor; vertical-align: middle;
        }
        @media (max-width: 500px) {
          .stat-grid { grid-template-columns: 1fr 1fr; }
          .stat-chip .chip-val { font-size: 16px; }
          .stat-chip .chip-label { font-size: 9px; }
          .stat-chip { padding: 10px 10px; gap: 8px; }
        }
        @media (min-width: 1600px) {
          .stat-chip { padding: 18px 20px; }
          .stat-chip .chip-val { font-size: 24px; }
          .stat-chip .chip-label { font-size: 11px; }
          .info-main .value { font-size: 32px; }
          .breakdown-item .pct { font-size: 24px; }
        }
      </style>
      <div id="statsPanel"></div>
      <div class="sankey-info-panel hidden" id="panel">
        <div class="info-main" id="infoMain"></div>
        <div class="expand-btn" id="expandBtn">
          <svg class="chevron-icon" viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/></svg>
          <svg class="chevron-icon" style="margin-left:-14px;" viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/></svg>
        </div>
        <div class="breakdown collapsed" id="breakdown"></div>
      </div>
    `;
    const btn = this.shadowRoot.getElementById('expandBtn');
    if (btn) {
      btn.addEventListener('click', () => this._toggleExpand());
    }
    this._updateStatsPanel();
    } catch (err) {
      console.error('Genergy SankeyPanel render error:', err);
      this.shadowRoot.innerHTML = `<div style="padding:24px;color:#E53935;font-size:13px;">⚠ Energy Flow panel failed to render</div>`;
    }
  }

  _updateStatsPanel() {
    if (!this.shadowRoot || !this._hass || !this._config.nodes) return;
    const statsEl = this.shadowRoot.getElementById('statsPanel');
    if (!statsEl) return;

    const meta = this._config.nodes || [];
    const solar = meta.find(n => n.id === 'solar');
    const load = meta.find(n => n.id === 'load');
    const batC = meta.find(n => n.id === 'bat_c');
    const batD = meta.find(n => n.id === 'bat_d');
    const gridI = meta.find(n => n.id === 'grid_i');
    const gridE = meta.find(n => n.id === 'grid_e');
    const ev = meta.find(n => n.id === 'ev');
    const hp = meta.find(n => n.id === 'hp');

    const solarVal = solar ? this._getKwh(solar.entity_id) : 0;
    const loadVal = load ? this._getKwh(load.entity_id) : 0;
    const batCVal = batC ? this._getKwh(batC.entity_id) : 0;
    const gridEVal = gridE ? this._getKwh(gridE.entity_id) : 0;
    const gridIVal = gridI ? this._getKwh(gridI.entity_id) : 0;
    const evVal = ev ? this._getKwh(ev.entity_id) : 0;
    const hpVal = hp ? this._getKwh(hp.entity_id) : 0;

    // Build 3×2 stat chips matching Sigenergy layout:
    // Row 1: Solar Produced, Load Consumed, Battery Discharged
    // Row 2: Battery Charged, Grid Imported, Grid Exported
    const batDVal = meta.find(n => n.id === 'bat_d') ? this._getKwh(meta.find(n => n.id === 'bat_d').entity_id) : 0;
    const chips = [];
    if (solar) chips.push({ node: solar, val: solarVal, icon: '☀️', label: 'Solar Produced' });
    if (load) chips.push({ node: load, val: loadVal, icon: '🏠', label: 'Load Consumed' });
    if (meta.find(n => n.id === 'bat_d')) chips.push({ node: meta.find(n => n.id === 'bat_d'), val: batDVal, icon: '🔋', label: 'Battery Discharged' });
    if (batC) chips.push({ node: batC, val: batCVal, icon: '🔋', label: 'Battery Charged' });
    if (gridI) chips.push({ node: gridI, val: gridIVal, icon: '🔌', label: 'Grid Imported' });
    if (gridE) chips.push({ node: gridE, val: gridEVal, icon: '⚡', label: 'Grid Exported' });
    // Add EV/HP only if they fit in a clean 3-column grid (max 6 for 3×2)
    if (chips.length < 6 && ev && evVal > 0.01) chips.push({ node: ev, val: evVal, icon: '🚗', label: 'EV Charged' });
    if (chips.length < 6 && hp && hpVal > 0.01) chips.push({ node: hp, val: hpVal, icon: '🌡️', label: 'Heat Pump' });

    const fmt = (v) => v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);

    const newStatsHtml = `
      <div class="stat-grid">
        ${chips.map(c => {
          return `
            <div class="stat-chip" data-node-id="${c.node.id}">
              <div class="chip-dot" style="background:${c.node.color}22;">
                <span>${c.icon}</span>
              </div>
              <div class="chip-info">
                <div class="chip-val">${fmt(c.val)} <span class="chip-unit">kWh</span></div>
                <div class="chip-label">${c.label}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Only update DOM if values actually changed (prevents hover flash)
    const statsKey = chips.map(c => c.node.id + ':' + Math.round(c.val * 100)).join(',');
    if (statsKey !== this._lastStatsKey) {
      this._lastStatsKey = statsKey;
      statsEl.innerHTML = newStatsHtml;

      // Attach click handlers on stat chips to select/deselect nodes
      statsEl.querySelectorAll('.stat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const nodeId = chip.dataset.nodeId;
          if (this._selectedNode === nodeId) {
            this._selectedNode = null;
            this._expanded = false;
          } else {
            this._selectedNode = nodeId;
            this._expanded = true;
          }
          this._updatePanel();
        });
      });
    }
  }

  _updatePanel() {
    if (!this.shadowRoot) return;
    const panel = this.shadowRoot.getElementById('panel');
    const infoMain = this.shadowRoot.getElementById('infoMain');
    const breakdown = this.shadowRoot.getElementById('breakdown');
    const expandBtn = this.shadowRoot.getElementById('expandBtn');
    if (!panel || !infoMain || !breakdown || !expandBtn) return;

    if (!this._selectedNode || !this._config.nodes) {
      panel.className = 'sankey-info-panel hidden';
      return;
    }

    const meta = this._config.nodes;
    const node = meta.find(n => n.id === this._selectedNode);
    if (!node) {
      panel.className = 'sankey-info-panel hidden';
      return;
    }

    panel.className = 'sankey-info-panel visible';

    // Get the value of the selected entity
    const val = this._getKwh(node.entity_id);
    infoMain.innerHTML = `
      <div class="value">${val.toFixed(2)} <span class="unit">kWh</span></div>
      <div class="label">${node.name}</div>
    `;

    // Build breakdown — show children if source, parents if destination
    const targets = node.type === 'source' ? (node.children || []) : (node.parents || []);
    const targetNodes = targets.map(eid => meta.find(n => n.entity_id === eid)).filter(Boolean);

    if (targetNodes.length === 0) {
      expandBtn.style.display = 'none';
      breakdown.innerHTML = '';
      breakdown.className = 'breakdown collapsed';
      return;
    }

    expandBtn.style.display = '';
    expandBtn.className = this._expanded ? 'expand-btn expanded' : 'expand-btn';

    // Compute accurate energy flows using greedy allocation (same as ha-sankey-chart)
    // The Sankey chart allocates flows source-by-source in order: Grid → Battery → Solar.
    // Each source distributes to its children proportionally to their remaining capacity.
    const allNodes = this._config.nodes || [];
    const allSources = allNodes.filter(n => n.type === 'source');
    const allDests = allNodes.filter(n => n.type === 'dest');
    // Build a flow matrix: flowMatrix[srcId][dstId] = kWh
    const flowMatrix = {};
    const remaining = {};
    // Initialize remaining capacity for each destination
    allDests.forEach(d => { remaining[d.entity_id] = this._getKwh(d.entity_id); });
    // Greedy allocation: sources in order (Grid first = smallest, then Battery, then Solar)
    allSources.forEach(src => {
      const srcVal = this._getKwh(src.entity_id);
      let srcRemaining = srcVal;
      flowMatrix[src.entity_id] = {};
      const childSet = new Set((src.children || []).filter(eid => remaining[eid] !== undefined));
      allDests.forEach(d => { if ((d.parents || []).includes(src.entity_id)) childSet.add(d.entity_id); });
      const children = [...childSet];
      // Proportional allocation to children based on their remaining capacity
      const totalDstRemaining = children.reduce((s, eid) => s + (remaining[eid] || 0), 0);
      children.forEach(eid => {
        if (totalDstRemaining > 0 && srcRemaining > 0) {
          const share = (remaining[eid] || 0) / totalDstRemaining;
          const flow = Math.min(share * srcVal, srcRemaining, remaining[eid] || 0);
          flowMatrix[src.entity_id][eid] = flow;
          remaining[eid] = (remaining[eid] || 0) - flow;
          srcRemaining -= flow;
        } else {
          flowMatrix[src.entity_id][eid] = 0;
        }
      });
    });

    // Now extract flows for the selected node
    const selectedVal = val;
    const targetNodes2 = targets.map(eid => meta.find(n => n.entity_id === eid)).filter(Boolean);
    const targetFlows = targetNodes2.map(t => {
      let flow = 0;
      if (node.type === 'source') {
        // Source → child: look up flowMatrix[source][child]
        flow = (flowMatrix[node.entity_id] || {})[t.entity_id] || 0;
      } else {
        // Destination ← parent: look up flowMatrix[parent][dest]
        flow = (flowMatrix[t.entity_id] || {})[node.entity_id] || 0;
      }
      const pct = selectedVal > 0 ? (flow / selectedVal * 100) : 0;
      return { node: t, flow, pct };
    });

    breakdown.innerHTML = targetFlows.map(t => {
      return `
        <div class="breakdown-item">
          <div class="dot" style="background:${t.node.color}"></div>
          <div class="details">
            <div class="pct">${t.pct.toFixed(1)}%</div>
            <div class="desc">${t.node.name}</div>
            <div class="kwh">${t.flow.toFixed(2)} kWh</div>
          </div>
        </div>
      `;
    }).join('');

    breakdown.className = this._expanded ? 'breakdown open' : 'breakdown collapsed';
  }
}

// ═══════════════════════════════════════════════════════════
// Lottie Insights Card — Animated system health overview
// Uses lottie-web from CDN for lightweight Lottie JSON rendering
// ═══════════════════════════════════════════════════════════

const _LOTTIE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
let _lottiePromise = null;

function _loadLottie() {
  if (window.lottie) return Promise.resolve(window.lottie);
  if (_lottiePromise) return _lottiePromise;
  _lottiePromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = _LOTTIE_CDN;
    s.onload = () => resolve(window.lottie);
    s.onerror = () => reject(new Error('Failed to load lottie-web'));
    document.head.appendChild(s);
  });
  return _lottiePromise;
}

class SigenergyInsightsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._animations = [];
    this._rendered = false;
  }

  set hass(hass) {
    this._hass = hass;
    try {
      if (this._rendered) this._updateValues();
      else this._renderSync();
    } catch(e) { console.warn('Genergy InsightsCard hass setter error:', e); }
  }

  setConfig(config) { this._config = config; }
  static getConfigElement() { return document.createElement('div'); }
  static getStubConfig() { return {}; }
  getCardSize() { return 4; }

  connectedCallback() { if (!this._rendered) this._renderSync(); }
  disconnectedCallback() {
    this._animations.forEach(a => { try { a.destroy(); } catch(e) {} });
    this._animations = [];
    this._rendered = false;
  }

  _getInsightTiles() {
    const cfg = window.SigenergyConfig ? window.SigenergyConfig.get() : {};
    const ents = cfg.entities || {};
    const feat = cfg.features || {};
    const tiles = [];

    // 1. Battery Health
    tiles.push({
      id: 'battery',
      lottie: 'care_battery.json',
      title: 'Battery Health',
      icon: '🔋',
      getValue: () => {
        const soc = this._getVal(ents.battery_soc);
        const temp = this._getVal(ents.battery_temp);
        const parts = [];
        if (soc !== null) parts.push(`SoC: ${soc.toFixed(0)}%`);
        if (temp !== null) parts.push(`${temp.toFixed(1)}°C`);
        return parts.length ? parts.join(' · ') : 'No data';
      },
      getStatus: () => {
        const soc = this._getVal(ents.battery_soc);
        if (soc === null) return 'unknown';
        if (soc >= 60) return 'good';
        if (soc >= 30) return 'warning';
        return 'critical';
      }
    });

    // 2. Capacity Assessment
    tiles.push({
      id: 'capacity',
      lottie: 'care_capacity.json',
      title: 'Capacity',
      icon: '⚡',
      getValue: () => {
        const cap = this._getVal(ents.battery_capacity);
        const maxSoc = this._getVal(ents.battery_max_soc);
        const minSoc = this._getVal(ents.battery_min_soc);
        const parts = [];
        if (cap !== null) parts.push(`${cap.toFixed(1)} kWh`);
        if (maxSoc !== null && minSoc !== null) parts.push(`Range: ${minSoc.toFixed(0)}–${maxSoc.toFixed(0)}%`);
        return parts.length ? parts.join(' · ') : 'No data';
      },
      getStatus: () => {
        const cap = this._getVal(ents.battery_capacity);
        return cap !== null ? 'good' : 'unknown';
      }
    });

    // 3. Environmental Impact
    tiles.push({
      id: 'environmental',
      lottie: 'care_environmental.json',
      title: 'Environment',
      icon: '🌱',
      getValue: () => {
        const solar = this._getValKWh(ents.solar_energy_today);
        const gridExp = this._getValKWh(ents.grid_export_today);
        const parts = [];
        if (solar !== null) parts.push(`Solar: ${solar.toFixed(1)} kWh`);
        if (gridExp !== null) parts.push(`Exported: ${gridExp.toFixed(1)} kWh`);
        return parts.length ? parts.join(' · ') : 'No data';
      },
      getStatus: () => {
        const solar = this._getValKWh(ents.solar_energy_today);
        if (solar === null) return 'unknown';
        if (solar > 5) return 'good';
        if (solar > 1) return 'warning';
        return 'critical';
      }
    });

    // 4. Equipment Status
    tiles.push({
      id: 'equipment',
      lottie: 'care_equipment.json',
      title: 'Equipment',
      icon: '🔧',
      getValue: () => {
        const invTemp = this._getVal(ents.inverter_temp) || this._getVal(ents.inverter_internal_temp);
        const gridFreq = this._getVal(ents.grid_frequency);
        const parts = [];
        if (invTemp !== null) parts.push(`Inv: ${invTemp.toFixed(1)}°C`);
        if (gridFreq !== null) parts.push(`${gridFreq.toFixed(2)} Hz`);
        return parts.length ? parts.join(' · ') : 'All systems OK';
      },
      getStatus: () => {
        const invTemp = this._getVal(ents.inverter_temp) || this._getVal(ents.inverter_internal_temp);
        if (invTemp === null) return 'good';
        if (invTemp < 45) return 'good';
        if (invTemp < 55) return 'warning';
        return 'critical';
      }
    });

    // 5. Network / Grid
    tiles.push({
      id: 'network',
      lottie: 'care_network.json',
      title: 'Grid',
      icon: '🌐',
      getValue: () => {
        const voltage = this._getVal(ents.grid_voltage);
        const freq = this._getVal(ents.grid_frequency);
        const parts = [];
        if (voltage !== null) parts.push(`${voltage.toFixed(1)} V`);
        if (freq !== null) parts.push(`${freq.toFixed(2)} Hz`);
        return parts.length ? parts.join(' · ') : 'Connected';
      },
      getStatus: () => {
        const v = this._getVal(ents.grid_voltage);
        if (v === null) return 'good';
        if (v >= 207 && v <= 253) return 'good';
        return 'warning';
      }
    });

    // 6. Revenue / Financial
    tiles.push({
      id: 'revenue',
      lottie: 'care_revenue.json',
      title: 'Revenue',
      icon: '💰',
      getValue: () => {
        const savings = this._getVal(ents.emhass_savings_today);
        const cost = this._getVal(ents.emhass_net_cost_today);
        const parts = [];
        if (savings !== null) parts.push(`Saved: €${savings.toFixed(2)}`);
        if (cost !== null) parts.push(`Cost: €${cost.toFixed(2)}`);
        return parts.length ? parts.join(' · ') : 'No data';
      },
      getStatus: () => {
        const savings = this._getVal(ents.emhass_savings_today);
        if (savings === null) return 'unknown';
        if (savings > 0) return 'good';
        return 'warning';
      }
    });

    return tiles;
  }

  _getVal(entityId) {
    if (!this._hass || !entityId) return null;
    const s = this._hass.states[entityId];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;
    const v = parseFloat(s.state);
    return isNaN(v) ? null : v;
  }

  _getValKWh(entityId) {
    if (!this._hass || !entityId) return null;
    const s = this._hass.states[entityId];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;
    const v = parseFloat(s.state);
    if (isNaN(v)) return null;
    const unit = (s.attributes?.unit_of_measurement || 'kWh').toString();
    if (unit === 'MWh') return v * 1000;
    if (unit === 'Wh') return v / 1000;
    return v;
  }

  _statusColor(status) {
    const isDark = (window._sigenergyResolveTheme ? window._sigenergyResolveTheme(this._hass) : 'dark') === 'dark';
    switch (status) {
      case 'good': return isDark ? '#2ecc71' : '#27ae60';
      case 'warning': return isDark ? '#f39c12' : '#e67e22';
      case 'critical': return isDark ? '#e74c3c' : '#c0392b';
      default: return isDark ? '#8892a4' : '#7f8c8d';
    }
  }

  async _render() {
    this._renderSync();
  }

  _renderSync() {
    if (this._rendered) return;
    try {
      const isDark = (window._sigenergyResolveTheme ? window._sigenergyResolveTheme(this._hass) : 'dark') === 'dark';
      const tiles = this._getInsightTiles();

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          border-radius: 16px !important;
          overflow: hidden !important;
          border: 1px solid ${isDark ? 'rgba(0,212,184,0.12)' : 'rgba(0,0,0,0.06)'} !important;
          background: ${isDark ? 'linear-gradient(135deg, rgba(18,24,40,0.95) 0%, rgba(26,31,46,0.98) 50%, rgba(20,28,42,0.95) 100%)' : 'rgba(255,255,255,0.92)'} !important;
          box-shadow: ${isDark ? '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 2px 12px rgba(0,0,0,0.06)'} !important;
        }
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 16px;
        }
        @media (max-width: 800px) {
          .insights-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .insights-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 1600px) {
          .insights-grid { gap: 16px; padding: 20px; }
          .insight-tile { padding: 20px; border-radius: 20px; }
          .tile-title { font-size: 15px; }
          .tile-value { font-size: 13px; }
          .lottie-container { width: 96px; height: 88px; }
          .card-header { font-size: 18px; padding: 20px 20px 0; }
        }
        .insight-tile {
          background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
          position: relative;
          overflow: hidden;
        }
        .insight-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'};
        }
        .insight-tile:active {
          transform: translateY(0);
        }
        .lottie-container {
          width: 80px;
          height: 73px;
          margin-bottom: 8px;
          border-radius: 12px;
          overflow: hidden;
        }
        .fallback-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 73px;
          font-size: 36px;
          border-radius: 12px;
          background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'};
        }
        .tile-title {
          font-size: 13px;
          font-weight: 600;
          color: ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'};
          margin-bottom: 4px;
        }
        .tile-value {
          font-size: 11px;
          color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'};
          line-height: 1.4;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-bottom: 6px;
          transition: background 0.3s;
        }
        .status-dot.pulse {
          animation: dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; }
          50% { box-shadow: 0 0 6px 3px currentColor; }
        }
        .card-header {
          padding: 16px 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'};
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-header-icon {
          font-size: 20px;
        }
        .sparkline-container {
          width: 100%;
          height: 28px;
          margin-top: 6px;
          opacity: 0.7;
        }
        .sparkline-container svg {
          width: 100%;
          height: 100%;
        }
        .expand-chevron {
          font-size: 10px;
          color: ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'};
          transition: transform 0.2s, color 0.2s;
          margin-top: 4px;
        }
        .insight-tile:hover .expand-chevron {
          color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'};
        }
        .tile-detail {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
          opacity: 0;
          width: 100%;
          margin-top: 0;
        }
        .tile-detail.open {
          max-height: 200px;
          opacity: 1;
          margin-top: 8px;
        }
        .tile-detail-inner {
          font-size: 11px;
          color: ${isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)'};
          line-height: 1.5;
          padding-top: 8px;
          border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
          text-align: left;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }
        .detail-label { opacity: 0.7; }
        .detail-value { font-weight: 500; }
        .insight-tile.expanded .expand-chevron {
          transform: rotate(180deg);
        }
      </style>
      <ha-card>
        <div class="card-header">
          <span class="card-header-icon">📊</span>
          System Insights
        </div>
        <div class="insights-grid">
          ${tiles.map(t => `
            <div class="insight-tile" data-tile="${t.id}">
              <div class="status-dot" data-status="${t.id}"></div>
              <div class="lottie-container" id="lottie-${t.id}"></div>
              <div class="tile-title">${t.title}</div>
              <div class="tile-value" data-value="${t.id}"></div>
              <div class="sparkline-container" data-sparkline="${t.id}"></div>
              <div class="expand-chevron">▼</div>
              <div class="tile-detail" data-detail="${t.id}">
                <div class="tile-detail-inner" data-detail-inner="${t.id}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </ha-card>
    `;

    // Add click-to-expand listeners
    this.shadowRoot.querySelectorAll('.insight-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const id = tile.dataset.tile;
        const detail = tile.querySelector('.tile-detail');
        const isOpen = tile.classList.contains('expanded');
        if (isOpen) {
          tile.classList.remove('expanded');
          detail.classList.remove('open');
        } else {
          tile.classList.add('expanded');
          detail.classList.add('open');
          this._populateDetail(id);
        }
      });
    });

    this._rendered = true;
    this._updateValues();
    this._renderSparklines();

    // Load Lottie animations asynchronously (non-blocking)
    this._loadAnimations(tiles).catch(e => {
      console.warn('Genergy: Lottie animation loading failed', e);
    });
    } catch(e) {
      console.warn('Genergy: InsightsCard render failed', e);
    }
  }

  async _loadAnimations(tiles) {
    const lottiePath = _SIGENERGY_SCRIPT_DIR + 'images/lottie/';

    // Load lottie-web and initialize animations
    try {
      const lottieLib = await _loadLottie();
      this._animations.forEach(a => { try { a.destroy(); } catch(e) {} });
      this._animations = [];

      for (const tile of tiles) {
        const container = this.shadowRoot.getElementById('lottie-' + tile.id);
        if (!container) continue;

        try {
          const resp = await fetch(lottiePath + tile.lottie);
          if (!resp.ok) continue;
          const animData = await resp.json();

          const anim = lottieLib.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animData,
          });
          this._animations.push(anim);
        } catch(e) {
          container.innerHTML = `<div class="fallback-icon">${tile.icon}</div>`;
        }
      }
    } catch(e) {
      console.warn('Genergy: lottie-web failed to load, using fallback icons', e);
      for (const tile of tiles) {
        const container = this.shadowRoot.getElementById('lottie-' + tile.id);
        if (container) {
          container.innerHTML = `<div class="fallback-icon">${tile.icon}</div>`;
        }
      }
    }

    this._updateValues();
  }

  _renderSparklines() {
    const cfg = window.SigenergyConfig ? window.SigenergyConfig.get() : {};
    const ents = cfg.entities || {};
    const sparkMap = {
      battery: ents.battery_soc,
      environmental: ents.solar_energy_today || ents.solar_power,
      equipment: ents.inverter_temp || ents.inverter_internal_temp,
      network: ents.grid_voltage,
      revenue: ents.emhass_savings_today
    };

    const isDark = (window._sigenergyResolveTheme ? window._sigenergyResolveTheme(this._hass) : 'dark') === 'dark';

    for (const [tileId, entityId] of Object.entries(sparkMap)) {
      if (!entityId || !this._hass) continue;
      const container = this.shadowRoot?.querySelector(`[data-sparkline="${tileId}"]`);
      if (!container) continue;

      const stateObj = this._hass.states[entityId];
      if (!stateObj) continue;

      // Use a simple approach - generate sparkline from recent attribute history if available
      // Otherwise just show a flat line at current value
      const val = parseFloat(stateObj.state);
      if (isNaN(val)) continue;

      const statusColor = this._statusColor(this._getInsightTiles().find(t => t.id === tileId)?.getStatus() || 'unknown');
      this._fetchSparklineData(entityId, container, statusColor, isDark);
    }
  }

  async _fetchSparklineData(entityId, container, color, isDark) {
    try {
      const token = this._hass?.auth?.data?.access_token;
      if (!token) return;

      const end = new Date().toISOString();
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const url = `/api/history/period/${start}?filter_entity_id=${entityId}&end_time=${end}&minimal_response&no_attributes`;

      const resp = await this._hass.callApi('GET', `history/period/${start}?filter_entity_id=${entityId}&end_time=${end}&minimal_response&no_attributes`);
      if (!resp || !resp[0] || resp[0].length < 2) return;

      const points = resp[0]
        .map(p => parseFloat(p.s || p.state))
        .filter(v => !isNaN(v));

      if (points.length < 2) return;

      // Downsample to ~30 points max
      const step = Math.max(1, Math.floor(points.length / 30));
      const sampled = [];
      for (let i = 0; i < points.length; i += step) sampled.push(points[i]);
      if (sampled.length < 2) return;

      const min = Math.min(...sampled);
      const max = Math.max(...sampled);
      const range = max - min || 1;
      const w = 100;
      const h = 28;
      const pad = 2;

      const pathPoints = sampled.map((v, i) => {
        const x = (i / (sampled.length - 1)) * w;
        const y = pad + (1 - (v - min) / range) * (h - 2 * pad);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');

      // Fill path (area under curve)
      const lastX = w;
      const fillPath = pathPoints + ` L${lastX},${h} L0,${h} Z`;

      container.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs><linearGradient id="sg-${entityId.replace(/\./g, '_')}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
        </linearGradient></defs>
        <path d="${fillPath}" fill="url(#sg-${entityId.replace(/\./g, '_')})" />
        <path d="${pathPoints}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      </svg>`;
    } catch (e) {
      // Sparklines are optional — fail silently
    }
  }

  _populateDetail(tileId) {
    const inner = this.shadowRoot?.querySelector(`[data-detail-inner="${tileId}"]`);
    if (!inner) return;

    const cfg = window.SigenergyConfig ? window.SigenergyConfig.get() : {};
    const ents = cfg.entities || {};
    const rows = [];

    const addRow = (label, entityId, unit, decimals) => {
      const v = this._getVal(entityId);
      if (v !== null) rows.push({ label, value: v.toFixed(decimals ?? 1) + (unit || '') });
    };

    switch (tileId) {
      case 'battery':
        addRow('State of Charge', ents.battery_soc, '%', 0);
        addRow('Temperature', ents.battery_temp, '°C', 1);
        addRow('Voltage', ents.battery_voltage, ' V', 1);
        addRow('Current', ents.battery_current, ' A', 2);
        addRow('Power', ents.battery_power, ' W', 0);
        addRow('Capacity', ents.battery_capacity, ' kWh', 1);
        addRow('Max SoC', ents.battery_max_soc, '%', 0);
        addRow('Min SoC', ents.battery_min_soc, '%', 0);
        addRow('Cycles', ents.battery_cycles, '', 0);
        break;
      case 'capacity':
        addRow('Total Capacity', ents.battery_capacity, ' kWh', 1);
        addRow('Max SoC Limit', ents.battery_max_soc, '%', 0);
        addRow('Min SoC Limit', ents.battery_min_soc, '%', 0);
        addRow('Charge Power', ents.battery_charge_power, ' W', 0);
        addRow('Discharge Power', ents.battery_discharge_power, ' W', 0);
        break;
      case 'environmental':
        addRow('Solar Today', ents.solar_energy_today, ' kWh', 1);
        addRow('Grid Export', ents.grid_export_today, ' kWh', 1);
        addRow('Grid Import', ents.grid_import_today, ' kWh', 1);
        addRow('Self-Sufficiency', ents.self_sufficiency, '%', 0);
        addRow('Solar Power Now', ents.solar_power, ' W', 0);
        break;
      case 'equipment':
        addRow('Inverter Temp', ents.inverter_temp || ents.inverter_internal_temp, '°C', 1);
        addRow('Inverter Power', ents.inverter_active_power, ' W', 0);
        addRow('Grid Frequency', ents.grid_frequency, ' Hz', 2);
        break;
      case 'network':
        addRow('Voltage', ents.grid_voltage, ' V', 1);
        addRow('Frequency', ents.grid_frequency, ' Hz', 2);
        addRow('Grid Power', ents.grid_active_power || ents.grid_power, ' W', 0);
        addRow('Import Today', ents.grid_import_today, ' kWh', 1);
        addRow('Export Today', ents.grid_export_today, ' kWh', 1);
        break;
      case 'revenue':
        addRow('Savings Today', ents.emhass_savings_today, ' €', 2);
        addRow('Net Cost', ents.emhass_net_cost_today, ' €', 2);
        addRow('Import Cost', ents.grid_import_cost_today, ' €', 2);
        addRow('Export Revenue', ents.grid_export_revenue_today, ' €', 2);
        break;
    }

    if (rows.length === 0) {
      inner.innerHTML = '<div style="text-align:center;opacity:0.5;">No detailed data available</div>';
    } else {
      inner.innerHTML = rows.map(r =>
        `<div class="detail-row"><span class="detail-label">${r.label}</span><span class="detail-value">${r.value}</span></div>`
      ).join('');
    }
  }

  _updateValues() {
    if (!this.shadowRoot) return;
    const tiles = this._getInsightTiles();
    for (const tile of tiles) {
      const valEl = this.shadowRoot.querySelector(`[data-value="${tile.id}"]`);
      if (valEl) valEl.textContent = tile.getValue();
      const statusEl = this.shadowRoot.querySelector(`[data-status="${tile.id}"]`);
      if (statusEl) {
        const status = tile.getStatus();
        statusEl.style.background = this._statusColor(status);
        statusEl.style.color = this._statusColor(status);
        if (status === 'critical') statusEl.classList.add('pulse');
        else statusEl.classList.remove('pulse');
      }
    }
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
    this._rafId = null;
    this._hasRendered = false;
    this._lastRenderKey = '';
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
    // Show loading skeleton on first render before hass is ready
    if (!this._hasRendered && !hass) {
      this._showSkeleton();
      return;
    }
    // Only re-render if entity values actually changed (prevents hover flash)
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      if (this._shouldRerender()) this._render();
    });
  }

  _shouldRerender() {
    const store = window.SigenergyConfig;
    const packs = store ? store.getFeature('battery_packs') : (this._config.battery_packs || 2);
    const parts = [];
    // Inverter power
    const invEnt = this._config.inverter_power || (store ? store.getEntity('inverter_output_power') : '');
    const invS = invEnt && this._hass.states[invEnt];
    parts.push(invS ? Math.round(parseFloat(invS.state) * 10) : 0);
    // Pack SoCs + expanded state
    for (let p = 1; p <= packs; p++) {
      const pe = store ? store.getEntity('battery_pack' + p + '_soc') : null;
      const ps = pe && this._hass.states[pe];
      parts.push(ps ? Math.round(parseFloat(ps.state) * 10) : 0);
      parts.push(this._expanded['battery' + p] ? 1 : 0);
    }
    parts.push(this._expanded['inverter'] ? 1 : 0);
    parts.push(this._cardWidth < 380 ? 1 : 0);
    const key = parts.join(',');
    if (key === this._lastRenderKey) return false;
    this._lastRenderKey = key;
    return true;
  }

  _showSkeleton() {
    if (!this.shadowRoot) return;
    const _t = 'dark'; // default to dark before knowing theme
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .skeleton-card { background: var(--ha-card-background, #1a1f2e); border-radius: 16px; padding: 20px; }
        .skeleton-line { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
        .skeleton-img { width: 60%; height: 200px; margin: 0 auto 16px; }
        .skeleton-pill { width: 140px; height: 50px; margin: 8px; display: inline-block; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      </style>
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-img"></div>
        <div style="text-align:center">
          <div class="skeleton-line skeleton-pill"></div>
          <div class="skeleton-line skeleton-pill"></div>
          <div class="skeleton-line skeleton-pill"></div>
        </div>
      </div>`;
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
    this._hasRendered = true;
    try {
      this._renderImpl();
    } catch (err) {
      console.error('[Genergy DeviceCard] Render error:', err);
      this.shadowRoot.innerHTML = '<div style="background:var(--ha-card-background,#1a1f2e);border-radius:16px;padding:20px;color:var(--primary-text-color,#fff);text-align:center;">' +
        '<div style="font-size:24px;margin-bottom:8px;">⚠️</div>' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:4px;">Battery System Error</div>' +
        '<div style="font-size:11px;color:#8892a4;">' + (err.message || 'Unknown error').replace(/</g, '&lt;') + '</div></div>';
    }
  }

  _renderImpl() {
    const store = window.SigenergyConfig;
    const packs = store ? store.getFeature('battery_packs') : (this._config.battery_packs || 2);
    const battSocEntity = store ? store.getEntity('battery_soc') : '';
    const invPowerEntity = this._config.inverter_power || (store ? store.getEntity('inverter_output_power') : '') || '';
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

    /* ── Theme resolution (shared by compact + wide) ── */
    var _t = window._sigenergyResolveTheme ? window._sigenergyResolveTheme(this._hass) : 'dark';

    /* ── Compact layout for narrow cards ── */
    if (this._cardWidth < 380) {
      var np = Math.max(1, Math.min(packs, 8));
      var imgSrc = _SIGENERGY_SCRIPT_DIR + 'images/1inverter' + np + 'battery.png';
      var _cBg = _t === 'light' ? '#fff' : '#1a1f2e';
      var _cText = _t === 'light' ? '#1a1f2e' : '#fff';
      var _cPillBg = _t === 'light' ? 'rgba(255,255,255,0.94)' : 'rgba(30,35,54,0.94)';
      var _cBorder = _t === 'light' ? 'rgba(0,0,0,0.1)' : '#2d3451';
      var _cName = _t === 'light' ? '#333' : '#e0e4ec';
      var html = '<style>:host{display:block}.card{background:var(--ha-card-background,' + _cBg + ');border-radius:16px;padding:12px;overflow:hidden;text-align:center;color:var(--primary-text-color,' + _cText + ')}.img{max-width:100%;height:auto;margin:0 auto 12px;display:block}.labels{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.pill{background:var(--card-background-color,' + _cPillBg + ');border:1px solid var(--divider-color,' + _cBorder + ');border-radius:14px;padding:8px 14px;display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer}.pill-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}.pill-name{font-size:15px;font-weight:600;color:var(--primary-text-color,' + _cName + ');white-space:nowrap}.pill-val{font-size:16px;font-weight:700;color:var(--primary-text-color,' + _cText + ');white-space:nowrap}</style>';
      html += '<div class="card">';
      html += prereqBanner;
      html += '<img class="img" src="' + imgSrc + '" alt="Battery System"/>';
      html += '<div class="labels">';
      html += '<div class="pill" style="border-color:rgba(46,204,113,0.35)"><span class="pill-dot" style="background:#2ecc71"></span><span class="pill-name">Inverter</span><span class="pill-val">' + invFmt + '</span></div>';
      for (var i = 1; i <= np; i++) {
        var soc = packSocs[i-1];
        var col = this._socColor(soc);
        var socTxt = soc !== null ? soc.toFixed(1) + '%' : '?';
        var socPct = soc !== null ? Math.min(100, Math.max(0, soc)) : 0;
        html += '<div class="pill" style="border-color:' + col + '35;position:relative;overflow:hidden"><div class="soc-bar" style="position:absolute;bottom:0;left:0;width:' + socPct + '%;height:3px;background:' + col + ';border-radius:0 0 14px 14px;transition:width 0.8s ease;opacity:0.7"></div><span class="pill-dot" style="background:' + col + '"></span><span class="pill-name">Batt ' + i + '</span><span class="pill-val">' + socTxt + '</span></div>';
      }
      html += '</div></div>';
      this.shadowRoot.innerHTML = html;
      return;
    }

    /* ── Layout constants (viewBox user-units) ── */
    var _pillBg = _t === 'light' ? 'rgba(255,255,255,0.94)' : 'rgba(30,35,54,0.94)';
    var _textFill = _t === 'light' ? '#1a1f2e' : '#e0e4ec';
    var _valFill = _t === 'light' ? '#1a1f2e' : '#fff';
    var _chevBg = _t === 'light' ? '#e8eaee' : '#2a2e38';
    var _chevBgExp = _t === 'light' ? '#d0e8e3' : '#3a5e58';
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
    var drawRow = function(cy, label, val, col, side, deviceKey, socPct, tempVal) {
      var s = '';
      var isExp = self._expanded[deviceKey];
      var chevChar = isExp ? '\u2039' : '\u203A';
      var hasSocBar = socPct !== undefined && socPct !== null;
      var fillW = hasSocBar ? PW * Math.min(100, Math.max(0, socPct)) / 100 : 0;
      if (side === 'left') {
        s += '<circle cx="' + sLeft + '" cy="' + cy + '" r="3" fill="' + col + '"/>';
        var le = IX - CL;
        s += '<line x1="' + sLeft + '" y1="' + cy + '" x2="' + (le + CR) + '" y2="' + cy + '" stroke="' + col + '" stroke-width="1.5" opacity="0.5" stroke-dasharray="4,2"/>';
        var ccx = le - G - CR;
        s += '<g class="chevron" data-device="' + deviceKey + '" style="cursor:pointer">';
        s += '<circle cx="' + ccx + '" cy="' + cy + '" r="' + CR + '" fill="' + (isExp ? _chevBgExp : _chevBg) + '" stroke="' + (isExp ? col : '#4a4e58') + '" stroke-width="1"/>';
        s += '<text x="' + ccx + '" y="' + (cy + 6) + '" text-anchor="middle" font-size="22" font-weight="700" fill="' + (isExp ? _valFill : '#8892a4') + '">' + chevChar + '</text>';
        s += '</g>';
        var px = P, py = cy - PH / 2;
        // Pill background with clip-path for SoC fill
        s += '<defs><clipPath id="clip-' + deviceKey + '"><rect x="' + px + '" y="' + py + '" width="' + PW + '" height="' + PH + '" rx="' + PR + '"/></clipPath></defs>';
        s += '<rect x="' + px + '" y="' + py + '" width="' + PW + '" height="' + PH + '" rx="' + PR + '" fill="' + _pillBg + '" stroke="' + col + '" stroke-opacity="0.35" stroke-width="1"/>';
        if (hasSocBar) {
          s += '<rect x="' + px + '" y="' + (py + PH - 4) + '" width="' + fillW + '" height="4" fill="' + col + '" opacity="0.6" clip-path="url(#clip-' + deviceKey + ')"/>';
        }
        s += '<text x="' + (px + PW / 2) + '" y="' + (py + 22) + '" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="' + _textFill + '">' + label + '</text>';
        s += '<circle cx="' + (px + 16) + '" cy="' + (py + 42) + '" r="5" fill="' + col + '"/>';
        s += '<text x="' + (px + 26) + '" y="' + (py + 47) + '" font-family="sans-serif" font-size="16" font-weight="700" fill="' + _valFill + '">' + val + '</text>';
        if (tempVal) {
          s += '<text x="' + (px + PW - 8) + '" y="' + (py + 47) + '" text-anchor="end" font-family="sans-serif" font-size="10" fill="' + (tempVal > 40 ? '#e74c3c' : '#8892a4') + '">' + tempVal.toFixed(1) + '°</text>';
        }
      } else {
        s += '<circle cx="' + sRight + '" cy="' + cy + '" r="3" fill="' + col + '"/>';
        var re = IX + IW + CL;
        s += '<line x1="' + sRight + '" y1="' + cy + '" x2="' + (re - CR) + '" y2="' + cy + '" stroke="' + col + '" stroke-width="1.5" opacity="0.5" stroke-dasharray="4,2"/>';
        var ccx = re + G + CR;
        s += '<g class="chevron" data-device="' + deviceKey + '" style="cursor:pointer">';
        s += '<circle cx="' + ccx + '" cy="' + cy + '" r="' + CR + '" fill="' + (isExp ? _chevBgExp : _chevBg) + '" stroke="' + (isExp ? col : '#4a4e58') + '" stroke-width="1"/>';
        s += '<text x="' + ccx + '" y="' + (cy + 6) + '" text-anchor="middle" font-size="22" font-weight="700" fill="' + (isExp ? _valFill : '#8892a4') + '">' + chevChar + '</text>';
        s += '</g>';
        var px = TW - P - PW, py = cy - PH / 2;
        s += '<defs><clipPath id="clip-' + deviceKey + '"><rect x="' + px + '" y="' + py + '" width="' + PW + '" height="' + PH + '" rx="' + PR + '"/></clipPath></defs>';
        s += '<rect x="' + px + '" y="' + py + '" width="' + PW + '" height="' + PH + '" rx="' + PR + '" fill="' + _pillBg + '" stroke="' + col + '" stroke-opacity="0.35" stroke-width="1"/>';
        if (hasSocBar) {
          s += '<rect x="' + px + '" y="' + (py + PH - 4) + '" width="' + fillW + '" height="4" fill="' + col + '" opacity="0.6" clip-path="url(#clip-' + deviceKey + ')"/>';
        }
        s += '<text x="' + (px + PW / 2) + '" y="' + (py + 22) + '" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="' + _textFill + '">' + label + '</text>';
        s += '<circle cx="' + (px + 16) + '" cy="' + (py + 42) + '" r="5" fill="' + col + '"/>';
        s += '<text x="' + (px + 26) + '" y="' + (py + 47) + '" font-family="sans-serif" font-size="16" font-weight="700" fill="' + _valFill + '">' + val + '</text>';
        if (tempVal) {
          s += '<text x="' + (px + PW - 8) + '" y="' + (py + 47) + '" text-anchor="end" font-family="sans-serif" font-size="10" fill="' + (tempVal > 40 ? '#e74c3c' : '#8892a4') + '">' + tempVal.toFixed(1) + '°</text>';
        }
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
      // Get temperature for this pack
      var packTempEntity = '';
      var packSocEntity = store ? store.getEntity('battery_pack' + i + '_soc') : '';
      if (packSocEntity && packSocEntity.endsWith('_soc')) {
        packTempEntity = packSocEntity.slice(0, -3).replace(/_view_$/, '_temperature_01');
      }
      var packTemp = packTempEntity ? this._getVal(packTempEntity) : null;
      b += drawRow(mcy, 'Battery(' + i + ')', soc + '%', col, side, 'battery' + i, packSoc, packTemp);
    }

    /* ── Expansion panels ── */
    var panels = '';
    var panelStyle = _t === 'light'
      ? 'background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#e0e0e0);border-radius:12px;padding:12px 16px;margin:8px 4px;'
      : 'background:var(--card-background-color,rgba(30,35,54,0.96));border:1px solid var(--divider-color,#2d3451);border-radius:12px;padding:12px 16px;margin:8px 4px;';
    var statStyle = 'display:inline-block;text-align:center;padding:6px 10px;min-width:70px;';
    var statVal = _t === 'light'
      ? 'font-size:18px;font-weight:700;color:var(--primary-text-color,#1a1f2e);display:block;'
      : 'font-size:18px;font-weight:700;color:#fff;display:block;';
    var statLbl = _t === 'light'
      ? 'font-size:10px;color:var(--secondary-text-color,#666);text-transform:uppercase;letter-spacing:1px;'
      : 'font-size:10px;color:#8892a4;text-transform:uppercase;letter-spacing:1px;';
    var headerStyle = _t === 'light'
      ? 'font-size:14px;font-weight:700;color:var(--primary-text-color,#1a1f2e);margin-bottom:8px;letter-spacing:1px;'
      : 'font-size:14px;font-weight:700;color:#e0e4ec;margin-bottom:8px;letter-spacing:1px;';;
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
      var invTemp = store ? store.getEntity('inverter_temp') : '';
      var invIntTemp = store ? store.getEntity('inverter_internal_temp') : '';
      var invOutput = store ? store.getEntity('inverter_output_power') : '';
      var invRated = store ? store.getEntity('inverter_rated_power') : '';
      var pvOne = store ? store.getEntity('pv1_power') : '';
      var pvTwo = store ? store.getEntity('pv2_power') : '';
      var pvStrings = store ? (store.getFeature && store.getFeature('pv_strings')) || 2 : 2;
      var gridV = store ? store.getEntity('grid_voltage') : '';
      var gridHz = store ? store.getEntity('grid_frequency') : '';
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
      // Derive battery pack entity prefix from the configured SoC entity
      var packSocEntity = store ? store.getEntity('battery_pack' + p + '_soc') : '';
      var prefix = '';
      if (packSocEntity && packSocEntity.endsWith('_soc')) {
        prefix = packSocEntity.slice(0, -3); // remove 'soc' to get 'sensor.xxx_view_'
      }
      var cellPrefix = '';
      if (prefix) {
        // Derive cell prefix from view prefix: sensor.xxx_view_ → sensor.xxx_cell_voltage_
        cellPrefix = prefix.replace(/_view_$/, '_cell_voltage_');
      }
      var tempEntity = '';
      if (prefix) {
        tempEntity = prefix.replace(/_view_$/, '_temperature_01');
      }
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
      var fmtCellV = function(eid) {
        if (!self._hass || !eid) return '—';
        var s = self._hass.states[eid];
        if (!s || s.state === 'unavailable' || s.state === 'unknown') return '—';
        var v = parseFloat(s.state);
        if (isNaN(v)) return s.state;
        return (v / 1000).toFixed(3) + 'V';
      };
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtCellV(cellPrefix ? cellPrefix + 'min' : '') + '</span><span style="' + statLbl + '">Cell Min</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtCellV(cellPrefix ? cellPrefix + 'max' : '') + '</span><span style="' + statLbl + '">Cell Max</span></div>';
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + fmtEntity(cellPrefix ? cellPrefix + 'diff' : '', 0, 'mV') + '</span><span style="' + statLbl + '">Cell Diff</span></div>';
      // Temperature
      var temp1 = fmtEntity(tempEntity, dps, '°C');
      panels += '<div style="' + statStyle + '"><span style="' + statVal + '">' + temp1 + '</span><span style="' + statLbl + '">Temp</span></div>';
      panels += '</div></div>';
    }

    var _wBg = _t === 'light' ? '#fff' : '#1a1f2e';
    var _wText = _t === 'light' ? '#1a1f2e' : '#fff';
    var _wChevHover = _t === 'light' ? '#d0d4da' : '#3a3e48';
    // Total SoC bar
    var totalSoc = battSocFallback;
    var totalCol = this._socRingColor(totalSoc);
    var totalPct = totalSoc !== null ? Math.min(100, Math.max(0, totalSoc)) : 0;
    var totalSocBar = '<div style="margin:4px 8px 2px;padding:6px 12px;display:flex;align-items:center;gap:10px;">' +
      '<div style="flex:1;height:6px;background:' + (_t === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)') + ';border-radius:3px;overflow:hidden;position:relative;">' +
      '<div style="position:absolute;left:0;top:0;height:100%;width:' + totalPct + '%;background:' + totalCol + ';border-radius:3px;transition:width 0.8s ease;"></div></div>' +
      '<span style="font-size:13px;font-weight:700;color:' + totalCol + ';white-space:nowrap;">' + (totalSoc !== null ? totalSoc.toFixed(1) + '%' : '—') + '</span></div>';
    this.shadowRoot.innerHTML =
      '<style>:host{display:block}.card{background:var(--ha-card-background,' + _wBg + ');border-radius:16px;padding:12px 4px;overflow:hidden;color:var(--primary-text-color,' + _wText + ')} .chevron{cursor:pointer;pointer-events:all;-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none} .chevron *{pointer-events:all} .chevron:hover circle,.chevron:active circle,.chevron:focus circle{fill:' + _wChevHover + '} .chevron:focus{outline:2px solid #00d4b8;outline-offset:2px;border-radius:50%}</style>' +
      '<div class="card">' + prereqBanner +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + TW + ' ' + TH + '" width="100%" style="display:block">' +
      b + '</svg>' + totalSocBar + panels + '</div>';

    // Wire up click handlers for chevron buttons
    var svg = this.shadowRoot.querySelector('svg');
    if (svg) {
      var chevrons = svg.querySelectorAll('.chevron');
      for (var c = 0; c < chevrons.length; c++) {
        // Add accessibility attributes
        chevrons[c].setAttribute('tabindex', '0');
        chevrons[c].setAttribute('role', 'button');
        chevrons[c].setAttribute('aria-label', 'Toggle ' + (chevrons[c].getAttribute('data-device') || 'details'));
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
        // Keyboard support: Enter and Space
        chevrons[c].addEventListener('keydown', (function(el) {
          return function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              var device = el.getAttribute('data-device');
              if (device) {
                self._expanded[device] = !self._expanded[device];
                self._render();
              }
            }
          };
        })(chevrons[c]));
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
window.__sigCardClasses['sigenergy-sankey-panel'] = SigenergySankeyPanel;
window.__sigCardClasses['sigenergy-insights-card'] = SigenergyInsightsCard;
window.__sigCardClasses['sigenergy-energy-flow-card'] = SigenergyEnergyFlowCard;

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
window.customCards.push({
  type: 'sigenergy-insights-card',
  name: 'Genergy Insights',
  description: 'Animated system health overview with Lottie animations',
  preview: true,
});

console.info(
  '%c GENERGY-DASHBOARD %c v2.19.0 ',
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
    '}',
    '',
    '/* Big screen (1920px+): increase grid gap for kiosk */',
    '@media (min-width: 1800px) {',
    '  #root { grid-gap: 12px !important; }',
    '}',
    '@media (min-width: 2400px) {',
    '  #root { grid-gap: 16px !important; }',
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

    // Find the sankey-chart element (parent of sankey-chart-base)
    function findSankeyChart() {
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
            if (sankey) return sankey;
          }
        }
        return null;
      } catch(e) { return null; }
    }

    function patchDestBars(baseSr) {
      if (patching) return;
      patching = true;
      try {
        // --- 1. Patch SVG gradient stops: make destination-end stops 30% opacity ---
        // This preserves source colors through the flow path with semi-transparent overlap at destinations.
        var conns = baseSr.querySelectorAll('.connectors');
        for (var c = 0; c < conns.length; c++) {
          var svg = conns[c].querySelector('svg');
          if (!svg) continue;
          var grads = svg.querySelectorAll('linearGradient');
          for (var g = 0; g < grads.length; g++) {
            var stops = grads[g].querySelectorAll('stop');
            if (stops.length < 2) continue;
            var lastStop = stops[stops.length - 1];
            // Make destination-end gradient stop 30% opacity to preserve source colors
            lastStop.setAttribute('stop-opacity', '0.3');
          }
          // --- 2. Boost flow path opacity for better visibility (closer to Sigenergy reference) ---
          var paths = svg.querySelectorAll('path');
          for (var p = 0; p < paths.length; p++) {
            var fo = paths[p].getAttribute('fill-opacity');
            if (fo && parseFloat(fo) < 0.5) {
              paths[p].setAttribute('fill-opacity', '0.55');
            }
          }
        }

        // --- 3. Inject per-flow percentage labels on connectors ---
        // Each SVG path represents a source→destination flow. We label significant
        // flows (>2% of destination) with the percentage of that destination's energy
        // coming from each source. This matches the Sigenergy app's per-flow labels.
        try {
          var ha = document.querySelector('home-assistant');
          var states = ha && ha.hass && ha.hass.states;
          if (states) {
            var cfg;
            try { cfg = JSON.parse(localStorage.getItem('sigenergy-dashboard-config')); } catch(e) { cfg = null; }
            if (cfg && cfg.entities) {
              var ents = cfg.entities;
              var feat = cfg.features || {};
              function _toKwh(eid) {
                var s = states[eid];
                if (!s) return 0;
                var v = parseFloat(s.state) || 0;
                var u = (s.attributes && s.attributes.unit_of_measurement) || 'kWh';
                if (u === 'MWh') return v * 1000;
                if (u === 'Wh') return v / 1000;
                return v;
              }
              var solar = _toKwh(ents.solar_energy_today);
              var batD = _toKwh(ents.battery_discharge_today);
              var gridI = _toKwh(ents.grid_import_today || ents.grid_import_high_tariff || ents.grid_import_low_tariff);
              var totalSrc = solar + batD + gridI;

              // Only inject labels if we have meaningful source data
              if (totalSrc > 0.1) {
                // Find the connector SVGs and remove any old percentage labels
                var connSvgs = baseSr.querySelectorAll('.connectors svg');
                for (var si = 0; si < connSvgs.length; si++) {
                  var svgEl = connSvgs[si];
                  // Remove previous percentage labels (flow-pct-label disabled — clutters wide layout)
                  var oldLabels = svgEl.querySelectorAll('.flow-pct-label');
                  for (var ol = 0; ol < oldLabels.length; ol++) oldLabels[ol].remove();
                  // Flow percentage labels disabled — node boxes already show percentages via CSS ::after
                }
              }
            }
          }
        } catch(e) { /* flow label injection failed silently */ }
      } finally {
        patching = false;
      }
    }

    // Inject proportional connection entities for multi-source flow distribution.
    // Calculates how much each source contributes to HP/EV based on source proportions.
    // Accepts a states object to inject into (defaults to ha.hass.states)
    function injectConnectionEntities(states) {
      try {
        if (!states) {
          var ha = document.querySelector('home-assistant');
          if (!ha || !ha.hass || !ha.hass.states) return false;
          states = ha.hass.states;
        }
        // Helper: read entity state converting to kWh
        function toKwh(eid) {
          var s = states[eid];
          if (!s) return 0;
          var v = parseFloat(s.state) || 0;
          var u = (s.attributes && s.attributes.unit_of_measurement) || 'kWh';
          if (u === 'MWh') return v * 1000;
          if (u === 'Wh') return v / 1000;
          return v;
        }
        // Source entity IDs — read from config stored in localStorage
        var cfg;
        try { cfg = JSON.parse(localStorage.getItem('sigenergy-dashboard-config')); } catch(e) { return false; }
        if (!cfg || !cfg.entities) return false;
        var ents = cfg.entities;
        var feat = cfg.features || {};
        var solar = toKwh(ents.solar_energy_today);
        var batD = toKwh(ents.battery_discharge_today);
        var gridI = toKwh(ents.grid_import_today || ents.grid_import_high_tariff || ents.grid_import_low_tariff);
        var total = solar + batD + gridI;
        if (total <= 0) return false;
        var solarPct = solar / total;
        var batPct = batD / total;
        var gridPct = gridI / total;
        // Destination small consumers — mirror the entity selection in the main sankey builder
        var hpEnt = (feat.hp_energy_is_cumulative && ents.hp_energy_daily_meter) ? ents.hp_energy_daily_meter : ents.heat_pump_energy_today;
        var hp = hpEnt ? toKwh(hpEnt) : 0;
        var evEnt = (feat.ev_energy_is_cumulative && ents.ev_energy_daily_meter) ? ents.ev_energy_daily_meter : ents.ev_energy_today;
        var ev = evEnt ? toKwh(evEnt) : 0;
        var now = new Date().toISOString();
        // Inject fake entities for each source→destination connection
        function inject(id, val) {
          states[id] = { entity_id: id, state: String(val), attributes: { unit_of_measurement: 'kWh' }, last_changed: now, last_updated: now };
        }
        if (hp > 0) {
          inject('_conn_solar_to_hp', hp * solarPct);
          inject('_conn_bat_to_hp', hp * batPct);
          inject('_conn_grid_to_hp', hp * gridPct);
        }
        if (ev > 0) {
          inject('_conn_solar_to_ev', ev * solarPct);
          inject('_conn_bat_to_ev', ev * batPct);
          inject('_conn_grid_to_ev', ev * gridPct);
        }
        return true; // injected something
      } catch(e) { return false; }
    }

    // Install a hass property interceptor on the sankey-chart element.
    // Every time HA sets `hass` on the sankey chart, we inject connection entities
    // into the states object BEFORE the chart's original setter processes them.
    var hassInterceptorInstalled = false;
    function installHassInterceptor() {
      if (hassInterceptorInstalled) return;
      var sankeyEl = findSankeyChart();
      if (!sankeyEl) return;
      // Get the original hass setter from the prototype chain
      var proto = Object.getPrototypeOf(sankeyEl);
      var desc = null;
      var p = proto;
      while (p && !desc) {
        desc = Object.getOwnPropertyDescriptor(p, 'hass');
        if (desc) break;
        p = Object.getPrototypeOf(p);
      }
      if (!desc || !desc.set) return;
      var origSet = desc.set;
      var origGet = desc.get;
      // Intercept the hass setter on the INSTANCE (doesn't affect other elements)
      Object.defineProperty(sankeyEl, 'hass', {
        configurable: true,
        get: origGet ? function() { return origGet.call(this); } : undefined,
        set: function(newHass) {
          if (newHass && newHass.states) {
            injectConnectionEntities(newHass.states);
          }
          origSet.call(this, newHass);
        }
      });
      hassInterceptorInstalled = true;
    }

    function trySetup() {
      try {
        // Install hass interceptor on the sankey chart (once) to inject connection
        // entities into every hass update before the chart renders.
        installHassInterceptor();

        // Also inject into current hass.states (for the initial render)
        injectConnectionEntities();

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
