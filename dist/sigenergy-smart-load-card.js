/**
 * Sigenergy Smart Load Card — Individual appliance power/energy monitoring grid
 * 
 * Reads smart_loads config from SigConfigStore.
 * Renders a responsive grid of tiles with mySigen appliance icons.
 */

const APPLIANCE_TYPES = [
  { id: 'air_conditioner',     label: 'Air Conditioner',   keywords: ['airco', 'air.cond', 'klimaat', 'climatisation', 'klimaanlage', 'aire.acondicionado', 'condizionatore'] },
  { id: 'car_charging',        label: 'EV Charger',        keywords: ['ev', 'car.charg', 'wallbox', 'laadpaal', 'borne.de.recharge', 'ladestation', 'cargador'] },
  { id: 'cloth_dryer',         label: 'Dryer',             keywords: ['dryer', 'droger', 'tumble', 'seche.linge', 'trockner', 'secadora', 'asciugatrice'] },
  { id: 'coffee_machine',      label: 'Coffee Machine',    keywords: ['coffee', 'koffie', 'espresso', 'cafe', 'kaffee', 'caffe'] },
  { id: 'dish_washer',         label: 'Dishwasher',        keywords: ['dish', 'afwasmachine', 'vaatwas', 'lave.vaisselle', 'spulmaschine', 'lavavajillas', 'lavastoviglie'] },
  { id: 'fan',                 label: 'Fan / Ventilation', keywords: ['fan', 'ventilat', 'afzuig', 'aanzuig', 'extracteur', 'lufter', 'ventilador', 'ventola'] },
  { id: 'floor_heating',       label: 'Floor Heating',     keywords: ['floor.heat', 'vloerverwarming', 'chauffage.sol', 'fussbodenheizung', 'suelo.radiante'] },
  { id: 'fridge',              label: 'Fridge',            keywords: ['fridge', 'frigo', 'koelkast', 'refrigerateur', 'kuhlschrank', 'nevera', 'frigorifero'] },
  { id: 'heat_pump',           label: 'Heat Pump',         keywords: ['heat.pump', 'warmtepomp', 'pompe.chaleur', 'warmepumpe', 'bomba.calor', 'pompa.calore'] },
  { id: 'heating_and_cooling', label: 'HVAC',              keywords: ['hvac', 'heat.*cool', 'klimaat', 'chauffage', 'heizung', 'calefaccion'] },
  { id: 'hot_water',           label: 'Hot Water / Boiler',keywords: ['boiler', 'hot.water', 'warm.water', 'chauffe.eau', 'warmwasser', 'calentador', 'scaldabagno'] },
  { id: 'humidifier',          label: 'Humidifier',        keywords: ['humidif', 'luchtbevochtiger', 'humidificateur', 'luftbefeuchter', 'umidificatore'] },
  { id: 'lights',              label: 'Lights',            keywords: ['light', 'licht', 'led', 'lamp', 'lumiere', 'beleuchtung', 'luz', 'illuminazione'] },
  { id: 'microwave',           label: 'Microwave',         keywords: ['microwave', 'magnetron', 'micro.ondes', 'mikrowelle', 'microondas', 'microonde'] },
  { id: 'oven',                label: 'Oven',              keywords: ['oven', 'combi', 'four', 'backofen', 'horno', 'forno'] },
  { id: 'plug_socket',         label: 'Smart Plug',        keywords: [] },
  { id: 'pool_pomp',           label: 'Pool/Water Pump',   keywords: ['pump', 'pomp', 'pompe', 'pumpe', 'bomba', 'pompa', 'water'] },
  { id: 'rice_cooker',         label: 'Rice Cooker',       keywords: ['rice', 'rijstkoker', 'cuiseur.riz', 'reiskocher'] },
  { id: 'server_rack',         label: 'Server / Network',  keywords: ['server', 'nas', 'router', 'network', 'switch', 'modem'] },
  { id: 'thermostat',          label: 'Thermostat',        keywords: ['thermostat', 'thermostaat', 'fire', 'haard', 'cheminee', 'kamin', 'chimenea', 'camino'] },
  { id: 'towel_rails',         label: 'Towel Rail',        keywords: ['towel', 'handdoek', 'seche.serviette', 'handtuchheizung'] },
  { id: 'tv',                  label: 'TV',                keywords: ['tv', 'television', 'televisie', 'fernseher', 'televisor', 'televisore'] },
  { id: 'washing_machine',     label: 'Washing Machine',   keywords: ['wash', 'wasmachine', 'lave.linge', 'waschmaschine', 'lavadora', 'lavatrice'] },
  { id: 'wine_cooler',         label: 'Wine Cooler',       keywords: ['wine', 'wijn', 'vin', 'wein', 'vino'] },
];

// Image base path — relies on HA static path registered by __init__.py
// JS is served at /genergy_dashboard/js/ but images at /genergy_dashboard/frontend/
const _SCRIPT_URL = import.meta.url;
const _BASE_PATH = new URL('.', _SCRIPT_URL).pathname.replace('/js/', '/frontend/');
const IMG_BASE = _BASE_PATH + 'images/smart_load/';

