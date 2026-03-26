/**
 * Sigenergy Dashboard — Config Store
 * 
 * Shared configuration store that all cards read from.
 * Settings card writes to this store.
 * Uses localStorage with optional HA input_text sync.
 */

const STORAGE_KEY = 'sigenergy-dashboard-config';

const DEFAULT_CONFIG = {
  entities: {
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
    weather: '',
    emhass_mode: '',
    emhass_reason: '',
    mpc_battery: '',
    mpc_grid: '',
    mpc_pv: '',
    buy_price: '',
    sell_price: '',
    nordpool: '',
  },
  features: {
    ev_charger: false,
    ev_vehicle: false,
    heat_pump: false,
    grid_connection: true,
    battery_packs: 2,
    emhass: true,
    weather_widget: true,
    sunrise_sunset: false,
    three_phase: false,
    dual_tariff: false,
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

class ConfigStore {
  constructor() {
    this._config = null;
    this._listeners = new Set();
  }

  /**
   * Get the full config, merging defaults with stored values.
   */
  get() {
    if (!this._config) {
      this._config = this._load();
    }
    return this._config;
  }

  /**
   * Get a specific entity ID.
   */
  getEntity(key) {
    const cfg = this.get();
    return cfg.entities?.[key] || DEFAULT_CONFIG.entities[key] || '';
  }

  /**
   * Get a feature flag.
   */
  getFeature(key) {
    const cfg = this.get();
    return cfg.features?.[key] ?? DEFAULT_CONFIG.features[key];
  }

  /**
   * Get a pricing setting.
   */
  getPricing(key) {
    const cfg = this.get();
    return cfg.pricing?.[key] ?? DEFAULT_CONFIG.pricing[key];
  }

  /**
   * Get a display preference.
   */
  getDisplay(key) {
    const cfg = this.get();
    return cfg.display?.[key] ?? DEFAULT_CONFIG.display[key];
  }

  /**
   * Update config and notify listeners.
   */
  update(section, key, value) {
    const cfg = this.get();
    if (!cfg[section]) cfg[section] = {};
    cfg[section][key] = value;
    this._save(cfg);
    this._notify();
  }

  /**
   * Subscribe to config changes.
   */
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  // --- Private ---

  _load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this._merge(DEFAULT_CONFIG, parsed);
      }
    } catch (e) {
      console.warn('SigenergyConfig: load failed', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  _save(config) {
    this._config = config;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...config,
        _version: 1,
        _saved: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('SigenergyConfig: save failed', e);
    }
  }

  _merge(defaults, overrides) {
    const result = {};
    for (const key of Object.keys(defaults)) {
      if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
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

// Singleton
export const configStore = new ConfigStore();

// Also set on window for non-module access
window.SigenergyConfig = configStore;
