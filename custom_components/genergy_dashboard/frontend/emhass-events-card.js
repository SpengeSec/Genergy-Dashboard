// EMHASS Events Card v2.0.5
// Combines Future Decisions (forecast) and Past Events (history) in one card
// Modelled on haeo-events-card structure and style
// Copy to /config/www/emhass-events-card.js
// Add resource: /local/emhass-events-card.js (type: JavaScript module)
//
// Sensor resolution uses a three-tier fallback per sensor:
//   1. Explicit card YAML config (highest priority)
//   2. Sigenergy/annable.me MPC sensor names
//   3. Standard EMHASS sensor names (lowest priority / generic fallback)
//
// Card YAML example with all overrides:
//   type: custom:emhass-events-card
//   grid_options:
//     columns: full
//     rows: auto
//   p_batt_forecast:      sensor.mpc_batt_power
//   p_grid_forecast:      sensor.mpc_grid_power
//   p_pv_forecast:        sensor.mpc_pv_power
//   p_load_forecast:      sensor.mpc_load_power
//   p_inverter:           sensor.mpc_inverter_power
//   soc_forecast:         sensor.mpc_batt_soc
//   buy_price:            sensor.mpc_general_price
//   sell_price:           sensor.mpc_feed_in_price
//   net_cost:             sensor.mpc_cost_fun
//   energy_load:          sensor.your_total_load_energy
//   energy_solar:         sensor.your_total_pv_energy
//   energy_grid_import:   sensor.your_total_imported_energy
//   energy_grid_export:   sensor.your_total_exported_energy
//   energy_batt_charge:   sensor.your_daily_batt_charge_energy
//   energy_batt_discharge: sensor.your_daily_batt_discharge_energy

const _EMHASS_VERSION = 'v2.0.5';

// Currency symbol — set from card config, defaults to '$'
let _EMHASS_CUR = '$';

// ── Tier 2: Sigenergy / annable.me MPC sensor names ─────────────────────────
const _EMHASS_MPC = {
  p_batt_forecast:       'sensor.mpc_batt_power',
  p_grid_forecast:       'sensor.mpc_grid_power',
  p_pv_forecast:         'sensor.mpc_pv_power',
  p_load_forecast:       'sensor.mpc_load_power',
  p_inverter:            'sensor.mpc_inverter_power',
  soc_forecast:          'sensor.mpc_batt_soc',
  buy_price:             'sensor.mpc_general_price',
  sell_price:            'sensor.mpc_feed_in_price',
  net_cost:              'sensor.mpc_cost_fun',
  energy_load:           null,
  energy_solar:          null,
  energy_grid_import:    null,
  energy_grid_export:    null,
  energy_batt_charge:    null,
  energy_batt_discharge: null,
};

// ── Tier 3: Standard EMHASS sensor names ────────────────────────────────────
const _EMHASS_STD = {
  p_batt_forecast:       'sensor.p_batt_forecast',
  p_grid_forecast:       'sensor.p_grid_forecast',
  p_pv_forecast:         'sensor.p_pv_forecast',
  p_load_forecast:       'sensor.p_load_forecast',
  p_inverter:            null,
  soc_forecast:          'sensor.soc_batt_forecast',
  buy_price:             'sensor.unit_load_cost',
  sell_price:            'sensor.unit_prod_price',
  net_cost:              'sensor.total_cost_fun_value',
  energy_load:           null,
  energy_solar:          null,
  energy_grid_import:    null,
  energy_grid_export:    null,
  energy_batt_charge:    null,
  energy_batt_discharge: null,
};

// ── Forecast attribute + value key candidates per sensor role ────────────────
// Each entry tried in order until one returns data. MPC variants listed first.
const _EMHASS_FC_KEYS = {
  p_batt_forecast: [
    { attr: 'battery_scheduled_power', key: 'mpc_batt_power'   },  // MPC / Sigenergy
    { attr: 'battery_scheduled_power', key: 'p_batt_forecast'  },  // std EMHASS
  ],
  p_grid_forecast: [
    { attr: 'forecasts',               key: 'mpc_grid_power'   },  // MPC
    { attr: 'forecasts',               key: 'p_grid_forecast'  },  // std EMHASS
    { attr: 'p_grid_forecast',         key: 'p_grid_forecast'  },  // alt std
  ],
  p_pv_forecast: [
    { attr: 'forecasts',               key: 'mpc_pv_power'     },  // MPC
    { attr: 'forecasts',               key: 'p_pv_forecast'    },  // std EMHASS
  ],
  p_load_forecast: [
    { attr: 'forecasts',               key: 'mpc_load_power'   },  // MPC
    { attr: 'forecasts',               key: 'p_load_forecast'  },  // std EMHASS
  ],
  p_inverter: [
    { attr: 'forecasts',               key: 'mpc_inverter_power' },
  ],
  soc_forecast: [
    { attr: 'battery_scheduled_soc',   key: 'mpc_batt_soc'     },  // MPC
    { attr: 'battery_scheduled_soc',   key: 'soc_batt_forecast'},  // std EMHASS
  ],
  buy_price: [
    { attr: 'unit_load_cost_forecasts', key: 'mpc_general_price'  },  // MPC
    { attr: 'unit_load_cost_forecasts', key: 'unit_load_cost'     },  // std EMHASS
  ],
  sell_price: [
    { attr: 'unit_prod_price_forecasts', key: 'mpc_feed_in_price' },  // MPC (annable.me)
    { attr: 'unit_prod_price_forecasts', key: 'mpc_prod_price'    },  // alt MPC
    { attr: 'unit_prod_price_forecasts', key: 'unit_prod_price'   },  // std EMHASS
  ],
};

// ── Colour scheme ─────────────────────────────────────────────────────────────
const _EMHASS_COLOURS = {
  solar_green: { bg: '#ccffcc', txt: '#333333', cost: '#333333' },
  solar:       { bg: '#ffffcc', txt: '#333333', cost: '#333333' },
  teal:        { bg: '#ccfff5', txt: '#333333', cost: '#333333' },
  pink:        { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },
  red:         { bg: 'rgba(180,50,50,0.35)',  txt: '#ffffff',   cost: '#ffaaaa' },
  green:       { bg: 'rgba(30,150,80,0.55)',  txt: '#ffffff',   cost: '#90ffb0' },
  orange:      { bg: 'rgba(255,165,0,0.35)',  txt: '#333333',   cost: '#cc6600' },
};

