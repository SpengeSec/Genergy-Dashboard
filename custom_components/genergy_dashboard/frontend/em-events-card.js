// EM Events Card - https://github.com/Roving-Ronin/EMS-Events-Card
// Combines Future Decisions (timeline) and Past Decisions (history) in one card
// Requires: sensor.energy_manager_plan + inverter sensors
// Copy to /config/www/em-events-card.js
// Add resource: /local/em-events-card.js (type: JavaScript module)

const _EMEC_VERSION = 'v2.4.11';

// Currency symbol — set from card config, defaults to '$'
let _EMEC_CUR = '$';

const _EMEC_SENSORS = [
  'sensor.energy_manager_decision',
  'sensor.inverter_pv_power',
  'sensor.inverter_load_power',
  'sensor.inverter_import_power',
  'sensor.inverter_export_power',
  'sensor.inverter_battery_charging_power',
  'sensor.inverter_battery_discharging_power',
  'sensor.inverter_battery_level',
  'sensor.nodered_buyprice',
  'sensor.nodered_sellprice',
  // Energy sensors for kWh display (total_increasing — delta between slots)
  'sensor.monthly_imported_energy',
  'sensor.monthly_exported_energy',
  'sensor.monthly_pv_generation',
  'sensor.monthly_battery_charge',
  'sensor.monthly_battery_discharge',
  'sensor.daily_consumed_energy',                 // load kWh (resets daily at midnight)
  'sensor.daily_exported_energy',                 // GloBird super export cap tracking
];

const _EMEC_COLOURS = {
  solar_green: { bg: '#ccffcc', txt: '#333333', cost: '#333333' },
  solar:       { bg: '#ffffcc', txt: '#333333', cost: '#333333' },
  teal:        { bg: '#ccfff5', txt: '#333333', cost: '#333333' },
  pink:        { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },
  red:         { bg: 'rgba(180,50,50,0.35)', txt: '#ffffff', cost: '#ffaaaa' },
  green:       { bg: 'rgba(30,150,80,0.55)',  txt: '#ffffff', cost: '#90ffb0' },
};

const _EMEC_LEG_L = [
  ['#ccfff5','#333','🌞 Solar + 🔋 Battery → 🏠 Home','Self Consumption - No Grid'],
  ['#ffe0e0','#333','🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)','Profit - Grid Export (Forced)'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home','Self Consumption - Solar'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery','Self Consumption - Charge Battery'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid','Profit - Grid Export (Forced)'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + ⚡ Grid','Profit - Grid Export (Solar)'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home','Cost - Solar + Grid Import'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost - Solar + Grid Import - Charge Battery'],
];

const _EMEC_LEG_R = [
  ['#ccfff5','#333','🔋 Battery → 🏠 Home','Self Consumption - Battery'],
  ['#ffffcc','#333','🔋 Battery → 🏠 Home + ⚡ Grid (Force)','Profit - Grid Export (Forced)'],
  ['#ffe0e0','#333','🔋 Battery + ⚡ Grid → 🏠 Home','Cost - Battery + Grid Import'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home','Cost - Grid Import (Battery Idle | No Solar)'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost - Grid Import (Fored Battery Charge)'],
  ['#ccfff5','#333','🚗 EV Charger','Placeholder - EV Charger'],
  ['#ccfff5','#333','❄️ 🚿 Scheduled Load(s)','Placeholder - HVAC, HWS - Surplus Solar'],
  ['','','',''],
];

