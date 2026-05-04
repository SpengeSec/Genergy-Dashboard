// HAEO Events Card
// Combines Future Decisions (forecast) and Past Events (history) in one card
// Requires: sensor.grid_net_cost + associated HAEO sensors
// Copy to /config/www/haeo-events-card.js
// Add resource: /local/haeo-events-card.js (type: JavaScript module)
//
// Card YAML config options (all optional — Sigenergy Local Modbus defaults used if omitted):
//   type: custom:haeo-events-card
//   grid_options:
//     columns: full
//
// ── Power sensors (HAEO optimizer provides these — no config needed for standard installs) ──
// Units are auto-detected from unit_of_measurement and normalised to kW internally.
//   entity_battery:    sensor.battery_active_power       # +ve=discharge, -ve=charge
//   entity_grid:       sensor.grid_active_power          # +ve=export, -ve=import (forecast convention)
//   entity_load:       sensor.load_power
//   entity_solar:      sensor.solar_power
//   entity_soc:        sensor.battery_state_of_charge
//   entity_buy_price:  number.grid_import_price
//   entity_sell_price: number.grid_export_price
//   entity_grid_net_cost: sensor.grid_net_cost
//
// ── Energy sensors (inverter integration — Sigenergy Local Modbus defaults below) ──
// Units are auto-detected from unit_of_measurement and normalised to kWh internally.
// IMPORTANT: Use lifetime/total sensors wherever possible. Daily or monthly sensors
// reset at midnight/month-end causing gaps (shown as —) across multi-day lookbacks.
// The battery sensors below reset daily — lifetime variants are preferred if available.
//   entity_energy_load:           sensor.sigen_plant_total_load_consumption    # Lifetime total
//   entity_energy_solar:          sensor.sigen_plant_total_pv_generation        # Lifetime total
//   entity_energy_grid_import:    sensor.sigen_plant_total_imported_energy      # Lifetime total
//   entity_energy_grid_export:    sensor.sigen_plant_total_exported_energy      # Lifetime total
//   entity_energy_batt_charge:    sensor.sigen_plant_daily_battery_charge_energy    # Daily reset — gaps at midnight
//   entity_energy_batt_discharge: sensor.sigen_plant_daily_battery_discharge_energy # Daily reset — gaps at midnight

const _HAEO_VERSION = 'v2.1.5';

// Currency symbol — set from card config, defaults to '$'
let _HAEO_CUR = '$';

// ── Default sensor entity IDs ────────────────────────────────────────────────
// Power sensors: provided by HAEO optimizer — same for all installs
// Energy sensors: provided by inverter integration — Sigenergy Local Modbus defaults
const _HAEO_DEFAULTS = {
  // HAEO optimizer sensors (forecast attributes used for Future tab)
  grid_net_cost:    'sensor.grid_net_cost',
  battery:          'sensor.battery_active_power',   // +ve=discharge, -ve=charge
  grid:             'sensor.grid_active_power',       // +ve=export, -ve=import (forecast convention)
  load:             'sensor.load_power',
  solar:            'sensor.solar_power',
  soc:              'sensor.battery_state_of_charge',
  buy_price:        'number.grid_import_price',
  sell_price:       'number.grid_export_price',
  // Sigenergy Local Modbus energy sensors (total_increasing, used for kWh delta columns)
  // Lifetime sensors preferred — daily/monthly sensors cause gaps at reset boundaries
  energy_load:           'sensor.sigen_plant_total_load_consumption',        // Lifetime total
  energy_solar:          'sensor.sigen_plant_total_pv_generation',            // Lifetime total
  energy_grid_import:    'sensor.sigen_plant_total_imported_energy',          // Lifetime total
  energy_grid_export:    'sensor.sigen_plant_total_exported_energy',          // Lifetime total
  energy_batt_charge:    'sensor.sigen_plant_daily_battery_charge_energy',    // Daily reset — gaps at midnight
  energy_batt_discharge: 'sensor.sigen_plant_daily_battery_discharge_energy', // Daily reset — gaps at midnight
};

// ── Colour scheme ─────────────────────────────────────────────────────────────
const _HAEO_COLOURS = {
  solar_green: { bg: '#ccffcc', txt: '#333333', cost: '#333333' },
  solar:       { bg: '#ffffcc', txt: '#333333', cost: '#333333' },
  teal:        { bg: '#ccfff5', txt: '#333333', cost: '#333333' },
  pink:        { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },
  red:         { bg: 'rgba(180,50,50,0.35)', txt: '#ffffff', cost: '#ffaaaa' },
  green:       { bg: 'rgba(30,150,80,0.55)',  txt: '#ffffff', cost: '#90ffb0' },
};

