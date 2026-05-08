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
  { id: 'general_shelly',      label: 'Shelly Device',     keywords: ['shelly'] },
  { id: 'generator',           label: 'Generator',         keywords: ['generator', 'genset', 'aggregaat', 'groupe.electrogene', 'stromerzeuger', 'generador', 'generatore'] },
  { id: 'circuit_breaker',     label: 'Circuit Breaker',   keywords: ['circuit', 'breaker', 'rcbo', 'rcd', 'mcb', 'switchboard', 'schakelaar', 'disjoncteur', 'sicherung', 'interruptor', 'interruttore', 'distribution.board', 'verdeelkast', 'tableau.electrique', 'sicherungskasten'] },
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
    this._collapsedSections = new Set(); // track which section IDs are collapsed
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
    const standbyThreshold = parseFloat(window.SigenergyConfig?.get()?.features?.smart_load_standby_threshold) || 5;
    const hideInactive = window.SigenergyConfig?.get()?.features?.smart_load_hide_inactive;

    // Check if loads config changed or hide-inactive toggle changed (needs full re-render)
    const loadKeys = loads.map(l => l.entity_power + '|' + l.label).join(';') + '|hide=' + !!hideInactive + '|threshold=' + standbyThreshold;
    if (loadKeys !== this._lastLoadKeys) {
      this._rendered = false;
      this._render();
      return;
    }

    // Update values in-place without replacing DOM
    const tiles = this.shadowRoot.querySelectorAll('.tile');
    let totalWatts = 0;
    let totalKwh = 0;
    let visibleCount = 0;

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

      // Hide inactive tiles when setting is enabled
      if (hideInactive && (watts == null || watts <= standbyThreshold)) {
        tile.style.display = 'none';
        return;
      }
      tile.style.display = '';
      visibleCount++;

      if (watts != null) totalWatts += watts;
      if (kwh != null && !isNaN(kwh)) totalKwh += kwh;

      // Update power text
      let cls = 'off', tileCls = 'off';
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
      // Don't clear existing rendered content — keeps last known state visible
      // Only clear if we've never rendered anything
      if (!this._rendered) {
        this.shadowRoot.innerHTML = '';
      }
      return;
    }

    const userCols = window.SigenergyConfig?.get()?.features?.smart_load_columns;
    const sortBy = window.SigenergyConfig?.get()?.features?.smart_load_sort || 'power';
    const standbyThreshold = parseFloat(window.SigenergyConfig?.get()?.features?.smart_load_standby_threshold) || 5;

    // Adaptive column count based on load count (if user didn't set explicit value)
    const loadCount = loads.length;
    const cols = userCols || (loadCount <= 2 ? 2 : loadCount <= 6 ? 3 : 4);

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

    // Filter out inactive loads if setting is enabled
    const hideInactive = window.SigenergyConfig?.get()?.features?.smart_load_hide_inactive;
    if (hideInactive) {
      items = items.filter(item => item.watts != null && item.watts > standbyThreshold);
    }

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
    const activeCount = items.filter(i => i.watts != null && i.watts > standbyThreshold).length;

    // Sections support
    const sections = (window.SigenergyConfig?.get()?.smart_load_sections || []).filter(s => s.name);
    const hasSections = sections.length > 0;

    // Helper: render a single tile
    const _renderTile = (item, rankIdx, totalActive) => {
      const w = item.watts;
      let cls = 'off', tileCls = 'off';
      if (w != null && w > 0) {
        if (w > 1000) { cls = 'high'; tileCls = 'high'; }
        else if (w <= standbyThreshold) { cls = 'standby'; tileCls = 'standby'; }
        else { cls = 'active'; tileCls = 'active'; }
      }
      const rankHtml = rankIdx >= 0 ? `<span class="rank-badge">#${rankIdx + 1}</span>` : '';
      const energyHtml = item.kwh != null && !isNaN(item.kwh) ? `<div class="tile-energy">${_formatEnergy(item.kwh)}</div>` : '';
      const toggleHtml = item.entity_switch ? `<div class="tile-toggle" data-switch="${item.entity_switch}" title="Toggle"></div>` : '';
      return `
        <div class="tile ${tileCls}" data-entity="${item.entity_power}" data-name="${item.label || item.typeInfo?.label || 'Load'}" data-type="${item.type}" data-power="${w}" data-switch="${item.entity_switch || ''}">
          ${rankHtml}
          ${toggleHtml}
          <img class="tile-icon" src="${IMG_BASE}${item.type}_mid.png" alt="${item.typeInfo?.label || item.type}" loading="lazy" onerror="this.src='${IMG_BASE}plug_socket_mid.png'">
          <div class="tile-label">${item.label || item.typeInfo?.label || 'Load'}</div>
          <div class="tile-power ${cls}">${_formatPower(w)}</div>
          ${energyHtml}
        </div>`;
    };

    const activeItems = items.filter(i => i.watts != null && i.watts > standbyThreshold);

    // Build section groups
    const renderSections = () => {
      if (!hasSections) {
        // No sections — render flat grid as before
        return `<div class="grid">${items.map((item, idx) => {
          const rankIdx = activeItems.indexOf(item);
          return _renderTile(item, rankIdx, activeItems.length);
        }).join('')}</div>`;
      }

      let html = '';
      const assignedIds = new Set(sections.flatMap(s => s.device_ids || []));
      const unassigned = items.filter(i => !assignedIds.has(i.entity_power));

      for (const section of sections) {
        const sectionItems = (section.device_ids || [])
          .map(id => items.find(i => i.entity_power === id))
          .filter(Boolean);
        if (sectionItems.length === 0) continue;
        const sectionWatts = sectionItems.reduce((s, i) => s + (i.watts || 0), 0);
        const sectionActive = sectionItems.filter(i => i.watts != null && i.watts > standbyThreshold).length;
        const isCollapsed = this._collapsedSections.has(section.id);
        html += `
          <div class="section-header" data-section-id="${section.id}">
            <span class="section-name">
              <span class="section-collapse-icon${isCollapsed ? ' collapsed' : ''}">▾</span>
              ${section.name}
            </span>
            <span class="section-stats">
              ${sectionActive > 0 ? `<span>${sectionActive} active</span>` : ''}
              <span class="section-power">${_formatPower(sectionWatts)}</span>
            </span>
          </div>
          <div class="section-grid${isCollapsed ? ' collapsed' : ''}">
            ${sectionItems.map(item => {
              const rankIdx = activeItems.indexOf(item);
              return _renderTile(item, rankIdx, activeItems.length);
            }).join('')}
          </div>`;
      }

      if (unassigned.length > 0) {
        const isCollapsed = this._collapsedSections.has('__other__');
        html += `
          <div class="section-header" data-section-id="__other__">
            <span class="section-name">
              <span class="section-collapse-icon${isCollapsed ? ' collapsed' : ''}">▾</span>
              Other
            </span>
            <span class="section-stats">
              <span class="section-power">${_formatPower(unassigned.reduce((s,i)=>s+(i.watts||0),0))}</span>
            </span>
          </div>
          <div class="section-grid${isCollapsed ? ' collapsed' : ''}">
            ${unassigned.map(item => {
              const rankIdx = activeItems.indexOf(item);
              return _renderTile(item, rankIdx, activeItems.length);
            }).join('')}
          </div>`;
      }
      return html;
    };

    const isDark = (window._sigenergyResolveTheme ? window._sigenergyResolveTheme(this._hass) : 'dark') === 'dark';
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --text-primary: ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'};
          --text-secondary: ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
          --accent: #00d4b8;
          --border: ${isDark ? 'rgba(0,212,184,0.12)' : 'rgba(0,0,0,0.06)'};
        }
        .card {
          background: ${isDark ? 'linear-gradient(135deg, rgba(18,24,40,0.95) 0%, rgba(26,31,46,0.98) 50%, rgba(20,28,42,0.95) 100%)' : 'rgba(255,255,255,0.92)'};
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          box-shadow: ${isDark ? '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 2px 12px rgba(0,0,0,0.06)'};
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .header-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .header-total {
          font-size: 13px;
          color: var(--accent);
          font-weight: 600;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(${cols}, 1fr);
          gap: 8px;
          margin-top: 4px;
        }
        @media (max-width: 768px) {
          .grid { grid-template-columns: repeat(${Math.min(cols, 3)}, 1fr); }
        }
        @media (max-width: 480px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
        .tile {
          position: relative;
          background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.3s, opacity 0.3s;
          min-height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .tile:hover {
          transform: translateY(-2px);
          background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
          box-shadow: 0 4px 16px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'};
          border-color: var(--accent);
        }
        .tile.active {
          border-color: rgba(0,212,184,0.4);
          box-shadow: 0 0 12px rgba(0,212,184,0.15), inset 0 0 8px rgba(0,212,184,0.04);
        }
        .tile.high {
          border-color: rgba(231,76,60,0.5);
          box-shadow: 0 0 16px rgba(231,76,60,0.2), inset 0 0 8px rgba(231,76,60,0.06);
          animation: pulseHigh 2s ease-in-out infinite;
        }
        .tile.standby {
          border-color: rgba(255,235,59,0.3);
          box-shadow: 0 0 6px rgba(255,235,59,0.08);
          opacity: 0.6;
        }
        @keyframes pulseHigh {
          0%, 100% { box-shadow: 0 0 16px rgba(231,76,60,0.2), inset 0 0 8px rgba(231,76,60,0.06); }
          50% { box-shadow: 0 0 24px rgba(231,76,60,0.35), inset 0 0 12px rgba(231,76,60,0.1); }
        }
        .tile-icon {
          width: 36px;
          height: 36px;
          object-fit: contain;
          opacity: 0.9;
          transition: opacity 0.2s, filter 0.3s;
        }
        .tile.active .tile-icon,
        .tile.high .tile-icon { opacity: 1; }
        .tile.off .tile-icon { opacity: 0.35; filter: grayscale(0.8); }
        .tile.off { opacity: 0.45; }
        .tile.off .tile-label { color: var(--text-secondary); opacity: 0.6; }
        .rank-badge {
          position: absolute;
          top: 4px;
          right: 6px;
          font-size: 9px;
          font-weight: 700;
          color: var(--accent);
          opacity: 0.6;
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
        .tile-power.active { color: #00d4b8; }
        .tile-power.high { color: #e74c3c; }
        .tile-power.standby { color: #ffeb3b; opacity: 0.7; }
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
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 4px 6px;
          margin-top: 12px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          user-select: none;
        }
        .section-header:first-child { margin-top: 0; }
        .section-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .section-collapse-icon {
          font-size: 10px;
          color: var(--text-secondary);
          transition: transform 0.2s;
        }
        .section-collapse-icon.collapsed { transform: rotate(-90deg); }
        .section-stats {
          font-size: 11px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-power {
          color: var(--accent);
          font-weight: 600;
        }
        .section-grid {
          display: grid;
          grid-template-columns: repeat(${cols}, 1fr);
          gap: 8px;
          margin-top: 8px;
          overflow: hidden;
          transition: max-height 0.25s ease;
        }
        .section-grid.collapsed { display: none; }
        @media (max-width: 768px) {
          .section-grid { grid-template-columns: repeat(${Math.min(cols, 3)}, 1fr); }
        }
        @media (max-width: 480px) {
          .section-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .tile-toggle {
          position: absolute;
          top: 4px;
          left: 5px;
          width: 22px;
          height: 13px;
          background: rgba(255,255,255,0.12);
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          padding: 1px 2px;
        }
        .tile-toggle::after {
          content: '';
          width: 9px;
          height: 9px;
          background: rgba(255,255,255,0.5);
          border-radius: 50%;
          transition: transform 0.2s, background 0.2s;
        }
        .tile.active .tile-toggle, .tile.high .tile-toggle {
          background: rgba(0,212,184,0.35);
          border-color: rgba(0,212,184,0.6);
        }
        .tile.active .tile-toggle::after, .tile.high .tile-toggle::after {
          transform: translateX(9px);
          background: #00d4b8;
        }
      </style>
      <div class="card">
        <div class="header">
          <span class="header-title">⚡ Smart Loads</span>
          <span class="header-total">${_formatPower(totalWatts)}</span>
        </div>
        ${renderSections()}
        ${items.length > 1 ? `
          <div class="total-row">
            <span class="total-label">Total (${items.length} loads)</span>
            <span class="total-value">${_formatPower(totalWatts)}${totalKwh > 0 ? ' · ' + _formatEnergy(totalKwh) : ''}</span>
          </div>
        ` : ''}
      </div>
    `;

    // Bind section header click -> collapse/expand
    this.shadowRoot.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', () => {
        const id = header.dataset.sectionId;
        if (!id) return;
        if (this._collapsedSections.has(id)) {
          this._collapsedSections.delete(id);
        } else {
          this._collapsedSections.add(id);
        }
        this._rendered = false;
        this._render();
      });
    });

    // Bind tile toggle click -> homeassistant.toggle service
    this.shadowRoot.querySelectorAll('.tile-toggle').forEach(tog => {
      tog.addEventListener('click', (e) => {
        e.stopPropagation();
        const switchEntity = tog.dataset.switch;
        if (!switchEntity || !this._hass) return;
        this._hass.callService('homeassistant', 'toggle', { entity_id: switchEntity })
          .catch(err => console.error('Smart load toggle failed:', err));
      });
    });

    // Bind tile click -> GenergyModal or HA more-info dialog
    const _useModals = window.SigenergyConfig?.get()?.features?.smart_load_modals;
    this.shadowRoot.querySelectorAll('.tile').forEach(tile => {
      tile.addEventListener('click', (e) => {
        // Don't open modal if toggle was clicked
        if (e.target.classList.contains('tile-toggle')) return;
        const entityId = tile.dataset.entity;
        if (!entityId || !this._hass) return;

        if (_useModals && window.GenergyModal) {
          this.dispatchEvent(new CustomEvent('genergy-modal', {
            bubbles: true,
            composed: true,
            detail: {
              type: 'smart_load',
              entityId,
              label: tile.dataset.name || entityId,
              applianceType: tile.dataset.type || 'plug_socket',
              power: tile.dataset.power || '0',
              hass: this._hass,
            }
          }));
        } else {
          this.dispatchEvent(new CustomEvent('hass-more-info', {
            bubbles: true,
            composed: true,
            detail: { entityId }
          }));
        }
      });
    });

    this._rendered = true;
    const _hideInactive = window.SigenergyConfig?.get()?.features?.smart_load_hide_inactive;
    const _stThresh = parseFloat(window.SigenergyConfig?.get()?.features?.smart_load_standby_threshold) || 5;
    this._lastLoadKeys = loads.map(l => l.entity_power + '|' + l.label).join(';') + '|hide=' + !!_hideInactive + '|threshold=' + _stThresh;
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