function _classifyByName(friendlyName) {
  const name = (friendlyName || '').toLowerCase();
  for (const a of APPLIANCE_TYPES) {
    if (a.keywords.length && a.keywords.some(kw => new RegExp(kw, 'i').test(name))) {
      return a.id;
    }
  }
  return 'plug_socket';
}

function _formatPower(watts) {
  if (watts == null || isNaN(watts)) return 'N/A';
  const w = Math.abs(parseFloat(watts));
  if (w >= 1000) return (w / 1000).toFixed(1) + ' kW';
  return Math.round(w) + ' W';
}

function _formatEnergy(kwh) {
  if (kwh == null || isNaN(kwh)) return '';
  const v = parseFloat(kwh);
  if (v >= 100) return v.toFixed(0) + ' kWh';
  return v.toFixed(1) + ' kWh';
}

class SigenergySmartLoadCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._unsubStore = null;
    this._rendered = false;
    this._lastLoadKeys = '';
  }

  set hass(hass) {
    const changed = this._hass !== hass;
    this._hass = hass;
    if (changed) {
      if (this._rendered) {
        this._updateValues();
      } else {
        this._render();
      }
    }
  }

  setConfig(config) {
    this._config = config || {};
  }

  connectedCallback() {
    const store = window.SigenergyConfig;
    if (store) {
      this._unsubStore = store.subscribe(() => { this._rendered = false; this._render(); });
    }
    this._render();
  }

  disconnectedCallback() {
    if (this._unsubStore) { this._unsubStore(); this._unsubStore = null; }
    this._rendered = false;
  }

  getCardSize() {
    return 4;
  }

  _getSmartLoads() {
    const store = window.SigenergyConfig;
    if (!store) return [];
    const cfg = store.get();
    if (!cfg.features?.smart_loads) return [];
    return cfg.smart_loads || [];
  }

  _updateValues() {
    if (!this.shadowRoot || !this._hass) return;
    const loads = this._getSmartLoads();
    const hass = this._hass;
    const standbyThreshold = window.SigenergyConfig?.get()?.features?.smart_load_standby_threshold || 5;

    // Check if loads config changed (needs full re-render)
    const loadKeys = loads.map(l => l.entity_power + '|' + l.label).join(';');
    if (loadKeys !== this._lastLoadKeys) {
      this._rendered = false;
      this._render();
      return;
    }

    // Update values in-place without replacing DOM
    const tiles = this.shadowRoot.querySelectorAll('.tile');
    let totalWatts = 0;
    let totalKwh = 0;

    tiles.forEach(tile => {
      const entityId = tile.dataset.entity;
      const load = loads.find(l => l.entity_power === entityId);
      if (!load) return;

      const powerState = hass.states?.[load.entity_power];
      let watts = null;
      if (powerState) {
        const val = parseFloat(powerState.state);
        const uom = powerState.attributes?.unit_of_measurement;
        if (!isNaN(val)) watts = (uom === 'kW') ? val * 1000 : val;
      }
      const energyState = hass.states?.[load.entity_energy];
      const kwh = energyState ? parseFloat(energyState.state) : null;

      if (watts != null) totalWatts += watts;
      if (kwh != null && !isNaN(kwh)) totalKwh += kwh;

      // Update power text
      let cls = 'off', tileCls = '';
      if (watts != null && watts > 0) {
        if (watts > 1000) { cls = 'high'; tileCls = 'high'; }
        else if (watts <= standbyThreshold) { cls = 'standby'; tileCls = 'standby'; }
        else { cls = 'active'; tileCls = 'active'; }
      }

      tile.className = 'tile' + (tileCls ? ' ' + tileCls : '');
      const powerEl = tile.querySelector('.tile-power');
      if (powerEl) {
        powerEl.className = 'tile-power ' + cls;
        powerEl.textContent = _formatPower(watts);
      }
      const energyEl = tile.querySelector('.tile-energy');
      if (energyEl && kwh != null && !isNaN(kwh)) {
        energyEl.textContent = _formatEnergy(kwh);
      }
    });

    // Update totals
    const totalEl = this.shadowRoot.querySelector('.header-total');
    if (totalEl) totalEl.textContent = _formatPower(totalWatts);
    const totalValueEl = this.shadowRoot.querySelector('.total-value');
    if (totalValueEl) {
      totalValueEl.textContent = _formatPower(totalWatts) + (totalKwh > 0 ? ' · ' + _formatEnergy(totalKwh) : '');
    }
  }

  _render() {
    if (!this.shadowRoot) return;
    const loads = this._getSmartLoads();
    const hass = this._hass;

    if (!loads.length) {
      this.shadowRoot.innerHTML = '';
      return;
    }

    const cols = window.SigenergyConfig?.get()?.features?.smart_load_columns || 4;
    const sortBy = window.SigenergyConfig?.get()?.features?.smart_load_sort || 'power';
    const standbyThreshold = window.SigenergyConfig?.get()?.features?.smart_load_standby_threshold || 5;

    // Build load data with current values
    let items = loads.map(load => {
      const powerState = hass?.states?.[load.entity_power];
      let watts = null;
      if (powerState) {
        const val = parseFloat(powerState.state);
        const uom = powerState.attributes?.unit_of_measurement;
        if (!isNaN(val)) {
          watts = (uom === 'kW') ? val * 1000 : val;
        }
      }
      const energyState = hass?.states?.[load.entity_energy];
      const kwh = energyState ? parseFloat(energyState.state) : null;
      const typeInfo = APPLIANCE_TYPES.find(a => a.id === load.type) || APPLIANCE_TYPES.find(a => a.id === 'plug_socket');
      return { ...load, watts, kwh, typeInfo };
    });

    // Sort
    if (sortBy === 'power') {
      items.sort((a, b) => (b.watts || 0) - (a.watts || 0));
    } else if (sortBy === 'energy') {
      items.sort((a, b) => (b.kwh || 0) - (a.kwh || 0));
    } else {
      items.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    }

    // Totals
    const totalWatts = items.reduce((sum, i) => sum + (i.watts || 0), 0);
    const totalKwh = items.reduce((sum, i) => sum + (i.kwh || 0), 0);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --card-bg: var(--ha-card-background, #22273a);
          --text-primary: var(--primary-text-color, #fff);
          --text-secondary: var(--secondary-text-color, #8892a4);
          --accent: var(--primary-color, #00d4b8);
          --border: var(--divider-color, rgba(92,156,230,0.12));
        }
        .card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .header-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .header-total {
          font-size: 12px;
          color: var(--accent);
          font-weight: 600;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(${cols}, 1fr);
          gap: 8px;
        }
        @media (max-width: 768px) {
          .grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 480px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
        .tile {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          min-height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .tile:hover {
          background: rgba(255,255,255,0.06);
          border-color: var(--accent);
        }
        .tile.active { border-color: rgba(255,165,0,0.5); }
        .tile.high { border-color: rgba(231,76,60,0.5); }
        .tile.standby { border-color: rgba(255,235,59,0.3); }
        .tile-icon {
          width: 36px;
          height: 36px;
          object-fit: contain;
          opacity: 0.9;
        }
        .tile-label {
          font-size: 10px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .tile-power {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .tile-power.active { color: #ffa726; }
        .tile-power.high { color: #e74c3c; }
        .tile-power.standby { color: #ffeb3b; }
        .tile-power.off { color: var(--text-secondary); }
        .tile-energy {
          font-size: 9px;
          color: var(--text-secondary);
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(0,212,184,0.06);
          border-radius: 8px;
          border: 1px solid rgba(0,212,184,0.15);
        }
        .total-label {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .total-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--accent);
        }
      </style>
      <div class="card">
        <div class="header">
          <span class="header-title">⚡ Smart Loads</span>
          <span class="header-total">${_formatPower(totalWatts)}</span>
        </div>
        <div class="grid">
          ${items.map(item => {
            const w = item.watts;
            let cls = 'off';
            let tileCls = '';
            if (w != null && w > 0) {
              if (w > 1000) { cls = 'high'; tileCls = 'high'; }
              else if (w <= standbyThreshold) { cls = 'standby'; tileCls = 'standby'; }
              else { cls = 'active'; tileCls = 'active'; }
            }
            return `
              <div class="tile ${tileCls}" data-entity="${item.entity_power}">
                <img class="tile-icon" src="${IMG_BASE}${item.type}_mid.png"
                     alt="${item.typeInfo?.label || item.type}"
                     loading="lazy"
                     onerror="this.src='${IMG_BASE}plug_socket_mid.png'">
                <div class="tile-label">${item.label || item.typeInfo?.label || 'Load'}</div>
                <div class="tile-power ${cls}">${_formatPower(w)}</div>
                ${item.kwh != null && !isNaN(item.kwh) ? `<div class="tile-energy">${_formatEnergy(item.kwh)}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        ${items.length > 1 ? `
          <div class="total-row">
            <span class="total-label">Total (${items.length} loads)</span>
            <span class="total-value">${_formatPower(totalWatts)}${totalKwh > 0 ? ' · ' + _formatEnergy(totalKwh) : ''}</span>
          </div>
        ` : ''}
      </div>
    `;

    // Bind tile click -> HA more-info dialog
    this.shadowRoot.querySelectorAll('.tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const entityId = tile.dataset.entity;
        if (entityId && this._hass) {
          const event = new Event('hass-more-info', { bubbles: true, composed: true });
          event.detail = { entityId };
          this.dispatchEvent(event);
        }
      });
    });

    this._rendered = true;
    this._lastLoadKeys = loads.map(l => l.entity_power + '|' + l.label).join(';');
  }
}

// Export for use in sigenergy-dashboard.js
window.__sigCardClasses = window.__sigCardClasses || {};
window.__sigCardClasses['sigenergy-smart-load-card'] = SigenergySmartLoadCard;
if (!customElements.get('sigenergy-smart-load-card')) {
  customElements.define('sigenergy-smart-load-card', SigenergySmartLoadCard);
}

// Export APPLIANCE_TYPES for use in settings UI auto-detection
window.__sigApplianceTypes = APPLIANCE_TYPES;
window.__sigClassifyByName = _classifyByName;