// ── Shared classify — future (mode-aware) ────────────────────────────────────
function _emec_classifyFuture(mode, pvKw, impKw, expKw, battCKw, battDKw, curtail, soc) {
  const T = 0.1;
  if (mode === 'FORCED_EXPORT') {
    if (pvKw > T && expKw > T) return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced export: solar and battery to home and grid', color: 'pink' };
    return                            { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced export: battery to home and grid', color: 'solar' };
  }
  if (mode === 'FORCED_DISCHARGE') {
    if (pvKw > T && expKw > T) return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced discharge: solar and battery to home and grid', color: 'pink' };
    return                            { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced discharge: battery to home and grid', color: 'solar' };
  }
  if (mode === 'FORCED_CHARGE') {
    if (impKw > T)               return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Forced grid charging — cheap rate window', color: 'red' };
    if (battCKw > T && pvKw > T) return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', note: 'Solar covering home and charging battery', color: 'solar_green' };
    return                              { label: '🌞 Solar → 🏠 Home (Self Consumption)', note: 'Solar covering home — battery full', color: 'solar_green' };
  }
  if (mode === 'SELF_CONSUMPTION') {
    if (pvKw > T && expKw > T && battCKw > T) return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid', note: 'Solar covering home, charging battery and exporting', color: 'solar_green' };
    if (pvKw > T && expKw > T)               return { label: '🌞 Solar → 🏠 Home + ⚡ Grid', note: 'Solar covering home and exporting surplus', color: 'solar_green' };
    if (pvKw > T && curtail === 100 && battCKw > T && soc < 99) return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', note: 'Solar covering home and charging battery — exports blocked', color: 'solar_green' };
    if (pvKw > T && curtail === 100 && soc >= 99 && battCKw < T) return { label: '🌞 Solar → 🏠 Home (Self Consumption)', note: 'Solar covering home — battery full, exports blocked', color: 'solar_green' };
    if (pvKw > T && curtail === 100 && soc >= 99 && battCKw > T) return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', note: 'Solar covering home with trickle charge — exports blocked', color: 'solar_green' };
    if (pvKw > T && battCKw > T && impKw < T && expKw < T) return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', note: 'Solar covering home and charging battery — no grid', color: 'solar_green' };
    if (pvKw > T && battDKw > T && impKw < T) return { label: '🌞 Solar + 🔋 Battery → 🏠 Home', note: 'Solar and battery together covering home', color: 'teal' };
    if (pvKw > T && impKw < T && expKw < T && battCKw < T && battDKw < T) return { label: '🌞 Solar → 🏠 Home (Self Consumption)', note: 'Solar covering home — no battery, no grid', color: 'solar_green' };
    if (battDKw > T && impKw > T) return { label: '🔋 Battery + ⚡ Grid → 🏠 Home', note: 'Battery discharging but grid also needed', color: 'pink' };
    if (battDKw > T && expKw > T) return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced discharge: battery to home and grid', color: 'solar' };
    if (battDKw > T)              return { label: '🔋 Battery → 🏠 Home (Self Consumption)', note: 'Battery powering home — no solar, no grid', color: 'teal' };
    if (battCKw > T && impKw > T) return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Grid charging battery and covering home', color: 'red' };
    if (impKw > T)                return { label: '⚡ Grid → 🏠 Home', note: 'Grid covering home — battery idle', color: 'red' };
    return null;
  }
  return null;
}

// ── Shared classify — past (sensor-based) ───────────────────────────────────
function _emec_classifyPast(solar, gridImp, gridExp, battC, battD) {
  const T = 0.2;
  if (solar > T && gridExp > T && battD > T) return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', color: 'pink' };
  if (solar > T && gridExp > T && battC > T) return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid', color: 'solar_green' };
  if (solar > T && gridExp > T)              return { label: '🌞 Solar → 🏠 Home + ⚡ Grid', color: 'solar_green' };
  if (battD > T && gridExp > T)              return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', color: 'solar' };
  if (solar > T && gridImp > T && battC > T) return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'pink' };
  if (solar > T && gridImp > T)              return { label: '🌞 Solar + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (solar > T && battC > T)                return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', color: 'solar_green' };
  if (solar > T && battD > T)                return { label: '🌞 Solar + 🔋 Battery → 🏠 Home', color: 'teal' };
  if (solar > T)                             return { label: '🌞 Solar → 🏠 Home (Self Consumption)', color: 'solar_green' };
  if (battD > T && gridImp > T)             return { label: '🔋 Battery + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (battD > T)                             return { label: '🔋 Battery → 🏠 Home (Self Consumption)', color: 'teal' };
  if (gridImp > T && battC > T)             return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'red' };
  if (gridImp > T)                           return { label: '⚡ Grid → 🏠 Home', color: 'red' };
  return { label: '—', color: '' };
}

function _emec_fmtP(v) {
  return (v < 0 ? '-' : '') + _EMEC_CUR + Math.abs(v).toFixed(4);
}

function _emec_fmtCost(cost) {
  // cost > 0 = money spent (import) = show as -$
  // cost < 0 = money earned (export) = show as $
  if (cost > 0.0001)  return { disp: '-' + _EMEC_CUR + cost.toFixed(3),           col: null };
  if (cost < -0.0001) return { disp: _EMEC_CUR  + Math.abs(cost).toFixed(3), col: '#4caf50' };
  return { disp: '—', col: null };
}


// ── Provider-aware price helpers ─────────────────────────────────────────────

// Parse HH:MM:SS time string into minutes-since-midnight
function _emec_timeToMins(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Get minutes-since-midnight for a timestamp
function _emec_tsToMins(ts) {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
}

// Check if time (mins since midnight) is within a window (handles overnight wrap)
function _emec_inWindow(mins, startMins, endMins) {
  if (startMins <= endMins) {
    return mins >= startMins && mins < endMins;
  } else {
    // overnight wrap e.g. 23:00 → 02:00
    return mins >= startMins || mins < endMins;
  }
}

// Get provider-aware buy/sell prices for a given timestamp
// Returns { buyP, sellP, inSuper } — inSuper only meaningful for GloBird
function _emec_getPrices(ts, provider, hass, rowBuyP, rowSellP) {
  const mins = _emec_tsToMins(ts);

  if (provider === 'GloBird') {
    // ── Buy price ──
    const peakBuyStart = _emec_timeToMins(hass.states['input_datetime.globird_peak_buy_start']?.state || '16:00:00');
    const peakBuyEnd   = _emec_timeToMins(hass.states['input_datetime.globird_peak_buy_end']?.state   || '23:00:00');
    const freeBuyStart = _emec_timeToMins(hass.states['input_datetime.globird_free_buy_start']?.state  || '11:00:00');
    const freeBuyEnd   = _emec_timeToMins(hass.states['input_datetime.globird_free_buy_end']?.state    || '14:00:00');

    const peakBuyP  = parseFloat(hass.states['input_number.globird_peak_buy_price']?.state  || 0) / 100;
    const freeBuyP  = parseFloat(hass.states['input_number.globird_free_buy_price']?.state  || 0) / 100;
    const otherBuyP = parseFloat(hass.states['input_number.globird_other_buy_price']?.state || 0) / 100;

    let buyP;
    if (_emec_inWindow(mins, peakBuyStart, peakBuyEnd)) {
      buyP = peakBuyP;
    } else if (_emec_inWindow(mins, freeBuyStart, freeBuyEnd)) {
      buyP = freeBuyP;
    } else {
      buyP = otherBuyP;
    }

    // ── Sell price ──
    const superStart = _emec_timeToMins(hass.states['input_datetime.globird_super_start']?.state || '18:00:00');
    const superEnd   = _emec_timeToMins(hass.states['input_datetime.globird_super_end']?.state   || '21:00:00');
    const stdStart   = _emec_timeToMins(hass.states['input_datetime.globird_std_start']?.state   || '16:00:00');
    const stdEnd     = _emec_timeToMins(hass.states['input_datetime.globird_std_end']?.state     || '21:00:00');

    const superSellP = parseFloat(hass.states['input_number.globird_super_sell']?.state || 0) / 100;
    const stdSellP   = parseFloat(hass.states['input_number.globird_std_sell']?.state   || 0) / 100;
    const otherSellP = parseFloat(hass.states['input_number.globird_other_sell']?.state || 0) / 100;

    const inSuper = _emec_inWindow(mins, superStart, superEnd);

    let sellP;
    if (inSuper) {
      sellP = superSellP;
    } else if (_emec_inWindow(mins, stdStart, stdEnd)) {
      sellP = stdSellP;
    } else {
      sellP = otherSellP;
    }

    return { buyP, sellP, inSuper, stdSellP, otherSellP, mins, stdStart, stdEnd };

  } else if (provider === 'Flow Power') {
    // ── Flat buy price ──
    const buyP = parseFloat(hass.states['input_number.flowpower_buy_price']?.state || 0) / 100;

    // ── Time-based sell price ──
    const peakStart = _emec_timeToMins(hass.states['input_datetime.flowpower_peak_start_time']?.state || '17:30:00');
    const peakEnd   = _emec_timeToMins(hass.states['input_datetime.flowpower_peak_end_time']?.state   || '19:30:00');
    const peakSellP = parseFloat(hass.states['input_number.flowpower_peak_feedin_price']?.state    || 0) / 100;
    const offSellP  = parseFloat(hass.states['input_number.flowpower_offpeak_feedin_price']?.state || 0) / 100;

    const sellP = _emec_inWindow(mins, peakStart, peakEnd) ? peakSellP : offSellP;

    return { buyP, sellP, inSuper: false };

  } else {
    // Amber Electric / LocalVolts — use plan values directly
    return { buyP: rowBuyP, sellP: rowSellP, inSuper: false };
  }
}

function _emec_getAt(arr, ts) {
  if (!arr || !arr.length) return null;
  let lo = 0, hi = arr.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= ts) { best = arr[mid].s; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

// Get energy delta between two consecutive 5-min slots from a total_increasing sensor
// Handles daily/monthly resets by returning 0 if delta is negative
function _emec_getDelta(arr, ts, prevTs) {
  if (!arr || !arr.length) return null;
  const curr = parseFloat(_emec_getAt(arr, ts));
  const prev = parseFloat(_emec_getAt(arr, prevTs));
  if (isNaN(curr) || isNaN(prev)) return null;
  const delta = curr - prev;
  return delta < 0 ? 0 : delta; // negative = reset occurred, treat as 0
}

// Format kWh value for display in brackets
function _emec_fmtKwh(kwh) {
  if (kwh === null || kwh === undefined) return '';
  if (kwh < 0.001) return '';
  if (kwh < 0.1)   return ' (' + (kwh * 1000).toFixed(0) + 'Wh)';
  return ' (' + kwh.toFixed(3) + 'kWh)';
}

// ── Shared legend HTML ───────────────────────────────────────────────────────
function _emec_legTable(items) {
  const rows = items.map(([bg, txt, label, desc]) => {
    if (!label) return '<tr><td colspan="2" style="border:none;padding:2px 0;"></td></tr>';
    return '<tr>' +
      '<td style="background-color:' + bg + ';color:' + txt + ';padding:3px 8px;white-space:nowrap;border:none;font-size:11px;">' + label + '</td>' +
      '<td style="padding:3px 8px;color:var(--primary-text-color);border:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;">' + desc + '</td>' +
      '</tr>';
  }).join('');
  return '<table style="width:100%;border-collapse:collapse;table-layout:auto;border-spacing:0;">' + rows + '</table>';
}

function _emec_buildLegend() {
  return '<details class="leg" style="font-size:11px;margin-top:12px;">' +
    '<summary style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;font-weight:bold;cursor:pointer;list-style:none;user-select:none;-webkit-user-select:none;">' +
    '<span>📘 Legend <span class="leg-chevron" style="display:inline-block;transition:transform 0.2s ease;font-size:10px;margin-left:2px;">▶</span></span>' +
    '<span style="display:flex;align-items:center;gap:10px;">' +
    '<span class="pill" style="background:#555;font-size:10px;" id="provider-pill">⚡ ...</span>' +
    '<span style="color:var(--secondary-text-color);font-size:10px;font-weight:normal;">' + _EMEC_VERSION + '</span>' +
    '</span>' +
    '</summary>' +
    '<div style="display:flex;gap:12px;align-items:flex-start;">' +
    '<div style="flex:1;min-width:0;overflow:hidden;">' + _emec_legTable(_EMEC_LEG_L) + '</div>' +
    '<div style="flex:1;min-width:0;overflow:hidden;">' + _emec_legTable(_EMEC_LEG_R) + '</div>' +
    '</div></details>';
}

// ── Shared CSS ───────────────────────────────────────────────────────────────
const _EMEC_STYLE = [
  ':host { display: block; }',
  '.card { padding: 8px 12px; font-family: var(--primary-font-family, sans-serif); font-size: 12px; }',
  '.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--divider-color,#444); margin-bottom: 10px; align-items: stretch; }',
  '.tab { padding: 6px 18px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--secondary-text-color); border-bottom: 3px solid transparent; margin-bottom: -2px; }',
  '.tab.active { color: #2196F3; border-bottom-color: #2196F3; background: rgba(33,150,243,0.07); }',
  '.sbar { display: flex; gap: 14px; align-items: center; padding: 4px 0 8px 0; font-size: 12px; flex-wrap: wrap; width: 100%; border-bottom: 2px solid #888; margin-bottom: 0; }',
  '.pill { padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 11px; color: #fff; }',
  '.stxt { color: var(--secondary-text-color); font-size: 11px; }',
  '.wrap { overflow: auto; width: 100%; }',
  '.pane { display: none; }',
  '.pane.active { display: block; }',
  /* All data-table rules scoped to .dt to prevent leaking into legend tables */
  '.dt { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 700px; table-layout: fixed; }',
														
  '.dt th, .dt td { padding: 4px 6px; border-bottom: 1px solid var(--divider-color,#444); font-size: 12px; line-height: 1.3; white-space: nowrap; text-align: right; overflow: hidden; text-overflow: ellipsis; }',
  '.dt th:nth-child(1) { text-align: left; box-shadow: inset -1px 0 0 #555; }',
  '.dt td:nth-child(1) { text-align: left !important; box-shadow: inset -1px 0 0 #555; font-size: 11px; }',
  /* nth-child(2) = Event col: left-align data rows, but NOT !important so th inline style can override to center */
  '.dt td:nth-child(2) { text-align: left; white-space: normal; box-shadow: inset -1px 0 0 #555; font-size: 11px; }',
  '.dt th:nth-child(2) { white-space: normal; box-shadow: inset -1px 0 0 #555; }',
  '.cur-unit { font-size: 9px; font-weight: normal; opacity:0.7;}',							 
  '.dt thead { background-color: var(--primary-background-color,#1c1c1c); }',
  '.dt thead th { background-color: var(--primary-background-color,#1c1c1c); font-weight: bold; color: var(--primary-text-color); border-bottom: 1px solid #666; }',
  /* Last row of thead = kW/kWh row — thick bottom border separates header from data */
  '.dt thead tr:last-child th { border-bottom: 2px solid #888; }',
  /* thick left border = major group boundary */
  '.bgl { box-shadow: inset 2px 0 0 #666; }',
  /* thin left border = kW/kWh within group */
  '.bgi { box-shadow: inset 1px 0 0 #555; }',
  '.dr td { background: var(--secondary-background-color); font-weight: bold; border-top: 2px solid var(--divider-color); text-align: left !important; padding: 5px 6px; }',
  '.dr td.bgi, .dr td.bgl { text-align: right !important; }',
  '.msg { padding: 20px; text-align: center; color: var(--secondary-text-color); }',
  '.err { padding: 10px; color: #f44336; }',
  '.leg summary::-webkit-details-marker { display: none; }',
  '.leg[open] .leg-chevron { transform: rotate(90deg); }',														  
].join('\n');

function _emec_buildHTML() {
  return '<style>' + _EMEC_STYLE + '</style>' +
    '<ha-card><div class="card">' +

    // ── Tabs ──
    '<div class="tabs">' +
    '<div class="tab active" id="tab-future">📅 Future Decisions</div>' +
    '<div class="tab" id="tab-past">📋 Past Decisions</div>' +
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

    // ── Future pane ──
    '<div class="pane active" id="pane-future">' +
    '<div class="sbar" id="sbar-future">⏳ Loading...</div>' +
    // Single table with sticky header inside scroll area
    '<div class="wrap"><table class="dt">' +
    '<colgroup>' +
    '<col style="width:52px;"><col style="width:40%;"><col style="width:68px;"><col style="width:68px;">' +
    '<col style="width:44px;"><col style="width:46px;"><col style="width:44px;"><col style="width:46px;">' +
    '<col style="width:44px;"><col style="width:46px;"><col style="width:44px;"><col style="width:46px;">' +
    '<col style="width:46px;"><col style="width:68px;">' +
    '</colgroup>' +
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
    '</thead>' +
    '</table>' +
    // Body scroll area
    '<div class="wrap"><table class="dt">' +
    '<colgroup>' +
    '<col style="width:52px;"><col style="width:40%;"><col style="width:68px;"><col style="width:68px;">' +
    '<col style="width:44px;"><col style="width:46px;"><col style="width:44px;"><col style="width:46px;">' +
    '<col style="width:44px;"><col style="width:46px;"><col style="width:44px;"><col style="width:46px;">' +
    '<col style="width:46px;"><col style="width:68px;">' +
    '</colgroup>' +
    '<tbody id="tb-future"><tr><td colspan="14" class="msg">⏳ Loading...</td></tr></tbody>' +
    '</table></div>' +
    '</div>' +

    // ── Past pane ──
    '<div class="pane" id="pane-past">' +
    '<div class="sbar">' +
    '<strong style="color:var(--primary-text-color);">Past Decisions</strong>' +
    '<span class="stxt" id="st-past">Loading...</span>' +
    '</div>' +
    // Single table with sticky header inside scroll area
    '<div class="wrap"><table class="dt">' +
    '<colgroup>' +
    '<col style="width:52px;"><col style="width:40%;"><col style="width:68px;"><col style="width:68px;">' +
    '<col style="width:44px;"><col style="width:46px;"><col style="width:44px;"><col style="width:46px;">' +
    '<col style="width:44px;"><col style="width:46px;"><col style="width:44px;"><col style="width:46px;">' +
    '<col style="width:46px;"><col style="width:68px;">' +
    '</colgroup>' +
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
    '</thead>' +
    '</table>' +
    // Body scroll area
    '<div class="wrap"><table class="dt">' +
    '<colgroup>' +
    '<col style="width:52px;"><col style="width:40%;"><col style="width:68px;"><col style="width:68px;">' +
    '<col style="width:44px;"><col style="width:46px;"><col style="width:44px;"><col style="width:46px;">' +
    '<col style="width:44px;"><col style="width:46px;"><col style="width:44px;"><col style="width:46px;">' +
    '<col style="width:46px;"><col style="width:68px;">' +
    '</colgroup>' +
    '<tbody id="tb-past"><tr><td colspan="14" class="msg">⏳ Select range to load...</td></tr></tbody>' +
    '</table></div>' +
    '</div>' +

    // ── Shared legend ──
    _emec_buildLegend() +
    '</div></ha-card>';
}

// ── Custom Element ────────────────────────────────────────────────────────────
class EmEventsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass         = null;
    this._config       = {};
    this._activeTab    = 'future';
    this._lastPlanTs   = null;
    this._lastRenderTs = 0;
    this._pastState    = 'idle';
    this._pastLoadTs   = 0;
  }

  setConfig(config) {
    this._config = config || {};
    _EMEC_CUR = this._config.currency_symbol || '$';													
    if (!this.shadowRoot.getElementById('tb-future')) {
      this.shadowRoot.innerHTML = _emec_buildHTML();
      this._wireRange();
      this._pastState  = 'idle';
      this._lastPlanTs = null;
      requestAnimationFrame(() => this._setWrapHeight());
      if (!this._ro) {
        this._ro = new ResizeObserver(() => this._setWrapHeight());
        this._ro.observe(document.documentElement);
      }
      // Smart refresh: fires at :01, :06, :11, :16 ... past the hour (1 min after each 5-min HA update)
      // Only refreshes when tab is visible; if hidden, catches up on next visibilitychange
      this._scheduleRefresh();
      if (!this._visHandler) {
        this._visHandler = () => {
          if (document.visibilityState === 'visible' && this._hass) {
            const staleMins = (Date.now() - this._lastRenderTs) / 60000;
            if (staleMins > 1) {
              this._doRefresh();
            }
          }
        };
        document.addEventListener('visibilitychange', this._visHandler);
      }
    }
  }

  // Calculate ms until next :01, :06, :11, :16 ... past the hour
  // (1 min after each 5-min HA update boundary)
  _msUntilNextBoundary() {
    const now = new Date();
    const secInHour = now.getMinutes() * 60 + now.getSeconds();
    // Target minutes past hour: 1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56
    const targets = [1,6,11,16,21,26,31,36,41,46,51,56];
    const minNow  = now.getMinutes() + now.getSeconds() / 60;
    // Find next target minute that is ahead of now
    let nextMin = targets.find(t => t > minNow);
    if (nextMin === undefined) nextMin = targets[0] + 60; // wrap to next hour
    const msUntil = (nextMin * 60 - secInHour) * 1000 - now.getMilliseconds();
    return Math.max(1000, msUntil);
  }

  _scheduleRefresh() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(() => {
      if (document.visibilityState !== 'hidden' && this._hass) {
        this._doRefresh();
      }
      // Always reschedule regardless of visibility
      this._scheduleRefresh();
    }, this._msUntilNextBoundary());
  }

  _doRefresh() {
    this._lastPlanTs = null; // force future re-render on next hass set
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
      const leg = this.shadowRoot.querySelector('.leg');
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
      this.shadowRoot.innerHTML = _emec_buildHTML();
      this._wireRange();
    }
    // Update provider pill in legend
    const providerState = hass.states['input_select.electricity_provider']?.state || 'Amber Electric';
    const provPill = this.shadowRoot.getElementById('provider-pill');
    if (provPill) provPill.textContent = '⚡ ' + providerState;

    // Re-render future tab when plan changes
    const planState = hass.states['sensor.energy_manager_plan'];
    const planTs    = planState?.last_changed;
    if (planTs !== this._lastPlanTs) {
      this._lastPlanTs = planTs;
      this._renderFuture();
    }
    // Auto-load past on first hass set
    if (this._pastState === 'idle') {
      this._pastState = 'loading';
      this._pastLoadTs = Date.now();
      this._loadPast();
    } else if (this._pastState === 'loading' && this._pastLoadTs && (Date.now() - this._pastLoadTs) > 30000) {
      // Stuck in loading for >30s — reset and retry
      this._pastState = 'idle';
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

  _wireRange() {
    // Wire tab clicks
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
    // Wire range selector
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

    const planState = this._hass?.states['sensor.energy_manager_plan'];
    if (!planState) {
      tbody.innerHTML = '<tr><td colspan="14" class="err">⚠️ sensor.energy_manager_plan not found</td></tr>';
      return;
    }

    const attr     = planState.attributes;
    const plan     = attr.energy_plan;
    const bs       = attr.blocks_summary;
    const summary  = plan?.summary;
    const provider = this._hass?.states['input_select.electricity_provider']?.state || 'Amber Electric';

    // ── GloBird uses a different data structure ──────────────────────────────
    const isGloBird = provider === 'GloBird';
    let timeline, meta, stepH;

    if (isGloBird) {
      // GloBird: blocks[] at root of planState.attributes
      const rawBlocks = attr.blocks || [];
      stepH = 0.5; // 30-min blocks
      // Normalise GloBird blocks to match timeline row shape
      timeline = rawBlocks.map(b => {
        const exportKw  = (b.export_w  || 0) / 1000;
        const chargeKw  = (b.charge_w  || 0) / 1000;
        const solarKw   = (b.solar_kwh || 0) * 2; // kWh per 30min → kW
        const loadKw    = (b.load_kwh  || 0) * 2;
        return {
          ts:   b.start_local,
          mode: b.action === 'charge' ? 'FORCED_CHARGE' :
                b.action === 'export' ? 'FORCED_EXPORT'  : 'SELF_CONSUMPTION',
          band: b.band,
          inputs: {
            pv_kw:          solarKw,
            load_kw:        loadKw,
            soc_pct_start:  b.soc_estimate_pct || 0,
            buy_price:      b.buy_price  || 0,
            sell_price:     b.sell_price || 0,
          },
          setpoints: { curtail_pct: 0, force_charge_kw: chargeKw, force_export_kw: exportKw },
          expected: {
            grid_import_kw:       b.action === 'charge' && chargeKw > solarKw ? chargeKw - solarKw : 0,
            grid_export_kw:       exportKw > 0 ? exportKw : 0,
            battery_charge_kw:    chargeKw,
            battery_discharge_kw: exportKw > 0 ? exportKw : 0,
            soc_pct_end:          b.soc_estimate_pct || 0,
          },
        };
      });
      meta = { step_minutes: 30 };
    } else {
      timeline = plan?.timeline || [];
      meta     = plan?.meta || {};
      stepH    = (meta.step_minutes || 30) / 60;
    }

    if (!timeline.length) {
      tbody.innerHTML = '<tr><td colspan="14" class="err">⚠️ No timeline data found</td></tr>';
      return;
    }

    const nowTs    = Date.now();
    const todayStr = new Date().toLocaleDateString('en-CA');

    // Daily cost and kWh totals (provider-aware prices) — only future rows, matching render loop
    const dailyCosts = {};
    const dailyKwh  = {}; // { load, pv, grid (signed), batt (signed) }
    let curDay = '', curTotal = 0, curKwh = { load:0, pv:0, grid:0, batt:0 };
    for (const row of timeline) {
      const ts      = new Date(row.ts).getTime();
      if (ts < nowTs) continue;  // skip past slots — matches render loop
      const day     = new Date(ts).toLocaleDateString('en-CA');
      const rowStepH = (row.interval_minutes || meta.step_minutes || 30) / 60;
      const { buyP, sellP } = _emec_getPrices(ts, provider, this._hass, row.inputs.buy_price || 0, row.inputs.sell_price || 0);
      const net = ((row.expected.grid_import_kw || 0) * buyP -
                   (row.expected.grid_export_kw || 0) * sellP) * rowStepH;
      const rImpKw  = row.expected.grid_import_kw       || 0;
      const rExpKw  = row.expected.grid_export_kw       || 0;
      const rBattC  = row.expected.battery_charge_kw    || 0;
      const rBattD  = row.expected.battery_discharge_kw || 0;
      const rGridKw = rExpKw > 0.1 ? -rExpKw : rImpKw > 0.1 ? rImpKw : 0;
      const rBattKw = rBattC > 0.1 ? rBattC  : rBattD  > 0.1 ? -rBattD : 0;
      if (day !== curDay) {
        if (curDay) { dailyCosts[curDay] = Math.round(curTotal * 10000) / 10000; dailyKwh[curDay] = { ...curKwh }; }
        curDay = day; curTotal = net;
        curKwh = { load: (row.inputs.load_kw||0)*rowStepH, pv: (row.inputs.pv_kw||0)*rowStepH, grid: rGridKw*rowStepH, batt: rBattKw*rowStepH };
      } else {
        curTotal += net;
        curKwh.load += (row.inputs.load_kw||0) * rowStepH;
        curKwh.pv   += (row.inputs.pv_kw||0)   * rowStepH;
        curKwh.grid += rGridKw * rowStepH;
        curKwh.batt += rBattKw * rowStepH;
      }
    }
    if (curDay) { dailyCosts[curDay] = Math.round(curTotal * 10000) / 10000; dailyKwh[curDay] = { ...curKwh }; }

    // Peak / morning SoC
    let closestDiff = Infinity, chargingNow = false;
    for (const row of timeline) {
      const diff = Math.abs(new Date(row.ts).getTime() - nowTs);
      if (diff < closestDiff) {
        closestDiff = diff;
        chargingNow = (row.inputs.pv_kw || 0) > 0.5 && (row.expected.battery_charge_kw || 0) > 0.1;
      }
    }
    let dawnSoc = null, dawnTime = '', dawnLabel = '';
    if (chargingNow) {
      let peakSoc = 0, peakTime = '';
      for (const row of timeline) {
        const ts = new Date(row.ts).getTime();
        if (ts >= nowTs && (row.inputs.pv_kw||0) > 0.5 && (row.expected.battery_charge_kw||0) > 0.01 && (row.expected.soc_pct_end||0) > peakSoc) {
          peakSoc = row.expected.soc_pct_end;
          peakTime = new Date(ts).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit', hour12:true }).replace(' 0',' ');
        }
      }
      if (peakSoc > 0) { dawnSoc = peakSoc; dawnTime = peakTime; dawnLabel = '🔋 Peak SoC'; }
    } else {
      for (const row of timeline) {
        if (dawnSoc !== null) break;
        const ts = new Date(row.ts).getTime();
        if (ts > nowTs && (row.inputs.pv_kw||0) > 0.5 && (row.expected.battery_charge_kw||0) > 0.1 && (row.expected.battery_discharge_kw||0) < 0.001) {
          dawnSoc   = row.inputs.soc_pct_start || 0;
          dawnTime  = new Date(ts).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit', hour12:true }).replace(' 0',' ');
          dawnLabel = '🌅 Morning SoC';
        }
      }
    }

    // Warnings
    let gridImportTime = '', forceExportTime = '';
    for (const row of timeline) {
      const ts = new Date(row.ts).getTime();
      if (ts < nowTs) continue;
      if (!gridImportTime  && (row.expected.grid_import_kw||0) > 0.1)
        gridImportTime  = new Date(ts).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit', hour12:false });
      if (!forceExportTime && row.mode === 'FORCED_EXPORT')
        forceExportTime = new Date(ts).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit', hour12:false });
    }

    // Status bar — bs.mode for Amber/LocalVolts, summary.now_mode for FlowPower etc
    const modeLabel  = bs?.mode || summary?.now_mode || 'UNKNOWN';
    const modeColors = { SELF_CONSUMPTION:'#28a745', FORCED_CHARGE:'#2196F3', FORCED_EXPORT:'#FF6B2C', FORCED_DISCHARGE:'#ff9800' };
    const modeIcons  = { SELF_CONSUMPTION:'🏠', FORCED_CHARGE:'⚡', FORCED_EXPORT:'📤', FORCED_DISCHARGE:'📤' };
    const modeColor  = modeColors[modeLabel] || '#9c27b0';
    const modeIcon   = modeIcons[modeLabel]  || '🔧';
    const nowSoc     = summary?.now_soc_pct;
    const dawnColor  = dawnSoc <= 20 ? '#f44336' : dawnSoc <= 35 ? '#ff9800' : '#4caf50';

    sbar.innerHTML =
      '<span>' + modeIcon + ' Mode: <span class="pill" style="background-color:' + modeColor + ';">' + modeLabel.replace(/_/g,' ') + '</span></span>' +
      (bs?.focus ? '<span>🎯 ' + bs.focus + '</span>' : '') +
      (nowSoc != null ? '<span>🔋 SoC now: <strong>' + nowSoc.toFixed(1) + '%</strong></span>' : '') +
      (dawnSoc != null ? '<span>' + dawnLabel + ' (' + dawnTime + '): <strong style="color:' + dawnColor + ';">' + dawnSoc.toFixed(1) + '%</strong></span>' : '') +
      (gridImportTime  ? '<span class="pill" style="background:#e65100;color:#ffffff;font-weight:bold;">⚠️ Grid import from ' + gridImportTime + '</span>' : '') +
      (forceExportTime ? '<span style="color:#FF6B2C;">📤 Force export from ' + forceExportTime + '</span>' : '') +
      '<span style="margin-left:auto;"></span>';

    // Table rows
    const rows = [];
    let lastDay = '';
    const isGloBirdProvider = provider === 'GloBird';
    const superCapKwh = isGloBirdProvider ? parseFloat(this._hass.states['input_number.globird_super_max_export']?.state || 10) : 0;
    // Seed today's baseline from actual sensor; day 2+ starts at 0
    const dailyExportedNow = isGloBirdProvider
      ? parseFloat(this._hass.states['sensor.daily_exported_energy']?.state || 0)
      : 0;
    let superExportedKwh = 0;
    let lastDayForCap = '';

    for (const row of timeline) {
      const ts = new Date(row.ts).getTime();
      if (ts < nowTs) continue;
      const day     = new Date(ts).toLocaleDateString('en-CA');
      const timeStr = new Date(ts).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit', hour12:false });

      if (day !== lastDay) {
        lastDay = day;
        const dayTotal = dailyCosts[day] || 0;
        const dk       = dailyKwh[day]  || { load:0, pv:0, grid:0, batt:0 };
        const dayColor = dayTotal <= 0 ? '#4caf50' : '#f44336';
        const dayLabel = day === todayStr ? '📅 Today' : '📅 ' + new Date(ts).toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' });
        const dayCostLabel = dayTotal <= 0 ? _EMEC_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _EMEC_CUR + dayTotal.toFixed(2);
        const fmtKd = (v) => Math.abs(v) > 0.001 ? (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) : '—';
        const fmtGrid = (v) => {  // negative=export=green, positive=import=red
          if (Math.abs(v) <= 0.001) return '—';
          const col = v < 0 ? '#4caf50' : '#f44336';
          return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>';
        };
        const fmtBatt = (v) => {  // negative=discharge=red, positive=charge=green
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
          '<td class="bgi" style="text-align:right;">' + fmtGrid(dk.grid) + '</td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;">' + fmtBatt(dk.batt) + '</td>' +
          '<td class="bgl"></td>' +
          '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLabel + '</td>' +
          '</tr>');
      }

      // Reset super export cap counter each new day
      // Today: seed from actual sensor value; future days start at 0
      if (isGloBirdProvider && day !== lastDayForCap) {
        superExportedKwh = (day === todayStr) ? dailyExportedNow : 0;
        lastDayForCap = day;
      }

      const pvKw    = row.inputs.pv_kw      || 0;
      const loadKw  = row.inputs.load_kw    || 0;
      const soc     = row.inputs.soc_pct_start || 0;
      const rowStepH = (row.interval_minutes || meta.step_minutes || 30) / 60;
      let { buyP, sellP, inSuper, stdSellP, otherSellP, mins, stdStart, stdEnd } = _emec_getPrices(ts, provider, this._hass, row.inputs.buy_price || 0, row.inputs.sell_price || 0);
      const impKw   = row.expected.grid_import_kw      || 0;
      const expKw   = row.expected.grid_export_kw      || 0;
      const battCKw = row.expected.battery_charge_kw   || 0;
      const battDKw = row.expected.battery_discharge_kw|| 0;
      const curtail = row.setpoints?.curtail_pct || 0;
      const gridKw  = expKw > 0.1 ? -expKw : impKw > 0.1 ? impKw : 0;
      const battKw  = battCKw > 0.1 ? battCKw : battDKw > 0.1 ? -battDKw : 0;

      // GloBird super export cap — track against daily_exported_energy baseline
      let capHit = false;
      if (isGloBirdProvider && inSuper && expKw > 0.1) {
        const slotExpKwh = expKw * rowStepH;
        if (superExportedKwh >= superCapKwh) {
          sellP = _emec_inWindow(mins, stdStart, stdEnd) ? stdSellP : otherSellP;
          capHit = true;
        } else if (superExportedKwh + slotExpKwh > superCapKwh) {
          const superPortion   = superCapKwh - superExportedKwh;
          const fallbackP      = _emec_inWindow(mins, stdStart, stdEnd) ? stdSellP : otherSellP;
          sellP = (superPortion * sellP + (slotExpKwh - superPortion) * fallbackP) / slotExpKwh;
          capHit = true;
        }
        superExportedKwh += slotExpKwh;
      }

      const cost    = ((impKw * buyP) - (expKw * sellP)) * rowStepH;

      const cls = _emec_classifyFuture(row.mode, pvKw, impKw, expKw, battCKw, battDKw, curtail, soc);
      if (!cls) continue;

      const c       = _EMEC_COLOURS[cls.color] || { bg:'transparent', txt:'var(--primary-text-color)', cost:'var(--primary-text-color)' };
      const gridCol = gridKw < 0 ? '#4caf50' : gridKw > 0 ? '#f44336' : c.txt;
      const battCol = battKw < 0 ? '#f44336' : battKw > 0 ? '#4caf50' : c.txt;  // discharge=red, charge=green
      const socCol  = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;
      const costFmt = _emec_fmtCost(cost);
      const costCol = costFmt.col || (cost > 0.0001 ? c.cost : c.txt);

      const fLoadKwh  = loadKw  * rowStepH;
      const fPvKwh    = pvKw    * rowStepH;
      const fGridKwh  = gridKw  * rowStepH;  // signed: negative=export, positive=import
      const fBattKwh  = battKw  * rowStepH;  // signed: negative=discharge, positive=charge

      const fmtKw  = (v) => Math.abs(v) < 0.005 ? '<span style="color:' + c.txt + ';">—</span>' : '<span style="color:' + c.txt + ';">' + v.toFixed(2) + '</span>';
      const fmtGKw = (v) => Math.abs(v) < 0.005 ? '<span style="color:' + c.txt + ';">—</span>' : '<span style="color:' + gridCol + ';">' + v.toFixed(2) + '</span>';
      const fmtBKw = (v) => Math.abs(v) < 0.005 ? '<span style="color:' + c.txt + ';">—</span>' : '<span style="color:' + battCol + ';">' + v.toFixed(2) + '</span>';
      const fmtGKwh = (v) => Math.abs(v) < 0.001 ? '—' : '<span style="color:' + gridCol + ';">' + v.toFixed(3) + '</span>';
      const fmtBKwh = (v) => Math.abs(v) < 0.001 ? '—' : '<span style="color:' + battCol + ';">' + v.toFixed(3) + '</span>';
      const sellDisp = _emec_fmtP(sellP) + (capHit ? ' ⚠' : '');

      rows.push('<tr style="background-color:' + c.bg + ';color:' + c.txt + ';">' +
        '<td>' + timeStr + '</td>' +
        '<td><span title="' + cls.note + '">' + cls.label + '</span></td>' +
        '<td class="bgl">' + _emec_fmtP(buyP)  + '</td>' +
        '<td class="bgi" style="opacity:1;font-size:12px;">' + sellDisp + '</td>' +
        '<td class="bgl">' + loadKw.toFixed(2) + '</td>' +
        '<td class="bgi">' + (Math.abs(fLoadKwh) > 0.001 ? fLoadKwh.toFixed(3) : '—') + '</td>' +
        '<td class="bgl">' + pvKw.toFixed(2) + '</td>' +
        '<td class="bgi">' + (Math.abs(fPvKwh) > 0.001 ? fPvKwh.toFixed(3) : '—') + '</td>' +
        '<td class="bgl"><span style="color:' + gridCol + ';">' + gridKw.toFixed(2) + '</span></td>' +
        '<td class="bgi"><span style="color:' + gridCol + ';">' + (Math.abs(fGridKwh) > 0.001 ? fGridKwh.toFixed(3) : '—') + '</span></td>' +
        '<td class="bgl"><span style="color:' + battCol + ';">' + battKw.toFixed(2) + '</span></td>' +
        '<td class="bgi"><span style="color:' + battCol + ';">' + (Math.abs(fBattKwh) > 0.001 ? fBattKwh.toFixed(3) : '—') + '</span></td>' +
        '<td class="bgl"><span style="color:' + socCol + ';">' + soc.toFixed(1) + '</span></td>' +
        '<td class="bgl"><span style="color:' + costCol + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
        '</tr>');
    }
    tbody.innerHTML = rows.join('');
    requestAnimationFrame(() => this._setWrapHeight());
  }

  // ── Past tab load ───────────────────────────────────────────────────────────
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
    if (!st || !tb) return;

    try {
      const { start, end } = this._getRangeP();
      st.textContent = 'Fetching...';

      const provider = this._hass?.states['input_select.electricity_provider']?.state || 'Amber Electric';

      const result = await this._hass.callWS({
        type: 'history/history_during_period',
        start_time: start.toISOString(),
        end_time:   end.toISOString(),
        entity_ids: _EMEC_SENSORS,
        minimal_response: true,
        no_attributes:    true,
      });

      const lookup = {};
      for (const [eid, states] of Object.entries(result)) {
        lookup[eid] = states.map(s => ({
          t: (s.lu !== undefined ? s.lu : s.lc) * 1000,
          s: s.s
        })).sort((a,b) => a.t - b.t);
      }

      // Auto-switch to Last 24h if today has no data
      if (!lookup['sensor.inverter_load_power']?.length) {
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
        return;
      }

      const step    = 5 * 60 * 1000;
      const startMs = Math.ceil(start.getTime() / step) * step;
      const entries = [];
      for (let t = startMs; t <= end.getTime(); t += step) entries.push(t);
      entries.reverse();

      const rows = [];
      let lastDay = '';

      // ── Pass 1: accumulate daily cost and kWh totals ─────────────────────
      const pastDailyCosts = {};
      const pastDailyKwh   = {};
      for (const ts of entries) {
        const dt     = new Date(ts);
        const dayStr = dt.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
        const gridImpKw0 = (parseFloat(_emec_getAt(lookup['sensor.inverter_import_power'], ts)) || 0) / 1000;
        const gridExpKw0 = (parseFloat(_emec_getAt(lookup['sensor.inverter_export_power'], ts)) || 0) / 1000;
        const solarKw0   = (parseFloat(_emec_getAt(lookup['sensor.inverter_pv_power'],     ts)) || 0) / 1000;
        const loadKw0    = (parseFloat(_emec_getAt(lookup['sensor.inverter_load_power'],   ts)) || 0) / 1000;
        const battCKw0   = (parseFloat(_emec_getAt(lookup['sensor.inverter_battery_charging_power'],    ts)) || 0) / 1000;
        const battDKw0   = (parseFloat(_emec_getAt(lookup['sensor.inverter_battery_discharging_power'], ts)) || 0) / 1000;
        const gridKw0    = gridExpKw0 > 0.2 ? -gridExpKw0 : gridImpKw0 > 0.2 ? gridImpKw0 : 0;
        const battKw0    = battCKw0   > 0.2 ? battCKw0    : battDKw0   > 0.2 ? -battDKw0  : 0;
        const rawBuyP0   = parseFloat(_emec_getAt(lookup['sensor.nodered_buyprice'],  ts)) || 0;
        const rawSellP0  = parseFloat(_emec_getAt(lookup['sensor.nodered_sellprice'], ts)) || 0;
        let { buyP: bP0, sellP: sP0, inSuper: iS0, stdSellP: ss0, otherSellP: os0, mins: m0, stdStart: sta0, stdEnd: ste0 } = _emec_getPrices(ts, provider, this._hass, rawBuyP0, rawSellP0);
        if (provider === 'GloBird' && iS0) {
          const superCapKwhP0 = parseFloat(this._hass.states['input_number.globird_super_max_export']?.state || 10);
          const dailyExpP0    = parseFloat(_emec_getAt(lookup['sensor.daily_exported_energy'], ts)) || 0;
          if (dailyExpP0 >= superCapKwhP0) sP0 = _emec_inWindow(m0, sta0, ste0) ? ss0 : os0;
        }
        const stepHP0 = 5 / 60;
        pastDailyCosts[dayStr] = (pastDailyCosts[dayStr] || 0) + (gridImpKw0 * bP0 - gridExpKw0 * sP0) * stepHP0;
        const pk = pastDailyKwh[dayStr] || { load:0, pv:0, grid:0, batt:0 };
        pk.load += loadKw0  * stepHP0;
        pk.pv   += solarKw0 * stepHP0;
        pk.grid += gridKw0  * stepHP0;
        pk.batt += battKw0  * stepHP0;
        pastDailyKwh[dayStr] = pk;
      }

      // ── Pass 2: render rows ───────────────────────────────────────────────
      for (const ts of entries) {
        const dt      = new Date(ts);
        const dayStr  = dt.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
        const timeStr = dt.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit', hour12:false });

        if (dayStr !== lastDay) {
          lastDay = dayStr;
          const dayTotal   = pastDailyCosts[dayStr] || 0;
          const pk         = pastDailyKwh[dayStr]   || { load:0, pv:0, grid:0, batt:0 };
          const dayColor   = dayTotal <= 0 ? '#4caf50' : '#f44336';
          const dayCostLbl = dayTotal > 0 ? '-' + _EMEC_CUR + dayTotal.toFixed(2) : _EMEC_CUR + Math.abs(dayTotal).toFixed(2);
          const fmtKd = (v) => Math.abs(v) > 0.001 ? (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) : '—';
          const fmtGrid = (v) => {
            if (Math.abs(v) <= 0.001) return '—';
            const col = v < 0 ? '#4caf50' : '#f44336';
            return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>';
          };
          const fmtBatt = (v) => {
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
            '<td class="bgi" style="text-align:right;">' + fmtGrid(pk.grid) + '</td>' +
            '<td class="bgl"></td>' +
            '<td class="bgi" style="text-align:right;">' + fmtBatt(pk.batt) + '</td>' +
            '<td class="bgl"></td>' +
            '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLbl + '</td>' +
            '</tr>');
        }

        const solar   = parseFloat(_emec_getAt(lookup['sensor.inverter_pv_power'],                    ts)) || 0;
        const load    = parseFloat(_emec_getAt(lookup['sensor.inverter_load_power'],                   ts)) || 0;
        const gridImp = parseFloat(_emec_getAt(lookup['sensor.inverter_import_power'],             ts)) || 0;
        const gridExp = parseFloat(_emec_getAt(lookup['sensor.inverter_export_power'],             ts)) || 0;
        const battC   = parseFloat(_emec_getAt(lookup['sensor.inverter_battery_charging_power'],   ts)) || 0;
        const battD   = parseFloat(_emec_getAt(lookup['sensor.inverter_battery_discharging_power'],ts)) || 0;
        const soc     = parseFloat(_emec_getAt(lookup['sensor.inverter_battery_level'],            ts)) || 0;
        const rawBuyP  = parseFloat(_emec_getAt(lookup['sensor.nodered_buyprice'],  ts)) || 0;
        const rawSellP = parseFloat(_emec_getAt(lookup['sensor.nodered_sellprice'], ts)) || 0;
        let { buyP, sellP, inSuper, stdSellP, otherSellP, mins, stdStart, stdEnd } = _emec_getPrices(ts, provider, this._hass, rawBuyP, rawSellP);

        // GloBird super export cap — read actual daily_exported_energy from history
        let capHit = false;
        if (provider === 'GloBird' && inSuper) {
          const superCapKwhP = parseFloat(this._hass.states['input_number.globird_super_max_export']?.state || 10);
          const dailyExpP    = parseFloat(_emec_getAt(lookup['sensor.daily_exported_energy'], ts)) || 0;
          if (dailyExpP >= superCapKwhP) {
            sellP  = _emec_inWindow(mins, stdStart, stdEnd) ? stdSellP : otherSellP;
            capHit = true;
          }
        }

        const solarKw   = solar   / 1000;
        const loadKw    = load    / 1000;
        const gridImpKw = gridImp / 1000;
        const gridExpKw = gridExp / 1000;
        const battCKw   = battC   / 1000;
        const battDKw   = battD   / 1000;

        if (soc === 0 && battCKw === 0 && battDKw === 0 && loadKw === 0) continue;

        const gridKw = gridExpKw > 0.2 ? -gridExpKw : gridImpKw > 0.2 ? gridImpKw : 0;
        const battKw = battCKw   > 0.2 ? battCKw    : battDKw   > 0.2 ? -battDKw  : 0;

        const cls     = _emec_classifyPast(solarKw, gridImpKw, gridExpKw, battCKw, battDKw);
        const c       = _EMEC_COLOURS[cls.color] || { bg:'#ffffcc', txt:'#888888' };
        const gridCol = gridKw < 0 ? '#4caf50' : gridKw > 0 ? '#f44336' : c.txt;
        const battCol = battKw < 0 ? '#f44336' : battKw > 0 ? '#4caf50' : c.txt;
        const socCol  = soc <= 20 ? '#f44336'  : soc >= 75 ? '#4caf50'  : c.txt;

        // Cost/profit: imports cost money (red), exports earn money (green)
        const stepHP  = 5 / 60;
        const pastCost = (gridImpKw * buyP - gridExpKw * sellP) * stepHP;
        let costDisp, costCol;
        if (gridExpKw > 0.2 && pastCost < -0.0001) {
          costDisp = _EMEC_CUR + Math.abs(pastCost).toFixed(3);
          costCol  = '#4caf50';
        } else if (gridImpKw > 0.2 && pastCost > 0.0001) {
          costDisp = '-' + _EMEC_CUR + pastCost.toFixed(3);
          costCol  = '#f44336';
        } else {
          costDisp = '—';
          costCol  = c.txt;
        }

        // kWh energy deltas from total_increasing sensors
        const prevTs   = ts - 5 * 60 * 1000;
        const eGridImp = _emec_getDelta(lookup['sensor.monthly_imported_energy'],  ts, prevTs);
        const eGridExp = _emec_getDelta(lookup['sensor.monthly_exported_energy'],  ts, prevTs);
        const eSolarRaw= _emec_getDelta(lookup['sensor.monthly_pv_generation'],    ts, prevTs);
        const eBattC   = _emec_getDelta(lookup['sensor.monthly_battery_charge'],   ts, prevTs);
        const eBattD   = _emec_getDelta(lookup['sensor.monthly_battery_discharge'],ts, prevTs);
        // Load sensor — config override → daily_consumed_energy
        const loadSensor = this._config.load_energy_sensor || 'sensor.daily_consumed_energy';
        const eLoadRaw = _emec_getDelta(lookup[loadSensor], ts, prevTs);
        // Sanity: if kW reading < 0.05kW (50W), treat kWh delta as 0 — filters sensor rounding artefacts
        const eSolar = (eSolarRaw !== null && solarKw   < 0.05) ? 0 : eSolarRaw;
        const eLoad  = (eLoadRaw  !== null && loadKw    < 0.05) ? 0 : eLoadRaw;
        const eGridRaw = gridExpKw > 0.2 ? (eGridExp !== null ? -eGridExp : null) : eGridImp;
        const eGrid  = (eGridRaw  !== null && Math.abs(gridKw)  < 0.05) ? 0 : eGridRaw;
        const eBattRaw = battCKw  > 0.2 ? eBattC : (eBattD !== null ? -eBattD : null);
        const eBatt  = (eBattRaw  !== null && Math.abs(battKw)  < 0.05) ? 0 : eBattRaw;

        const fmtKw  = (v) => Math.abs(v) < 0.005 ? '<span style="color:' + c.txt + ';">—</span>' : '<span style="color:' + c.txt + ';">' + v.toFixed(2) + '</span>';
        const fmtGKw = (v) => Math.abs(v) < 0.005 ? '<span style="color:' + c.txt + ';">—</span>' : '<span style="color:' + gridCol + ';">' + v.toFixed(2) + '</span>';
        const fmtBKw = (v) => Math.abs(v) < 0.005 ? '<span style="color:' + c.txt + ';">—</span>' : '<span style="color:' + battCol + ';">' + v.toFixed(2) + '</span>';
        const fmtGKwh = (v) => (v === null || Math.abs(v) < 0.001) ? '—' : '<span style="color:' + gridCol + ';">' + v.toFixed(3) + '</span>';
        const fmtBKwh = (v) => (v === null || Math.abs(v) < 0.001) ? '—' : '<span style="color:' + battCol + ';">' + v.toFixed(3) + '</span>';

        rows.push('<tr style="background-color:' + c.bg + ';color:' + c.txt + ';">' +
          '<td>' + timeStr + '</td>' +
          '<td>' + cls.label + '</td>' +
          '<td class="bgl">' + _emec_fmtP(buyP)    + '</td>' +
          '<td class="bgi" style="opacity:1;font-size:12px;">' + _emec_fmtP(sellP) + (capHit ? ' ⚠' : '') + '</td>' +
          '<td class="bgl">' + loadKw.toFixed(2) + '</td>' +
          '<td class="bgi">' + (eLoad  !== null && Math.abs(eLoad)  > 0.001 ? eLoad.toFixed(3)  : '—') + '</td>' +
          '<td class="bgl">' + solarKw.toFixed(2) + '</td>' +
          '<td class="bgi">' + (eSolar !== null && Math.abs(eSolar) > 0.001 ? eSolar.toFixed(3) : '—') + '</td>' +
          '<td class="bgl"><span style="color:' + gridCol + ';">' + gridKw.toFixed(2) + '</span></td>' +
          '<td class="bgi"><span style="color:' + gridCol + ';">' + (eGrid  !== null && Math.abs(eGrid)  > 0.001 ? eGrid.toFixed(3)  : '—') + '</span></td>' +
          '<td class="bgl"><span style="color:' + battCol + ';">' + battKw.toFixed(2) + '</span></td>' +
          '<td class="bgi"><span style="color:' + battCol + ';">' + (eBatt  !== null && Math.abs(eBatt)  > 0.001 ? eBatt.toFixed(3)  : '—') + '</span></td>' +
          '<td class="bgl"><span style="color:' + socCol  + ';">' + soc.toFixed(1)   + '</span></td>' +
          '<td class="bgl"><span style="color:' + costCol + ';font-weight:bold;">' + costDisp + '</span></td>' +
          '</tr>');
      }

      tb.innerHTML = rows.join('');
      requestAnimationFrame(() => this._setWrapHeight());
      const sel2 = this.shadowRoot.getElementById('range-past');
      st.textContent = entries.length + ' readings — ' + (sel2 ? sel2.options[sel2.selectedIndex].text : '');
      this._pastState = 'ready';

    } catch(e) {
      const tb2 = this.shadowRoot.getElementById('tb-past');
      if (tb2) tb2.innerHTML = '<tr><td colspan="14" class="err">⚠️ ' + e.message + '</td></tr>';
      const st2 = this.shadowRoot.getElementById('st-past');
      if (st2) st2.textContent = 'Error — ' + e.message.slice(0,60);
      this._pastState = 'ready';
    }
  }

  getCardSize() { return 12; }
}

if (!customElements.get('em-events-card')) {
  customElements.define('em-events-card', EmEventsCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'em-events-card')) {
  window.customCards.push({
    type: 'em-events-card',
    name: 'EM Events Card',
    description: 'Energy Manager future and past decisions in one card',
  });
}
