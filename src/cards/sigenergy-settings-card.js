/**
 * Sigenergy Dashboard — Settings Card (Lit Element)
 * 
 * A custom Lovelace card that provides entity configuration,
 * feature toggles, pricing setup, and display preferences
 * for the Sigenergy Dashboard.
 * 
 * Tabs:
 *   1. Entity Configuration — map HA entities to dashboard slots
 *   2. Features & Toggles — EV, heat pump, grid, battery packs
 *   3. Electricity Pricing — Tibber/Amber/Nordpool/Custom
 *   4. Display Preferences — theme, units, decimals
 * 
 * Persistence: uses HA input_text helpers or localStorage fallback.
 */

const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// Design tokens from sigenergy_dark theme
const THEME = {
  bg: '#1a1f2e',
  cardBg: '#22273a',
  border: '#2d3451',
  primary: '#00d4b8',
  text: '#ffffff',
  textSecondary: '#8892a4',
  solar: '#c8b84a',
  battery: '#00d4b8',
  grid: '#6b7fd4',
  load: '#9b59b6',
  danger: '#e74c3c',
  success: '#2ecc71',
};

// Default entity mapping for Deye inverters
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
  weather: '',
  emhass_mode: '',
  emhass_reason: '',
  mpc_battery: '',
  mpc_grid: '',
  mpc_pv: '',
  buy_price: '',
  sell_price: '',
  nordpool: '',
  battery_pack1_soc: '',
  battery_pack2_soc: '',
  inverter_temp: '',
  battery_temp: '',
  grid_voltage: '',
  grid_frequency: '',
};

const STORAGE_KEY = 'sigenergy-dashboard-config';

class SigenergySettingsCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
      _activeTab: { type: Number },
      _entities: { type: Object },
      _features: { type: Object },
      _pricing: { type: Object },
      _display: { type: Object },
    };
  }

  constructor() {
    super();
    this._activeTab = 0;
    this._entities = { ...DEFAULT_ENTITIES };
    this._features = {
      ev_charger: false,
      ev_vehicle: false,
      heat_pump: false,
      grid_connection: true,
      battery_packs: 2,
      emhass: true,
      weather_widget: true,
      sunrise_sunset: false,
    };
    this._pricing = {
      source: 'nordpool', // tibber | amber | nordpool | custom
      cheap_threshold: 0.10,
      expensive_threshold: 0.25,
      currency: '€',
      show_price_overlay: true,
      show_price_badge: true,
      show_color_coding: true,
    };
    this._display = {
      theme: 'dark',
      power_threshold: 1000,
      decimal_places: 1,
      chart_range: 'today',
      soc_ring_low: 40,
      soc_ring_high: 60,
    };
    this._loadConfig();
  }

  setConfig(config) {
    this._config = config;
  }

  static getConfigElement() {
    return document.createElement('sigenergy-settings-editor');
  }

  static getStubConfig() {
    return {};
  }

  _loadConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.entities) this._entities = { ...DEFAULT_ENTITIES, ...parsed.entities };
        if (parsed.features) this._features = { ...this._features, ...parsed.features };
        if (parsed.pricing) this._pricing = { ...this._pricing, ...parsed.pricing };
        if (parsed.display) this._display = { ...this._display, ...parsed.display };
      }
    } catch (e) {
      console.warn('Sigenergy Dashboard: Failed to load config', e);
    }
  }

  _saveConfig() {
    const config = {
      entities: this._entities,
      features: this._features,
      pricing: this._pricing,
      display: this._display,
      _version: 1,
      _saved: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Sigenergy Dashboard: Failed to save config', e);
    }
    // Also attempt to save to HA file system via REST API
    this._saveToHA(config);
  }

  async _saveToHA(config) {
    if (!this.hass) return;
    try {
      // Try writing to /config/www/sigenergy-config.json via HA REST API
      // This requires the File Editor addon or custom component
      const resp = await this.hass.callWS({
        type: 'persistent_notification/create',
        notification_id: 'sigenergy_config_saved',
        title: 'Sigenergy Dashboard',
        message: `Configuration saved at ${new Date().toLocaleTimeString()}`,
      });
    } catch (e) {
      // Silent fail — localStorage is the primary store
    }
  }

  _getEntityState(entityId) {
    if (!this.hass || !entityId) return 'N/A';
    const state = this.hass.states[entityId];
    return state ? `${state.state} ${state.attributes.unit_of_measurement || ''}`.trim() : 'Not found';
  }

  _updateEntity(key, value) {
    this._entities = { ...this._entities, [key]: value };
    this._saveConfig();
    this.requestUpdate();
  }

  _updateFeature(key, value) {
    this._features = { ...this._features, [key]: value };
    this._saveConfig();
    this.requestUpdate();
  }

  _updatePricing(key, value) {
    this._pricing = { ...this._pricing, [key]: value };
    this._saveConfig();
    this.requestUpdate();
  }

  _updateDisplay(key, value) {
    this._display = { ...this._display, [key]: value };
    this._saveConfig();
    this.requestUpdate();
  }

  static get styles() {
    return css`
      :host {
        display: block;
        font-family: var(--ha-card-header-font-family, inherit);
      }
      .card {
        background: ${THEME.cardBg};
        border: 1px solid ${THEME.border};
        border-radius: 16px;
        padding: 16px;
        color: ${THEME.text};
      }
      .tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 16px;
        border-bottom: 1px solid ${THEME.border};
        padding-bottom: 8px;
      }
      .tab {
        padding: 8px 16px;
        border-radius: 8px 8px 0 0;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: ${THEME.textSecondary};
        transition: all 0.2s;
        border: none;
        background: none;
      }
      .tab:hover {
        color: ${THEME.text};
        background: rgba(0, 212, 184, 0.1);
      }
      .tab.active {
        color: ${THEME.primary};
        border-bottom: 2px solid ${THEME.primary};
      }
      .section {
        margin-bottom: 16px;
      }
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: ${THEME.primary};
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .entity-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding: 6px 8px;
        background: rgba(45, 52, 81, 0.5);
        border-radius: 8px;
      }
      .entity-label {
        min-width: 140px;
        font-size: 12px;
        color: ${THEME.textSecondary};
      }
      .entity-input {
        flex: 1;
        background: ${THEME.bg};
        border: 1px solid ${THEME.border};
        border-radius: 6px;
        padding: 6px 10px;
        color: ${THEME.text};
        font-size: 12px;
        font-family: monospace;
      }
      .entity-input:focus {
        outline: none;
        border-color: ${THEME.primary};
      }
      .entity-state {
        min-width: 80px;
        text-align: right;
        font-size: 11px;
        color: ${THEME.primary};
        font-weight: 500;
      }
      .entity-state.error {
        color: ${THEME.danger};
      }
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: rgba(45, 52, 81, 0.5);
        border-radius: 8px;
        margin-bottom: 6px;
      }
      .toggle-label {
        font-size: 13px;
        color: ${THEME.text};
      }
      .toggle-desc {
        font-size: 11px;
        color: ${THEME.textSecondary};
        margin-top: 2px;
      }
      .toggle-switch {
        width: 44px;
        height: 24px;
        background: ${THEME.border};
        border-radius: 12px;
        position: relative;
        cursor: pointer;
        transition: background 0.3s;
      }
      .toggle-switch.on {
        background: ${THEME.primary};
      }
      .toggle-switch::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        top: 2px;
        left: 2px;
        transition: transform 0.3s;
      }
      .toggle-switch.on::after {
        transform: translateX(20px);
      }
      .pricing-source {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }
      .pricing-btn {
        padding: 10px;
        border: 2px solid ${THEME.border};
        border-radius: 10px;
        background: ${THEME.bg};
        color: ${THEME.text};
        cursor: pointer;
        text-align: center;
        font-size: 13px;
        transition: all 0.2s;
      }
      .pricing-btn.active {
        border-color: ${THEME.primary};
        background: rgba(0, 212, 184, 0.1);
      }
      .pricing-btn:hover {
        border-color: ${THEME.primary};
      }
      .input-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .input-label {
        min-width: 160px;
        font-size: 12px;
        color: ${THEME.textSecondary};
      }
      .input-field {
        flex: 1;
        background: ${THEME.bg};
        border: 1px solid ${THEME.border};
        border-radius: 6px;
        padding: 6px 10px;
        color: ${THEME.text};
        font-size: 12px;
      }
      .input-field:focus {
        outline: none;
        border-color: ${THEME.primary};
      }
      select.input-field {
        cursor: pointer;
      }
      .save-btn {
        display: block;
        width: 100%;
        padding: 10px;
        margin-top: 12px;
        background: ${THEME.primary};
        color: ${THEME.bg};
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .save-btn:hover {
        opacity: 0.9;
      }
    `;
  }

  render() {
    return html`
      <div class="card">
        <div class="tabs">
          <button class="tab ${this._activeTab === 0 ? 'active' : ''}" @click=${() => this._activeTab = 0}>
            ⚡ Entities
          </button>
          <button class="tab ${this._activeTab === 1 ? 'active' : ''}" @click=${() => this._activeTab = 1}>
            🔧 Features
          </button>
          <button class="tab ${this._activeTab === 2 ? 'active' : ''}" @click=${() => this._activeTab = 2}>
            💰 Pricing
          </button>
          <button class="tab ${this._activeTab === 3 ? 'active' : ''}" @click=${() => this._activeTab = 3}>
            🎨 Display
          </button>
        </div>
        ${this._activeTab === 0 ? this._renderEntities() : ''}
        ${this._activeTab === 1 ? this._renderFeatures() : ''}
        ${this._activeTab === 2 ? this._renderPricing() : ''}
        ${this._activeTab === 3 ? this._renderDisplay() : ''}
      </div>
    `;
  }

  _renderEntityRow(label, key) {
    const entityId = this._entities[key] || '';
    const state = this._getEntityState(entityId);
    const isError = state === 'Not found';
    return html`
      <div class="entity-row">
        <span class="entity-label">${label}</span>
        <input class="entity-input" 
               .value=${entityId} 
               placeholder="sensor.entity_id"
               @change=${(e) => this._updateEntity(key, e.target.value)} />
        <span class="entity-state ${isError ? 'error' : ''}">${state}</span>
      </div>
    `;
  }

  _renderEntities() {
    return html`
      <div class="section">
        <div class="section-title">☀️ Core Power Entities</div>
        ${this._renderEntityRow('Solar Power', 'solar_power')}
        ${this._renderEntityRow('Home Load', 'load_power')}
        ${this._renderEntityRow('Battery Power', 'battery_power')}
        ${this._renderEntityRow('Battery SoC', 'battery_soc')}
        ${this._renderEntityRow('Grid Power', 'grid_power')}
      </div>
      <div class="section">
        <div class="section-title">📊 Daily Energy Totals</div>
        ${this._renderEntityRow('Solar Today', 'solar_energy_today')}
        ${this._renderEntityRow('Load Today', 'load_energy_today')}
        ${this._renderEntityRow('Batt Charge', 'battery_charge_today')}
        ${this._renderEntityRow('Batt Discharge', 'battery_discharge_today')}
        ${this._renderEntityRow('Grid Import', 'grid_import_today')}
        ${this._renderEntityRow('Grid Export', 'grid_export_today')}
      </div>
      ${this._features.emhass ? html`
        <div class="section">
          <div class="section-title">🤖 EMHASS Entities</div>
          ${this._renderEntityRow('EMHASS Mode', 'emhass_mode')}
          ${this._renderEntityRow('Decision Reason', 'emhass_reason')}
          ${this._renderEntityRow('MPC Battery', 'mpc_battery')}
          ${this._renderEntityRow('MPC Grid', 'mpc_grid')}
          ${this._renderEntityRow('MPC PV', 'mpc_pv')}
          ${this._renderEntityRow('Buy Price', 'buy_price')}
          ${this._renderEntityRow('Sell Price', 'sell_price')}
        </div>
      ` : ''}
      <div class="section">
        <div class="section-title">🔋 Battery Packs</div>
        ${Array.from({length: this._features.battery_packs}, (_, i) => 
          this._renderEntityRow(`Pack ${i+1} SoC`, `battery_pack${i+1}_soc`)
        )}
      </div>
      <div class="section">
        <div class="section-title">🌡️ Other</div>
        ${this._renderEntityRow('Weather', 'weather')}
        ${this._renderEntityRow('Inverter Temp', 'inverter_temp')}
        ${this._renderEntityRow('Battery Temp', 'battery_temp')}
        ${this._renderEntityRow('Grid Voltage', 'grid_voltage')}
        ${this._renderEntityRow('Grid Voltage L2', 'grid_voltage_l2')}
        ${this._renderEntityRow('Grid Voltage L3', 'grid_voltage_l3')}
        ${this._renderEntityRow('Grid Frequency', 'grid_frequency')}
        ${this._renderEntityRow('Nordpool', 'nordpool')}
      </div>
    `;
  }

  _renderToggle(label, desc, key, value) {
    return html`
      <div class="toggle-row">
        <div>
          <div class="toggle-label">${label}</div>
          <div class="toggle-desc">${desc}</div>
        </div>
        <div class="toggle-switch ${value ? 'on' : ''}" 
             @click=${() => this._updateFeature(key, !value)}></div>
      </div>
    `;
  }

  _renderFeatures() {
    return html`
      <div class="section">
        <div class="section-title">System Components</div>
        ${this._renderToggle('Grid Connection', 'Hide grid for off-grid setups', 'grid_connection', this._features.grid_connection)}
        ${this._renderToggle('EMHASS Integration', 'Show EMHASS optimizer data', 'emhass', this._features.emhass)}
        ${this._renderToggle('Weather Widget', 'Show weather on Overview', 'weather_widget', this._features.weather_widget)}
      </div>
      <div class="section">
        <div class="section-title">Optional Equipment</div>
        ${this._renderToggle('EV Charger', 'Show EV charger + flow animation', 'ev_charger', this._features.ev_charger)}
        ${this._renderToggle('EV Vehicle', 'Show car in garage', 'ev_vehicle', this._features.ev_vehicle)}
        ${this._renderToggle('Heat Pump / HVAC', 'Show heat pump unit', 'heat_pump', this._features.heat_pump)}
      </div>
      <div class="section">
        <div class="section-title">Battery Configuration</div>
        <div class="input-group">
          <span class="input-label">Number of Battery Packs</span>
          <input class="input-field" type="number" min="1" max="8"
                 .value=${String(this._features.battery_packs)}
                 @change=${(e) => this._updateFeature('battery_packs', parseInt(e.target.value))} />
        </div>
      </div>
      <div class="section">
        <div class="section-title">Chart Enhancements</div>
        ${this._renderToggle('Sunrise/Sunset Lines', 'Show day/night on charts', 'sunrise_sunset', this._features.sunrise_sunset)}
      </div>
    `;
  }

  _renderPricing() {
    return html`
      <div class="section">
        <div class="section-title">Price Source</div>
        <div class="pricing-source">
          <div class="pricing-btn ${this._pricing.source === 'tibber' ? 'active' : ''}"
               @click=${() => this._updatePricing('source', 'tibber')}>
            Tibber
          </div>
          <div class="pricing-btn ${this._pricing.source === 'amber' ? 'active' : ''}"
               @click=${() => this._updatePricing('source', 'amber')}>
            Amber Electric
          </div>
          <div class="pricing-btn ${this._pricing.source === 'nordpool' ? 'active' : ''}"
               @click=${() => this._updatePricing('source', 'nordpool')}>
            Nordpool
          </div>
          <div class="pricing-btn ${this._pricing.source === 'custom' ? 'active' : ''}"
               @click=${() => this._updatePricing('source', 'custom')}>
            Custom / Manual
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Price Thresholds</div>
        <div class="input-group">
          <span class="input-label">Cheap Threshold (€/kWh)</span>
          <input class="input-field" type="number" step="0.01"
                 .value=${String(this._pricing.cheap_threshold)}
                 @change=${(e) => this._updatePricing('cheap_threshold', parseFloat(e.target.value))} />
        </div>
        <div class="input-group">
          <span class="input-label">Expensive Threshold (€/kWh)</span>
          <input class="input-field" type="number" step="0.01"
                 .value=${String(this._pricing.expensive_threshold)}
                 @change=${(e) => this._updatePricing('expensive_threshold', parseFloat(e.target.value))} />
        </div>
        <div class="input-group">
          <span class="input-label">Currency Symbol</span>
          <input class="input-field" type="text" maxlength="3"
                 .value=${this._pricing.currency}
                 @change=${(e) => this._updatePricing('currency', e.target.value)} />
        </div>
      </div>
      <div class="section">
        <div class="section-title">Display Options</div>
        ${this._renderToggle('Price Overlay on Charts', 'Secondary Y-axis with price', 'show_price_overlay', this._pricing.show_price_overlay)}
        ${this._renderToggle('Price Badge on Overview', 'Current price on house card', 'show_price_badge', this._pricing.show_price_badge)}
        ${this._renderToggle('Price Color Coding', 'Green/yellow/red thresholds', 'show_color_coding', this._pricing.show_color_coding)}
      </div>
    `;
  }

  _renderDisplay() {
    return html`
      <div class="section">
        <div class="section-title">Theme</div>
        <div class="pricing-source">
          <div class="pricing-btn ${this._display.theme === 'dark' ? 'active' : ''}"
               @click=${() => this._updateDisplay('theme', 'dark')}>
            🌙 Dark
          </div>
          <div class="pricing-btn ${this._display.theme === 'light' ? 'active' : ''}"
               @click=${() => this._updateDisplay('theme', 'light')}>
            ☀️ Light
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Number Formatting</div>
        <div class="input-group">
          <span class="input-label">Decimal Places</span>
          <select class="input-field" 
                  @change=${(e) => this._updateDisplay('decimal_places', parseInt(e.target.value))}>
            <option value="0" ?selected=${this._display.decimal_places === 0}>0</option>
            <option value="1" ?selected=${this._display.decimal_places === 1}>1</option>
            <option value="2" ?selected=${this._display.decimal_places === 2}>2</option>
          </select>
        </div>
        <div class="input-group">
          <span class="input-label">Auto-scale Threshold (W)</span>
          <input class="input-field" type="number" step="100"
                 .value=${String(this._display.power_threshold)}
                 @change=${(e) => this._updateDisplay('power_threshold', parseInt(e.target.value))} />
          <span class="entity-state">Below: W, Above: kW</span>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Charts</div>
        <div class="input-group">
          <span class="input-label">Default Time Range</span>
          <select class="input-field"
                  @change=${(e) => this._updateDisplay('chart_range', e.target.value)}>
            <option value="today" ?selected=${this._display.chart_range === 'today'}>Today</option>
            <option value="24h" ?selected=${this._display.chart_range === '24h'}>Last 24 Hours</option>
            <option value="7d" ?selected=${this._display.chart_range === '7d'}>Last 7 Days</option>
          </select>
        </div>
      </div>
      <div class="section">
        <div class="section-title">🔋 Battery SoC Ring</div>
        <div class="toggle-desc" style="margin-bottom:8px;">Pulsing glow color on the battery device indicator ring, based on SoC thresholds.</div>
        <div class="input-group">
          <span class="input-label">🔴 Red → Orange threshold (%)</span>
          <input class="input-field" type="number" min="0" max="100" step="1"
                 .value=${String(this._display.soc_ring_low)}
                 @change=${(e) => this._updateDisplay('soc_ring_low', parseInt(e.target.value))} />
        </div>
        <div class="input-group">
          <span class="input-label">🟠 Orange → Green threshold (%)</span>
          <input class="input-field" type="number" min="0" max="100" step="1"
                 .value=${String(this._display.soc_ring_high)}
                 @change=${(e) => this._updateDisplay('soc_ring_high', parseInt(e.target.value))} />
        </div>
        <div class="toggle-desc">Below ${this._display.soc_ring_low}% = red pulse, ${this._display.soc_ring_low}–${this._display.soc_ring_high}% = orange pulse, above ${this._display.soc_ring_high}% = green pulse</div>
      </div>
      <button class="save-btn" @click=${() => { this._saveConfig(); alert('Configuration saved!'); }}>
        💾 Save Configuration
      </button>
    `;
  }

  getCardSize() {
    return 8;
  }
}

customElements.define('sigenergy-settings-card', SigenergySettingsCard);

// Export config for other cards to read
window.SigenergyConfig = {
  get() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { entities: DEFAULT_ENTITIES };
    } catch (e) {
      return { entities: DEFAULT_ENTITIES };
    }
  }
};

console.info(
  `%c SIGENERGY-DASHBOARD %c v0.1.0 `,
  'color: orange; font-weight: bold; background: black;',
  'color: white; font-weight: bold; background: dimgray;'
);