// ── Legend ────────────────────────────────────────────────────────────────────
const _HAEO_LEG_L = [
  ['#ccffcc','#333','🌞 Solar → 🏠 Home','Self Consumption - Solar'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery','Self Consumption - Charge Battery'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + ⚡ Grid','Profit - Grid Export (Solar)'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid','Profit - Grid Export + Charge Battery'],
  ['#ccfff5','#333','🌞 Solar + 🔋 Battery → 🏠 Home','Self Consumption - No Grid'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home','Cost - Solar + Grid Import'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost - Solar + Grid Import + Charge Battery'],
  ['#ffe0e0','#333','🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)','Profit - Grid Export (Forced)'],
];

const _HAEO_LEG_R = [
  ['#ccfff5','#333','🔋 Battery → 🏠 Home','Self Consumption - Battery'],
  ['#ffffcc','#333','🔋 Battery → 🏠 Home + ⚡ Grid (Force)','Profit - Grid Export (Forced)'],
  ['#ffe0e0','#333','🔋 Battery + ⚡ Grid → 🏠 Home','Cost - Battery + Grid Import'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home','Cost - Grid Import (Battery Idle | No Solar)'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost - Grid Import (Forced Battery Charge)'],
  ['#ffe0e0','#333','🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home','Cost - Solar + Battery + Grid Import'],
  ['#ccfff5','#333','🚗 EV Charger','Placeholder - EV Charger'],
  ['#ccfff5','#333','❄️ 🚿 Scheduled Load(s)','Placeholder - HVAC, HWS - Surplus Solar'],
];

// ── Classify future ───────────────────────────────────────────────────────────
// battKw: positive = discharge, negative = charge
// gridKw: positive = export,    negative = import
function _haeo_classifyFuture(solarKw, loadKw, battKw, gridKw) {
  const T = 0.05;
  const charging    = battKw < -T;
  const discharging = battKw > T;
  const exporting   = gridKw > T;
  const importing   = gridKw < -T;

  // ── Force export (battery discharging to grid) ──
  if (exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced export: solar and battery exporting to grid', color: 'green' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced discharge: battery exporting to grid', color: 'solar' };

  // ── Forced grid charge ──
  if (charging && importing && solarKw > T)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Solar + forced grid charging battery', color: 'pink' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Forced grid charging — cheap rate window', color: 'red' };
  if (charging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', note: 'Solar covering home and charging battery — no grid', color: 'solar_green' };

  // ── Solar scenarios ──
  if (solarKw > T && exporting && battKw > T)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Solar and battery covering home and exporting', color: 'green' };
  if (solarKw > T && exporting && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid', note: 'Solar covering home, charging battery and exporting', color: 'solar_green' };
  if (solarKw > T && exporting)
    return { label: '🌞 Solar → 🏠 Home + ⚡ Grid', note: 'Solar covering home and exporting surplus', color: 'solar_green' };
  if (solarKw > T && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home', note: 'Solar and battery discharging but grid also needed', color: 'pink' };
  if (solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home', note: 'Solar and battery together covering home — no grid', color: 'teal' };
  if (solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home', note: 'Solar and grid together covering home', color: 'pink' };
  if (solarKw > T && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', note: 'Solar covering home and charging battery — no grid', color: 'solar_green' };
  if (solarKw > T)
    return { label: '🌞 Solar → 🏠 Home', note: 'Solar covering home — no battery, no grid', color: 'solar_green' };

  // ── No solar ──
  if (discharging && exporting)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced discharge: battery exporting to grid', color: 'solar' };
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Home', note: 'Battery discharging but grid supplement needed', color: 'pink' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Home', note: 'Battery powering home — no solar, no grid', color: 'teal' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Forced grid charging — cheap rate window', color: 'red' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Home', note: 'Grid covering home — battery idle', color: 'red' };
  // Fallback: load present but source not explicit in forecast
  if (loadKw > T)
    return { label: '🔋 Battery → 🏠 Home', note: 'Inferred: battery powering home — no explicit source in forecast', color: 'teal' };
  return { label: '—', note: '', color: '' };
}

// ── Classify past ─────────────────────────────────────────────────────────────
function _haeo_classifyPast(solarKw, loadKw, battKw, gridKw) {
  const T = 0.10;
  const charging    = battKw < -T;
  const discharging = battKw > T;
  const exporting   = gridKw > T;
  const importing   = gridKw < -T;

  // Force export (battery discharging to grid)
  if (exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', color: 'green' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', color: 'solar' };
  // Solar with export
  if (solarKw > T && exporting && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid', color: 'solar_green' };
  if (solarKw > T && exporting)
    return { label: '🌞 Solar → 🏠 Home + ⚡ Grid', color: 'solar_green' };
  // Forced grid charge
  if (charging && importing && solarKw > T)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'pink' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'red' };
  if (charging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', color: 'solar_green' };
  // Solar self-consumption
  if (solarKw > T && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home', color: 'teal' };
  if (solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (solarKw > T)
    return { label: '🌞 Solar → 🏠 Home', color: 'solar_green' };
  // No solar
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Home', color: 'teal' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'red' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Home', color: 'red' };
  if (loadKw > T)
    return { label: '⚡ Grid → 🏠 Home', color: 'red' };
  return { label: '—', color: '' };
}

// ── Formatters ────────────────────────────────────────────────────────────────
function _haeo_fmtP(v) {
  return (v < 0 ? '-' : '') + _HAEO_CUR + Math.abs(v).toFixed(4);
}

// Returns {disp, col} — cost > 0 = money spent (import), cost < 0 = money earned (export)
function _haeo_fmtCost(cost) {
  if (cost > 0.0001)  return { disp: '-' + _HAEO_CUR + cost.toFixed(3),           col: null };
  if (cost < -0.0001) return { disp: _HAEO_CUR  + Math.abs(cost).toFixed(3), col: '#4caf50' };
  return { disp: '—', col: null };
}

// Binary search: most recent state value at or before timestamp ts
function _haeo_getAt(arr, ts) {
  if (!arr || !arr.length) return null;
  let lo = 0, hi = arr.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= ts) { best = arr[mid].s; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

// Energy delta between two consecutive slots from a total_increasing sensor.
// mult normalises the result to kWh (auto-detected from unit_of_measurement).
// Returns null if no data; 0 if reset detected (delta < 0 — daily/monthly sensor reset).
// Note: daily-reset sensors (e.g. battery charge/discharge) produce a 0 delta at midnight
// rather than a gap, which shows as — in the table. Lifetime sensors are preferred to
// avoid this — see config comments at top of file.
function _haeo_getDelta(arr, ts, prevTs, mult) {
  if (!arr || !arr.length) return null;
  const curr = parseFloat(_haeo_getAt(arr, ts));
  const prev = parseFloat(_haeo_getAt(arr, prevTs));
  if (isNaN(curr) || isNaN(prev)) return null;
  const delta = curr - prev;
  return delta < 0 ? 0 : delta * (mult || 1);
}

// ── Unit normalisation ───────────────────────────────────────────────────────
// Read unit_of_measurement from hass state and return a multiplier so all
// values are normalised to kW (power) or kWh (energy) internally.
// Power:  W→÷1000, kW→×1, MW→×1000
// Energy: Wh→÷1000, kWh→×1, MWh→×1000, GWh→×1000000
function _haeo_powerMult(hass, entityId) {
  // Normalise to uppercase and trim whitespace before comparing
  const u = (hass?.states[entityId]?.attributes?.unit_of_measurement || 'kW').trim().toUpperCase();
  if (u === 'W')   return 0.001;
  if (u === 'KW')  return 1;
  if (u === 'MW')  return 1000;
  return 1; // default kW for unknown/missing unit
}

function _haeo_energyMult(hass, entityId) {
  const u = (hass?.states[entityId]?.attributes?.unit_of_measurement || 'kWh').trim().toUpperCase();
  if (u === 'WH')  return 0.001;
  if (u === 'KWH') return 1;
  if (u === 'MWH') return 1000;
  if (u === 'GWH') return 1000000;
  return 1; // default kWh for unknown/missing unit
}

// ── Legend HTML ───────────────────────────────────────────────────────────────
function _haeo_legTable(items) {
  const rows = items.map(([bg, txt, label, desc]) => {
    if (!label) return '<tr><td colspan="2" style="border:none;padding:2px 0;"></td></tr>';
    return '<tr>' +
      '<td style="background-color:' + bg + ';color:' + txt + ';padding:3px 8px;white-space:nowrap;border:none;font-size:11px;">' + label + '</td>' +
      '<td style="padding:3px 8px;color:var(--primary-text-color);border:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;">' + desc + '</td>' +
      '</tr>';
  }).join('');
  return '<table style="width:100%;border-collapse:collapse;table-layout:auto;border-spacing:0;">' + rows + '</table>';
}

function _haeo_buildLegend() {
  return '<details class="leg" style="font-size:11px;margin-top:12px;">' +
    '<summary style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;font-weight:bold;cursor:pointer;list-style:none;user-select:none;-webkit-user-select:none;">' +
    '<span>📘 Legend <span class="leg-chevron" style="display:inline-block;transition:transform 0.2s ease;font-size:10px;margin-left:2px;">▶</span></span>' +
    '<span style="color:var(--secondary-text-color);font-size:10px;font-weight:normal;">' + _HAEO_VERSION + '</span>' +
    '</summary>' +
    '<div style="display:flex;gap:12px;align-items:flex-start;">' +
    '<div style="flex:1;min-width:0;overflow:hidden;">' + _haeo_legTable(_HAEO_LEG_L) + '</div>' +
    '<div style="flex:1;min-width:0;overflow:hidden;">' + _haeo_legTable(_HAEO_LEG_R) + '</div>' +
    '</div></details>';
}

// ── Shared column definitions ─────────────────────────────────────────────────
// Time(52) | Event(40%) | Buy(68) | Sell(68) | Load kW(44) kWh(46) | PV kW(44) kWh(46) | Grid kW(44) kWh(46) | Batt kW(44) kWh(46) | SoC(46) | Cost(68)
const _HAEO_COLGROUP =
  '<colgroup>' +
  '<col style="width:48px;"><col style="width:30%;"><col style="width:62px;"><col style="width:62px;">' +
  '<col style="width:40px;"><col style="width:44px;"><col style="width:40px;"><col style="width:44px;">' +
  '<col style="width:40px;"><col style="width:44px;"><col style="width:40px;"><col style="width:44px;">' +
  '<col style="width:44px;"><col style="width:62px;">' +
  '</colgroup>';

const _HAEO_THEAD =
  '<thead>' +
  '<tr>' +
  '<th rowspan="2" style="text-align:left;vertical-align:bottom;">Time</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;">Event</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">Buy<br><span class="cur-unit">/kWh</span></th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 1px 0 0 #555;">Sell<br><span class="cur-unit">/kWh</span></th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Load</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">PV</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Grid</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Battery</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">SoC %</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">Cost/<br>Profit</th>' +
  '</tr>' +
  '<tr>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '</tr>' +
  '</thead>';

// ── CSS ───────────────────────────────────────────────────────────────────────
const _HAEO_STYLE = [
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
function _haeo_buildHTML() {
  return '<style>' + _HAEO_STYLE + '</style>' +
    '<ha-card><div class="card">' +

    '<div class="tabs">' +
    '<div class="tab active" id="tab-future">📅 Future Decisions</div>' +
    '<div class="tab" id="tab-past">📋 Past Events</div>' +
    '<span id="range-past-wrap" style="display:none;margin-left:auto;align-self:center;padding-right:4px;">' +
    '<select id="range-past" style="font-size:11px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;padding:2px 6px;cursor:pointer;">' +
    '<option value="today">Today</option>' +
    '<option value="yesterday">Yesterday</option>' +
    '<option value="24">Last 24h</option>' +
    '<option value="48">Last 48h</option>' +
    '<option value="72">Last 72h</option>' +
    '<option value="96">Last 96h</option>' +
    '<option value="168">Last 7 days</option>' +
    '</select></span>' +
    '</div>' +

    '<div class="pane active" id="pane-future">' +
    '<div class="sbar" id="sbar-future">⏳ Loading...</div>' +
    '<div class="wrap"><table class="dt">' + _HAEO_COLGROUP + _HAEO_THEAD +
    '<tbody id="tb-future"><tr><td colspan="14" class="msg">⏳ Loading...</td></tr></tbody>' +
    '</table></div>' +
    '</div>' +

    '<div class="pane" id="pane-past">' +
    '<div class="sbar">' +
    '<strong style="color:var(--primary-text-color);">Past Events</strong>' +
    '<span class="stxt" id="st-past">Select a range to load</span>' +
    '</div>' +
    '<div class="wrap"><table class="dt">' + _HAEO_COLGROUP + _HAEO_THEAD +
    '<tbody id="tb-past"><tr><td colspan="14" class="msg">⏳ Select range to load...</td></tr></tbody>' +
    '</table></div>' +
    '</div>' +

    _haeo_buildLegend() +
    '</div></ha-card>';
}

// ── Custom Element ────────────────────────────────────────────────────────────
class HaeoEventsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass         = null;
    this._config       = {};
    this._activeTab    = 'future';
    this._lastCostTs   = null;
    this._lastRenderTs = 0;
    this._pastState    = 'idle';
    this._pastLoadTs   = 0;
  }

  // Resolve a sensor entity ID: config override → default
  _eid(key) {
    return this._config['entity_' + key] || _HAEO_DEFAULTS[key];
  }

  setConfig(config) {
    this._config = config || {};
    _HAEO_CUR = this._config.currency_symbol || '$';
    if (!this.shadowRoot.getElementById('tb-future')) {
      this._lastCostTs = null;
      this._pastState = 'idle';
      this._pastLoadTs = 0;
      this.shadowRoot.innerHTML = _haeo_buildHTML();
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
            const staleMins = (Date.now() - this._lastRenderTs) / 60000;
            if (staleMins > 1) this._doRefresh();
          }
        };
        document.addEventListener('visibilitychange', this._visHandler);
      }
    }
  }

  // Smart refresh: fires at :01, :06, :11 ... past the hour (1 min after each 5-min HA boundary)
  _msUntilNextBoundary() {
    const now      = new Date();
    const secInHr  = now.getMinutes() * 60 + now.getSeconds();
    const targets  = [1,6,11,16,21,26,31,36,41,46,51,56];
    const minNow   = now.getMinutes() + now.getSeconds() / 60;
    let nextMin    = targets.find(t => t > minNow);
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
    this._lastCostTs = null;
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
      this.shadowRoot.innerHTML = _haeo_buildHTML();
      this._wireEvents();
    }
    // Watch battery sensor for forecast updates — it has the richest data
    const costState = hass.states[this._eid('battery')];
    const costTs    = costState?.last_changed;
    if (costTs !== this._lastCostTs) {
      this._lastCostTs = costTs;
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
    ['future', 'past'].forEach(t => {
      sr.getElementById('tab-'  + t).classList.toggle('active', t === tab);
      sr.getElementById('pane-' + t).classList.toggle('active', t === tab);
    });
    const wrap = sr.getElementById('range-past-wrap');
    if (wrap) wrap.style.display = tab === 'past' ? 'inline-flex' : 'none';
    requestAnimationFrame(() => this._setWrapHeight());
  }

  _wireEvents() {
    const tabFuture = this.shadowRoot.getElementById('tab-future');
    const tabPast   = this.shadowRoot.getElementById('tab-past');
    if (tabFuture && !tabFuture._wired) {
      tabFuture._wired = true;
      tabFuture.addEventListener('click', () => this._switchTab('future'));
    }
    if (tabPast && !tabPast._wired) {
      tabPast._wired = true;
      tabPast.addEventListener('click', () => this._switchTab('past'));
    }
    const sel = this.shadowRoot.getElementById('range-past');
    if (sel && !sel._wired) {
      sel._wired = true;
      sel.addEventListener('change', () => {
        this._pastState = 'loading';
        const tb = this.shadowRoot.getElementById('tb-past');
        if (tb) tb.innerHTML = '<tr><td colspan="14" class="msg">⏳ Fetching history...</td></tr>';
        this._loadPast();
      });
    }
  }

  // ── Future tab render ───────────────────────────────────────────────────────
  _renderFuture() {
    this._lastRenderTs = Date.now();
    const sbar  = this.shadowRoot.getElementById('sbar-future');
    const tbody = this.shadowRoot.getElementById('tb-future');
    if (!sbar || !tbody) return;

    // Build UTC-epoch-ms → value Map from a sensor's {time, value} forecast attribute.
    // Keying by epoch ms is timezone-safe regardless of UTC offset in time strings.
    // mult: unit multiplier to normalise to kW — auto-detected from unit_of_measurement.
    const buildMap = (entityId, mult) => {
      const fc = this._hass?.states[entityId]?.attributes?.forecast;
      if (!Array.isArray(fc)) return new Map();
      const m = new Map();
      for (const row of fc) {
        if (!row || row.time == null) continue;
        const ts = new Date(row.time).getTime();
        if (!isNaN(ts)) m.set(ts, (row.value != null ? parseFloat(row.value) || 0 : 0) * mult);
      }
      return m;
    };

    // Primary axis: battery_active_power — has the richest power forecast data.
    // Other sensors (prices, cost) have different step sizes so we use nearest-timestamp
    // lookup for those rather than exact epoch-ms matching.
    const battState = this._hass?.states[this._eid('battery')];
    if (!battState) {
      tbody.innerHTML = '<tr><td colspan="14" class="err">⚠️ ' + this._eid('battery') + ' not found</td></tr>';
      return;
    }
    const primaryFc = battState.attributes?.forecast;
    if (!Array.isArray(primaryFc) || !primaryFc.length) {
      tbody.innerHTML = '<tr><td colspan="14" class="err">⚠️ No forecast data on ' + this._eid('battery') + '</td></tr>';
      return;
    }

    // Also need grid_net_cost for cost tracking — use its own forecast array
    const costFc = this._hass?.states[this._eid('grid_net_cost')]?.attributes?.forecast || [];

    // Auto-detect unit_of_measurement for each power sensor and normalise to kW
    // Forecast attribute values are always in kW/% / $/kWh regardless of live sensor unit
    // — do NOT apply powerMult here, that is only for history sensor reads.
    // Grid forecast: HAEO uses negative=export, positive=import — negate to match
    // our display convention (positive=export, negative=import).
    const battMap  = buildMap(this._eid('battery'),        1);
    const gridMap  = buildMap(this._eid('grid'),          -1); // negate: HAEO negative=export → positive=export
    const loadMap  = buildMap(this._eid('load'),           1);
    const solarMap = buildMap(this._eid('solar'),          1);
    const socMap   = buildMap(this._eid('soc'),            1);
    const buyMap   = buildMap(this._eid('buy_price'),      1);
    const sellMap  = buildMap(this._eid('sell_price'),     1);
    const costMap  = buildMap(this._eid('grid_net_cost'),  1);

    // Nearest-timestamp lookup: for sensors with coarser step sizes (prices, cost)
    // find the Map entry whose key is closest to the target timestamp.
    const nearestGet = (map, ts) => {
      if (map.has(ts)) return map.get(ts);
      let best = null, bestDiff = Infinity;
      for (const [k, v] of map) {
        const d = Math.abs(k - ts);
        if (d < bestDiff) { bestDiff = d; best = v; }
      }
      return best ?? 0;
    };

    // Pre-build sorted timestamp array for step-size calculation
    const fcTimestamps = primaryFc
      .map(r => new Date(r.time).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    // stepH(ts): hours between this timestamp and the next forecast row
    const stepHFor = (ts) => {
      const idx = fcTimestamps.indexOf(ts);
      if (idx >= 0 && idx < fcTimestamps.length - 1)
        return (fcTimestamps[idx + 1] - ts) / 3600000;
      return 1; // fallback 1h for last row
    };

    const nowTs    = Date.now();
    const todayStr = new Date().toLocaleDateString('en-CA');

    // ── Status bar ──
    const nowSoc  = parseFloat(this._hass?.states[this._eid('soc')]?.state)       || null;
    const nowBuy  = parseFloat(this._hass?.states[this._eid('buy_price')]?.state)  || null;
    const nowSell = parseFloat(this._hass?.states[this._eid('sell_price')]?.state) || null;

    // Morning SoC / Peak SoC — same logic as EM card
    let closestDiff = Infinity, chargingNow = false;
    for (const row of primaryFc) {
      const ts   = new Date(row.time).getTime();
      const diff = Math.abs(ts - nowTs);
      if (diff < closestDiff) {
        closestDiff = diff;
        chargingNow = (solarMap.get(ts) || 0) > 0.5 && (battMap.get(ts) || 0) < -0.1;
      }
    }
    let dawnSoc = null, dawnTime = '', dawnLabel = '';
    if (chargingNow) {
      let pkSoc = 0, pkTime = '';
      for (const row of primaryFc) {
        const ts = new Date(row.time).getTime();
        if (isNaN(ts) || ts < nowTs) continue;
        const soc = socMap.get(ts) || 0;
        if ((solarMap.get(ts) || 0) > 0.5 && (battMap.get(ts) || 0) < -0.01 && soc > pkSoc) {
          pkSoc  = soc;
          pkTime = new Date(ts).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(' 0', ' ');
        }
      }
      if (pkSoc > 0) { dawnSoc = pkSoc; dawnTime = pkTime; dawnLabel = '🔋 Peak SoC'; }
    } else {
      for (const row of primaryFc) {
        if (dawnSoc !== null) break;
        const ts = new Date(row.time).getTime();
        if (isNaN(ts) || ts <= nowTs) continue;
        if ((solarMap.get(ts) || 0) > 0.5 && (battMap.get(ts) || 0) < -0.1) {
          dawnSoc   = socMap.get(ts) || 0;
          dawnTime  = new Date(ts).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(' 0', ' ');
          dawnLabel = '🌅 Morning SoC';
        }
      }
    }

    let gridImportTime = '', gridExportTime = '';
    for (const row of primaryFc) {
      const ts = new Date(row.time).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const gridKw = gridMap.get(ts) || 0;
      if (!gridImportTime && gridKw < -0.05)
        gridImportTime = new Date(ts).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
      if (!gridExportTime && gridKw > 0.05)
        gridExportTime = new Date(ts).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    const socColor  = nowSoc  != null ? (nowSoc  <= 20 ? '#f44336' : nowSoc  >= 75 ? '#4caf50' : 'var(--primary-text-color)') : '';
    const dawnColor = dawnSoc != null ? (dawnSoc <= 20 ? '#f44336' : dawnSoc <= 35 ? '#ff9800' : '#4caf50') : '';

    sbar.innerHTML =
      (nowSoc   != null ? '<span>🔋 SoC now: <strong style="color:' + socColor  + ';">' + nowSoc.toFixed(1)  + '%</strong></span>' : '') +
      (dawnSoc  != null ? '<span>' + dawnLabel + ' (' + dawnTime + '): <strong style="color:' + dawnColor + ';">' + dawnSoc.toFixed(1) + '%</strong></span>' : '') +
      (nowBuy   != null ? '<span>💸 Buy: <strong>' + _HAEO_CUR + nowBuy.toFixed(4)  + '/kWh</strong></span>' : '') +
      (nowSell  != null ? '<span>💰 Sell: <strong>' + _HAEO_CUR + nowSell.toFixed(4) + '/kWh</strong></span>' : '') +
      (gridImportTime ? '<span class="pill" style="background:#e65100;">⚠️ Grid import from ' + gridImportTime + '</span>' : '') +
      (gridExportTime ? '<span style="color:#4caf50;">📤 Grid export from ' + gridExportTime + '</span>' : '') +
      '<span style="margin-left:auto;"></span>';

    // ── Pre-pass: daily cost and kWh totals ──
    const dailyCosts = {};
    const dailyKwh   = {};
    for (const row of primaryFc) {
      const ts = new Date(row.time).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const day     = new Date(ts).toLocaleDateString('en-CA');
      const battKw  = battMap.get(ts)  || 0;
      const gridKw  = gridMap.get(ts)  || 0;
      // Only count grid_net_cost when grid is actually active this slot
      const rawCost0 = nearestGet(costMap, ts);
      const cost     = Math.abs(gridKw) > 0.05 ? rawCost0 : 0;
      const loadKw  = loadMap.get(ts)  || 0;
      const solarKw = solarMap.get(ts) || 0;
      // Step size in hours — inferred from gap to next forecast timestamp
      const stepH   = stepHFor(ts);
      dailyCosts[day] = (dailyCosts[day] || 0) + cost;
      const dk = dailyKwh[day] || { load:0, pv:0, grid:0, batt:0 };
      dk.load += loadKw  * stepH;
      dk.pv   += solarKw * stepH;
      dk.grid += gridKw  * stepH;  // +ve=export, -ve=import
      dk.batt += battKw  * stepH;  // +ve=discharge, -ve=charge
      dailyKwh[day] = dk;
    }

    // ── Table rows ──
    const rows = [];
    let lastDay = '';

    for (const row of primaryFc) {
      const ts = new Date(row.time).getTime();
      if (isNaN(ts) || ts < nowTs) continue;

      const day     = new Date(ts).toLocaleDateString('en-CA');
      const timeStr = new Date(ts).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });

      if (day !== lastDay) {
        lastDay = day;
        const dayTotal = dailyCosts[day] || 0;
        const dk       = dailyKwh[day]  || { load:0, pv:0, grid:0, batt:0 };
        const dayColor = dayTotal <= 0 ? '#4caf50' : '#f44336';
        const dayLabel = day === todayStr ? '📅 Today' : '📅 ' + new Date(ts).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
        // cost from grid_net_cost: positive = money spent (import), negative = money earned
        const dayCostLabel = dayTotal <= 0 ? _HAEO_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _HAEO_CUR + dayTotal.toFixed(2);
        const fmtKd = (v) => Math.abs(v) > 0.001 ? (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) : '—';
        // Grid: negative=export(green), positive=import(red)
        const fmtKdCol = (v) => {
          if (Math.abs(v) <= 0.001) return '—';
          const col = v < 0 ? '#4caf50' : '#f44336';
          return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>';
        };
        // Battery: negative=discharge(red), positive=charge(green) — inverted from grid
        const fmtKdColBatt = (v) => {
          if (Math.abs(v) <= 0.001) return '—';
          const col = v < 0 ? '#f44336' : '#4caf50';
          return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>';
        };
        rows.push('<tr class="dr">' +
          '<td colspan="2">' + dayLabel + '</td>' +
          '<td class="bgl" colspan="2"></td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;">' + fmtKd(dk.load) + '</td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;">' + fmtKd(dk.pv) + '</td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;">' + fmtKdCol(-dk.grid) + '</td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;">' + fmtKdColBatt(-dk.batt) + '</td>' +
          '<td class="bgl"></td>' +
          '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLabel + '</td>' +
          '</tr>');
      }

      // Power sensors share the battery timestamp axis — exact match
      const battKw  = battMap.get(ts)       || 0;
      const gridKw  = gridMap.get(ts)       || 0;
      const loadKw  = loadMap.get(ts)       || 0;
      const solarKw = solarMap.get(ts)      || 0;
      const soc     = socMap.get(ts)        || 0;
      // Price/cost sensors have coarser steps — use nearest timestamp
      const buyP    = nearestGet(buyMap,  ts);
      const sellP   = nearestGet(sellMap, ts);
      // grid_net_cost: only meaningful when grid is actually active.
      // When battery powers home with no grid flow, cost = 0 → show —
      const rawCost = nearestGet(costMap, ts);
      const cost    = Math.abs(gridKw) > 0.05 ? rawCost : 0;

      const cls = _haeo_classifyFuture(solarKw, loadKw, battKw, gridKw);
      const c   = _HAEO_COLOURS[cls.color] || { bg: 'transparent', txt: 'var(--primary-text-color)', cost: 'var(--primary-text-color)' };

      // Grid: negative=export (green=earning), positive=import (red=costing)
      const gridCol  = gridKw < 0 ? '#f44336' : gridKw > 0 ? '#4caf50' : c.txt;
      // Battery: discharge(positive internally)=red, charge from solar=green, charge from grid=amber
      const battCol  = battKw > 0.05 ? '#f44336'
                     : battKw < -0.05 && gridKw < -0.05 ? '#ff9800'
                     : battKw < -0.05 ? '#4caf50'
                     : c.txt;
      const socCol   = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;
      const costFmt  = _haeo_fmtCost(cost);
      const costCol  = costFmt.col || (cost > 0.0001 ? c.cost : c.txt);

      // kWh = kW × stepH where stepH is inferred from gap to next forecast timestamp
      const stepH    = stepHFor(ts);
      const fmtKwh   = (v) => Math.abs(v * stepH) > 0.001 ? (v * stepH).toFixed(3) : '—';
      const fmtKwhC  = (v, col) => {
        const kwh = v * stepH;
        return Math.abs(kwh) > 0.001
          ? '<span style="color:' + col + ';">' + kwh.toFixed(3) + '</span>'
          : '—';
      };

      rows.push('<tr style="background-color:' + c.bg + ';color:' + c.txt + ';">' +
        '<td>' + timeStr + '</td>' +
        '<td><span title="' + cls.note + '">' + cls.label + '</span></td>' +
        '<td class="bgl">' + _haeo_fmtP(buyP)   + '</td>' +
        '<td class="bgi">' + _haeo_fmtP(sellP)  + '</td>' +
        '<td class="bgl">' + loadKw.toFixed(2)  + '</td>' +
        '<td class="bgi">' + fmtKwh(loadKw)     + '</td>' +
        '<td class="bgl">' + solarKw.toFixed(2) + '</td>' +
        '<td class="bgi">' + fmtKwh(solarKw)    + '</td>' +
        '<td class="bgl"><span style="color:' + gridCol + ';">' + (-gridKw).toFixed(2) + '</span></td>' +
        '<td class="bgi">' + fmtKwhC(-gridKw, gridCol)  + '</td>' +
        '<td class="bgl"><span style="color:' + battCol + ';">' + (-battKw).toFixed(2) + '</span></td>' +
        '<td class="bgi"><span style="color:' + battCol + ';">' + fmtKwh(-battKw) + '</span></td>' +
        '<td class="bgl"><span style="color:' + socCol + ';">' + soc.toFixed(1) + '</span></td>' +
        '<td class="bgl"><span style="color:' + costCol + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
        '</tr>');
    }

    tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="14" class="msg">No future forecast rows available.</td></tr>';
    requestAnimationFrame(() => this._setWrapHeight());
  }

  // ── Past tab ────────────────────────────────────────────────────────────────
  _getRangeP() {
    const sel = this.shadowRoot.getElementById('range-past');
    const val = sel ? sel.value : 'today';
    const now = new Date();
    let start, end;
    if (val === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end   = now;
    } else if (val === 'yesterday') {
      end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      start = new Date(end - 86400000);
    } else {
      end   = now;
      start = new Date(end - parseInt(val) * 3600000);
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

      // Power sensors for event classification
      const powerSensors = [
        this._eid('battery'),
        this._eid('grid'),
        this._eid('load'),
        this._eid('solar'),
        this._eid('soc'),
        this._eid('buy_price'),
        this._eid('sell_price'),
      ];
      // Energy sensors for kWh delta columns
      const energySensors = [
        this._eid('energy_load'),
        this._eid('energy_solar'),
        this._eid('energy_grid_import'),
        this._eid('energy_grid_export'),
        this._eid('energy_batt_charge'),
        this._eid('energy_batt_discharge'),
      ];

      const result = await this._hass.callWS({
        type:             'history/history_during_period',
        start_time:       start.toISOString(),
        end_time:         end.toISOString(),
        entity_ids:       [...new Set([...powerSensors, ...energySensors])],
        minimal_response: true,
        no_attributes:    true,
      });

      const lookup = {};
      for (const [eid, states] of Object.entries(result)) {
        lookup[eid] = states.map(s => ({
          t: (s.lu !== undefined ? s.lu : s.lc) * 1000,
          s: s.s
        })).sort((a, b) => a.t - b.t);
      }

      // Build unit multiplier maps from LIVE sensor state unit_of_measurement.
      // This is the most reliable source — the history API stores values in whatever
      // unit the sensor was reporting, which matches the live state unit.
      // Power sensors: W→÷1000, kW→×1, MW→×1000 (normalise to kW)
      // Energy sensors: Wh→÷1000, kWh→×1, MWh→×1000, GWh→×1000000 (normalise to kWh)
      this._pwrMult = {
        battery: _haeo_powerMult(this._hass, this._eid('battery')),
        grid:    _haeo_powerMult(this._hass, this._eid('grid')),
        load:    _haeo_powerMult(this._hass, this._eid('load')),
        solar:   _haeo_powerMult(this._hass, this._eid('solar')),
      };
      this._engMult = {
        energy_load:           _haeo_energyMult(this._hass, this._eid('energy_load')),
        energy_solar:          _haeo_energyMult(this._hass, this._eid('energy_solar')),
        energy_grid_import:    _haeo_energyMult(this._hass, this._eid('energy_grid_import')),
        energy_grid_export:    _haeo_energyMult(this._hass, this._eid('energy_grid_export')),
        energy_batt_charge:    _haeo_energyMult(this._hass, this._eid('energy_batt_charge')),
        energy_batt_discharge: _haeo_energyMult(this._hass, this._eid('energy_batt_discharge')),
      };
      // Sanity check: if a power sensor value from history looks implausibly large
      // after applying the multiplier (e.g. > 500 kW for a home system), the unit
      // detection may be wrong — log a warning but don't crash.
      const _checkPwr = (key) => {
        const arr = lookup[this._eid(key)];
        if (!arr || !arr.length) return;
        const sample = Math.abs(parseFloat(arr[0].s) || 0) * this._pwrMult[key];
        if (sample > 500) console.warn('HAEO card: ' + key + ' value ' + sample.toFixed(1) + ' kW seems implausible — check unit_of_measurement');
      };
      ['battery','grid','load','solar'].forEach(k => _checkPwr(k));

      // Auto-switch to Last 24h if today has no load data
      if (!lookup[this._eid('load')]?.length) {
        const sel = this.shadowRoot.getElementById('range-past');
        if (sel && sel.value === 'today') {
          st.textContent = 'No data yet — switching to Last 24h...';
          sel.value = '24';
          this._pastState = 'loading';
          setTimeout(() => this._loadPast(), 500);
          return;
        }
        tb.innerHTML = '<tr><td colspan="14" class="msg">⚠️ No sensor data for this period.</td></tr>';
        st.textContent = 'No data';
        this._pastState = 'ready';
        this._pastLoadTs = 0;
        return;
      }

      const step    = 5 * 60 * 1000;
      const startMs = Math.ceil(start.getTime() / step) * step;
      const entries = [];
      for (let t = startMs; t <= end.getTime(); t += step) entries.push(t);
      entries.reverse();

      // ── Pass 1: daily cost and kWh totals ──
      const pastDailyCosts = {};
      const pastDailyKwh   = {};
      for (const ts of entries) {
        const dt     = new Date(ts);
        const dayStr = dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const battKw = (parseFloat(_haeo_getAt(lookup[this._eid('battery')], ts)) || 0) * this._pwrMult.battery;
        // Grid: negate — device records positive=import, our convention is positive=export
        const gridKw = -((parseFloat(_haeo_getAt(lookup[this._eid('grid')],  ts)) || 0) * this._pwrMult.grid);
        const loadKw = (parseFloat(_haeo_getAt(lookup[this._eid('load')],    ts)) || 0) * this._pwrMult.load;
        const solarKw= (parseFloat(_haeo_getAt(lookup[this._eid('solar')],   ts)) || 0) * this._pwrMult.solar;
        const buyP   = parseFloat(_haeo_getAt(lookup[this._eid('buy_price')],ts)) || 0;
        const sellP  = parseFloat(_haeo_getAt(lookup[this._eid('sell_price')],ts))|| 0;
        const stepH  = 5 / 60;
        // Cost: import = positive cost, export = negative cost (earning)
        const importing = gridKw < -0.1;
        const exporting = gridKw > 0.1;
        const cost = importing ? Math.abs(gridKw) * buyP * stepH : exporting ? -(gridKw * sellP * stepH) : 0;
        pastDailyCosts[dayStr] = (pastDailyCosts[dayStr] || 0) + cost;
        const dk = pastDailyKwh[dayStr] || { load:0, pv:0, grid:0, batt:0 };
        dk.load += loadKw  * stepH;
        dk.pv   += solarKw * stepH;
        dk.grid += gridKw  * stepH;
        dk.batt += battKw  * stepH;
        pastDailyKwh[dayStr] = dk;
      }

      // ── Pass 2: render rows ──
      const rows = [];
      let lastDay = '';

      for (const ts of entries) {
        const dt      = new Date(ts);
        const dayStr  = dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = dt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });

        if (dayStr !== lastDay) {
          lastDay = dayStr;
          const dayTotal = pastDailyCosts[dayStr] || 0;
          const pk       = pastDailyKwh[dayStr]   || { load:0, pv:0, grid:0, batt:0 };
          const dayColor = dayTotal <= 0 ? '#4caf50' : '#f44336';
          // dayTotal: positive = cost, negative = earned
          const dayCostLbl = dayTotal <= 0 ? _HAEO_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _HAEO_CUR + dayTotal.toFixed(2);
          const fmtKd = (v) => Math.abs(v) > 0.001 ? (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) : '—';
          // Grid: negative=export(green), positive=import(red)
          const fmtKdCol = (v) => {
            if (Math.abs(v) <= 0.001) return '—';
            const col = v < 0 ? '#4caf50' : '#f44336';
            return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>';
          };
          // Battery: negative=discharge(red), positive=charge(green)
          const fmtKdColBatt = (v) => {
            if (Math.abs(v) <= 0.001) return '—';
            const col = v < 0 ? '#f44336' : '#4caf50';
            return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>';
          };
          rows.push('<tr class="dr">' +
            '<td colspan="2">📅 ' + dayStr + '</td>' +
            '<td class="bgl" colspan="2"></td>' +
            '<td class="bgl"></td>' +
            '<td class="bgi" style="text-align:right;">' + fmtKd(pk.load) + '</td>' +
            '<td class="bgl"></td>' +
            '<td class="bgi" style="text-align:right;">' + fmtKd(pk.pv) + '</td>' +
            '<td class="bgl"></td>' +
            '<td class="bgi" style="text-align:right;">' + fmtKdCol(-pk.grid) + '</td>' +
            '<td class="bgl"></td>' +
            '<td class="bgi" style="text-align:right;">' + fmtKdColBatt(-pk.batt) + '</td>' +
            '<td class="bgl"></td>' +
            '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLbl + '</td>' +
            '</tr>');
        }

        // Power values — normalised to kW using auto-detected unit multipliers
        // Grid history: device records positive=import — negate to match display convention (positive=export)
        // This matches the forecast negation applied in _renderFuture's buildMap call.
        const battKw  = (parseFloat(_haeo_getAt(lookup[this._eid('battery')],  ts)) || 0) * this._pwrMult.battery;
        const gridKwR = (parseFloat(_haeo_getAt(lookup[this._eid('grid')],     ts)) || 0) * this._pwrMult.grid;
        const gridKw  = -gridKwR; // negate: device positive=import → convention positive=export
        const loadKw  = (parseFloat(_haeo_getAt(lookup[this._eid('load')],     ts)) || 0) * this._pwrMult.load;
        const solarKw = (parseFloat(_haeo_getAt(lookup[this._eid('solar')],    ts)) || 0) * this._pwrMult.solar;
        const soc     = parseFloat(_haeo_getAt(lookup[this._eid('soc')],        ts)) || 0;
        const buyP    = parseFloat(_haeo_getAt(lookup[this._eid('buy_price')],  ts)) || 0;
        const sellP   = parseFloat(_haeo_getAt(lookup[this._eid('sell_price')], ts)) || 0;

        if (soc === 0 && Math.abs(battKw) < 0.01 && Math.abs(gridKw) < 0.01 && loadKw < 0.01 && solarKw < 0.01) continue;

        const cls = _haeo_classifyPast(solarKw, loadKw, battKw, gridKw);
        const c   = _HAEO_COLOURS[cls.color] || { bg: '#ffffcc', txt: '#888888', cost: '#888888' };

        // Grid: negative=export (green=earning), positive=import (red=costing)
        const gridCol = gridKw < 0 ? '#f44336' : gridKw > 0 ? '#4caf50' : c.txt;
        // Battery: discharge(positive internally)=red, charge from solar=green, charge from grid=amber
        const battCol = battKw > 0.05 ? '#f44336'
                      : battKw < -0.05 && gridKw < -0.05 ? '#ff9800'
                      : battKw < -0.05 ? '#4caf50'
                      : c.txt;
        const socCol  = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;

        // Cost for this slot
        const stepH    = 5 / 60;
        const importing = gridKw < -0.1;
        const exporting = gridKw > 0.1;
        const slotCost  = importing ? Math.abs(gridKw) * buyP * stepH : exporting ? -(gridKw * sellP * stepH) : 0;
        const costFmt   = _haeo_fmtCost(slotCost);
        const costCol   = costFmt.col || (slotCost > 0.0001 ? c.cost : c.txt);

        // Energy kWh deltas from total_increasing sensors — multiplied to normalise to kWh
        const prevTs  = ts - step;
        const eLoad   = _haeo_getDelta(lookup[this._eid('energy_load')],           ts, prevTs, this._engMult.energy_load);
        const eSolar  = _haeo_getDelta(lookup[this._eid('energy_solar')],           ts, prevTs, this._engMult.energy_solar);
        const eGImp   = _haeo_getDelta(lookup[this._eid('energy_grid_import')],     ts, prevTs, this._engMult.energy_grid_import);
        const eGExp   = _haeo_getDelta(lookup[this._eid('energy_grid_export')],     ts, prevTs, this._engMult.energy_grid_export);
        const eBattC  = _haeo_getDelta(lookup[this._eid('energy_batt_charge')],     ts, prevTs, this._engMult.energy_batt_charge);
        const eBattD  = _haeo_getDelta(lookup[this._eid('energy_batt_discharge')],  ts, prevTs, this._engMult.energy_batt_discharge);
        // Grid kWh: only show when kW is above threshold — suppresses energy sensor
        // noise on rows where grid is truly idle (device jitter can produce tiny deltas)
        const eGrid   = exporting ? (eGExp !== null ? -eGExp : null)
                      : importing ? eGImp
                      : null;
        // Batt kWh: sign matches display convention (discharge=-kW/-kWh, charge=+kW/+kWh)
        const eBatt   = battKw > 0.1  ? (eBattD !== null ? -eBattD : null)   // discharge → negative
                      : battKw < -0.1 ? eBattC                                // charge → positive
                      : null;

        // Threshold 0.005 kWh (5 Wh) to suppress sensor noise and tiny update artefacts
        const fmtE = (v) => v !== null && Math.abs(v) > 0.005 ? v.toFixed(3) : '—';

        rows.push('<tr style="background-color:' + c.bg + ';color:' + c.txt + ';">' +
          '<td>' + timeStr + '</td>' +
          '<td>' + cls.label + '</td>' +
          '<td class="bgl">' + _haeo_fmtP(buyP)   + '</td>' +
          '<td class="bgi">' + _haeo_fmtP(sellP)  + '</td>' +
          '<td class="bgl">' + loadKw.toFixed(2)  + '</td>' +
          '<td class="bgi">' + fmtE(eLoad)  + '</td>' +
          '<td class="bgl">' + solarKw.toFixed(2) + '</td>' +
          '<td class="bgi">' + fmtE(eSolar) + '</td>' +
          '<td class="bgl"><span style="color:' + gridCol + ';">' + (-gridKw).toFixed(2) + '</span></td>' +
          '<td class="bgi"><span style="color:' + gridCol + ';">' + fmtE(eGrid)  + '</span></td>' +
          '<td class="bgl"><span style="color:' + battCol + ';">' + (-battKw).toFixed(2) + '</span></td>' +
          '<td class="bgi"><span style="color:' + battCol + ';">' + fmtE(eBatt) + '</span></td>' +
          '<td class="bgl"><span style="color:' + socCol + ';">' + soc.toFixed(1) + '</span></td>' +
          '<td class="bgl"><span style="color:' + costCol + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
          '</tr>');
      }

      tb.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="14" class="msg">⚠️ No readings for this period.</td></tr>';
      requestAnimationFrame(() => this._setWrapHeight());
      const sel2 = this.shadowRoot.getElementById('range-past');
      st.textContent = entries.length + ' readings — ' + (sel2 ? sel2.options[sel2.selectedIndex].text : '');
      this._pastState = 'ready';
      this._pastLoadTs = 0;

    } catch (e) {
      const tb2 = this.shadowRoot.getElementById('tb-past');
      if (tb2) tb2.innerHTML = '<tr><td colspan="14" class="err">⚠️ ' + e.message + '</td></tr>';
      const st2 = this.shadowRoot.getElementById('st-past');
      if (st2) st2.textContent = 'Error — ' + e.message.slice(0, 60);
      this._pastState = 'ready';
      this._pastLoadTs = 0;
    }
  }

  getCardSize() { return 12; }
}

if (!customElements.get('haeo-events-card')) {
  customElements.define('haeo-events-card', HaeoEventsCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'haeo-events-card')) {
  window.customCards.push({
    type: 'haeo-events-card',
    name: 'HAEO Events Card',
    description: 'HAEO Optimizer future forecast and past events in one card',
  });
}