// ── Legend ────────────────────────────────────────────────────────────────────
const _EMHASS_LEG_L = [
  ['#ccffcc','#333','🌞 Solar → 🏠 Home',                               'Self Consumption — Solar only'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery',                 'Self Consumption — Charge Battery (Solar)'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + ⚡ Grid',                    'Profit — Grid Export (Solar)'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid',       'Profit — Grid Export + Charge Battery'],
  ['#ccfff5','#333','🌞 Solar + 🔋 Battery → 🏠 Home',                 'Self Consumption — Solar + Battery, No Grid'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home',                    'Cost — Solar + Grid Import'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost — Solar + Grid Import + Charge Battery'],
  ['rgba(30,150,80,0.55)','#fff','🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)','Profit — Forced Export (Solar + Battery)'],
];

const _EMHASS_LEG_R = [
  ['#ccfff5','#333','🔋 Battery → 🏠 Home',                            'Self Consumption — Battery only'],
  ['#ffffcc','#333','🔋 Battery → 🏠 Home + ⚡ Grid (Force)',          'Profit — Forced Export (Battery)'],
  ['#ffe0e0','#333','🔋 Battery + ⚡ Grid → 🏠 Home',                  'Cost — Battery + Grid Import'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home',                  'Cost — Grid Import (Battery Idle, No Solar)'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost — Grid Import (Forced Battery Charge)'],
  ['#ffe0e0','#333','🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home',      'Cost — Solar + Battery + Grid Import'],
  ['rgba(255,165,0,0.35)','#333','🚿 HWS / 🚗 EV / ❄️ HVAC',          'Deferrable load scheduled'],
  ['','','',''],
];

// ── Classify future ───────────────────────────────────────────────────────────
// Sign conventions (verified against live data — SoC trend confirmation):
//   battW: +ve = DISCHARGING (SoC drops), -ve = CHARGING (SoC rises)
//   gridW: -ve = export, +ve = import
//   pvW:   always +ve
// Threshold T=50W (0.05 kW) — matches HAEO classifier granularity
function _emhass_classifyFuture(pvW, loadW, battW, gridW) {
  const T = 50;
  const charging    = battW < -T;   // negative = charging
  const discharging = battW >  T;   // positive = discharging
  const importing   = gridW >  T;
  const exporting   = gridW < -T;
  const hasPV       = pvW   >  T;

  // ── Force export (battery discharging to grid) ──────────────────────────────
  if (exporting && discharging && hasPV)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced export: solar and battery exporting to grid', color: 'green',      mode: 'Command Discharging (PV First)' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)',             note: 'Forced discharge: battery exporting to grid',        color: 'solar',      mode: 'Command Discharging' };

  // ── Forced grid charge ───────────────────────────────────────────────────────
  if (charging && importing && hasPV)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Solar + forced grid charging battery',               color: 'pink',       mode: 'Command Charging (PV First)' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)',             note: 'Forced grid charging — cheap rate window',           color: 'red',        mode: 'Command Charging' };
  if (charging && hasPV)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery',                   note: 'Solar covering home and charging battery — no grid', color: 'solar_green', mode: 'Maximum Self Consumption' };

  // ── Solar scenarios ──────────────────────────────────────────────────────────
  if (hasPV && exporting && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Solar and battery covering home and exporting',      color: 'green',      mode: 'Command Discharging (PV First)' };
  if (hasPV && exporting && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid',         note: 'Solar covering home, charging battery and exporting', color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV && exporting)
    return { label: '🌞 Solar → 🏠 Home + ⚡ Grid',                      note: 'Solar covering home and exporting surplus',          color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home',         note: 'Solar and battery discharging but grid also needed', color: 'pink',       mode: 'Maximum Self Consumption' };
  if (hasPV && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home',                   note: 'Solar and battery together covering home — no grid', color: 'teal',       mode: 'Maximum Self Consumption' };
  if (hasPV && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home',                      note: 'Solar and grid together covering home',              color: 'pink',       mode: 'Maximum Self Consumption' };
  if (hasPV && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery',                   note: 'Solar covering home and charging battery — no grid', color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV)
    return { label: '🌞 Solar → 🏠 Home',                                 note: 'Solar covering home — no battery, no grid',          color: 'solar_green', mode: 'Maximum Self Consumption' };

  // ── No solar ─────────────────────────────────────────────────────────────────
  if (discharging && exporting)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)',             note: 'Forced discharge: battery exporting to grid',        color: 'solar',      mode: 'Command Discharging' };
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Home',                     note: 'Battery discharging but grid supplement needed',     color: 'pink',       mode: 'Maximum Self Consumption' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Home',                               note: 'Battery powering home — no solar, no grid',          color: 'teal',       mode: 'Maximum Self Consumption' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)',             note: 'Forced grid charging — cheap rate window',           color: 'red',        mode: 'Command Charging' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Home',                                   note: 'Grid covering home — battery idle',                  color: 'red',        mode: 'Standby' };
  if (exporting)
    return { label: '⚡ Grid Export',                                       note: 'Grid exporting — source unclear in forecast',        color: 'green',      mode: 'Command Discharging' };
  // Fallback — load present but source unclear in forecast
  if (loadW > T)
    return { label: '⚡ Grid → 🏠 Home',                                   note: 'Load present but power source unclear in forecast',  color: 'red',        mode: 'Standby' };
  return { label: '—', note: '', color: '', mode: '' };
}

// ── Classify past ─────────────────────────────────────────────────────────────
// Same sign convention: battW +ve = discharging, -ve = charging
function _emhass_classifyPast(pvW, loadW, battW, gridW) {
  const T = 50;
  const charging    = battW < -T;
  const discharging = battW >  T;
  const importing   = gridW >  T;
  const exporting   = gridW < -T;
  const hasPV       = pvW   >  T;

  // Force export (battery discharging to grid)
  if (exporting && discharging && hasPV)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', color: 'green' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)',             color: 'solar' };
  // Solar with export
  if (hasPV && exporting && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid',         color: 'solar_green' };
  if (hasPV && exporting)
    return { label: '🌞 Solar → 🏠 Home + ⚡ Grid',                      color: 'solar_green' };
  // Forced grid charge
  if (charging && importing && hasPV)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'pink' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)',             color: 'red' };
  if (charging && hasPV)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery',                   color: 'solar_green' };
  // Solar self-consumption
  if (hasPV && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home',         color: 'pink' };
  if (hasPV && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home',                   color: 'teal' };
  if (hasPV && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home',                      color: 'pink' };
  if (hasPV && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery',                   color: 'solar_green' };
  if (hasPV)
    return { label: '🌞 Solar → 🏠 Home',                                 color: 'solar_green' };
  // No solar
  if (discharging && exporting)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)',             color: 'solar' };
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Home',                     color: 'pink' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Home',                               color: 'teal' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)',             color: 'red' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Home',                                   color: 'red' };
  if (exporting)
    return { label: '⚡ Grid Export',                                       color: 'green' };
  if (loadW > T)
    return { label: '⚡ Grid → 🏠 Home',                                   color: 'red' };
  return { label: '—', color: '' };
}

// ── Formatters ────────────────────────────────────────────────────────────────
function _emhass_fmtP(v) {
  return _EMHASS_CUR + Math.abs(v).toFixed(4);
}

// Clamp values below noise floor to zero for display (20W threshold)
const _EMHASS_NOISE_W = 20;
function _emhass_clamp(w) { return Math.abs(w) < _EMHASS_NOISE_W ? 0 : w; }

// cost > 0 = money spent, cost < 0 = money earned
function _emhass_fmtCost(cost) {
  if (cost > 0.0001)  return { disp: '-' + _EMHASS_CUR + cost.toFixed(3),           col: null };
  if (cost < -0.0001) return { disp: _EMHASS_CUR  + Math.abs(cost).toFixed(3), col: '#4caf50' };
  return { disp: '—', col: null };
}

function _emhass_getAt(arr, ts) {
  if (!arr || !arr.length) return null;
  let lo = 0, hi = arr.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= ts) { best = arr[mid].s; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

function _emhass_getDelta(arr, ts, prevTs, mult) {
  if (!arr || !arr.length) return null;
  const curr = parseFloat(_emhass_getAt(arr, ts));
  const prev = parseFloat(_emhass_getAt(arr, prevTs));
  if (isNaN(curr) || isNaN(prev)) return null;
  const delta = curr - prev;
  return delta < 0 ? 0 : delta * (mult || 1);
}

function _emhass_powerMult(hass, entityId) {
  if (!entityId) return 0.001;
  const u = (hass?.states[entityId]?.attributes?.unit_of_measurement || 'W').trim().toUpperCase();
  if (u === 'W')  return 0.001;
  if (u === 'KW') return 1;
  if (u === 'MW') return 1000;
  return 0.001;
}

function _emhass_energyMult(hass, entityId) {
  if (!entityId) return 1;
  const u = (hass?.states[entityId]?.attributes?.unit_of_measurement || 'kWh').trim().toUpperCase();
  if (u === 'WH')  return 0.001;
  if (u === 'KWH') return 1;
  if (u === 'MWH') return 1000;
  return 1;
}

// ── Legend HTML ───────────────────────────────────────────────────────────────
function _emhass_legTable(items) {
  return '<table style="width:100%;border-collapse:collapse;table-layout:auto;border-spacing:0;">' +
    items.map(([bg, txt, label, desc]) => {
      if (!label) return '<tr><td colspan="2" style="border:none;padding:2px 0;"></td></tr>';
      return '<tr>' +
        '<td style="background-color:' + bg + ';color:' + txt + ';padding:3px 8px;white-space:nowrap;border:none;font-size:11px;">' + label + '</td>' +
        '<td style="padding:3px 8px;color:var(--primary-text-color);border:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;">' + desc + '</td>' +
        '</tr>';
    }).join('') + '</table>';
}

function _emhass_buildLegend() {
  return '<details class="leg" style="font-size:11px;margin-top:12px;">' +
    '<summary style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;font-weight:bold;cursor:pointer;list-style:none;user-select:none;-webkit-user-select:none;">' +
    '<span>📘 Legend <span class="leg-chevron" style="display:inline-block;transition:transform 0.2s ease;font-size:10px;margin-left:2px;">▶</span></span>' +
    '<span style="color:var(--secondary-text-color);font-size:10px;font-weight:normal;">EMHASS Events Card ' + _EMHASS_VERSION + '</span>' +
    '</summary>' +
    '<div style="display:flex;gap:12px;align-items:flex-start;">' +
    '<div style="flex:1;min-width:0;overflow:hidden;">' + _emhass_legTable(_EMHASS_LEG_L) + '</div>' +
    '<div style="flex:1;min-width:0;overflow:hidden;">' + _emhass_legTable(_EMHASS_LEG_R) + '</div>' +
    '</div></details>';
}

// ── Column definitions ────────────────────────────────────────────────────────
const _EMHASS_COLGROUP =
  '<colgroup>' +
  '<col style="width:48px;"><col style="width:22%;"><col style="width:12%;">' +
  '<col style="width:62px;"><col style="width:62px;">' +
  '<col style="width:40px;"><col style="width:44px;"><col style="width:40px;"><col style="width:44px;">' +
  '<col style="width:40px;"><col style="width:44px;"><col style="width:40px;"><col style="width:44px;">' +
  '<col style="width:44px;"><col style="width:62px;">' +
  '</colgroup>';

const _EMHASS_THEAD =
  '<thead><tr>' +
  '<th rowspan="2" style="text-align:left;vertical-align:bottom;">Time</th>' +
  '<th rowspan="2" style="text-align:left;vertical-align:bottom;">Event</th>' +
  '<th rowspan="2" style="text-align:left;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">Mode</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">Buy<br><span class="cur-unit">/kWh</span></th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 1px 0 0 #555;">Sell<br><span class="cur-unit">/kWh</span></th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Load</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">PV</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Grid</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Battery</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">SoC %</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">Cost/<br>Profit</th>' +
  '</tr><tr>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th><th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th><th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th><th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th><th class="bgi" style="text-align:right;">kWh</th>' +
  '</tr></thead>';

// ── CSS ───────────────────────────────────────────────────────────────────────
const _EMHASS_STYLE = [
  ':host { display: block; width: 100%; }',
  'ha-card { width: 100%; box-sizing: border-box; }',
  '.card { padding: 8px 12px; font-family: var(--primary-font-family, sans-serif); font-size: 12px; width: 100%; box-sizing: border-box; }',
  '.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--divider-color,#444); margin-bottom: 10px; align-items: stretch; }',
  '.tab { padding: 6px 18px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--secondary-text-color); border-bottom: 3px solid transparent; margin-bottom: -2px; }',
  '.tab.active { color: #2196F3; border-bottom-color: #2196F3; background: rgba(33,150,243,0.07); }',
  '.sbar { display: flex; gap: 14px; align-items: center; padding: 4px 0 8px 0; font-size: 12px; flex-wrap: wrap; width: 100%; border-bottom: 2px solid #888; margin-bottom: 0; }',
  '.pill { padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 11px; color: #fff; }',
  '.stxt { color: var(--secondary-text-color); font-size: 11px; }',
  '.wrap { overflow: auto; width: 100%; }',
  '.pane { display: none; }',
  '.pane.active { display: block; }',
  '.dt { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 700px; table-layout: fixed; }',
  '.dt thead { position: sticky; top: 0; z-index: 2; }',
  '.dt th, .dt td { padding: 3px 4px; border-bottom: 1px solid var(--divider-color,#444); font-size: 11px; line-height: 1.3; white-space: nowrap; text-align: right; overflow: hidden; text-overflow: ellipsis; }',
  '.dt th:nth-child(1) { text-align: left; box-shadow: inset -1px 0 0 #555; }',
  '.dt td:nth-child(1) { text-align: left !important; box-shadow: inset -1px 0 0 #555; font-size: 11px; }',
  '.dt td:nth-child(2) { text-align: left; white-space: normal; box-shadow: inset -1px 0 0 #555; font-size: 11px; }',
  '.dt th:nth-child(2) { white-space: normal; box-shadow: inset -1px 0 0 #555; }',
  '.dt td:nth-child(3) { text-align: left; white-space: normal; box-shadow: inset -1px 0 0 #555; font-size:10px; color: var(--secondary-text-color); }',
  '.dt th:nth-child(3) { text-align: left; white-space: normal; box-shadow: inset -1px 0 0 #555; }',
  '.cur-unit { font-size: 9px; font-weight: normal; opacity: 0.7; }',
  '.dt thead { background-color: var(--primary-background-color,#1c1c1c); }',
  '.dt thead th { background-color: var(--primary-background-color,#1c1c1c); font-weight: bold; color: var(--primary-text-color); border-bottom: 1px solid #666; }',
  '.dt thead tr:last-child th { border-bottom: 2px solid #888; }',
  '.bgl { box-shadow: inset 2px 0 0 #666; }',
  '.bgi { box-shadow: inset 1px 0 0 #555; }',
  '.dr td { background: var(--secondary-background-color); font-weight: bold; border-top: 2px solid var(--divider-color); text-align: left !important; padding: 5px 6px; }',
  '.dr td.bgi, .dr td.bgl { text-align: right !important; }',
  '.msg { padding: 20px; text-align: center; color: var(--secondary-text-color); }',
  '.err { padding: 10px; color: #f44336; }',
  '.leg summary::-webkit-details-marker { display: none; }',
  '.leg[open] .leg-chevron { transform: rotate(90deg); }',
].join('\n');

// ── HTML template ─────────────────────────────────────────────────────────────
function _emhass_buildHTML() {
  return '<style>' + _EMHASS_STYLE + '</style>' +
    '<ha-card><div class="card">' +
    '<div class="tabs">' +
    '<div class="tab active" id="tab-future">📅 Future Decisions</div>' +
    '<div class="tab" id="tab-past">📋 Past Events</div>' +
    '<span id="range-past-wrap" style="display:none;margin-left:auto;align-self:center;padding-right:4px;">' +
    '<select id="range-past" style="font-size:11px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;padding:2px 6px;cursor:pointer;">' +
    '<option value="today">Today</option><option value="yesterday">Yesterday</option>' +
    '<option value="24">Last 24h</option><option value="48">Last 48h</option>' +
    '<option value="72">Last 72h</option><option value="96">Last 96h</option>' +
    '<option value="168">Last 7 days</option>' +
    '</select></span></div>' +
    '<div class="pane active" id="pane-future">' +
    '<div class="sbar" id="sbar-future">⏳ Loading...</div>' +
    '<div class="wrap"><table class="dt">' + _EMHASS_COLGROUP + _EMHASS_THEAD +
    '<tbody id="tb-future"><tr><td colspan="15" class="msg">⏳ Loading...</td></tr></tbody>' +
    '</table></div></div>' +
    '<div class="pane" id="pane-past">' +
    '<div class="sbar"><strong style="color:var(--primary-text-color);">Past Events</strong>' +
    '<span class="stxt" id="st-past">Select a range to load</span></div>' +
    '<div class="wrap"><table class="dt">' + _EMHASS_COLGROUP + _EMHASS_THEAD +
    '<tbody id="tb-past"><tr><td colspan="15" class="msg">⏳ Select range to load...</td></tr></tbody>' +
    '</table></div></div>' +
    _emhass_buildLegend() +
    '</div></ha-card>';
}

// ── Custom Element ────────────────────────────────────────────────────────────
class EmhassEventsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass         = null;
    this._config       = {};
    this._activeTab    = 'future';
    this._lastFcTs     = null;
    this._lastRenderTs = 0;
    this._pastState    = 'idle';
    this._pastLoadTs   = 0;
  }

  // Three-tier entity ID resolution: card YAML → MPC → std EMHASS
  _eid(key) {
    return this._config[key] || _EMHASS_MPC[key] || _EMHASS_STD[key] || null;
  }

  // Build epoch-ms Map from a forecast attribute, trying each candidate {attr,key} until data found
  _buildFcMap(entityId, candidates, mult) {
    if (!entityId || !this._hass) return new Map();
    const state = this._hass.states[entityId];
    if (!state) return new Map();

    for (const { attr, key } of (candidates || [])) {
      const fc = state.attributes?.[attr];
      if (!Array.isArray(fc) || !fc.length) continue;

      // Try to build the map — don't bail on key check, just skip rows where key is missing
      const m = new Map();
      for (const row of fc) {
        if (!row || row.date == null) continue;
        const rawVal = row[key];
        if (rawVal === undefined) continue;  // this candidate key doesn't exist in this row
        const ts = new Date(row.date).getTime();
        if (!isNaN(ts)) {
          const val = parseFloat(rawVal);
          m.set(ts, (isNaN(val) ? 0 : val) * (mult || 1));
        }
      }
      if (m.size > 0) return m;

      // Key not found in this attr — try to auto-detect the value key from the first row
      if (fc.length > 0) {
        const firstRow = fc[0];
        const autoKey = Object.keys(firstRow).find(k => k !== 'date' && k !== 'datetime');
        if (autoKey) {
          const m2 = new Map();
          for (const row of fc) {
            if (!row || row.date == null) continue;
            const ts = new Date(row.date).getTime();
            if (!isNaN(ts)) {
              const val = parseFloat(row[autoKey]);
              m2.set(ts, (isNaN(val) ? 0 : val) * (mult || 1));
            }
          }
          if (m2.size > 0) return m2;
        }
      }
    }
    return new Map();
  }

  // Diagnostic: return a string describing what was found for each sensor (for status bar debug)
  _fcDiag() {
    const keys = ['p_batt_forecast','p_grid_forecast','p_pv_forecast','p_load_forecast','soc_forecast','buy_price','sell_price'];
    return keys.map(k => {
      const eid = this._eid(k);
      if (!eid) return k + ':no-eid';
      const state = this._hass?.states[eid];
      if (!state) return k + ':no-state';
      // Find which attr has data
      for (const { attr, key } of (_EMHASS_FC_KEYS[k] || [])) {
        const fc = state.attributes?.[attr];
        if (Array.isArray(fc) && fc.length) {
          const firstRow = fc[0];
          const hasKey = firstRow[key] !== undefined;
          const autoKey = Object.keys(firstRow).find(kk => kk !== 'date' && kk !== 'datetime');
          return k + ':' + attr + '/' + (hasKey ? key : 'AUTO:' + autoKey) + '(' + fc.length + ')';
        }
      }
      return k + ':no-attr';
    }).join(' | ');
  }

  // Get primary forecast array (battery) — needed to drive the row loop
  // Auto-detects any array attribute with 'date' fields if known attrs fail
  _getPrimaryFc() {
    const eid = this._eid('p_batt_forecast');
    if (!eid) return null;
    const state = this._hass?.states[eid];
    if (!state) return null;
    for (const { attr } of _EMHASS_FC_KEYS.p_batt_forecast) {
      const fc = state.attributes?.[attr];
      if (Array.isArray(fc) && fc.length && fc[0].date) return fc;
    }
    // Auto-detect: any array attribute whose rows have a 'date' field
    for (const [, val] of Object.entries(state.attributes || {})) {
      if (Array.isArray(val) && val.length > 0 && val[0] && val[0].date) return val;
    }
    return null;
  }

  setConfig(config) {
    this._config = config || {};
    _EMHASS_CUR = this._config.currency_symbol || '$';
    if (!this.shadowRoot.getElementById('tb-future')) {
      this._lastFcTs = null;
      this._pastState = 'idle';
      this._pastLoadTs = 0;
      this.shadowRoot.innerHTML = _emhass_buildHTML();
      this._wireEvents();
      requestAnimationFrame(() => this._setWrapHeight());
      if (!this._ro) {
        this._ro = new ResizeObserver(() => this._setWrapHeight());
        this._ro.observe(document.documentElement);
      }
      this._scheduleRefresh();
      if (!this._visHandler) {
        this._visHandler = () => {
          if (document.visibilityState === 'visible' && this._hass) {
            if ((Date.now() - this._lastRenderTs) / 60000 > 1) this._doRefresh();
          }
        };
        document.addEventListener('visibilitychange', this._visHandler);
      }
    }
  }

  _msUntilNextBoundary() {
    const now     = new Date();
    const secInHr = now.getMinutes() * 60 + now.getSeconds();
    const targets = [1,6,11,16,21,26,31,36,41,46,51,56];
    const minNow  = now.getMinutes() + now.getSeconds() / 60;
    let nextMin   = targets.find(t => t > minNow);
    if (nextMin === undefined) nextMin = targets[0] + 60;
    return Math.max(1000, (nextMin * 60 - secInHr) * 1000 - now.getMilliseconds());
  }

  _scheduleRefresh() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(() => {
      if (document.visibilityState !== 'hidden' && this._hass) this._doRefresh();
      this._scheduleRefresh();
    }, this._msUntilNextBoundary());
  }

  _doRefresh() {
    this._lastFcTs = null;
    this._renderFuture();
    if (this._activeTab === 'past' && this._pastState === 'ready') {
      this._pastState = 'loading';
      this._loadPast();
    }
    this._lastRenderTs = Date.now();
  }

  _setWrapHeight() {
    const wraps = this.shadowRoot.querySelectorAll('.wrap');
    wraps.forEach(w => {
      const top = w.getBoundingClientRect().top;
      if (top < 10) return;
      const leg  = this.shadowRoot.querySelector('.leg');
      const legH = leg ? leg.getBoundingClientRect().height + 12 : 0;
      /* Walk up DOM (crossing shadow boundaries) to find nearest overflow:hidden
         container (e.g. modal). Use its max-height (not actual height) to avoid
         circular sizing when the container shrinks to fit content. */
      let avail = window.innerHeight - top - legH - 12;
      let el = this;
      for (let i = 0; i < 30 && el; i++) {
        const p = el.parentElement || (el.getRootNode && el.getRootNode() !== document ? el.getRootNode().host : null);
        if (!p) break;
        try {
          const cs = getComputedStyle(p);
          if (cs.overflow === 'hidden' || cs.overflowY === 'hidden') {
            const r = p.getBoundingClientRect();
            const mh = parseFloat(cs.maxHeight);
            const cH = (!isNaN(mh) && mh > 0) ? mh : r.height;
            avail = cH - (top - r.top) - legH - 12;
            break;
          }
        } catch(e) {}
        el = p;
      }
      w.style.height = Math.max(120, avail) + 'px';
    });
    /* Chrome doesn't support position:sticky on <thead>.
       Apply it to each <th> with computed top for multi-row headers. */
    const thead = this.shadowRoot.querySelector('.dt thead');
    if (thead) {
      const rows = thead.querySelectorAll('tr');
      if (rows[0]) {
        const h0 = rows[0].getBoundingClientRect().height;
        rows[0].querySelectorAll('th').forEach(th => { th.style.position = 'sticky'; th.style.top = '0px'; th.style.zIndex = '3'; });
        if (rows[1]) rows[1].querySelectorAll('th').forEach(th => { th.style.position = 'sticky'; th.style.top = h0 + 'px'; th.style.zIndex = '2'; });
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot.getElementById('tb-future')) {
      this.shadowRoot.innerHTML = _emhass_buildHTML();
      this._wireEvents();
    }
    const battState = hass.states[this._eid('p_batt_forecast')];
    const fcTs = battState?.last_changed;
    if (fcTs !== this._lastFcTs) {
      this._lastFcTs = fcTs;
      this._renderFuture();
    }
    if (this._pastState === 'loading' && this._pastLoadTs && Date.now() - this._pastLoadTs > 30000) {
      this._pastState = 'idle';
    }
    if (this._pastState === 'idle') {
      this._pastState = 'loading';
      this._loadPast();
    }
  }

  _switchTab(tab) {
    this._activeTab = tab;
    const sr = this.shadowRoot;
    ['future','past'].forEach(t => {
      sr.getElementById('tab-'  + t).classList.toggle('active', t === tab);
      sr.getElementById('pane-' + t).classList.toggle('active', t === tab);
    });
    const wrap = sr.getElementById('range-past-wrap');
    if (wrap) wrap.style.display = tab === 'past' ? 'inline-flex' : 'none';
    requestAnimationFrame(() => this._setWrapHeight());
  }

  _wireEvents() {
    const tf = this.shadowRoot.getElementById('tab-future');
    const tp = this.shadowRoot.getElementById('tab-past');
    if (tf && !tf._wired) { tf._wired = true; tf.addEventListener('click', () => this._switchTab('future')); }
    if (tp && !tp._wired) { tp._wired = true; tp.addEventListener('click', () => this._switchTab('past')); }
    const sel = this.shadowRoot.getElementById('range-past');
    if (sel && !sel._wired) {
      sel._wired = true;
      sel.addEventListener('change', () => {
        this._pastState = 'loading';
        const tb = this.shadowRoot.getElementById('tb-past');
        if (tb) tb.innerHTML = '<tr><td colspan="15" class="msg">⏳ Fetching history...</td></tr>';
        this._loadPast();
      });
    }
  }

  // ── Future tab ──────────────────────────────────────────────────────────────
  _renderFuture() {
    this._lastRenderTs = Date.now();
    const sbar  = this.shadowRoot.getElementById('sbar-future');
    const tbody = this.shadowRoot.getElementById('tb-future');
    if (!sbar || !tbody) return;

    const primaryFc = this._getPrimaryFc();
    if (!primaryFc || !primaryFc.length) {
      tbody.innerHTML = '<tr><td colspan="15" class="err">⚠️ No forecast data found on ' +
        (this._eid('p_batt_forecast') || 'sensor.mpc_batt_power / sensor.p_batt_forecast') + '</td></tr>';
      return;
    }

    const battMap  = this._buildFcMap(this._eid('p_batt_forecast'), _EMHASS_FC_KEYS.p_batt_forecast, 1);
    const gridMap  = this._buildFcMap(this._eid('p_grid_forecast'), _EMHASS_FC_KEYS.p_grid_forecast, 1);
    const pvMap    = this._buildFcMap(this._eid('p_pv_forecast'),   _EMHASS_FC_KEYS.p_pv_forecast,   1);
    const loadMap  = this._buildFcMap(this._eid('p_load_forecast'), _EMHASS_FC_KEYS.p_load_forecast, 1);
    const socMap   = this._buildFcMap(this._eid('soc_forecast'),    _EMHASS_FC_KEYS.soc_forecast,    1);
    const buyMap   = this._buildFcMap(this._eid('buy_price'),       _EMHASS_FC_KEYS.buy_price,       1);
    const sellMap  = this._buildFcMap(this._eid('sell_price'),      _EMHASS_FC_KEYS.sell_price,      1);

    const nearestGet = (map, ts) => {
      if (map.has(ts)) return map.get(ts);
      let best = null, bestDiff = Infinity;
      for (const [k, v] of map) { const d = Math.abs(k - ts); if (d < bestDiff) { bestDiff = d; best = v; } }
      return best ?? 0;
    };

    const fcTimestamps = primaryFc.map(r => new Date(r.date).getTime()).filter(t => !isNaN(t)).sort((a,b) => a-b);
    const stepHFor = (ts) => {
      const idx = fcTimestamps.indexOf(ts);
      return (idx >= 0 && idx < fcTimestamps.length - 1) ? (fcTimestamps[idx+1] - ts) / 3600000 : 5/60;
    };

    const nowTs    = Date.now();
    const todayStr = new Date().toLocaleDateString('en-CA');

    // Status bar values
    const nowSoc     = parseFloat(this._hass?.states[this._eid('soc_forecast')]?.state) || null;
    const nowBuy     = parseFloat(this._hass?.states[this._eid('buy_price')]?.state)     || null;
    const nowSell    = parseFloat(this._hass?.states[this._eid('sell_price')]?.state)    || null;
    const netCostRaw = parseFloat(this._hass?.states[this._eid('net_cost')]?.state)      || null;

    // Morning / Peak SoC detection
    let dawnSoc = null, dawnTime = '', dawnLabel = '';
    const chargingNow = primaryFc.some(r => {
      const ts = new Date(r.date).getTime();
      return Math.abs(ts - nowTs) < 900000 && (pvMap.get(ts)||0) > 150 && (battMap.get(ts)||0) > 150;
    });
    if (chargingNow) {
      let pkSoc = 0, pkTime = '';
      for (const row of primaryFc) {
        const ts = new Date(row.date).getTime();
        if (isNaN(ts) || ts < nowTs) continue;
        const soc = socMap.get(ts) || 0;
        if ((pvMap.get(ts)||0) > 150 && (battMap.get(ts)||0) > 150 && soc > pkSoc) {
          pkSoc = soc;
          pkTime = new Date(ts).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:true}).replace(' 0',' ');
        }
      }
      if (pkSoc > 0) { dawnSoc = pkSoc; dawnTime = pkTime; dawnLabel = '🔋 Peak SoC'; }
    } else {
      for (const row of primaryFc) {
        if (dawnSoc !== null) break;
        const ts = new Date(row.date).getTime();
        if (isNaN(ts) || ts <= nowTs) continue;
        if ((pvMap.get(ts)||0) > 150 && (battMap.get(ts)||0) > 150) {
          dawnSoc  = socMap.get(ts) || 0;
          dawnTime = new Date(ts).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:true}).replace(' 0',' ');
          dawnLabel = '🌅 Morning SoC';
        }
      }
    }

    let gridImportTime = '', gridExportTime = '';
    for (const row of primaryFc) {
      const ts = new Date(row.date).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const gW = gridMap.get(ts) || 0;
      if (!gridImportTime && gW >  150) gridImportTime = new Date(ts).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false});
      if (!gridExportTime && gW < -150) gridExportTime = new Date(ts).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false});
    }

    const socColor  = nowSoc    != null ? (nowSoc  <= 20 ? '#f44336' : nowSoc  >= 75 ? '#4caf50' : 'var(--primary-text-color)') : '';
    const dawnColor = dawnSoc   != null ? (dawnSoc <= 20 ? '#f44336' : dawnSoc <= 35 ? '#ff9800' : '#4caf50') : '';
    const netColor  = netCostRaw != null ? (netCostRaw >= 0 ? '#4caf50' : '#f44336') : '';

    sbar.innerHTML =
      (nowSoc      != null ? '<span>🔋 SoC: <strong style="color:' + socColor  + ';">' + nowSoc.toFixed(1)  + '%</strong></span>' : '') +
      (dawnSoc     != null ? '<span>' + dawnLabel + ' (' + dawnTime + '): <strong style="color:' + dawnColor + ';">' + dawnSoc.toFixed(1) + '%</strong></span>' : '') +
      (nowBuy      != null ? '<span>💸 Buy: <strong>' + _EMHASS_CUR + nowBuy.toFixed(4)  + '/kWh</strong></span>' : '') +
      (nowSell     != null ? '<span>💰 Sell: <strong>' + _EMHASS_CUR + nowSell.toFixed(4) + '/kWh</strong></span>' : '') +
      (netCostRaw  != null ? '<span>📊 Net: <strong style="color:' + netColor + ';">' + (netCostRaw >= 0 ? '+' : '') + _EMHASS_CUR + netCostRaw.toFixed(2) + '</strong></span>' : '') +
      (gridImportTime ? '<span class="pill" style="background:#e65100;">⚠️ Grid import from ' + gridImportTime + '</span>' : '') +
      (gridExportTime ? '<span style="color:#4caf50;">📤 Grid export from ' + gridExportTime + '</span>' : '') +
      '<span style="margin-left:auto;"></span>' +
      '<details style="width:100%;margin-top:4px;font-size:10px;color:var(--secondary-text-color);"><summary style="cursor:pointer;">🔍 Sensor debug</summary><pre style="white-space:pre-wrap;font-size:9px;">' + this._fcDiag() + '</pre></details>';

    // Pre-pass: daily cost + kWh totals
    const dailyCosts = {}, dailyKwh = {};
    for (const row of primaryFc) {
      const ts = new Date(row.date).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const day   = new Date(ts).toLocaleDateString('en-CA');
      const battW = battMap.get(ts) || 0;
      const gridW = gridMap.get(ts) || 0;
      const loadW = loadMap.get(ts) || 0;
      const pvW   = pvMap.get(ts)   || 0;
      const buyP  = nearestGet(buyMap, ts);
      const sellP = nearestGet(sellMap, ts);
      const stepH = stepHFor(ts);
      const gridKw = gridW / 1000;
      const cost = gridW > 50 ? gridKw * buyP * stepH : gridW < -50 ? -(Math.abs(gridKw) * sellP * stepH) : 0;
      dailyCosts[day] = (dailyCosts[day] || 0) + cost;
      const dk = dailyKwh[day] || { load:0, pv:0, grid:0, batt:0 };
      dk.load += (loadW/1000) * stepH;
      dk.pv   += (pvW/1000)   * stepH;
      dk.grid += gridKw       * stepH;
      dk.batt += (battW/1000) * stepH;
      dailyKwh[day] = dk;
    }

    // Render rows
    const rows = [];
    let lastDay = '';

    for (const row of primaryFc) {
      const ts = new Date(row.date).getTime();
      if (isNaN(ts) || ts < nowTs) continue;

      const day     = new Date(ts).toLocaleDateString('en-CA');
      const timeStr = new Date(ts).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false});

      if (day !== lastDay) {
        lastDay = day;
        const dayTotal   = dailyCosts[day] || 0;
        const dk         = dailyKwh[day]  || { load:0, pv:0, grid:0, batt:0 };
        // dayTotal < 0 = profit earned (exports > imports), dayTotal > 0 = net cost
        const dayColor   = dayTotal <= 0 ? '#4caf50' : '#f44336';
        const dayLabel   = day === todayStr ? '📅 Today' : '📅 ' + new Date(ts).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
        const dayCostLbl = dayTotal <= 0 ? _EMHASS_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _EMHASS_CUR + dayTotal.toFixed(2);
        const fmtKd = (v) => Math.abs(v) > 0.001 ? (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) : '—';
        const fmtG  = (v) => { if (Math.abs(v) <= 0.001) return '—'; const col = v > 0 ? '#f44336' : '#4caf50'; return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>'; };
        const fmtB  = (v) => { if (Math.abs(v) <= 0.001) return '—'; const col = v > 0 ? '#4caf50' : '#f44336'; return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>'; };
        rows.push('<tr class="dr"><td colspan="2">' + dayLabel + '</td><td class="bgl" colspan="3"></td>' +
          '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk.load) + '</td>' +
          '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk.pv)   + '</td>' +
          '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtG(dk.grid)  + '</td>' +
          '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtB(-dk.batt) + '</td>' +  // negate: raw +ve=discharge → display -ve
          '<td class="bgl"></td><td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLbl + '</td></tr>');
      }

      const battW  = _emhass_clamp(battMap.get(ts) || 0);
      const gridW  = _emhass_clamp(gridMap.get(ts) || 0);
      const loadW  = _emhass_clamp(loadMap.get(ts) || 0);
      const pvW    = _emhass_clamp(pvMap.get(ts)   || 0);
      const soc    = socMap.get(ts)  || 0;
      const buyP   = nearestGet(buyMap,  ts);
      const sellP  = nearestGet(sellMap, ts);

      const cls  = _emhass_classifyFuture(pvW, loadW, battW, gridW);
      const c    = _EMHASS_COLOURS[cls.color] || { bg:'transparent', txt:'var(--primary-text-color)', cost:'var(--primary-text-color)' };

      const gridCol = gridW > 50 ? '#f44336' : gridW < -50 ? '#4caf50' : c.txt;
      // Display battery negated: raw +ve=discharge → display -ve (red); raw -ve=charge → display +ve (green)
      const battDisp = -battW;  // negated for display
      const battCol = battW > 50 ? '#f44336' : battW < -50 ? '#4caf50' : c.txt;
      const socCol  = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;

      const stepH   = stepHFor(ts);
      const gridKw  = gridW / 1000;
      const cost    = gridW > 50 ? gridKw * buyP * stepH : gridW < -50 ? -(Math.abs(gridKw) * sellP * stepH) : 0;
      const costFmt = _emhass_fmtCost(cost);
      const costCol = costFmt.col || (cost > 0.0001 ? c.cost : c.txt);

      const fmtKwh  = (w) => Math.abs(w/1000*stepH) > 0.001 ? (w/1000*stepH).toFixed(3) : '—';
      const fmtKwhC = (w, col) => { const k = w/1000*stepH; return Math.abs(k) > 0.001 ? '<span style="color:' + col + ';">' + k.toFixed(3) + '</span>' : '—'; };

      rows.push('<tr style="background-color:' + c.bg + ';color:' + c.txt + ';">' +
        '<td>' + timeStr + '</td>' +
        '<td><span title="' + cls.note + '">' + cls.label + '</span></td>' +
        '<td class="bgl">' + (cls.mode || '') + '</td>' +
        '<td class="bgl">' + _emhass_fmtP(buyP)  + '</td>' +
        '<td class="bgi">' + _emhass_fmtP(sellP) + '</td>' +
        '<td class="bgl">' + (loadW/1000).toFixed(2) + '</td>' +
        '<td class="bgi">' + fmtKwh(loadW) + '</td>' +
        '<td class="bgl">' + (pvW/1000).toFixed(2) + '</td>' +
        '<td class="bgi">' + fmtKwh(pvW) + '</td>' +
        '<td class="bgl"><span style="color:' + gridCol + ';">' + (gridW/1000).toFixed(2) + '</span></td>' +
        '<td class="bgi">' + fmtKwhC(gridW, gridCol) + '</td>' +
        '<td class="bgl"><span style="color:' + battCol + ';">' + (battDisp/1000).toFixed(2) + '</span></td>' +
        '<td class="bgi"><span style="color:' + battCol + ';">' + fmtKwh(battDisp) + '</span></td>' +
        '<td class="bgl"><span style="color:' + socCol + ';">' + soc.toFixed(1) + '</span></td>' +
        '<td class="bgl"><span style="color:' + costCol + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
        '</tr>');
    }

    tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="15" class="msg">No future forecast rows available.</td></tr>';
    requestAnimationFrame(() => this._setWrapHeight());
  }

  // ── Past tab ──────────────────────────────────────────────────────────────
  _getRangeP() {
    const sel = this.shadowRoot.getElementById('range-past');
    const val = sel ? sel.value : 'today';
    const now = new Date();
    let start, end;
    if (val === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); end = now;
    } else if (val === 'yesterday') {
      end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      start = new Date(end - 86400000);
    } else {
      end = now; start = new Date(end - parseInt(val) * 3600000);
    }
    return { start, end };
  }

  async _loadPast() {
    const st = this.shadowRoot.getElementById('st-past');
    const tb = this.shadowRoot.getElementById('tb-past');
    if (!st || !tb) {
      this._pastState = 'idle';
      return;
    }
    this._pastLoadTs = Date.now();
    try {
      const { start, end } = this._getRangeP();
      st.textContent = 'Fetching...';

      const powerIds = [
        this._eid('p_batt_forecast'), this._eid('p_grid_forecast'),
        this._eid('p_pv_forecast'),   this._eid('p_load_forecast'),
        this._eid('soc_forecast'),    this._eid('buy_price'), this._eid('sell_price'),
      ].filter(Boolean);

      const energyIds = [
        this._eid('energy_load'),   this._eid('energy_solar'),
        this._eid('energy_grid_import'), this._eid('energy_grid_export'),
        this._eid('energy_batt_charge'), this._eid('energy_batt_discharge'),
      ].filter(Boolean);

      const result = await this._hass.callWS({
        type: 'history/history_during_period',
        start_time: start.toISOString(), end_time: end.toISOString(),
        entity_ids: [...new Set([...powerIds, ...energyIds])],
        minimal_response: true, no_attributes: true,
      });

      const lookup = {};
      for (const [eid, states] of Object.entries(result)) {
        lookup[eid] = states.map(s => ({ t: (s.lu !== undefined ? s.lu : s.lc) * 1000, s: s.s })).sort((a,b) => a.t - b.t);
      }

      this._pwrMult = {
        p_batt: _emhass_powerMult(this._hass, this._eid('p_batt_forecast')),
        p_grid: _emhass_powerMult(this._hass, this._eid('p_grid_forecast')),
        p_pv:   _emhass_powerMult(this._hass, this._eid('p_pv_forecast')),
        p_load: _emhass_powerMult(this._hass, this._eid('p_load_forecast')),
      };
      this._engMult = {
        energy_load:           _emhass_energyMult(this._hass, this._eid('energy_load')),
        energy_solar:          _emhass_energyMult(this._hass, this._eid('energy_solar')),
        energy_grid_import:    _emhass_energyMult(this._hass, this._eid('energy_grid_import')),
        energy_grid_export:    _emhass_energyMult(this._hass, this._eid('energy_grid_export')),
        energy_batt_charge:    _emhass_energyMult(this._hass, this._eid('energy_batt_charge')),
        energy_batt_discharge: _emhass_energyMult(this._hass, this._eid('energy_batt_discharge')),
      };

      const battEid = this._eid('p_batt_forecast');
      const gridEid = this._eid('p_grid_forecast');
      const pvEid   = this._eid('p_pv_forecast');
      const loadEid = this._eid('p_load_forecast');
      const socEid  = this._eid('soc_forecast');
      const buyEid  = this._eid('buy_price');
      const sellEid = this._eid('sell_price');

      if (!lookup[loadEid]?.length && !lookup[pvEid]?.length) {
        const sel = this.shadowRoot.getElementById('range-past');
        if (sel && sel.value === 'today') {
          st.textContent = 'No data yet — switching to Last 24h...';
          sel.value = '24'; this._pastState = 'loading';
          setTimeout(() => this._loadPast(), 500); return;
        }
        tb.innerHTML = '<tr><td colspan="15" class="msg">⚠️ No sensor data for this period.</td></tr>';
        st.textContent = 'No data'; this._pastState = 'ready'; this._pastLoadTs = 0; return;
      }

      const step    = 5 * 60 * 1000;
      const startMs = Math.ceil(start.getTime() / step) * step;
      const entries = [];
      for (let t = startMs; t <= end.getTime(); t += step) entries.push(t);
      entries.reverse();

      // Pass 1: daily totals
      const pastDailyCosts = {}, pastDailyKwh = {};
      for (const ts of entries) {
        const dayStr = new Date(ts).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
        const battW = _emhass_clamp((parseFloat(_emhass_getAt(lookup[battEid], ts))||0) * this._pwrMult.p_batt);
        const gridW = _emhass_clamp((parseFloat(_emhass_getAt(lookup[gridEid], ts))||0) * this._pwrMult.p_grid);
        const loadW = _emhass_clamp((parseFloat(_emhass_getAt(lookup[loadEid], ts))||0) * this._pwrMult.p_load);
        const pvW   = _emhass_clamp((parseFloat(_emhass_getAt(lookup[pvEid],   ts))||0) * this._pwrMult.p_pv);
        const buyP  = parseFloat(_emhass_getAt(lookup[buyEid],  ts)) || 0;
        const sellP = parseFloat(_emhass_getAt(lookup[sellEid], ts)) || 0;
        const stepH = 5/60, gridKw = gridW/1000;
        const cost = gridW > 50 ? gridKw*buyP*stepH : gridW < -50 ? -(Math.abs(gridKw)*sellP*stepH) : 0;
        pastDailyCosts[dayStr] = (pastDailyCosts[dayStr]||0) + cost;
        const dk = pastDailyKwh[dayStr] || { load:0, pv:0, grid:0, batt:0 };
        dk.load += (loadW/1000)*stepH; dk.pv += (pvW/1000)*stepH; dk.grid += gridKw*stepH; dk.batt += (battW/1000)*stepH;
        pastDailyKwh[dayStr] = dk;
      }

      // Pass 2: render rows
      const rows = [];
      let lastDay = '';
      for (const ts of entries) {
        const dt     = new Date(ts);
        const dayStr = dt.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
        const timeStr= dt.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false});

        if (dayStr !== lastDay) {
          lastDay = dayStr;
          const dayTotal   = pastDailyCosts[dayStr] || 0;
          const pk         = pastDailyKwh[dayStr]   || { load:0, pv:0, grid:0, batt:0 };
          // dayTotal < 0 = profit earned, dayTotal > 0 = net cost
          const dayColor   = dayTotal <= 0 ? '#4caf50' : '#f44336';
          const dayCostLbl = dayTotal <= 0 ? _EMHASS_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _EMHASS_CUR + dayTotal.toFixed(2);
          const fmtKd = (v) => Math.abs(v) > 0.001 ? (v<0?'-':'') + Math.abs(v).toFixed(2) : '—';
          const fmtG  = (v) => { if (Math.abs(v)<=0.001) return '—'; const col=v>0?'#f44336':'#4caf50'; return '<span style="color:'+col+';">'+(v<0?'-':'')+Math.abs(v).toFixed(2)+'</span>'; };
          const fmtB  = (v) => { if (Math.abs(v)<=0.001) return '—'; const col=v>0?'#4caf50':'#f44336'; return '<span style="color:'+col+';">'+(v<0?'-':'')+Math.abs(v).toFixed(2)+'</span>'; };
          rows.push('<tr class="dr"><td colspan="2">' + dayStr + '</td><td class="bgl" colspan="3"></td>' +
            '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(pk.load) + '</td>' +
            '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(pk.pv)   + '</td>' +
            '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtG(pk.grid)  + '</td>' +
            '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtB(-pk.batt) + '</td>' +  // negate: raw +ve=discharge → display -ve
            '<td class="bgl"></td><td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLbl + '</td></tr>');
        }

        const battW = _emhass_clamp((parseFloat(_emhass_getAt(lookup[battEid], ts))||0) * this._pwrMult.p_batt);
        const gridW = _emhass_clamp((parseFloat(_emhass_getAt(lookup[gridEid], ts))||0) * this._pwrMult.p_grid);
        const loadW = _emhass_clamp((parseFloat(_emhass_getAt(lookup[loadEid], ts))||0) * this._pwrMult.p_load);
        const pvW   = _emhass_clamp((parseFloat(_emhass_getAt(lookup[pvEid],   ts))||0) * this._pwrMult.p_pv);
        const soc   = parseFloat(_emhass_getAt(lookup[socEid],  ts)) || 0;
        const buyP  = parseFloat(_emhass_getAt(lookup[buyEid],  ts)) || 0;
        const sellP = parseFloat(_emhass_getAt(lookup[sellEid], ts)) || 0;

        if (soc===0 && Math.abs(battW)<10 && Math.abs(gridW)<10 && loadW<10 && pvW<10) continue;

        const cls = _emhass_classifyPast(pvW, loadW, battW, gridW);
        const c   = _EMHASS_COLOURS[cls.color] || { bg:'transparent', txt:'var(--primary-text-color)', cost:'var(--primary-text-color)' };

        const gridCol = gridW > 50 ? '#f44336' : gridW < -50 ? '#4caf50' : c.txt;
        // Display battery negated: raw +ve=discharge → display -ve (red); raw -ve=charge → display +ve (green)
        const battDisp = -battW;
        const battCol = battW > 50 ? '#f44336' : battW < -50 ? '#4caf50' : c.txt;
        const socCol  = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;

        const stepH = 5/60, gridKw = gridW/1000;
        const cost  = gridW > 50 ? gridKw*buyP*stepH : gridW < -50 ? -(Math.abs(gridKw)*sellP*stepH) : 0;
        const costFmt = _emhass_fmtCost(cost);
        const costCol = costFmt.col || (cost > 0.0001 ? c.cost : c.txt);

        const prevTs = ts - step;
        const eLoad  = _emhass_getDelta(lookup[this._eid('energy_load')],           ts, prevTs, this._engMult.energy_load);
        const eSolar = _emhass_getDelta(lookup[this._eid('energy_solar')],          ts, prevTs, this._engMult.energy_solar);
        const eGImp  = _emhass_getDelta(lookup[this._eid('energy_grid_import')],    ts, prevTs, this._engMult.energy_grid_import);
        const eGExp  = _emhass_getDelta(lookup[this._eid('energy_grid_export')],    ts, prevTs, this._engMult.energy_grid_export);
        const eBattC = _emhass_getDelta(lookup[this._eid('energy_batt_charge')],    ts, prevTs, this._engMult.energy_batt_charge);
        const eBattD = _emhass_getDelta(lookup[this._eid('energy_batt_discharge')], ts, prevTs, this._engMult.energy_batt_discharge);
        const eGrid  = gridW < -50 ? (eGExp !== null ? -eGExp : null) : gridW > 50 ? eGImp : null;
        const eBatt  = battW < -50 ? (eBattD !== null ? -eBattD : null) : battW > 50 ? eBattC : null;
        const fmtE   = (v) => v !== null && Math.abs(v) > 0.005 ? v.toFixed(3) : '—';

        rows.push('<tr style="background-color:' + c.bg + ';color:' + c.txt + ';">' +
          '<td>' + timeStr + '</td><td>' + cls.label + '</td>' +
          '<td class="bgl"></td>' +
          '<td class="bgl">' + _emhass_fmtP(buyP)  + '</td>' +
          '<td class="bgi">' + _emhass_fmtP(sellP) + '</td>' +
          '<td class="bgl">' + (loadW/1000).toFixed(2) + '</td><td class="bgi">' + fmtE(eLoad)  + '</td>' +
          '<td class="bgl">' + (pvW/1000).toFixed(2)   + '</td><td class="bgi">' + fmtE(eSolar) + '</td>' +
          '<td class="bgl"><span style="color:' + gridCol + ';">' + (gridW/1000).toFixed(2) + '</span></td>' +
          '<td class="bgi"><span style="color:' + gridCol + ';">' + fmtE(eGrid)  + '</span></td>' +
          '<td class="bgl"><span style="color:' + battCol + ';">' + (battDisp/1000).toFixed(2) + '</span></td>' +
          '<td class="bgi"><span style="color:' + battCol + ';">' + fmtE(eBatt !== null ? -eBatt : null) + '</span></td>' +
          '<td class="bgl"><span style="color:' + socCol  + ';">' + soc.toFixed(1) + '</span></td>' +
          '<td class="bgl"><span style="color:' + costCol + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
          '</tr>');
      }

      tb.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="15" class="msg">⚠️ No readings for this period.</td></tr>';
      requestAnimationFrame(() => this._setWrapHeight());
      const sel2 = this.shadowRoot.getElementById('range-past');
      st.textContent = entries.length + ' readings — ' + (sel2 ? sel2.options[sel2.selectedIndex].text : '');
      this._pastState = 'ready';
      this._pastLoadTs = 0;

    } catch (e) {
      const tb2 = this.shadowRoot.getElementById('tb-past');
      if (tb2) tb2.innerHTML = '<tr><td colspan="15" class="err">⚠️ ' + e.message + '</td></tr>';
      const st2 = this.shadowRoot.getElementById('st-past');
      if (st2) st2.textContent = 'Error — ' + e.message.slice(0, 60);
      this._pastState = 'ready';
      this._pastLoadTs = 0;
    }
  }

  getCardSize() { return 12; }
}

if (!customElements.get('emhass-events-card')) {
  customElements.define('emhass-events-card', EmhassEventsCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'emhass-events-card')) {
  window.customCards.push({
    type:        'emhass-events-card',
    name:        'EMHASS Events Card',
    description: 'EMHASS optimizer future forecast and past events — supports MPC (Sigenergy/annable.me) and standard EMHASS sensor names with three-tier fallback',
  });
}
